import { useIsFocused } from '@react-navigation/native';
import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { getPetTypeInfo } from '../../config/petTypes';
import usePetStore, { getStage } from '../../store/usePetStore';
import Pet3DView from '../Pet3D/Pet3DView';
import StageCropped from './StageCropped';

const OLD_NAMES = { ajolote: 'ajolote', xolo: 'xolo', alebrije: 'alebrije' };

/**
 * PetRebirthNotice — aviso único para quien tenía Ajolote, Xolo o Alebrije:
 * su mascota renació como Ayotl, Tecolote o Monarca y conserva todo su progreso.
 * Espera a que no haya una ceremonia de evolución en pantalla.
 */
export default function PetRebirthNotice() {
  const isFocused = useIsFocused();
  const reduceMotion = useReducedMotion();
  const pending = usePetStore((s) => s.pendingRebirth);
  const pendingEvolution = usePetStore((s) => s.pendingEvolution);
  const petName = usePetStore((s) => s.petName);
  const vinculo = usePetStore((s) => s.vinculo);
  const clear = usePetStore((s) => s.clearPendingRebirth);

  if (!pending) return null;
  const info = getPetTypeInfo(pending.to);
  if (!info) return null;
  const stage = getStage(vinculo);
  const visible = isFocused && !pendingEvolution;
  const oldName = OLD_NAMES[pending.from] ?? 'mascota';

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={clear}>
      <View style={styles.backdrop}>
        <View style={styles.card} accessibilityViewIsModal>
          <Pet3DView
            petType={pending.to}
            stage={stage}
            size={190}
            active={visible}
            reduceMotion={reduceMotion}
            interactive
            mood="joyful"
            fallback={<StageCropped petType={pending.to} stage={stage} size={190} />}
          />
          <Text style={[styles.eyebrow, { color: info.accent }]}>{info.word}</Text>
          <Text style={styles.title}>¡{petName} renació!</Text>
          <Text style={styles.body}>
            Tu {oldName} ahora es {info.article} {info.name}, en 3D y con animaciones.
            Conserva su nombre, su etapa y todo su vínculo.
          </Text>
          <Text style={styles.hint}>{info.desc}</Text>
          <Pressable
            onPress={clear}
            style={({ pressed }) => [styles.button, { backgroundColor: info.accent, opacity: pressed ? 0.85 : 1 }]}
            accessibilityRole="button"
          >
            <Text style={styles.buttonText}>¡Vamos!</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(20,8,30,0.72)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { width: '100%', maxWidth: 380, backgroundColor: '#FFF8EE', borderRadius: 24, paddingHorizontal: 22, paddingTop: 10, paddingBottom: 22, alignItems: 'center' },
  eyebrow: { fontSize: 12, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase', marginTop: 4 },
  title: { fontSize: 24, fontWeight: '800', color: '#2A1630', marginTop: 4, textAlign: 'center' },
  body: { fontSize: 15, lineHeight: 21, color: '#4A3A52', textAlign: 'center', marginTop: 8 },
  hint: { fontSize: 13, color: '#7A6882', textAlign: 'center', marginTop: 8 },
  button: { marginTop: 18, borderRadius: 999, paddingVertical: 12, paddingHorizontal: 34 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
});
