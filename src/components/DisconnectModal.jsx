import React, { useState } from 'react';
import {
  Alert,
  Dimensions,
  Image,
  ImageBackground,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useAuth } from '../context/AuthContext';

const { width, height } = Dimensions.get('window');

export default function DisconnectModal({ visible, onClose }) {
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const { logout, user } = useAuth();

  if (!visible) return null;

  const handleDisconnect = async () => {
    Alert.alert(
      'Desconectar',
      '¿Estás seguro de que quieres desconectarte? Perderás tu progreso actual.',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Desconectar',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsDisconnecting(true);
              await logout();
              onClose();
              Alert.alert(
                'Desconectado',
                'Te has desconectado exitosamente. Se ha creado una nueva sesión.',
                [{ text: 'OK' }]
              );
            } catch (error) {
              console.error('Error during disconnect:', error);
              Alert.alert(
                'Error',
                'Hubo un problema al desconectarte. Por favor, intenta de nuevo.',
                [{ text: 'OK' }]
              );
            } finally {
              setIsDisconnecting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <ImageBackground
          source={require('../../assets/icons/disconnect-bg.png')} 
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
          
          {/* Disconnect Content - positioned over the background image */}
          <View style={styles.contentContainer}>
            <Text style={styles.title}>¿Desconectar?</Text>
            <Text style={styles.subtitle}>
              Al desconectarte, perderás tu progreso actual y se creará una nueva sesión.
            </Text>
            
            {user && (
              <View style={styles.userInfo}>
                <Text style={styles.userName}>Usuario: {user.name}</Text>
                <Text style={styles.userLevel}>Nivel: {user.currentLevel || 1}</Text>
                <Text style={styles.userCoins}>Monedas: {user.coins || 0}</Text>
              </View>
            )}
            
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={[styles.button, styles.cancelButton]} 
                onPress={onClose}
                disabled={isDisconnecting}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.button, styles.disconnectButton]} 
                onPress={handleDisconnect}
                disabled={isDisconnecting}
              >
                <Text style={styles.disconnectButtonText}>
                  {isDisconnecting ? 'Desconectando...' : 'Desconectar'}
                </Text>
              </TouchableOpacity>
            </View>
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
    width: width * 1,  // 80% of screen width
    height: width * 1, // maintain square shape
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    padding: 15,
  },
  closeButton: {
    position: 'absolute',
    top: height * 0.1,    // 5% from top
    right: width * 0.13,   // 5% from right
  },
  crossIcon: {
    width: width * 0.08,   // 8% of screen width
    height: width * 0.08,  // keep square
  },
  contentContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -width * 0.3 }, { translateY: -50 }],
    width: width * 0.6,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2E5C8A',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  userInfo: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 8,
    padding: 10,
    marginBottom: 20,
    width: '100%',
    alignItems: 'center',
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E5C8A',
    marginBottom: 5,
  },
  userLevel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  userCoins: {
    fontSize: 14,
    color: '#666',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 10,
  },
  button: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#6C757D',
  },
  disconnectButton: {
    backgroundColor: '#DC3545',
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  disconnectButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
