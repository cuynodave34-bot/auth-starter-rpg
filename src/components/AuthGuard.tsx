import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuth } from '../providers/AuthProvider';
import { usePlayer } from '../providers/PlayerProvider';
import { useNavigation } from '@react-navigation/native';

interface AuthGuardProps {
  children: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const { player, loading: playerLoading, isActive, evolutionPath } = usePlayer();
  const navigation = useNavigation<any>();

  useEffect(() => {
    if (!authLoading && !playerLoading) {
      if (!user) {
        // User not authenticated, redirect to login
        navigation.navigate('Login');
        return;
      }

      if (!player) {
        // Player data not found, redirect to login
        navigation.navigate('Login');
        return;
      }

      if (!isActive) {
        // Player status is not Active (banned, deleted, etc.)
        navigation.navigate('Login');
        return;
      }

      // User is authenticated and active, redirect to appropriate dashboard
      if (evolutionPath === 'Human') {
        navigation.navigate('HumanDashboard');
      } else if (evolutionPath === 'Demon') {
        navigation.navigate('DemonDashboard');
      } else {
        // Evolution path not set, redirect to login
        navigation.navigate('Login');
      }
    }
  }, [user, player, authLoading, playerLoading, isActive, evolutionPath, navigation]);

  // Show loading screen while checking authentication
  if (authLoading || playerLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E6F14A" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // Show loading screen while redirecting
  if (!user || !player || !isActive) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E6F14A" />
        <Text style={styles.loadingText}>Redirecting...</Text>
      </View>
    );
  }

  return <>{children}</>;
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0B0B0C',
  },
  loadingText: {
    color: '#E6E8EB',
    fontSize: 16,
    marginTop: 16,
  },
});
