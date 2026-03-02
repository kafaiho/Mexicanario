import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

export default function InviteModal({ visible, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Invitar</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="close" size={24} color="#8B4513" />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <Text style={styles.skullEmoji}>💀</Text>
            
            <Text style={styles.message}>
              Que crezca la guachafa!{'\n'}
              Invita a tus panas y recibe 100 por cada{'\n'}
              uno que instale el juego
            </Text>

            <View style={styles.progressContainer}>
              <Text style={styles.progressText}>0/100</Text>
            </View>

            <TouchableOpacity style={styles.inviteButton}>
              <Text style={styles.inviteButtonText}>Guardar</Text>
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
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: '#FFE4B5',
    borderRadius: 20,
    padding: 20,
    width: '80%',
    borderWidth: 4,
    borderColor: '#8B4513',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8B4513',
  },
  closeButton: {
    padding: 5,
  },
  content: {
    alignItems: 'center',
  },
  skullEmoji: {
    fontSize: 60,
    marginBottom: 20,
  },
  message: {
    textAlign: 'center',
    fontSize: 14,
    color: '#8B4513',
    marginBottom: 20,
    lineHeight: 20,
  },
  progressContainer: {
    backgroundColor: '#F5DEB3',
    borderRadius: 20,
    paddingHorizontal: 30,
    paddingVertical: 10,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#D2691E',
  },
  progressText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#8B4513',
  },
  inviteButton: {
    backgroundColor: '#32CD32',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#228B22',
  },
  inviteButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
