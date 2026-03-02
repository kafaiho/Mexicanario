import { useMutation } from 'convex/react';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
} from 'react-native';
import { api } from '../../convex/_generated/api';
import { useAuth } from '../context/AuthContext';
import CountryPicker from './CountryPicker';
import { FONTS } from '../theme/designTokens';

const { width, height } = Dimensions.get('window');
const BROWN = '#8B4513';
const AMBER = '#D2691E';
const GOLD  = '#F8BE17';
const WHEAT = '#FFE4B5';
const WHEAT2 = '#F5DEB3';

export default function Perfil({ visible, onClose }) {
  const { userId, user } = useAuth();
  const updateUserProfile = useMutation(api.users.updateUserProfile);

  const [name, setName] = useState('');
  const [country, setCountry] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

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

          <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
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
});
