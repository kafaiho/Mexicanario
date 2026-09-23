import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAction, useMutation, useQuery } from 'convex/react';
import * as SecureStore from 'expo-secure-store';
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { api } from '../../convex/_generated/api';
import { Alert } from 'react-native';

// ── Secure credential helpers ──────────────────────────────────────────────────
// Uses Keychain (iOS) / EncryptedSharedPreferences (Android) instead of plaintext AsyncStorage.
const CRED_EMAIL_KEY = 'mexicanario_email';
const CRED_PASS_KEY  = 'mexicanario_pass';

async function secureGetCredentials() {
  try {
    const email = await SecureStore.getItemAsync(CRED_EMAIL_KEY);
    const pass  = await SecureStore.getItemAsync(CRED_PASS_KEY);
    return { email, pass };
  } catch (_) {
    return { email: null, pass: null };
  }
}

async function secureSaveCredentials(email, password) {
  await SecureStore.setItemAsync(CRED_EMAIL_KEY, email.toLowerCase().trim());
  await SecureStore.setItemAsync(CRED_PASS_KEY, password);
}

async function secureClearCredentials() {
  await SecureStore.deleteItemAsync(CRED_EMAIL_KEY);
  await SecureStore.deleteItemAsync(CRED_PASS_KEY);
}

// ── Device session (proves to the backend that this device owns userId) ─────
const SESSION_KEY = 'mexicanario_session';

async function loadSession() {
  try {
    const raw = await SecureStore.getItemAsync(SESSION_KEY);
    return raw ? JSON.parse(raw) : null; // { userId, sessionToken }
  } catch (_) {
    return null;
  }
}

async function saveSession(userId, sessionToken) {
  try {
    await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify({ userId, sessionToken }));
  } catch (_) { /* the session still works for this app run */ }
}

async function clearSession() {
  try { await SecureStore.deleteItemAsync(SESSION_KEY); } catch (_) { }
}

