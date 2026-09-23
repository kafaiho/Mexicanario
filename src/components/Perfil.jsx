import { useMutation, useQuery } from 'convex/react';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
} from 'react-native';
import { api } from '../../convex/_generated/api';
import { useAuth } from '../context/AuthContext';
import { useSocialAuth } from '../hooks/useSocialAuth';
import CountryPicker from './CountryPicker';
import { FONTS } from '../theme/designTokens';
import { useUserMutation } from "../hooks/useUserMutation";

const { width, height } = Dimensions.get('window');
const BROWN = '#8B4513';
const AMBER = '#D2691E';
const GOLD  = '#F8BE17';
const WHEAT = '#FFE4B5';
const WHEAT2 = '#F5DEB3';

export default function Perfil({ visible, onClose }) {
  const { userId, user, socialSignIn, restoreAccount } = useAuth();
  const updateUserProfile = useUserMutation(api.users.updateUserProfile);
  const { signInWithGoogle, signInWithApple, googleAuthReady } = useSocialAuth();

  const [name, setName] = useState('');
  const [country, setCountry] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState(null); // 'google' | 'apple' | null
  const [hasChanges, setHasChanges] = useState(false);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // The backend verifies the Google/Apple token and, if an account is linked,
  // returns a session for it.
  const handleRestoreResult = (found, idToken, provider) => {
    if (found?.found) {
      Alert.alert(
        '¡Cuenta encontrada! 🎉',
        `Encontramos tu cuenta con ${found.name}.\n\n¿Cargar ese progreso? Esto reemplazará la sesión actual.`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Restaurar progreso',
            onPress: async () => {
              await restoreAccount(found.userId, found.sessionToken);
              onClose();
            },
          },
        ]
      );
    } else {
      Alert.alert(
        'No encontramos cuenta',
        `No hay ninguna cuenta vinculada a este ${provider === 'google' ? 'Google' : 'Apple ID'}.\n\n¿Quieres vincular tu progreso actual a esta cuenta?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Vincular este progreso',
            onPress: () => handleLinkFlow(idToken, provider),
          },
        ]
      );
    }
  };

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setCountry(user.country || '');
      setHasChanges(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      setHasChanges(name !== user.name || country !== user.country);
    }
  }, [name, country, user]);

  // ── Social auth handlers ───────────────────────────────────────────────────

  const handleLinkFlow = async (idToken, provider) => {
    let result;
    try {
      result = await socialSignIn(provider, idToken, 'link');
    } catch (e) {
      Alert.alert('Error', 'No pudimos verificar tu cuenta. Intenta de nuevo.');
      return;
    }
    if (result?.success) {
      Alert.alert('¡Vinculado! ✅', `Tu cuenta está ahora vinculada con ${provider === 'google' ? 'Google' : 'Apple'}. Tu progreso se guardará automáticamente.`);
    } else if (result?.conflict) {
      Alert.alert(
        'Cuenta existente',
        `Ya hay una cuenta vinculada a este ${provider === 'google' ? 'Google' : 'Apple ID'}.\n\n¿Quieres cargar ese progreso? (perderás el progreso actual)`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Cargar progreso anterior',
            style: 'destructive',
            onPress: async () => {
              await restoreAccount(result.existingUserId, result.sessionToken);
              onClose();
            },
          },
        ]
      );
    }
  };

  const handleVincularGoogle = async () => {
    setSocialLoading('google');
    try {
      const creds = await signInWithGoogle();
      if (!creds) { setSocialLoading(null); return; }
      await handleLinkFlow(creds.idToken, 'google');
    } catch (e) {
      Alert.alert('Error', 'No se pudo conectar con Google. Intenta de nuevo.');
    } finally {
      setSocialLoading(null);
    }
  };

  const handleVincularApple = async () => {
    setSocialLoading('apple');
    try {
      const creds = await signInWithApple();
      if (!creds) { setSocialLoading(null); return; }
      await handleLinkFlow(creds.idToken, 'apple');
    } catch (e) {
      Alert.alert('Error', 'No se pudo conectar con Apple. Intenta de nuevo.');
    } finally {
      setSocialLoading(null);
    }
  };

  const handleRestaurarGoogle = async () => {
    setSocialLoading('google-restore');
    try {
      const creds = await signInWithGoogle();
      if (!creds) return;
      const found = await socialSignIn('google', creds.idToken, 'restore');
      handleRestoreResult(found, creds.idToken, 'google');
    } catch (e) {
      Alert.alert('Error', 'No se pudo conectar con Google. Intenta de nuevo.');
    } finally {
      setSocialLoading(null);
    }
  };

  const handleRestaurarApple = async () => {
    setSocialLoading('apple-restore');
    try {
      const creds = await signInWithApple();
      if (!creds) return;
      const found = await socialSignIn('apple', creds.idToken, 'restore');
      handleRestoreResult(found, creds.idToken, 'apple');
    } catch (e) {
      Alert.alert('Error', 'No se pudo conectar con Apple. Intenta de nuevo.');
    } finally {
      setSocialLoading(null);
    }
  };

  // ── Profile save ───────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!userId) { Alert.alert('Error', 'Debes iniciar sesión'); return; }
    if (!name.trim()) { Alert.alert('Error', 'El nombre no puede estar vacío'); return; }
    if (!country.trim()) { Alert.alert('Error', 'Selecciona un país'); return; }
    try {
      setIsLoading(true);
      await updateUserProfile({ userId, name: name.trim(), country: country.trim() || 'Desconocido' });
      Alert.alert('¡Guardado!', 'Perfil actualizado.', [{ text: 'OK', onPress: () => { setIsEditing(false); onClose(); } }]);
    } catch (e) {
      Alert.alert('Error', 'No se pudo guardar. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      Alert.alert('Cambios sin guardar', '¿Salir sin guardar?', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Descartar', style: 'destructive', onPress: () => { if (user) { setName(user.name || ''); setCountry(user.country || ''); } setIsEditing(false); onClose(); } },
      ]);
    } else {
      setIsEditing(false);
      onClose();
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleCancel}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Perfil</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={handleCancel}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
            {/* Name field */}
            <View style={styles.field}>
              <View style={styles.fieldIcon}>
                <Image source={require('../../assets/icons/name.png')} style={styles.fieldIconImg} resizeMode="contain" />
              </View>
              <View style={styles.fieldContent}>
                <Text style={styles.fieldLabel}>Nombre</Text>
                {isEditing ? (
                  <TextInput
                    style={styles.input}
                    value={name}
                    onChangeText={setName}
                    placeholder="Tu nombre"
                    placeholderTextColor="#bbb"
                    maxLength={30}
                    autoFocus
                  />
                ) : (
                  <TouchableOpacity onPress={() => setIsEditing(true)}>
                    <Text style={styles.fieldValue}>{user?.name || 'Toca para editar'}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Avatar field (read-only) */}
            <View style={styles.field}>
              <View style={styles.fieldIcon}>
                <Image source={require('../../assets/icons/Avatar.png')} style={styles.fieldIconImg} resizeMode="contain" />
              </View>
              <View style={styles.fieldContent}>
                <Text style={styles.fieldLabel}>Avatar</Text>
                <Text style={styles.fieldValue}>{user?.avatar || 'Default'}</Text>
              </View>
            </View>

            {/* Country field */}
            <View style={styles.field}>
              <View style={styles.fieldIcon}>
                <Image source={require('../../assets/icons/Pais.png')} style={styles.fieldIconImg} resizeMode="contain" />
              </View>
              <View style={styles.fieldContent}>
                <Text style={styles.fieldLabel}>País</Text>
                {isEditing ? (
                  <TouchableOpacity onPress={() => setShowCountryPicker(true)}>
                    <Text style={[styles.fieldValue, { color: AMBER }]}>
                      {country || 'Seleccionar país →'}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity onPress={() => setIsEditing(true)}>
                    <Text style={styles.fieldValue}>{user?.country || 'Toca para editar'}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
            {/* ── Vincular cuenta ───────────────────────────────────────── */}
            <View style={styles.socialSection}>
              {user?.googleId || user?.appleId ? (
                // ── Linked state ──────────────────────────────────────────
                <View style={styles.linkedBanner}>
                  <Text style={styles.linkedIcon}>✅</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.linkedTitle}>Cuenta vinculada</Text>
                    <Text style={styles.linkedSub}>
                      {user.googleId ? '🟦 Google' : '🍎 Apple'}
                      {user.email ? `  ·  ${user.email}` : ''}
                    </Text>
                    <Text style={styles.linkedDesc}>Tu progreso se guarda automáticamente en la nube.</Text>
                  </View>
                </View>
              ) : (
                // ── Unlinked state ────────────────────────────────────────
                <>
                  <View style={styles.socialHeader}>
                    <Text style={styles.socialTitle}>🔒 Vincular cuenta</Text>
                    <Text style={styles.socialDesc}>Guarda y recupera tu progreso en cualquier dispositivo.</Text>
                  </View>

                  {/* Vincular buttons */}
                  <TouchableOpacity
                    style={[styles.socialBtn, socialLoading === 'google' && styles.socialBtnDisabled]}
                    onPress={handleVincularGoogle}
                    disabled={!!socialLoading || !googleAuthReady}
                    activeOpacity={0.8}
                  >
                    {socialLoading === 'google'
                      ? <ActivityIndicator size="small" color={BROWN} />
                      : <Text style={styles.socialBtnText}>🟦  Vincular con Google</Text>
                    }
                  </TouchableOpacity>

                  {Platform.OS === 'ios' && (
                    <TouchableOpacity
                      style={[styles.socialBtn, socialLoading === 'apple' && styles.socialBtnDisabled]}
                      onPress={handleVincularApple}
                      disabled={!!socialLoading}
                      activeOpacity={0.8}
                    >
                      {socialLoading === 'apple'
                        ? <ActivityIndicator size="small" color={BROWN} />
                        : <Text style={styles.socialBtnText}>🍎  Vincular con Apple</Text>
                      }
                    </TouchableOpacity>
                  )}

                  {/* Divider */}
                  <View style={styles.socialDivider}>
                    <View style={styles.socialDividerLine} />
                    <Text style={styles.socialDividerText}>¿Ya tienes cuenta guardada?</Text>
                    <View style={styles.socialDividerLine} />
                  </View>

                  {/* Restore buttons */}
                  <TouchableOpacity
                    style={[styles.socialBtnOutline, socialLoading === 'google-restore' && styles.socialBtnDisabled]}
                    onPress={handleRestaurarGoogle}
                    disabled={!!socialLoading || !googleAuthReady}
                    activeOpacity={0.8}
                  >
                    {socialLoading === 'google-restore'
                      ? <ActivityIndicator size="small" color={AMBER} />
                      : <Text style={styles.socialBtnOutlineText}>🟦  Restaurar con Google</Text>
                    }
                  </TouchableOpacity>

                  {Platform.OS === 'ios' && (
                    <TouchableOpacity
                      style={[styles.socialBtnOutline, socialLoading === 'apple-restore' && styles.socialBtnDisabled]}
                      onPress={handleRestaurarApple}
                      disabled={!!socialLoading}
                      activeOpacity={0.8}
                    >
                      {socialLoading === 'apple-restore'
                        ? <ActivityIndicator size="small" color={AMBER} />
                        : <Text style={styles.socialBtnOutlineText}>🍎  Restaurar con Apple</Text>
                      }
                    </TouchableOpacity>
                  )}
                </>
              )}
            </View>
          </ScrollView>

          {/* Action buttons */}
          <View style={styles.footer}>
            {isEditing ? (
              <>
                <TouchableOpacity
                  style={[styles.saveBtn, (!hasChanges || isLoading) && styles.saveBtnDisabled]}
                  onPress={handleSave}
                  disabled={!hasChanges || isLoading}
                >
                  {isLoading
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <Text style={styles.saveBtnText}>Guardar</Text>
                  }
                </TouchableOpacity>
                {hasChanges && (
                  <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
                    <Text style={styles.cancelBtnText}>Cancelar</Text>
                  </TouchableOpacity>
                )}
              </>
            ) : (
              <TouchableOpacity style={styles.editBtn} onPress={() => setIsEditing(true)}>
                <Text style={styles.editBtnText}>✏️  Editar perfil</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <CountryPicker
          visible={showCountryPicker}
          onClose={() => setShowCountryPicker(false)}
          onSelect={(sel) => { if (sel) setCountry(sel); setShowCountryPicker(false); }}
          currentCountry={country}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: '#FFE4B5',
    borderTopLeftRadius: width * 0.07,
    borderTopRightRadius: width * 0.07,
    paddingTop: height * 0.01,
    paddingBottom: height * 0.04,
    minHeight: height * 0.45,
    maxHeight: height * 0.75,
    borderWidth: width * 0.01,
    borderBottomWidth: 0,
    borderColor: '#8B4513',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 16,
  },

  // Drag handle
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: width * 0.05,
    paddingTop: height * 0.01,
    paddingBottom: height * 0.02,
    borderBottomWidth: 2,
    borderBottomColor: '#D2691E55',
  },
  title: { fontFamily: FONTS.display, fontSize: width * 0.053, color: BROWN, flex: 1, textAlign: 'center', marginLeft: width * 0.095 },
  closeBtn: {
    width: width * 0.095,
    height: width * 0.095,
    borderRadius: width * 0.0475,
    backgroundColor: WHEAT2,
    borderWidth: 1.5,
    borderColor: 'rgba(139,69,19,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: { fontFamily: FONTS.bodyBold, fontSize: width * 0.042, color: BROWN },

  body: { paddingHorizontal: width * 0.05, paddingTop: height * 0.015, gap: height * 0.005 },

  field: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: WHEAT2,
    borderRadius: width * 0.04,
    paddingVertical: height * 0.017,
    paddingHorizontal: width * 0.035,
    marginBottom: height * 0.012,
    borderWidth: 1.5,
    borderColor: 'rgba(210,105,30,0.4)',
  },
  fieldIcon: { width: width * 0.095, height: width * 0.095, marginRight: width * 0.035, justifyContent: 'center', alignItems: 'center' },
  fieldIconImg: { width: width * 0.095, height: width * 0.095 },
  fieldContent: { flex: 1 },
  fieldLabel: { fontFamily: FONTS.bodyBold, fontSize: width * 0.029, color: '#9A6030', marginBottom: height * 0.003, textTransform: 'uppercase', letterSpacing: 0.5 },
  fieldValue: { fontFamily: FONTS.body, fontSize: width * 0.042, color: BROWN },
  input: {
    fontFamily: FONTS.body,
    fontSize: width * 0.042,
    color: BROWN,
    borderBottomWidth: 1.5,
    borderBottomColor: AMBER,
    paddingVertical: height * 0.003,
  },

  footer: { paddingHorizontal: width * 0.05, paddingTop: height * 0.02, gap: height * 0.012 },
  saveBtn: {
    backgroundColor: GOLD,
    paddingVertical: height * 0.017,
    borderRadius: width * 0.13,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#C8950A',
  },
  saveBtnDisabled: { opacity: 0.45 },
  saveBtnText: { fontFamily: FONTS.bodyBold, color: '#523600', fontSize: width * 0.042 },

  editBtn: {
    backgroundColor: AMBER,
    paddingVertical: height * 0.017,
    borderRadius: width * 0.13,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: BROWN,
  },
  editBtnText: { fontFamily: FONTS.bodyBold, color: WHEAT, fontSize: width * 0.042 },

  cancelBtn: { alignItems: 'center', paddingVertical: height * 0.01 },
  cancelBtnText: { fontFamily: FONTS.body, color: '#9A6030', fontSize: width * 0.037 },

  // ── Social auth section ──────────────────────────────────────────────────
  socialSection: {
    marginTop: height * 0.012,
    marginBottom: height * 0.008,
  },

  // Linked banner
  linkedBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0FFF4',
    borderRadius: width * 0.04,
    borderWidth: 1.5,
    borderColor: '#4CAF50',
    padding: width * 0.04,
    gap: width * 0.03,
  },
  linkedIcon: { fontSize: width * 0.08 },
  linkedTitle: { fontFamily: FONTS.bodyBold, fontSize: width * 0.038, color: '#2E7D32' },
  linkedSub: { fontFamily: FONTS.bodyBold, fontSize: width * 0.034, color: BROWN, marginTop: 2 },
  linkedDesc: { fontFamily: FONTS.body, fontSize: width * 0.029, color: '#5A8A5A', marginTop: 4 },

  // Header
  socialHeader: { marginBottom: height * 0.012 },
  socialTitle: { fontFamily: FONTS.bodyBold, fontSize: width * 0.04, color: BROWN, marginBottom: 4 },
  socialDesc: { fontFamily: FONTS.body, fontSize: width * 0.031, color: '#9A6030' },

  // Vincular button (filled)
  socialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: WHEAT2,
    borderRadius: width * 0.04,
    borderWidth: 1.5,
    borderColor: AMBER,
    paddingVertical: height * 0.015,
    marginBottom: height * 0.009,
  },
  socialBtnDisabled: { opacity: 0.5 },
  socialBtnText: { fontFamily: FONTS.bodyBold, fontSize: width * 0.038, color: BROWN },

  // Divider
  socialDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: width * 0.02,
    marginVertical: height * 0.01,
  },
  socialDividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(139,69,19,0.2)' },
  socialDividerText: { fontFamily: FONTS.body, fontSize: width * 0.028, color: '#9A6030' },

  // Restaurar button (outline)
  socialBtnOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: width * 0.04,
    borderWidth: 1.5,
    borderColor: 'rgba(210,105,30,0.4)',
    paddingVertical: height * 0.013,
    marginBottom: height * 0.009,
  },
  socialBtnOutlineText: { fontFamily: FONTS.body, fontSize: width * 0.035, color: AMBER },
});
