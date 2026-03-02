import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Image, ImageBackground } from 'react-native';

export default function AdRemovalModal({ visible, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <ImageBackground
        source={{ uri: '/assets/images/bg.png' }}
        style={styles.overlay}
        resizeMode="cover"
      >
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Sin A nuncios</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <View style={styles.adOptions}>
              <View style={styles.adOption}>
                <View style={styles.adIconContainer}>
                  <Image 
                    source={{ uri: '/assets/images/ads.png' }} 
                    style={styles.adIcon} 
                  />
                </View>
                <Text style={styles.adDuration}>Durante 10 minutos</Text>
                <TouchableOpacity style={styles.adButton}>
                  <Text style={styles.adButtonText}>11 Ad</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.adOption}>
                <View style={styles.adIconContainer}>
                  <Image 
                    source={{ uri: '/assets/images/ads.png' }} 
                    style={styles.adIcon} 
                  />
                </View>
                <Text style={styles.adDuration}>permanentemente</Text>
                <TouchableOpacity style={styles.adPriceButton}>
                  <Text style={styles.adPriceText}>R$ 1.500,00</Text>
                </TouchableOpacity>
              </View>
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
  adOptions: {
    gap: 20,
    width: '100%',
  },
  adOption: {
    backgroundColor: '#F5DEB3',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#D2691E',
  },
  adIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  adIcon: {
    width: 70,
    height: 70,
  },
  adDuration: {
    fontSize: 16,
    color: '#8B4513',
    marginBottom: 15,
    textAlign: 'center',
  },
  adButton: {
    backgroundColor: '#32CD32',
    paddingHorizontal: 25,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#228B22',
  },
  adButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  adPriceButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 25,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#2E5C8A',
  },
  adPriceText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
