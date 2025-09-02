import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CustomScrollbar } from './CustomScrollbar';

interface Friend {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'away';
  avatar?: string;
  level?: number;
}

interface Group {
  id: string;
  name: string;
  memberCount: number;
  avatar?: string;
}

interface SocialsSidebarProps {
  theme: 'blue' | 'red';
  friends?: Friend[];
  groups?: Group[];
  onFriendPress?: (friend: Friend) => void;
  onGroupPress?: (group: Group) => void;
  onAddFriend?: () => void;
  onCreateGroup?: () => void;
}

export const SocialsSidebar: React.FC<SocialsSidebarProps> = ({
  theme,
  friends = [],
  groups = [],
  onFriendPress,
  onGroupPress,
  onAddFriend,
  onCreateGroup,
}) => {
  const [activeTab, setActiveTab] = useState<'friends' | 'groups'>('friends');
  const [contentHeight, setContentHeight] = useState(600);
  const containerHeight = 400;

  const themeColors = {
    blue: {
      primary: '#4F46E5',
      secondary: '#3730A3',
      accent: '#818CF8',
      background: 'rgba(79, 70, 229, 0.15)',
      backgroundSecondary: 'rgba(129, 140, 248, 0.1)',
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
      backgroundSecondary: 'rgba(248, 113, 113, 0.1)',
      border: 'rgba(248, 113, 113, 0.2)',
      text: '#F8FAFC',
      textSecondary: '#FECACA',
      gradient: ['rgba(220, 38, 38, 0.2)', 'rgba(153, 27, 27, 0.1)'],
    },
  };

  const currentTheme = themeColors[theme];

  const displayFriends = friends;
  const displayGroups = groups;

  const getStatusColor = (status: Friend['status']) => {
    switch (status) {
      case 'online': return '#10B981';
      case 'away': return '#F59E0B';
      case 'offline': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const renderFriendItem = (friend: Friend) => (
    <TouchableOpacity
      key={friend.id}
      style={[styles.listItem, { borderColor: currentTheme.border }]}
      onPress={() => onFriendPress?.(friend)}
      activeOpacity={0.7}
    >
      <View style={styles.avatarContainer}>
        <View style={[styles.avatar, { backgroundColor: currentTheme.primary }]}>
          <Text style={[styles.avatarText, { color: currentTheme.text }]}>
            {friend.name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={[styles.statusDot, { backgroundColor: getStatusColor(friend.status) }]} />
      </View>
      
      <View style={styles.itemContent}>
        <Text style={[styles.itemName, { color: currentTheme.text }]} numberOfLines={1}>
          {friend.name}
        </Text>
        <View style={styles.itemMeta}>
          <Text style={[styles.statusText, { color: currentTheme.textSecondary }]}>
            {friend.status}
          </Text>
          {friend.level && (
            <Text style={[styles.levelText, { color: currentTheme.accent }]}>
              Lv.{friend.level}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderGroupItem = (group: Group) => (
    <TouchableOpacity
      key={group.id}
      style={[styles.listItem, { borderColor: currentTheme.border }]}
      onPress={() => onGroupPress?.(group)}
      activeOpacity={0.7}
    >
      <View style={styles.avatarContainer}>
        <View style={[styles.avatar, { backgroundColor: currentTheme.secondary }]}>
          <Text style={[styles.avatarText, { color: currentTheme.text }]}>
            {group.name.charAt(0).toUpperCase()}
          </Text>
        </View>
      </View>
      
      <View style={styles.itemContent}>
        <Text style={[styles.itemName, { color: currentTheme.text }]} numberOfLines={1}>
          {group.name}
        </Text>
        <Text style={[styles.memberCount, { color: currentTheme.textSecondary }]}>
          {group.memberCount} members
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderContent = () => {
    if (activeTab === 'friends') {
      return displayFriends.map(renderFriendItem);
    } else {
      return displayGroups.map(renderGroupItem);
    }
  };

  return (
    <LinearGradient
      colors={currentTheme.gradient}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: currentTheme.border }]}>
        <Text style={[styles.title, { color: currentTheme.text }]}>Socials</Text>
        
        {/* Tab buttons */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'friends' && { backgroundColor: currentTheme.primary },
            ]}
            onPress={() => setActiveTab('friends')}
          >
            <Text
              style={[
                styles.tabText,
                { color: activeTab === 'friends' ? currentTheme.text : currentTheme.textSecondary },
              ]}
            >
              Friends
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'groups' && { backgroundColor: currentTheme.primary },
            ]}
            onPress={() => setActiveTab('groups')}
          >
            <Text
              style={[
                styles.tabText,
                { color: activeTab === 'groups' ? currentTheme.text : currentTheme.textSecondary },
              ]}
            >
              Groups
            </Text>
          </TouchableOpacity>
        </View>

        {/* Add Friend Button */}
        {activeTab === 'friends' && (
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: currentTheme.primary }]}
            onPress={onAddFriend}
            activeOpacity={0.8}
          >
            <Text style={[styles.addButtonText, { color: currentTheme.text }]}>
              + Add Friend
            </Text>
          </TouchableOpacity>
        )}

        {/* Create Group Button */}
        {activeTab === 'groups' && (
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: currentTheme.primary }]}
            onPress={onCreateGroup}
            activeOpacity={0.8}
          >
            <Text style={[styles.addButtonText, { color: currentTheme.text }]}>
              + Create Group
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Content with custom scrollbar */}
      <View style={styles.contentContainer}>
        <CustomScrollbar
          contentHeight={contentHeight}
          containerHeight={containerHeight}
          theme={theme}
        >
          <View style={styles.listContainer}>
            {renderContent()}
          </View>
        </CustomScrollbar>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '25%',
    height: '100%',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.1)',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  tabContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  addButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 4,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  contentContainer: {
    flex: 1,
    padding: 8,
  },
  listContainer: {
    paddingBottom: 16,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '600',
  },
  statusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#1F2937',
  },
  itemContent: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  itemMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    textTransform: 'capitalize',
  },
  levelText: {
    fontSize: 12,
    fontWeight: '600',
  },
  memberCount: {
    fontSize: 12,
  },
});
