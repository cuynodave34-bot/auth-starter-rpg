import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { DashboardLayout } from '../components/DashboardLayout';
import { NotificationPopup } from '../components/NotificationPopup';
import { PlayerProfile } from '../components/PlayerProfile';
import { ActionButtons } from '../components/ActionButtons';
import { NavigationMenu } from '../components/NavigationMenu';
import { DashboardHeader } from '../components/DashboardHeader';
import { MainButtonsGrid } from '../components/MainButtonsGrid';

export const DemonDashboard: React.FC = () => {
  const [showNotification, setShowNotification] = useState(false);
  const [activeTab, setActiveTab] = useState<'Dashboard' | 'Arena' | 'Clan'>('Dashboard');

  const themeColors = {
    primary: '#DC2626',
    secondary: '#991B1B',
    accent: '#F87171',
    background: '#1A0F0F',
    surface: 'rgba(220, 38, 38, 0.15)',
    surfaceSecondary: 'rgba(248, 113, 113, 0.1)',
    text: '#F8FAFC',
    textSecondary: '#FECACA',
    border: 'rgba(248, 113, 113, 0.2)',
  };

  const handleFriendPress = (friend: any) => {
    // Handle friend interaction
  };

  const handleGroupPress = (group: any) => {
    // Handle group interaction
  };

  const handleAddFriend = () => {
    // Handle add friend logic
  };

  const handleCreateGroup = () => {
    // Handle create group logic
  };

  const handleAcceptPlayer = () => {
    setShowNotification(false);
    // Handle player acceptance logic
  };

  const handleDeclinePlayer = () => {
    setShowNotification(false);
    // Handle player decline logic
  };

  const handleTabChange = (tab: 'Dashboard' | 'Arena' | 'Clan') => {
    setActiveTab(tab);
    // Handle navigation logic here
  };

  return (
    <DashboardLayout
      theme="red"
      onFriendPress={handleFriendPress}
      onGroupPress={handleGroupPress}
      onAddFriend={handleAddFriend}
      onCreateGroup={handleCreateGroup}
    >
      <LinearGradient
        colors={['#1A0F0F', '#2A1A1A', '#3A2A2A']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <DashboardHeader 
            theme="red" 
            onSearch={(query) => {
              // TODO: Implement search functionality
              console.log('Search query:', query);
            }}
          />

          {/* Navigation Menu */}
          <NavigationMenu 
            theme="red" 
            activeTab={activeTab} 
            onTabChange={handleTabChange} 
          />

          {/* Player Profile */}
          <PlayerProfile theme="red" />

          {/* Action Buttons */}
          <ActionButtons theme="red" />

          {/* Main Buttons Grid */}
          <MainButtonsGrid theme="red" />


        </ScrollView>
      </LinearGradient>

      {/* Notification Popup */}
      <NotificationPopup
        visible={showNotification}
        title="NOTIFICATION"
        message="You have acquired the qualifications to be a Player. Will you accept?"
        onAccept={handleAcceptPlayer}
        onDecline={handleDeclinePlayer}
        acceptText="Accept"
        declineText="Decline"
        theme="red"
      />
    </DashboardLayout>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },

  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '500',
    textAlign: 'center',
    opacity: 0.7,
  },
});
