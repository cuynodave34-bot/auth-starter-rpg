import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { DashboardLayout } from '../components/DashboardLayout';
import { NotificationPopup } from '../components/NotificationPopup';
import { PlayerProfile } from '../components/PlayerProfile';
import { ActionButtons } from '../components/ActionButtons';
import { NavigationMenu } from '../components/NavigationMenu';
import { HeaderButtons } from '../components/HeaderButtons';
import { MainButtonsGrid } from '../components/MainButtonsGrid';

export const HumanDashboard: React.FC = () => {
  const [showNotification, setShowNotification] = useState(false);
  const [activeTab, setActiveTab] = useState<'Dashboard' | 'Arena' | 'Clan'>('Dashboard');

  const themeColors = {
    primary: '#4F46E5',
    secondary: '#3730A3',
    accent: '#818CF8',
    background: '#0F0F23',
    surface: 'rgba(79, 70, 229, 0.15)',
    surfaceSecondary: 'rgba(129, 140, 248, 0.1)',
    text: '#F8FAFC',
    textSecondary: '#CBD5E1',
    border: 'rgba(129, 140, 248, 0.2)',
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
      theme="blue"
      onFriendPress={handleFriendPress}
      onGroupPress={handleGroupPress}
      onAddFriend={handleAddFriend}
      onCreateGroup={handleCreateGroup}
    >
      <LinearGradient
        colors={['#0F0F23', '#1A1A3A', '#2A2A4A']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: themeColors.text }]}>
              Tensei Slime
            </Text>
            <HeaderButtons theme="blue" />
          </View>

          {/* Navigation Menu */}
          <NavigationMenu 
            theme="blue" 
            activeTab={activeTab} 
            onTabChange={handleTabChange} 
          />

          {/* Player Profile */}
          <PlayerProfile theme="blue" />

          {/* Action Buttons */}
          <ActionButtons theme="blue" />

          {/* Main Buttons Grid */}
          <MainButtonsGrid theme="blue" />


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
        theme="blue"
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 24,
    paddingTop: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 8,
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
