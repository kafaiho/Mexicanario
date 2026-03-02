import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Image, ImageBackground } from 'react-native';

export default function SupportModal({ visible, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <ImageBackground
        source={{ uri: '/assets/images/bg.png' }}
        style={styles.overlay}
        resizeMode="cover"
      >
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Apoyar</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <Text style={styles.message}>
              Te está gustando?{'\n'}
              brindanos un cafecito que nos da energía{'\n'}
              para seguir inventando!
            </Text>

            <Text style={styles.subMessage}>Un guayoyo!</Text>

            <View style={styles.donationOptions}>
              <TouchableOpacity style={styles.donationButton}>
                <Image 
                  source={{ uri: '/assets/images/gift.png' }} 
                  style={styles.giftIcon} 
                />
                <Text style={styles.donationPrice}>R$ 300,00</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.donationButton}>
                <Image 
                  source={{ uri: '/assets/images/gift.png' }} 
                  style={styles.giftIcon} 
                />
                <View style={styles.donationInfo}>
                  <Text style={styles.donationText}>Un tetero</Text>
                  <Text style={styles.donationPrice}>R$ 600,00</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.donationButton}>
                <Image 
                  source={{ uri: '/assets/images/gift.png' }} 
                  style={styles.giftIcon} 
                />
                <View style={styles.donationInfo}>
                  <Text style={styles.donationText}>Un tetero</Text>
                  <Text style={styles.donationPrice}>R$ 1500,00</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ImageBackground>
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
    alignItems: 'center',
  },
  message: {
    textAlign: 'center',
    fontSize: 16,
    color: '#8B4513',
    marginBottom: 15,
    lineHeight: 22,
  },
  subMessage: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8B4513',
    marginBottom: 20,
  },
  donationOptions: {
    gap: 15,
    width: '100%',
  },
  donationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5DEB3',
    padding: 15,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#D2691E',
  },
  giftIcon: {
    width: 50,
    height: 50,
    marginRight: 15,
  },
  donationInfo: {
    flex: 1,
  },
  donationText: {
    fontSize: 16,
    color: '#8B4513',
    fontWeight: '500',
  },
  donationPrice: {
    fontSize: 14,
    color: '#4A90E2',
    fontWeight: 'bold',
  },
});
