import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SocialsSidebar } from './SocialsSidebar';

interface DashboardLayoutProps {
  children: React.ReactNode;
  theme: 'blue' | 'red';
  friends?: any[];
  groups?: any[];
  onFriendPress?: (friend: any) => void;
  onGroupPress?: (group: any) => void;
  onAddFriend?: () => void;
  onCreateGroup?: () => void;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  theme,
  friends,
  groups,
  onFriendPress,
  onGroupPress,
  onAddFriend,
  onCreateGroup,
}) => {
  const themeColors = {
    blue: {
      background: '#0F0F23',
      gradient: ['#0F0F23', '#1A1A3A', '#2A2A4A'],
    },
    red: {
      background: '#1A0F0F',
      gradient: ['#1A0F0F', '#2A1A1A', '#3A2A2A'],
    },
  };

  const currentTheme = themeColors[theme];

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      {/* Socials Sidebar */}
      <SocialsSidebar
        theme={theme}
        friends={friends}
        groups={groups}
        onFriendPress={onFriendPress}
        onGroupPress={onGroupPress}
        onAddFriend={onAddFriend}
        onCreateGroup={onCreateGroup}
      />

      {/* Main Dashboard Content */}
      <View style={styles.mainContent}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  mainContent: {
    flex: 1,
    marginLeft: 8, // 8px padding between sidebar and main content
  },
});
