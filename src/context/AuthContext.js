import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMutation, useQuery } from 'convex/react';
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const staleCheckDone = useRef(false);

  const createAnonymousUser = useMutation(api.auth.createAnonymousUser);
  const linkSocialAccount   = useMutation(api.auth.linkSocialAccount);
  const loginWithEmailMut   = useMutation(api.friends.loginWithEmail);
  // Query the user — returns null if the userId doesn't exist in this deployment
  const user = useQuery(api.auth.getUser, userId ? { userId } : 'skip');

  const loadStoredUser = async () => {
    try {
      const storedUserId = await AsyncStorage.getItem('userId');
      if (storedUserId) {
        staleCheckDone.current = false; // reset so the effect can check
        setUserId(storedUserId);
      } else {
        // No stored user — try auto-restore by email first
        const restored = await tryAutoRestoreByEmail();
        if (restored) return;

        // No stored user — create a new one with timeout
        const promise = createAnonymousUser();
        const timeout = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Connection timeout')), 10000)
        );
        const newUserId = await Promise.race([promise, timeout]);
        await AsyncStorage.setItem('userId', newUserId);
        staleCheckDone.current = true;
        setUserId(newUserId);
      }
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
      if (result?.userId) {
        await AsyncStorage.setItem('userId', result.userId);
        staleCheckDone.current = true;
        setUserId(result.userId);
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
          setUserId(null);
          const newUserId = await createAnonymousUser();
          await AsyncStorage.setItem('userId', newUserId);
          setUserId(newUserId);
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

  // ── Social account linking ─────────────────────────────────────────────────

  /**
   * Link a Google or Apple account to the current anonymous user.
   * Returns { success: true } or { conflict: true, existingUserId: string }
   */
  const linkGoogle = async (googleId, email) => {
    if (!userId) return { error: 'No user' };
    return await linkSocialAccount({ userId, provider: 'google', socialId: googleId, email });
  };

  const linkApple = async (appleId, email) => {
    if (!userId) return { error: 'No user' };
    return await linkSocialAccount({ userId, provider: 'apple', socialId: appleId, email });
  };

  /**
   * Switch to a different account (e.g. after finding a linked account via Google/Apple).
   * Updates AsyncStorage and local state — the anonymous account is abandoned.
   */
  const restoreAccount = async (targetUserId) => {
    await AsyncStorage.setItem('userId', targetUserId);
    staleCheckDone.current = true;
    setUserId(targetUserId);
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
      await AsyncStorage.removeItem('userId');
      setUserId(null);
      staleCheckDone.current = true;
      const newUserId = await createAnonymousUser();
      await AsyncStorage.setItem('userId', newUserId);
      setUserId(newUserId);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const value = {
    userId,
    user,
    loading,
    error,
    retry,
    logout,
    isAuthenticated: !!userId,
    // Social auth
    linkGoogle,
    linkApple,
    restoreAccount,
    // Email session persistence
    saveCredentials,
    clearCredentials,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};