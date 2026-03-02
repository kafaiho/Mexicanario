import React from 'react';
import { Modal, View, StyleSheet, Image, Text  , TouchableOpacity, ImageBackground } from 'react-native';

export default function Avatar({ visible, onClose }) {
  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <ImageBackground
          source={require('../../assets/icons/perfillBg.png')} // Background image
          style={styles.container}
          resizeMode="contain"
        >
                    <Text style={styles.title}>Avatar</Text>
          
          {/* Close Button */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Image
              source={require('../../assets/icons/close.png')}
              style={styles.crossIcon}
              resizeMode="contain"
            />
          </TouchableOpacity>

          {/* 3 Middle Images */}
          <View style={styles.imageRow}>
            <Image source={require('../../assets/icons/up side 1.png')} style={styles.midImageBig} resizeMode="contain" />
            <Image source={require('../../assets/icons/selected.png')} style={styles.midImage} resizeMode="contain" />
            <Image source={require('../../assets/icons/unselected.png')} style={styles.midImage} resizeMode="contain" />
            <Image source={require('../../assets/icons/selected.png')} style={styles.midImage} resizeMode="contain" />
          </View>

          {/* 6 Buttons */}
          <View style={styles.buttonGrid}>
            {[
              require('../../assets/icons/Guardar.png'),
            ].map((src, index) => (
              <TouchableOpacity key={index} style={styles.button}>
                <Image source={src} style={styles.buttonImage} resizeMode="contain" />
              </TouchableOpacity>
            ))}
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
  width: 480,
    height: 480,
    position: 'relative',
    alignItems: 'center',
  },
  closeButton: {
   position: 'absolute',
    top: 30,
    right: 30,
  },
  crossIcon: {
    width: 35,
    height: 35,
  },
    title: {
    position: 'absolute',
    top: 29,
    alignSelf: 'center',
    fontSize: 40,
    fontWeight: 'bold',
    color: '#fff', // change if your background is light
  },
  imageRow: {
   gap: 15,
    flexDirection: 'column',
    justifyContent: 'center',
    marginTop: 110,
  },
  midImageBig:{
    width: 400,
    height: 70,
  },
  midImage: {
  width: 400,
    height: 50,
  },
  buttonGrid: {
     gap: 10,
    flexDirection: 'column',
    justifyContent: 'center',
    marginTop: 20,
  },
  button: {
    width: 400,
    height: 50,
  },
  buttonImage: {
    width: '100%',
    height: '100%',
  },
});
