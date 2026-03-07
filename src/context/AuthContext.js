import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMutation, useQuery } from 'convex/react';
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { api } from '../../convex/_generated/api';
import { Alert } from 'react-native';

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

  // Auto-restore: if we have saved email+password, login automatically
  const tryAutoRestoreByEmail = async () => {
    try {
      const savedEmail = await AsyncStorage.getItem('@mexicanario:savedEmail');
      const savedPass  = await AsyncStorage.getItem('@mexicanario:savedPass');
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
      await AsyncStorage.multiRemove(['@mexicanario:savedEmail', '@mexicanario:savedPass']);
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
   * Save email + password locally so the session auto-restores on next app open.
   * Call this after a successful registerAccount or loginWithEmail.
   */
  const saveCredentials = async (email, password) => {
    await AsyncStorage.setItem('@mexicanario:savedEmail', email.toLowerCase().trim());
    await AsyncStorage.setItem('@mexicanario:savedPass', password);
  };

  /**
   * Clear saved credentials (on logout or account deletion).
   */
  const clearCredentials = async () => {
    await AsyncStorage.multiRemove(['@mexicanario:savedEmail', '@mexicanario:savedPass']);
  };

  // ── Logout ─────────────────────────────────────────────────────────────────

  const logout = async () => {
    try {
      await clearCredentials();
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