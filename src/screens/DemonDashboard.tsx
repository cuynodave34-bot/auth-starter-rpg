import React, { useState, useCallback, useRef } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { DashboardLayout } from '../components/DashboardLayout';
import { NotificationPopup } from '../components/NotificationPopup';
import { PlayerProfile } from '../components/PlayerProfile';
import { ActionButtons } from '../components/ActionButtons';
import { NavigationMenu } from '../components/NavigationMenu';
import { DashboardHeader } from '../components/DashboardHeader';
import { MainButtonsGrid } from '../components/MainButtonsGrid';
import { ArenaLobby } from '../components/ArenaLobby';
import { TransitionWrapper } from '../components/TransitionWrapper';

export const DemonDashboard: React.FC = () => {
  const [showNotification, setShowNotification] = useState(false);
  const [activeTab, setActiveTab] = useState<'Dashboard' | 'Arena' | 'Clan'>('Dashboard');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionDirection, setTransitionDirection] = useState<'left' | 'right'>('left');
  
  // Prevent multiple rapid tab changes
  const isChangingTab = useRef(false);

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

  const handleTabChange = useCallback((tab: 'Dashboard' | 'Arena' | 'Clan') => {
    // Prevent multiple rapid tab changes
    if (isChangingTab.current || tab === activeTab) {
      return;
    }

    isChangingTab.current = true;
    
    // Determine transition direction based on tab order
    const tabOrder = ['Dashboard', 'Arena', 'Clan'];
    const currentIndex = tabOrder.indexOf(activeTab);
    const newIndex = tabOrder.indexOf(tab);
    const direction = newIndex > currentIndex ? 'left' : 'right';
    
    setTransitionDirection(direction);
    setIsTransitioning(true);
    
    // Update active tab after transition starts
    setTimeout(() => {
      setActiveTab(tab);
    }, 150);
  }, [activeTab]);

  const handleTransitionComplete = useCallback(() => {
    setIsTransitioning(false);
    // Allow new tab changes after animation completes
    setTimeout(() => {
      isChangingTab.current = false;
    }, 100);
  }, []);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Dashboard':
        return (
          <>
            <PlayerProfile theme="red" />
            <ActionButtons theme="red" />
            <MainButtonsGrid theme="red" />
          </>
        );
      case 'Arena':
        return (
          <ArenaLobby theme="red" />
        );
      case 'Clan':
        return (
          <View style={styles.clanContent}>
            <Text style={styles.clanTitle}>Clan</Text>
            <Text style={styles.clanSubtitle}>Join or create a clan</Text>
            {/* Add Clan-specific content here */}
          </View>
        );
      default:
        return null;
    }
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

          {/* Tab Content with Transition Wrapper */}
          <TransitionWrapper
            isTransitioning={isTransitioning}
            direction={transitionDirection}
            onTransitionComplete={handleTransitionComplete}
          >
            {renderTabContent()}
          </TransitionWrapper>
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
  clanContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  clanTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F8FAFC',
    marginBottom: 8,
  },
  clanSubtitle: {
    fontSize: 16,
    color: '#FECACA',
    marginBottom: 24,
  },
});
