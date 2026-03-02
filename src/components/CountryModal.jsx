import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

export default function CountryModal({ visible, onClose }) {
  const [selectedCountry, setSelectedCountry] = useState('mexico');

  const countries = [
    { code: 'usa', flag: '🇺🇸', name: 'usa' },
    { code: 'mexico', flag: '🇲🇽', name: 'mexico' },
    { code: 'uk', flag: '🇬🇧', name: 'uk' }
  ];

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Mexico</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="close" size={24} color="#8B4513" />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <View style={styles.countryList}>
              {countries.map((country) => (
                <TouchableOpacity
                  key={country.code}
                  style={[
                    styles.countryOption,
                    selectedCountry === country.code && styles.selectedCountry
                  ]}
                  onPress={() => setSelectedCountry(country.code)}
                >
                  <Text style={styles.flagEmoji}>{country.flag}</Text>
                  <Text style={styles.countryName}>{country.name}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.saveButton}>
              <Text style={styles.saveButtonText}>Guardar</Text>
            </TouchableOpacity>
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
    padding: 5,
  },
  content: {
    alignItems: 'center',
  },
  countryList: {
    width: '100%',
    gap: 10,
    marginBottom: 30,
  },
  countryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5DEB3',
    padding: 15,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D2691E',
  },
  selectedCountry: {
    borderColor: '#32CD32',
    backgroundColor: '#98FB98',
  },
  flagEmoji: {
    fontSize: 24,
    marginRight: 15,
  },
  countryName: {
    fontSize: 16,
    color: '#8B4513',
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: '#32CD32',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#228B22',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
