import React, { useMemo, useState } from 'react';
import { Image, Modal, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function DictionaryModal({ visible, onClose, wordData }) {
  const [query, setQuery] = useState('');

  // Use wordData if provided, otherwise fall back to defaults
  const word = wordData?.word || 'PANA';
  const meaning = wordData?.meaning || 'Persona con la que se tiene una relación de amistad muy cercana y de confianza.';
  const mexicanWord = wordData?.mexican_word || '';
  const example = wordData?.example || '';
  const region = wordData?.region || '';

  // Phone-like bottom keyboard layout with Ñ and delete
  const rows = useMemo(
    () => [
      ['Q','W','E','R','T','Y','U','I','O','P'],
      ['A','S','D','F','G','H','J','K','L','Ñ'],
      ['Z','X','C','V','B','N','M','SPACE','DEL']
    ],
    []
  );

  const onKeyPress = (key) => {
    if (key === 'DEL') { setQuery((q) => q.slice(0, -1)); return; }
    if (key === 'SPACE') { setQuery((q) => q + ' '); return; }
    setQuery((q) => q + key);
  };

  // Key render
  const renderKey = (k, idx) => {
    const isWide = k === 'SPACE';
    const isDelete = k === 'DEL';
    return (
      <TouchableOpacity
        key={`${k}-${idx}`}
        activeOpacity={0.85}
        onPress={() => onKeyPress(k)}
        style={[
          styles.key,
          isWide && styles.keyWide,
          isDelete && styles.keyDelete
        ]}
      >
        {isDelete ? (
          <Image source={require('../../assets/icons/trash.png')} style={{ width: 20, height: 20 }} />
        ) : (
          <Text style={[styles.keyText, isWide && styles.keyTextDim]}>
            {isWide ? 'Espacio' : k}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Mexicanario</Text>
            <TouchableOpacity style={styles.optimoButton} onPress={() => {}}>
              <Text style={styles.optimoText}>Óptimo</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>×</Text>
            </TouchableOpacity>
          </View>

          {/* Content above the keyboard */}
          <ScrollView
            style={styles.content}
            contentContainerStyle={{ paddingBottom: 260 /* space for keyboard */ }}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.queryPill}>
              <Text style={styles.queryText}>{query || 'Escribe...'}</Text>
            </View>

            <View style={styles.definitionCard}>
              <Text style={styles.wordTitle}>{word}</Text>
              <Text style={styles.definition}>{meaning}</Text>
              {example && (
                <Text style={styles.example}>Ejemplo: {example}</Text>
              )}
              {region && (
                <Text style={styles.region}>Región: {region}</Text>
              )}
              
              {/* Accent flexibility hint */}
              <View style={styles.accentHintContainer}>
                <Text style={styles.accentHintText}>
                  💡 Tip: Accents don't matter! You can type "n" instead of "ñ"
                </Text>
              </View>
            </View>
          </ScrollView>

          {/* Bottom docked keyboard */}
          <SafeAreaView edges={['bottom']} style={styles.keyboardDock}>
            <View style={styles.handle} />
            {rows.map((row, rIdx) => (
              <View key={rIdx} style={styles.keyboardRow}>
                {row.map((k, kIdx) => renderKey(k, kIdx))}
              </View>
            ))}
          </SafeAreaView>
        </View>
      </View>
    </Modal>
  );
}

const KEY_HEIGHT = 50;

const styles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center',
  },
  modal: {
    backgroundColor: '#FFE4B5',
    borderRadius: 20,
    width: '92%',
    height: '86%',
    borderWidth: 4, borderColor: '#8B4513',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 2, borderBottomColor: '#E8C799',
  },
  title: { fontSize: 22, fontWeight: '800', color: '#8B4513', flex: 1 },
  optimoButton: { backgroundColor: '#48C774', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 2, borderColor: 'rgba(0,0,0,0.08)' },
  optimoText: { color: 'white', fontWeight: '800' },
  closeButton: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#FF6B35', alignItems: 'center', justifyContent: 'center' },
  closeText: { color: 'white', fontSize: 20, fontWeight: '800', lineHeight: 24 },

  content: { flex: 1, padding: 16 },
  queryPill: {
    alignSelf: 'center', backgroundColor: '#FFFFFF', borderRadius: 24, paddingVertical: 8, paddingHorizontal: 16,
    borderWidth: 2, borderColor: '#E7EDF6', marginBottom: 12,
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 3,
  },
  queryText: { fontWeight: '800', color: '#2E5C8A' },
  definitionCard: { backgroundColor: '#F5DEB3', borderRadius: 12, padding: 14, borderWidth: 2, borderColor: '#D2691E' },
  wordTitle: { fontSize: 16, fontWeight: '800', color: '#8B4513', marginBottom: 8 },
  definition: { fontSize: 14, color: '#8B4513', lineHeight: 20 },
  example: { fontSize: 13, color: '#8B4513', fontStyle: 'italic', marginTop: 8, lineHeight: 18 },
  region: { fontSize: 12, color: '#8B4513', fontWeight: '600', marginTop: 4, lineHeight: 16 },
  mexicanWordContainer: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E7EDF6',
  },
  mexicanWordLabel: {
    fontSize: 14,
    color: '#8B4513',
    fontWeight: '700',
    marginBottom: 4,
  },
  mexicanWord: {
    fontSize: 16,
    color: '#2E5C8A',
    fontWeight: '800',
  },
  accentHintContainer: {
    backgroundColor: '#E8F4FD',
    borderRadius: 8,
    padding: 12,
    marginTop: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  accentHintText: {
    fontSize: 13,
    color: '#007AFF',
    textAlign: 'center',
    fontStyle: 'italic',
  },

  // Bottom dock keyboard styling
  keyboardDock: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    paddingTop: 10, paddingBottom: 12,
    backgroundColor: '#F8FAFF',
    borderTopLeftRadius: 18, borderTopRightRadius: 18,
    borderTopWidth: 2, borderColor: '#E7EDF6',
    shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 8, shadowOffset: { width: 0, height: -2 }, elevation: 10,
  },
  handle: {
    alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: '#D9E2F0', marginBottom: 10,
  },
  keyboardRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingHorizontal: 12, marginBottom: 8 },
  key: {
    height: KEY_HEIGHT, minWidth: 34, paddingHorizontal: 10,
    backgroundColor: '#FFFFFF', borderRadius: 12,
    borderWidth: 2, borderColor: '#E7EDF6',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 3,
  },
  keyWide: { flexGrow: 1, minWidth: 90 },
  keyDelete: { backgroundColor: '#4A90E2', borderColor: '#4A90E2' },
  keyText: { fontWeight: '800', fontSize: 16, color: '#2E5C8A' },
  keyTextDim: { color: '#94A9C6', fontWeight: '700' },
});