/** One-time migration: move plaintext creds from AsyncStorage → SecureStore, then wipe old keys. */
async function migrateCredsToSecureStore() {
  try {
    const oldEmail = await AsyncStorage.getItem('@mexicanario:savedEmail');
    const oldPass  = await AsyncStorage.getItem('@mexicanario:savedPass');
    if (oldEmail && oldPass) {
      await secureSaveCredentials(oldEmail, oldPass);
      await AsyncStorage.multiRemove(['@mexicanario:savedEmail', '@mexicanario:savedPass']);
    }
  } catch (_) { /* best effort */ }
}

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [userId, setUserId] = useState(null);
  const [sessionToken, setSessionToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const staleCheckDone = useRef(false);

  const createGuestSession  = useMutation(api.sessions.createGuestSession);
  const claimLegacySession  = useMutation(api.sessions.claimLegacySession);
  const revokeSession       = useMutation(api.sessions.revokeSession);
  const socialSignInAction  = useAction(api.sessions.socialSignIn);
  const loginWithEmailMut   = useMutation(api.friends.loginWithEmail);
  // Query the user — returns null if the userId doesn't exist in this deployment
  const user = useQuery(
    api.auth.getUser,
    userId ? (sessionToken ? { userId, sessionToken } : { userId }) : 'skip'
  );

  /** Makes (userId, token) the active identity on this device. */
  const adoptSession = async (newUserId, newToken) => {
    await AsyncStorage.setItem('userId', newUserId);
    await saveSession(newUserId, newToken);
    staleCheckDone.current = true;
    setSessionToken(newToken);
    setUserId(newUserId);
  };

  const startGuest = async () => {
    const promise = createGuestSession();
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Connection timeout')), 10000)
    );
    const guest = await Promise.race([promise, timeout]);
    await adoptSession(guest.userId, guest.sessionToken);
  };

  const loadStoredUser = async () => {
    try {
      const storedUserId = await AsyncStorage.getItem('userId');
      if (storedUserId) {
        const stored = await loadSession();
        if (stored?.userId === storedUserId && stored.sessionToken) {
          staleCheckDone.current = false; // reset so the effect can check
          setSessionToken(stored.sessionToken);
          setUserId(storedUserId);
          return;
        }
        // Install from before sessions existed: claim one for this device.
        try {
          const { sessionToken: claimed } = await claimLegacySession({ userId: storedUserId });
          await saveSession(storedUserId, claimed);
          staleCheckDone.current = false;
          setSessionToken(claimed);
          setUserId(storedUserId);
          return;
        } catch (claimErr) {
          console.warn('Legacy session claim failed:', claimErr);
          if (await tryAutoRestoreByEmail()) return;
          await startGuest();
          return;
        }
      }
      // No stored user — try auto-restore by email first, else a new guest
      const restored = await tryAutoRestoreByEmail();
      if (restored) return;
      await startGuest();
    } catch (err) {
      console.error('Error loading/creating user:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  // Auto-restore: if we have saved email+password in SecureStore, login automatically
  const tryAutoRestoreByEmail = async () => {
    try {
      // Migrate old plaintext creds on first run after update
      await migrateCredsToSecureStore();

      const { email: savedEmail, pass: savedPass } = await secureGetCredentials();
      if (!savedEmail || !savedPass) return false;

      const result = await loginWithEmailMut({ email: savedEmail, password: savedPass });
      if (result?.userId && result.sessionToken) {
        await adoptSession(result.userId, result.sessionToken);
        return true;
      }
    } catch (err) {
      console.warn('Auto-restore by email failed:', err);
      // Clear saved credentials if they're invalid
      await secureClearCredentials();
    }
    return false;
  };

  useEffect(() => {
    loadStoredUser();
  }, []);

  // Detect stale userId: if we have an ID but user is null in Convex,
  // it means the ID belongs to a different deployment — create a fresh one.
  useEffect(() => {
    if (staleCheckDone.current) return;
    if (!userId) return;
    if (user === undefined) return; // still loading

    if (user === null) {
      staleCheckDone.current = true;
      (async () => {
        try {
          // Try to restore by email before creating a new user
          const restored = await tryAutoRestoreByEmail();
          if (restored) return;

          await AsyncStorage.removeItem('userId');
          await clearSession();
          setUserId(null);
          setSessionToken(null);
          await startGuest();
        } catch (err) {
          console.error('Error recreating user:', err);
          setError(err);
        }
      })();
    } else {
      staleCheckDone.current = true; // user exists — all good
    }
  }, [user, userId]);

  const retry = () => {
    setError(null);
    setLoading(true);
    staleCheckDone.current = false;
    loadStoredUser();
  };

  // ── Google / Apple (verified by the backend) ──────────────────────────────

  /**
   * mode "restore": { found, userId, name, sessionToken } for the linked account.
   * mode "link": { success } or { conflict, existingUserId, sessionToken }.
   */
  const socialSignIn = async (provider, idToken, mode) => {
    return await socialSignInAction({
      provider,
      idToken,
      mode,
      ...(userId ? { userId } : {}),
      ...(sessionToken ? { sessionToken } : {}),
    });
  };

  /**
   * Switch to a different account the backend already authorized for this
   * device (email login or verified Google/Apple). The previous session ends.
   */
  const restoreAccount = async (targetUserId, targetSessionToken) => {
    if (sessionToken && sessionToken !== targetSessionToken) {
      revokeSession({ sessionToken }).catch(() => { });
    }
    await adoptSession(targetUserId, targetSessionToken);
  };

  /**
   * Save email + password securely so the session auto-restores on next app open.
   * Uses Keychain (iOS) / EncryptedSharedPreferences (Android).
   */
  const saveCredentials = async (email, password) => {
    await secureSaveCredentials(email, password);
  };

  /**
   * Clear saved credentials (on logout or account deletion).
   */
  const clearCredentials = async () => {
    await secureClearCredentials();
  };

  // ── Logout ─────────────────────────────────────────────────────────────────

  const logout = async () => {
    try {
      // Keep saved credentials so Face ID / biometric re-login still works.
      // Credentials are only wiped on account deletion.
      if (sessionToken) revokeSession({ sessionToken }).catch(() => { });
      await AsyncStorage.removeItem('userId');
      await clearSession();
      setUserId(null);
      setSessionToken(null);
      staleCheckDone.current = true;
      await startGuest();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const value = {
    userId,
    sessionToken,
    user,
    loading,
    error,
    retry,
    logout,
    isAuthenticated: !!userId,
    // Social auth
    socialSignIn,
    restoreAccount,
    // Email session persistence
    saveCredentials,
    clearCredentials,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};