import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Image } from 'react-native';

export default function VenezolanometroModal({ visible, onClose }) {
  const levels = [
    { level: 60, locked: false },
    { level: 50, locked: true },
    { level: 40, locked: true },
    { level: 30, locked: true },
    { level: 10, locked: true },
  ];

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Venezolanómetra</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <View style={styles.meterContainer}>
              {levels.map((item, index) => (
                <View key={index} style={styles.levelContainer}>
                  <Text style={styles.levelText}>{item.level}</Text>
                  <View style={[styles.levelIndicator, item.locked && styles.lockedIndicator]}>
                    {item.locked && (
                      <Image 
                        source={{ uri: '/placeholder.svg?height=20&width=20&text=🔒' }} 
                        style={styles.lockIcon} 
                      />
                    )}
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.bottomSection}>
              <View style={styles.characterContainer}>
                <Image 
                  source={{ uri: '/placeholder.svg?height=60&width=60&text=🌮' }} 
                  style={styles.characterImage} 
                />
                <Text style={styles.characterText}>
                  En panales{'\n'}
                  de colmena{'\n'}
                  se come!
                </Text>
              </View>
            </View>
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
    width: '85%',
    height: '70%',
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#8B4513',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    alignItems: 'center',
  },
  meterContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  levelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  levelText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8B4513',
    marginRight: 20,
    width: 30,
  },
  levelIndicator: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#32CD32',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#228B22',
  },
  lockedIndicator: {
    backgroundColor: '#D3D3D3',
    borderColor: '#A9A9A9',
  },
  lockIcon: {
    width: 20,
    height: 20,
  },
  bottomSection: {
    alignItems: 'center',
  },
  characterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5DEB3',
    borderRadius: 15,
    padding: 15,
    borderWidth: 2,
    borderColor: '#D2691E',
  },
  characterImage: {
    width: 60,
    height: 60,
    marginRight: 15,
  },
  characterText: {
    fontSize: 14,
    color: '#8B4513',
    fontWeight: '500',
    textAlign: 'center',
  },
});
