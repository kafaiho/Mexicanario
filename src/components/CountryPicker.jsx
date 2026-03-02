import React, { useState } from 'react';
import {
    Dimensions,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

const { width, height } = Dimensions.get('window');

// List of common countries
const COUNTRIES = [
  'Argentina', 'Australia', 'Brazil', 'Canada', 'Chile', 'China', 'Colombia',
  'Costa Rica', 'Cuba', 'Denmark', 'Ecuador', 'Egypt', 'El Salvador',
  'Finland', 'France', 'Germany', 'Guatemala', 'Honduras', 'India',
  'Indonesia', 'Ireland', 'Italy', 'Japan', 'Malaysia', 'Mexico',
  'Netherlands', 'New Zealand', 'Nicaragua', 'Norway', 'Panama',
  'Paraguay', 'Peru', 'Philippines', 'Poland', 'Portugal', 'Russia',
  'Singapore', 'South Africa', 'South Korea', 'Spain', 'Sweden',
  'Switzerland', 'Thailand', 'Turkey', 'Ukraine', 'United Kingdom',
  'United States', 'Uruguay', 'Venezuela', 'Vietnam'
].sort();

export default function CountryPicker({ visible, onClose, onSelect, currentCountry }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredCountries, setFilteredCountries] = useState(COUNTRIES);

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setFilteredCountries(COUNTRIES);
    } else {
      const filtered = COUNTRIES.filter(country =>
        country.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredCountries(filtered);
    }
  };

  const handleSelectCountry = (country) => {
    onSelect(country);
    onClose();
    setSearchQuery('');
    setFilteredCountries(COUNTRIES);
  };

  const handleClose = () => {
    setSearchQuery('');
    setFilteredCountries(COUNTRIES);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Select Country</Text>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={handleSearch}
              placeholder="Search countries..."
              placeholderTextColor="#999"
            />
          </View>

          {/* Countries List */}
          <ScrollView style={styles.countriesList} showsVerticalScrollIndicator={false}>
            {filteredCountries.map((country, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.countryItem,
                  currentCountry === country && styles.selectedCountry
                ]}
                onPress={() => handleSelectCountry(country)}
              >
                <Text style={[
                  styles.countryText,
                  currentCountry === country && styles.selectedCountryText
                ]}>
                  {country}
                </Text>
                {currentCountry === country && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Custom Country Option */}
          <TouchableOpacity
            style={styles.customCountryButton}
            onPress={() => handleSelectCountry('')}
          >
            <Text style={styles.customCountryText}>Enter Custom Country</Text>
          </TouchableOpacity>
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
  container: {
    width: width * 0.9,
    height: height * 0.8,
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#f8f9fa',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#ff6b6b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  searchContainer: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchInput: {
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
  },
  countriesList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  countryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedCountry: {
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
  },
  countryText: {
    fontSize: 16,
    color: '#333',
  },
  selectedCountryText: {
    color: '#1976d2',
    fontWeight: 'bold',
  },
  checkmark: {
    color: '#4caf50',
    fontSize: 18,
    fontWeight: 'bold',
  },
  customCountryButton: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#f8f9fa',
  },
  customCountryText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
  },
});
