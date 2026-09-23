import { Alert, Platform } from 'react-native';

// ─── Google OAuth client IDs ──────────────────────────────────────────────────
const GOOGLE_WEB_CLIENT_ID     = "238037079938-rlg954774ts69r3pkig9f39ubl48dm86.apps.googleusercontent.com";
const GOOGLE_IOS_CLIENT_ID     = "238037079938-uk6c2f89ni70vnu4fu6rmtnghnu3p14m.apps.googleusercontent.com";
const GOOGLE_ANDROID_CLIENT_ID = "238037079938-8so7kfjsajjpesp1ger6r8nshfgspjs5.apps.googleusercontent.com";

let GoogleSignin = null;
let statusCodes = {};
try {
  const mod = require('@react-native-google-signin/google-signin');
  GoogleSignin = mod.GoogleSignin;
  statusCodes = mod.statusCodes || {};
  if (GoogleSignin?.configure) {
    GoogleSignin.configure({
      webClientId: GOOGLE_WEB_CLIENT_ID,
      iosClientId: GOOGLE_IOS_CLIENT_ID,
      scopes: ['openid', 'profile', 'email'],
      offlineAccess: false,
    });
  }
} catch (_) {
  // Module not available in this environment (e.g. Expo Go)
}

// expo-apple-authentication is a native-only module — safe to import but
// only functional on iOS native builds (not Expo Go on Android).
let AppleAuthentication = null;
try {
  AppleAuthentication = require('expo-apple-authentication');
} catch {
  // Module not available in this environment (Expo Go on Android)
}

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
  /**
   * Opens Google OAuth flow.
   * Returns { googleId, email, idToken } on success, null if cancelled or failed.
   * The backend verifies idToken; googleId/email are only for display.
   */
  const signInWithGoogle = async () => {
    if (!GoogleSignin) {
      Alert.alert(
        "Google Sign-In",
        "El inicio de sesión con Google requiere una compilación nativa."
      );
      return null;
    }
    try {
      await GoogleSignin.hasPlayServices();
      const result = await GoogleSignin.signIn();
      // Use getTokens() to consistently extract idToken across different versions
      const tokens = await GoogleSignin.getTokens();
      const idToken = tokens?.idToken || result?.idToken || result?.data?.idToken;

      if (!idToken) {
        console.warn('No ID token from Google SignIn');
        return null;
      }

      const payload = decodeJwtPayload(idToken);
      if (!payload?.sub) return null;

      return { googleId: payload.sub, email: payload.email ?? null, idToken };
    } catch (e) {
      if (e.code === statusCodes.SIGN_IN_CANCELLED) {
        return null; // normal dismissal
      }
      console.warn('[useSocialAuth] Google Sign-In error:', e);
      return null;
    }
  };

  /**
   * Opens Apple Sign-In (iOS only).
   * Returns { appleId, email, idToken } on success, null if cancelled or failed.
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
      if (!credential.identityToken) return null;
      return { appleId: credential.user, email: credential.email ?? null, idToken: credential.identityToken };
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
    googleAuthReady: true, // Native GoogleSignin is always ready
  };
}
