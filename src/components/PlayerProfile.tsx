import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { usePlayer } from '../providers/PlayerProvider';
import { supabase } from '../lib/supabase';
import * as ImagePicker from 'expo-image-picker';

interface PlayerProfileProps {
  theme: 'blue' | 'red';
}

export const PlayerProfile: React.FC<PlayerProfileProps> = ({ theme }) => {
  const { player, refreshPlayer } = usePlayer();
  const [uploading, setUploading] = useState(false);

  const themeColors = {
    blue: {
      primary: '#4F46E5',
      secondary: '#3730A3',
      accent: '#818CF8',
      background: 'rgba(79, 70, 229, 0.15)',
      border: 'rgba(129, 140, 248, 0.2)',
      text: '#F8FAFC',
      textSecondary: '#CBD5E1',
      gradient: ['rgba(79, 70, 229, 0.2)', 'rgba(55, 48, 163, 0.1)'],
    },
    red: {
      primary: '#DC2626',
      secondary: '#991B1B',
      accent: '#F87171',
      background: 'rgba(220, 38, 38, 0.15)',
      border: 'rgba(248, 113, 113, 0.2)',
      text: '#F8FAFC',
      textSecondary: '#FECACA',
      gradient: ['rgba(220, 38, 38, 0.2)', 'rgba(153, 27, 27, 0.1)'],
    },
  };

  const currentTheme = themeColors[theme];

  const handleProfilePicturePress = async () => {
    try {
      // Request permission to access media library
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant permission to access your photo library.');
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadProfilePicture(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const uploadProfilePicture = async (imageUri: string) => {
    if (!player?.playerDB?.uuid) {
      Alert.alert('Error', 'Player data not found.');
      return;
    }

    try {
      setUploading(true);

      // Create a unique filename
      const fileExt = imageUri.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${player.playerDB.uuid}.${fileExt}`;
      const filePath = `profile-pictures/${fileName}`;

      // Convert image to blob
      const response = await fetch(imageUri);
      const blob = await response.blob();

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(filePath, blob, {
          cacheControl: '3600',
          upsert: true, // This will overwrite existing files
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(filePath);

      // Update PlayerDB with new profile picture URL
      const { error: updateError } = await supabase
        .from('PlayerDB')
        .update({ profile_picture_url: publicUrl })
        .eq('uuid', player.playerDB.uuid);

      if (updateError) {
        throw updateError;
      }

      // Refresh player data
      await refreshPlayer();
      
      Alert.alert('Success', 'Profile picture updated successfully!');
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      Alert.alert('Error', 'Failed to upload profile picture. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  if (!player?.playerDB) {
    return null;
  }

  const playerData = player.playerDB;

  return (
    <View style={styles.container}>
      {/* Main card with sophisticated design */}
      <View style={[styles.cardContainer, { borderColor: currentTheme.border }]}>
        {/* Glow effect background */}
        <LinearGradient
          colors={currentTheme.gradient as [string, string, ...string[]]}
          style={styles.glowBackground}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        
        {/* Decorative corner brackets */}
        <View style={[styles.cornerBracket, styles.topLeftBracket, { borderColor: currentTheme.border }]} />
        <View style={[styles.cornerBracket, styles.bottomRightBracket, { borderColor: currentTheme.border }]} />
        
        {/* Decorative overlays */}
        <View style={[styles.decorativeOverlay, styles.overlay1, { backgroundColor: 'rgba(255, 255, 255, 0.08)' }]} />
        <View style={[styles.decorativeOverlay, styles.overlay2, { backgroundColor: 'rgba(255, 255, 255, 0.06)' }]} />
        <View style={[styles.decorativeOverlay, styles.overlay3, { backgroundColor: 'rgba(255, 255, 255, 0.05)' }]} />
        <View style={[styles.decorativeOverlay, styles.overlay4, { backgroundColor: 'rgba(255, 255, 255, 0.04)' }]} />
        <View style={[styles.decorativeOverlay, styles.overlay5, { backgroundColor: 'rgba(255, 255, 255, 0.03)' }]} />
        
        {/* Main content */}
        <View style={styles.cardContent}>
          {/* Profile Picture Section */}
          <View style={styles.profileSection}>
            <TouchableOpacity
              style={[styles.profilePictureContainer, { borderColor: currentTheme.primary }]}
              onPress={handleProfilePicturePress}
              disabled={uploading}
            >
              {playerData.profile_picture_url ? (
                <Image
                  source={{ uri: playerData.profile_picture_url }}
                  style={styles.profilePicture}
                />
              ) : (
                <View style={[styles.profilePicturePlaceholder, { backgroundColor: currentTheme.primary }]}>
                  <Text style={[styles.profilePictureText, { color: currentTheme.text }]}>
                    {playerData.username.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              {uploading && (
                <View style={styles.uploadingOverlay}>
                  <Text style={[styles.uploadingText, { color: currentTheme.text }]}>
                    Uploading...
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Player Information - New Format */}
          <View style={styles.infoSection}>
            {/* Top Row - Username */}
            <View style={styles.topRow}>
              <View style={styles.usernameContainer}>
                <Text style={[styles.usernameLabel, { color: currentTheme.textSecondary }]}>USERNAME</Text>
                <Text style={[styles.usernameValue, { color: currentTheme.text }]}>{playerData.username}</Text>
                <View style={[styles.uuidContainer, { borderColor: '#60A5FA', backgroundColor: '#1E3A8A' }]}>
                  <Text style={[styles.uuidValue, { color: '#FFFFFF' }]}>
                    {playerData.uuid}
                  </Text>
                </View>
              </View>
            </View>
            
            {/* Evolution Path Row */}
            <View style={styles.evolutionRow}>
              <Text style={[styles.evolutionLabel, { color: currentTheme.textSecondary }]}>EVOLUTION PATH</Text>
              <Text style={[styles.evolutionValue, { color: currentTheme.accent }]}>{playerData["Evolution Path"]}</Text>
            </View>
            
            {/* Stats Row - Three columns */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={[styles.statLabel, { color: currentTheme.textSecondary }]}>WILL POINTS</Text>
                <Text style={[styles.statValue, { color: currentTheme.text }]}>{playerData.willpoints.toLocaleString()}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statLabel, { color: currentTheme.textSecondary }]}>EVO FRAGMENTS</Text>
                <Text style={[styles.statValue, { color: currentTheme.text }]}>{playerData.evofragments.toLocaleString()}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statLabel, { color: currentTheme.textSecondary }]}>CURRENCY</Text>
                <Text style={[styles.statValue, { color: currentTheme.text }]}>{playerData.currency.toLocaleString()}</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 24,
    marginBottom: 24,
  },
  cardContainer: {
    position: 'relative',
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  glowBackground: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 18,
    opacity: 0.3,
  },
  cornerBracket: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#fff',
  },
  topLeftBracket: {
    top: 8,
    left: 8,
    width: 20,
    height: 20,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 4,
  },
  bottomRightBracket: {
    bottom: 8,
    right: 8,
    width: 20,
    height: 20,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 4,
  },
  decorativeOverlay: {
    position: 'absolute',
    borderRadius: 2,
  },
  overlay1: {
    width: 6,
    height: 20,
    top: 16,
    right: 16,
  },
  overlay2: {
    width: 6,
    height: 28,
    bottom: 16,
    right: 16,
  },
  overlay3: {
    width: 12,
    height: 6,
    bottom: 16,
    left: 16,
  },
  overlay4: {
    width: 4,
    height: 16,
    top: 24,
    right: 24,
  },
  overlay5: {
    width: 8,
    height: 4,
    bottom: 24,
    left: 24,
  },
  cardContent: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    padding: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
    minHeight: 180,
  },
  profileSection: {
    marginRight: 24,
    alignItems: 'center',
  },
  profilePictureContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  profilePicture: {
    width: 66,
    height: 66,
    borderRadius: 33,
  },
  profilePicturePlaceholder: {
    width: 66,
    height: 66,
    borderRadius: 33,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profilePictureText: {
    fontSize: 20,
    fontWeight: '700',
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 33,
  },
  uploadingText: {
    fontSize: 10,
    fontWeight: '600',
  },
  infoSection: {
    flex: 1,
    justifyContent: 'space-between',
    height: 140,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  usernameContainer: {
    flex: 1,
  },
  usernameLabel: {
    fontSize: 8,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 2,
    opacity: 0.7,
  },
  usernameValue: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  uuidContainer: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 8,
    alignSelf: 'flex-start',
    maxWidth: '100%',
  },
  uuidValue: {
    fontSize: 10,
    fontWeight: '600',
    fontFamily: 'monospace',
    letterSpacing: 0.3,
    lineHeight: 12,
  },
  evolutionRow: {
    marginBottom: 12,
  },
  evolutionLabel: {
    fontSize: 8,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 2,
    opacity: 0.7,
  },
  evolutionValue: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 2,
  },
  statLabel: {
    fontSize: 7,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 2,
    opacity: 0.7,
    textAlign: 'center',
  },
  statValue: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
});
