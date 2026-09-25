import { useQuery } from 'convex/react';
import React from 'react';
import { Dimensions, Image, ImageBackground, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { api } from '../../convex/_generated/api';
import { useAuth } from '../context/AuthContext';

const { width, height } = Dimensions.get('window');

export default function MexicanarioModal({ visible, onClose }) {
  const { userId, user } = useAuth();
  const dictionary = useQuery(
    api.words.getDictionary,
    userId ? { userId } : "skip"
  );

  if (!dictionary) return null;

  // Descubiertas completas; de las bloqueadas solo llega cuántas hay por letra
  const { words, lockedByLetter = {}, total: totalCount } = dictionary;
  const unlockedCount = words.length;

  // Agrupa las descubiertas por su letra (el servidor ya la calcula igual que las bloqueadas)
  const grouped = {};
  for (const word of [...words].sort((a, b) => a.word.localeCompare(b.word, 'es'))) {
    (grouped[word.letter] ??= []).push(word);
  }

  // Todas las letras que tienen palabras (descubiertas o no), en orden del abecedario
  const alphabet = [...new Set([...Object.keys(grouped), ...Object.keys(lockedByLetter)])]
    .sort((a, b) => (a === '#') - (b === '#') || a.localeCompare(b, 'es'));

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <ImageBackground source={require('../../assets/images/bg.webp')} style={styles.overlay} resizeMode="cover">
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Mexicanario</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>

          {/* Progress counter */}
          <View style={styles.progressBar}>
            <Text style={styles.progressText}>
              {unlockedCount} / {totalCount} palabras descubiertas
            </Text>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: totalCount > 0 ? `${(unlockedCount / totalCount) * 100}%` : '0%' },
                ]}
              />
            </View>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.content} contentContainerStyle={{ paddingBottom: height * 0.025 }}>
            {/* Book visual */}
            <View style={styles.bookContainer}>
              <Image source={require('../../assets/images/venezolario.png')} style={styles.bookImage} resizeMode="contain" />
            </View>

            {/* Alphabetical word list */}
            {alphabet.map((letter) => {
              const found = grouped[letter] ?? [];
              const locked = lockedByLetter[letter] ?? 0;
              return (
              <View key={letter} style={styles.letterSection}>
                <View style={styles.letterHeaderRow}>
                  <Text style={styles.letterHeader}>{letter}</Text>
                  <Text style={styles.letterCount}>{found.length} / {found.length + locked}</Text>
                </View>
                {found.map((word, index) => (
                  <View key={word._id || index} style={styles.wordCard}>
                    <Text style={styles.wordTitle}>{word.word}</Text>
                    <Text style={styles.definition}>{word.meaning}</Text>
                    {word.example ? (
                      <Text style={styles.example}>"{word.example}"</Text>
                    ) : null}
                  </View>
                ))}
                {/* Las que faltan de esta letra: una sola fila para no dibujar cientos de tarjetas */}
                {locked > 0 && (
                  <View style={[styles.wordCard, styles.wordCardLocked]}>
                    <View style={styles.lockedRow}>
                      <Text style={styles.lockIcon}>🔒</Text>
                      <Text style={styles.lockedText}>
                        {locked === 1
                          ? '1 palabra por descubrir. ¡Adivínala jugando!'
                          : `${locked} palabras por descubrir. ¡Adivínalas jugando!`}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
              );
            })}

            {totalCount === 0 && (
              <View style={styles.noResults}>
                <Text style={styles.noResultsText}>No hay palabras todavia</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </ImageBackground>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modal: {
    backgroundColor: '#FFE4B5',
    borderRadius: width * 0.05,
    padding: width * 0.05,
    width: '85%',
    height: '78%',
    borderWidth: width * 0.01,
    borderColor: '#8B4513',
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: height * 0.015 },
  title: { fontSize: width * 0.06, fontWeight: 'bold', color: '#8B4513' },
  closeButton: {
    width: width * 0.08,
    height: width * 0.08,
    borderRadius: width * 0.04,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: { color: 'white', fontSize: width * 0.055, fontWeight: 'bold' },
  content: { flex: 1 },

  // Progress bar
  progressBar: { marginBottom: height * 0.015 },
  progressText: { color: '#8B4513', fontWeight: 'bold', fontSize: width * 0.034, marginBottom: height * 0.008, textAlign: 'center' },
  progressTrack: { height: height * 0.01, backgroundColor: '#DEB887', borderRadius: width * 0.01, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#D2691E', borderRadius: width * 0.01 },

  bookContainer: { alignItems: 'center', marginBottom: height * 0.015 },
  bookImage: { width: width * 0.2, height: width * 0.2 },

  letterSection: { marginBottom: height * 0.025 },
  letterHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: height * 0.012 },
  letterHeader: { fontSize: width * 0.053, fontWeight: 'bold', color: '#8B4513' },
  letterCount: { fontSize: width * 0.032, fontWeight: 'bold', color: '#A0522D' },

  wordCard: {
    backgroundColor: '#F5DEB3',
    borderRadius: width * 0.025,
    padding: width * 0.04,
    borderWidth: 2,
    borderColor: '#D2691E',
    marginBottom: height * 0.012,
  },
  wordCardLocked: {
    backgroundColor: '#E8D5B5',
    borderColor: '#C4A882',
  },
  wordTitle: { fontSize: width * 0.042, fontWeight: 'bold', color: '#8B4513', marginBottom: height * 0.005 },
  definition: { fontSize: width * 0.037, color: '#8B4513', lineHeight: width * 0.053 },
  example: { fontSize: width * 0.034, color: '#7A4020', fontStyle: 'italic', marginTop: height * 0.005 },

  lockedRow: { flexDirection: 'row', alignItems: 'center', gap: width * 0.02 },
  lockIcon: { fontSize: width * 0.053 },
  lockedText: { flex: 1, color: '#A08060', fontSize: width * 0.034, fontStyle: 'italic' },

  noResults: { alignItems: 'center', paddingVertical: height * 0.025 },
  noResultsText: { fontSize: width * 0.042, color: '#8B4513', fontStyle: 'italic' },
});
