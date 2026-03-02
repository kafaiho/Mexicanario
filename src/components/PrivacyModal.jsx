import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

export default function PrivacyModal({ visible, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Política de Privacidad</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="close" size={24} color="#8B4513" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            <Text style={styles.sectionTitle}>Fecha de entrada en vigor:</Text>
            <Text style={styles.text}>
              Esta Política de Privacidad describe cómo recopilamos, usamos y protegemos su información personal cuando utiliza nuestros servicios. Al acceder o utilizar nuestros servicios, usted acepta las prácticas descritas en esta política.
            </Text>

            <Text style={styles.sectionTitle}>1. Información que recopilamos</Text>
            <Text style={styles.text}>
              Recopilamos información que usted nos proporciona directamente, como cuando crea una cuenta, se comunica con nosotros o utiliza nuestros servicios. También podemos recopilar información automáticamente sobre su uso de nuestros servicios.
            </Text>

            <Text style={styles.sectionTitle}>2. Cómo usamos su información</Text>
            <Text style={styles.text}>
              Utilizamos su información para proporcionar, mantener y mejorar nuestros servicios, procesar transacciones, comunicarnos con usted y cumplir con nuestras obligaciones legales.
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#8B4513',
    flex: 1,
  },
  closeButton: {
    padding: 5,
  },
  content: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#8B4513',
    marginBottom: 10,
    marginTop: 15,
  },
  text: {
    fontSize: 14,
    color: '#8B4513',
    lineHeight: 20,
    marginBottom: 15,
  },
});
