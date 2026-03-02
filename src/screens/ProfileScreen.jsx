import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ImageBackground, Dimensions } from 'react-native';
import { FONTS } from '../theme/designTokens';

const { width, height } = Dimensions.get('window');
const BROWN = '#8B4513';
const AMBER = '#D2691E';
const GOLD  = '#F8BE17';
const WHEAT = '#FFE4B5';
import { LinearGradient } from 'expo-linear-gradient';
import TopBar from '../components/TopBar';
import ProfileModal from '../components/ProfileModal';
import AvatarModal from '../components/AvatarModal';
import CountryModal from '../components/CountryModal';
import InviteModal from '../components/InviteModal';

export default function ProfileScreen() {
  const [showProfile, setShowProfile] = useState(false);
  const [showAvatar, setShowAvatar] = useState(false);
  const [showCountry, setShowCountry] = useState(false);
  const [showInvite, setShowInvite] = useState(false);

  return (
   <ImageBackground
              source={require('../../assets/images/bg.png')}
              style={styles.container}
              resizeMode="cover"
            >
      <TopBar />
      
      {/* Main content */}
      <View style={styles.contentContainer}>
        <Text style={styles.gameDescription}>
          Palabras que todo Mexicano{'\n'}sabe de memoria
        </Text>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={styles.progressFill} />
          </View>
          <Text style={styles.progressText}>1/50</Text>
        </View>

        <TouchableOpacity style={styles.levelButton}>
          <Text style={styles.levelButtonText}>Nivel 2</Text>
        </TouchableOpacity>

        {/* Profile buttons */}
        <View style={styles.profileButtons}>
          <TouchableOpacity 
            style={styles.profileButton}
            onPress={() => setShowProfile(true)}
          >
            <Text style={styles.profileButtonText}>Perfil</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.profileButton}
            onPress={() => setShowAvatar(true)}
          >
            <Text style={styles.profileButtonText}>Avatar</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.profileButton}
            onPress={() => setShowCountry(true)}
          >
            <Text style={styles.profileButtonText}>País</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.profileButton}
            onPress={() => setShowInvite(true)}
          >
            <Text style={styles.profileButtonText}>Invitar</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Modals */}
      <ProfileModal visible={showProfile} onClose={() => setShowProfile(false)} />
      <AvatarModal visible={showAvatar} onClose={() => setShowAvatar(false)} />
      <CountryModal visible={showCountry} onClose={() => setShowCountry(false)} />
      <InviteModal visible={showInvite} onClose={() => setShowInvite(false)} />
          </ImageBackground>
      
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: width * 0.05,
    marginTop: height * 0.12,
  },
  gameDescription: {
    textAlign: 'center',
    fontFamily: FONTS.display,
    fontSize: width * 0.075,
    color: GOLD,
    textShadowColor: '#523600',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    marginBottom: height * 0.035,
  },
  progressContainer: {
    alignItems: 'center',
    marginBottom: height * 0.025,
    backgroundColor: WHEAT,
    borderRadius: width * 0.06,
    borderWidth: 2,
    borderColor: 'rgba(139,69,19,0.35)',
    paddingHorizontal: width * 0.06,
    paddingVertical: height * 0.018,
  },
  progressBar: {
    width: width * 0.53,
    height: height * 0.022,
    backgroundColor: 'rgba(139,69,19,0.2)',
    borderRadius: width * 0.05,
    overflow: 'hidden',
    marginBottom: height * 0.01,
    borderWidth: 1.5,
    borderColor: 'rgba(139,69,19,0.4)',
  },
  progressFill: {
    width: '50%',
    height: '100%',
    backgroundColor: AMBER,
    borderRadius: width * 0.05,
  },
  progressText: {
    textAlign: 'center',
    fontFamily: FONTS.bodyBold,
    color: BROWN,
    fontSize: width * 0.045,
  },
  levelButton: {
    backgroundColor: GOLD,
    borderColor: '#C8950A',
    paddingHorizontal: width * 0.17,
    paddingVertical: height * 0.018,
    borderRadius: width * 0.1,
    borderWidth: 2,
    marginBottom: height * 0.035,
  },
  levelButtonText: {
    fontFamily: FONTS.bodyBold,
    color: '#523600',
    fontSize: width * 0.065,
  },
  profileButtons: {
    gap: height * 0.018,
    alignItems: 'center',
  },
  profileButton: {
    backgroundColor: AMBER,
    paddingHorizontal: width * 0.17,
    paddingVertical: height * 0.018,
    borderRadius: width * 0.1,
    borderWidth: 2,
    borderColor: BROWN,
  },
  profileButtonText: {
    fontFamily: FONTS.bodyBold,
    color: WHEAT,
    fontSize: width * 0.065,
  },
});
