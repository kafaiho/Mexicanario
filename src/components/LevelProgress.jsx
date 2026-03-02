import { useQuery } from 'convex/react';
import React from 'react';
import {
  Image,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { api } from '../../convex/_generated/api';
import { useAuth } from '../context/AuthContext';

export default function LevelProgress() {
  const { userId } = useAuth();
  const levelInfo = useQuery(api.users.getCurrentLevel, { userId });

  if (!levelInfo) return null;

  return (
    <View style={styles.container}>
      <View style={styles.levelHeader}>
        <View style={styles.levelBadge}>
          <Text style={styles.levelText}>Nivel {levelInfo.level}</Text>
        </View>
      </View>

      {/* Level Indicator */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBackground} />
        <View style={[styles.progressFill, { width: '100%' }]} />
      </View>

      {/* Rewards */}
      <View style={styles.rewardsContainer}>
        <View style={styles.reward}>
          <Image 
            source={require('../../assets/icons/coin.png')} 
            style={styles.rewardIcon}
          />
          <Text style={styles.rewardText}>+{levelInfo.reward.coins}</Text>
        </View>
        <View style={styles.reward}>
          <Image 
            source={require('../../assets/icons/diamond.png')} 
            style={styles.rewardIcon}
          />
          <Text style={styles.rewardText}>+{levelInfo.reward.diamonds}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 15,
    margin: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  levelBadge: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 20,
  },
  levelText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  scoreText: {
    color: '#2E5C3F',
    fontSize: 14,
    fontWeight: '600',
  },
  progressContainer: {
    height: 10,
    backgroundColor: '#E7EDF6',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#E7EDF6',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#41C778',
    borderRadius: 5,
  },
  rewardsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 10,
  },
  reward: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  rewardIcon: {
    width: 20,
    height: 20,
    marginRight: 5,
  },
  rewardText: {
    color: '#FF6B35',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
