import React from 'react';
import { Modal, View, StyleSheet, Image, TouchableOpacity, ImageBackground, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export default function SinAnuncios({ visible, onClose }) {
  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <ImageBackground
          source={require('../../assets/icons/u (1).png')}
          style={styles.container}
          resizeMode="contain"
        >
          {/* Close Button */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Image
              source={require('../../assets/icons/close.png')}
              style={styles.crossIcon}
              resizeMode="contain"
            />
          </TouchableOpacity>

          {/* Images */}
          <View style={styles.imageRow}>
            <Image source={require('../../assets/icons/ads.png')} style={styles.midImage} resizeMode="contain" />
            <Image source={require('../../assets/icons/ads (1).png')} style={styles.midImage} resizeMode="contain" />
          </View>
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
    height: height * 0.65, // 65% of screen height
    position: 'relative',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: height * 0.21,   // 2.5% from top
    right: width * 0.15,   // 5% from right
  },
  crossIcon: {
    width: width * 0.08,   // 8% of screen width
    height: width * 0.08,
  },
  imageRow: {
    flexDirection: 'column',
    justifyContent: 'center',
    marginTop: height * 0.27, // responsive margin
  },
  midImage: {
    width: width * 0.6,    // 75% of screen width
    height: height * 0.1,  // 15% of screen height
  },
});
