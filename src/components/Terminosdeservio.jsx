import React from 'react';
import { View, Modal, ImageBackground, Image, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export default function Terminosdeservio({ visible, onClose }) {
  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <ImageBackground
          source={require('../../assets/icons/Terminos de servio (1).png')} 
          style={styles.container}
          resizeMode="contain"
        >
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Image
              source={require('../../assets/icons/close.png')}
              style={styles.crossIcon}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </ImageBackground>
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
  container: {
    width: width * 1,   // 85% of screen width
    height: height * 0.75,  // 75% of screen height
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    padding: width * 0.03, // responsive padding
  },
  closeButton: {
    position: 'absolute',
    top: height * 0.13,    // 3% from top
    right: width * 0.13,   // 5% from right
  },
  crossIcon: {
    width: width * 0.08,   // 8% of screen width
    height: width * 0.08,
  },
});
