import React from 'react';
import { View, Modal, ImageBackground, Image, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get("window");

export default function Heriokio({ visible, onClose }) {
  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <ImageBackground
          source={require('../../assets/icons/hvhu.png')} 
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
    width: width * 0.9,     // ✅ 90% of screen width
    height: height * 0.8,   // ✅ 80% of screen height
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    padding: width * 0.04,  // ✅ responsive padding
  },
  closeButton: {
    position: 'absolute',
   top: height * 0.18,       // ✅ 5% from top
    right: width * 0.10,  
  },
  crossIcon: {
    width: width * 0.08,    // ✅ icon scales with screen size
    height: width * 0.08,
  },
});
