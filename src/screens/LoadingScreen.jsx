import React, { useEffect, useState } from 'react';
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

export default function LoadingScreen() {
  const [progress] = useState(new Animated.Value(0));
  const [loadingText, setLoadingText] = useState('Loading...');
  const [percentage, setPercentage] = useState(0);

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: 3000,
      useNativeDriver: false,
    }).start();

    const interval = setInterval(() => {
      setPercentage((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 1;
      });
    }, 30);

    return () => clearInterval(interval);
  }, []);

  return (
    <ImageBackground
      source={require('../../assets/images/bg.png')}
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
        <Text style={styles.loadingLabel}>{loadingText}</Text>
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
