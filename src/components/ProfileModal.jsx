import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput } from 'react-native';
import { FONTS } from '../theme/designTokens';

const BROWN = '#8B4513';
const AMBER = '#D2691E';
const GOLD  = '#F8BE17';
const WHEAT = '#FFE4B5';
const WHEAT2 = '#F5DEB3';

export default function ProfileModal({ visible, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Perfil</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <View style={styles.inputGroup}>
              <View style={styles.inputContainer}>
                <Text style={styles.fieldIcon}>✏️</Text>
                <Text style={styles.inputLabel}>Mudassir</Text>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.inputContainer}>
                <Text style={styles.avatarIcon}>👤</Text>
                <Text style={styles.inputLabel}>Avatar</Text>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.inputContainer}>
                <Text style={styles.flagIcon}>🇲🇽</Text>
                <Text style={styles.inputLabel}>País</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.saveButton}>
              <Text style={styles.saveButtonText}>Guardar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: WHEAT,
    borderRadius: 20,
    padding: 20,
    width: '80%',
    borderWidth: 2,
    borderColor: 'rgba(139,69,19,0.5)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(210,105,30,0.3)',
  },
  title: {
    fontFamily: FONTS.display,
    fontSize: 24,
    color: BROWN,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: WHEAT2,
    borderWidth: 1.5,
    borderColor: 'rgba(139,69,19,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIcon: {
    fontFamily: FONTS.bodyBold,
    fontSize: 14,
    color: BROWN,
  },
  content: {
    gap: 12,
  },
  inputGroup: {
    marginBottom: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: WHEAT2,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(210,105,30,0.4)',
    gap: 12,
  },
  fieldIcon: {
    fontSize: 18,
  },
  inputLabel: {
    fontFamily: FONTS.body,
    fontSize: 16,
    color: BROWN,
  },
  avatarIcon: {
    fontSize: 18,
  },
  flagIcon: {
    fontSize: 18,
  },
  saveButton: {
    backgroundColor: GOLD,
    padding: 14,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 16,
    borderWidth: 1.5,
    borderColor: '#C8950A',
  },
  saveButtonText: {
    fontFamily: FONTS.bodyBold,
    color: '#523600',
    fontSize: 17,
  },
});
