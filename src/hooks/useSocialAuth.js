import * as Google from 'expo-auth-session/providers/google';
import { Platform } from 'react-native';

// expo-apple-authentication is a native-only module — safe to import but
// only functional on iOS native builds (not Expo Go on Android).
let AppleAuthentication = null;
try {
  AppleAuthentication = require('expo-apple-authentication');
} catch {
  // Module not available in this environment (Expo Go on Android)
}

// ─── Google OAuth client IDs ──────────────────────────────────────────────────
// Obtain these from https://console.cloud.google.com → APIs & Services → Credentials
// Create 3 OAuth 2.0 Client IDs: Web Application, Android, iOS
// Android package:  com.kafaiho.mexicanario
// iOS bundle ID:    com.kafaiho.mexicanario
const GOOGLE_EXPO_CLIENT_ID    = "238037079938-rlg954774ts69r3pkig9f39ubl48dm86.apps.googleusercontent.com";
const GOOGLE_IOS_CLIENT_ID     = "238037079938-uk6c2f89ni70vnu4fu6rmtnghnu3p14m.apps.googleusercontent.com";
const GOOGLE_ANDROID_CLIENT_ID = "238037079938-8so7kfjsajjpesp1ger6r8nshfgspjs5.apps.googleusercontent.com";

// ─── JWT decode helper ────────────────────────────────────────────────────────
function decodeJwtPayload(token) {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

// ─── Hook ────────────────────────────────────────────────────────────────────
export function useSocialAuth() {
  const [request, , promptAsync] = Google.useAuthRequest({
    expoClientId:    GOOGLE_EXPO_CLIENT_ID,
    iosClientId:     GOOGLE_IOS_CLIENT_ID,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID,
    scopes: ['openid', 'profile', 'email'],
  });

  /**
   * Opens Google OAuth flow.
   * Returns { googleId, email } on success, null if cancelled or failed.
   */
  const signInWithGoogle = async () => {
    const result = await promptAsync();
    if (result?.type !== 'success') return null;

    const idToken = result.authentication?.idToken;
    if (!idToken) return null;

    const payload = decodeJwtPayload(idToken);
    if (!payload?.sub) return null;

    return { googleId: payload.sub, email: payload.email ?? null };
  };

  /**
   * Opens Apple Sign-In (iOS only).
   * Returns { appleId, email } on success, null if cancelled or failed.
   */
  const signInWithApple = async () => {
    if (Platform.OS !== 'ios' || !AppleAuthentication) return null;
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      return { appleId: credential.user, email: credential.email ?? null };
    } catch (e) {
      // ERR_CANCELED is normal when user dismisses
      if (e?.code !== 'ERR_CANCELED') {
        console.warn('[useSocialAuth] Apple Sign-In error:', e);
      }
      return null;
    }
  };

  return {
    signInWithGoogle,
    signInWithApple,
    googleAuthReady: !!request,
  };
}
