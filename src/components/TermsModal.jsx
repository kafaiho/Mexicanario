import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';

export default function TermsModal({ visible, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Términos de servicio</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            <Text style={styles.sectionTitle}>Fecha de entrada en vigor:</Text>
            <Text style={styles.text}>
              Bienvenido a nuestro juego. Estos Términos de Servicio rigen el uso de nuestros servicios. Al acceder o utilizar nuestros servicios, usted acepta estar sujeto a estos términos y condiciones. Si no está de acuerdo con alguna parte de estos términos, entonces no puede acceder al servicio.
            </Text>

            <Text style={styles.sectionTitle}>1. Licencia para usar nuestros servicios</Text>
            <Text style={styles.text}>
              Concedemos a los usuarios una licencia limitada, no exclusiva, no transferible y revocable para usar nuestros servicios de acuerdo con estos términos. Esta licencia permite el uso personal y no comercial de nuestros servicios. Usted no puede modificar, distribuir, transmitir, mostrar, realizar, reproducir, publicar, licenciar, crear trabajos derivados, transferir o vender cualquier información, software, productos o servicios obtenidos de nuestros servicios.
            </Text>

            <Text style={styles.sectionTitle}>2. Conducta del usuario</Text>
            <Text style={styles.text}>
              Nuestros usuarios deben seguir ciertas reglas de conducta al utilizar nuestros servicios. Usted acepta no utilizar nuestros servicios para cualquier propósito que sea ilegal o esté prohibido por estos términos. Usted no puede usar nuestros servicios de manera que pueda dañar, deshabilitar, sobrecargar o deteriorar nuestros servicios o interferir con el uso y disfrute de nuestros servicios por parte de cualquier otra parte.
            </Text>
          </ScrollView>
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
    width: '90%',
    height: '80%',
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8B4513',
    flex: 1,
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
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4A90E2',
    marginBottom: 10,
    marginTop: 15,
  },
  text: {
    fontSize: 12,
    color: '#8B4513',
    lineHeight: 18,
    marginBottom: 15,
    textAlign: 'justify',
  },
});
