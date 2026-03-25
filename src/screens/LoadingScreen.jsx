import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    Image,
    ImageBackground,
    StyleSheet,
    Text,
    View,
} from 'react-native';

const { width, height } = Dimensions.get('window');

/**
 * LoadingScreen — shown while auth is in progress.
 *
 * @param {{ authReady?: boolean }} props
 *   authReady: true once auth has completed (drives progress to 100%).
 *              Falls back to a 4s timed animation if not provided (backwards compat).
 */
export default function LoadingScreen({ authReady }) {
  const progress = useRef(new Animated.Value(0)).current;
  const [percentage, setPercentage] = useState(0);
  const [statusText, setStatusText] = useState('Conectando...');
  const slowTimerRef = useRef(null);

  // Phase 1: animate to 70% quickly (1.5s) — "connecting" phase
  useEffect(() => {
    Animated.timing(progress, {
      toValue: 0.7,
      duration: 1500,
      useNativeDriver: false,
    }).start();

    // If still loading after 4s, show "taking longer" message
    slowTimerRef.current = setTimeout(() => {
      setStatusText('La conexión está tardando...');
    }, 4000);

    return () => clearTimeout(slowTimerRef.current);
  }, []);

  // Phase 2: when auth completes, snap to 100%
  useEffect(() => {
    if (!authReady) return;
    clearTimeout(slowTimerRef.current);
    setStatusText('¡Listo!');
    Animated.timing(progress, {
      toValue: 1,
      duration: 400,
      useNativeDriver: false,
    }).start();
  }, [authReady]);

  // Sync percentage counter with animated value
  useEffect(() => {
    const id = progress.addListener(({ value }) => {
      setPercentage(Math.round(value * 100));
    });
    return () => progress.removeListener(id);
  }, []);

  return (
    <ImageBackground
      source={require('../../assets/images/bg.webp')}
      style={styles.container}
      resizeMode="cover"
    >
      {/* Logo */}
      <View style={styles.logoContainer}>
        <Image
          source={require('../../assets/images/logo.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />
      </View>

      {/* Loading bar */}
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingLabel}>{statusText}</Text>
        <View style={styles.progressBarContainer}>
          <Animated.View
            style={[
              styles.progressBar,
              {
                width: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
          <View style={styles.percentageOverlay}>
            <Text style={styles.percentage}>{percentage}%</Text>
          </View>
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: height * 0.12,
  },
  logoImage: {
    width: width * 0.85,
    height: height * 0.35,
  },
  loadingContainer: {
    position: 'absolute',
    bottom: height * 0.15,
    width: '80%',
    alignItems: 'center',
  },
  loadingLabel: {
    color: '#FFFFFF',
    fontSize: width * 0.048,
    fontWeight: 'bold',
    marginBottom: height * 0.012,
  },
  progressBarContainer: {
    width: '100%',
    height: height * 0.032,
    backgroundColor: '#cd9a54',
    borderRadius: width * 0.025,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#67e05c',
    borderRadius: width * 0.025,
  },
  percentageOverlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  percentage: {
    color: '#FFFFFF',
    fontSize: width * 0.042,
    fontWeight: 'bold',
  },
});
