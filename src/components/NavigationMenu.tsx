import React, { useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Animated } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Tooltip } from './Tooltip';

interface NavigationMenuProps {
  theme: 'blue' | 'red';
  activeTab: 'Dashboard' | 'Arena' | 'Clan';
  onTabChange: (tab: 'Dashboard' | 'Arena' | 'Clan') => void;
}

const DashboardIcon = ({ color }: { color: string }) => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 13H11V3H3V13ZM3 21H11V15H3V21ZM13 21H21V11H13V21ZM13 3V9H21V3H13Z"
      fill={color}
    />
  </Svg>
);

const ArenaIcon = ({ color }: { color: string }) => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2ZM12 6.5L11.5 8.5L9.5 8.75L11 10L10.5 12L12 11L13.5 12L13 10L14.5 8.75L12.5 8.5L12 6.5Z"
      fill={color}
    />
    <Path
      d="M12 18L13.09 20.26L18 21L13.09 21.74L12 24L10.91 21.74L6 21L10.91 20.26L12 18Z"
      fill={color}
    />
  </Svg>
);

const ClanIcon = ({ color }: { color: string }) => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <Path
      d="M16 4C18.2 4 20 5.8 20 8C20 10.2 18.2 12 16 12C13.8 12 12 10.2 12 8C12 5.8 13.8 4 16 4ZM16 6C14.9 6 14 6.9 14 8C14 9.1 14.9 10 16 10C17.1 10 18 9.1 18 8C18 6.9 17.1 6 16 6ZM8 4C10.2 4 12 5.8 12 8C12 10.2 10.2 12 8 12C5.8 12 4 10.2 4 8C4 5.8 5.8 4 8 4ZM8 6C6.9 6 6 6.9 6 8C6 9.1 6.9 10 8 10C9.1 10 10 9.1 10 8C10 6.9 9.1 6 8 6ZM16 14C18.7 14 21 16.3 21 19V21H11V19C11 16.3 13.3 14 16 14ZM8 14C10.7 14 13 16.3 13 19V21H3V19C3 16.3 5.3 14 8 14ZM16 16C14.6 16 13.5 17.1 13.5 18.5V19H18.5V18.5C18.5 17.1 17.4 16 16 16ZM8 16C6.6 16 5.5 17.1 5.5 18.5V19H10.5V18.5C10.5 17.1 9.4 16 8 16Z"
      fill={color}
    />
  </Svg>
);

const AnimatedNavButton: React.FC<{
  children: React.ReactNode;
  onPress: () => void;
  isActive: boolean;
  backgroundColor: string;
  borderColor: string;
  activeBackgroundColor: string;
  activeBorderColor: string;
  iconColor: string;
  activeIconColor: string;
  activeGlow: string;
}> = ({ 
  children, 
  onPress, 
  isActive, 
  backgroundColor, 
  borderColor, 
  activeBackgroundColor, 
  activeBorderColor, 
  iconColor, 
  activeIconColor,
  activeGlow
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.95,
        useNativeDriver: true,
        tension: 300,
        friction: 10,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 300,
        friction: 10,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={0.8}
    >
      <Animated.View
        style={[
          styles.navButton,
          {
            backgroundColor: isActive ? activeBackgroundColor : backgroundColor,
            borderColor: isActive ? activeBorderColor : borderColor,
            borderWidth: isActive ? 2 : 0.5,
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
            shadowColor: isActive ? activeGlow : 'transparent',
            shadowOffset: {
              width: 0,
              height: 0,
            },
            shadowOpacity: isActive ? 1 : 0,
            shadowRadius: isActive ? 8 : 0,
            elevation: isActive ? 8 : 2,
          },
        ]}
      >
        <View style={{ opacity: isActive ? 1 : 0.6 }}>
          {React.cloneElement(children as React.ReactElement, {
            color: isActive ? activeIconColor : iconColor,
          })}
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};

export const NavigationMenu: React.FC<NavigationMenuProps> = ({ 
  theme, 
  activeTab, 
  onTabChange 
}) => {
  const themeColors = theme === 'blue' 
    ? {
        primary: '#4F46E5',
        accent: '#818CF8',
        surface: 'rgba(79, 70, 229, 0.15)',
        border: 'rgba(129, 140, 248, 0.3)',
        activeSurface: 'rgba(79, 70, 229, 0.4)',
        activeBorder: '#818CF8',
        iconColor: '#818CF8',
        activeIconColor: '#FFFFFF',
        activeGlow: 'rgba(129, 140, 248, 0.6)',
      }
    : {
        primary: '#DC2626',
        accent: '#F87171',
        surface: 'rgba(220, 38, 38, 0.15)',
        border: 'rgba(248, 113, 113, 0.3)',
        activeSurface: 'rgba(220, 38, 38, 0.4)',
        activeBorder: '#F87171',
        iconColor: '#F87171',
        activeIconColor: '#FFFFFF',
        activeGlow: 'rgba(248, 113, 113, 0.6)',
      };

  const handleDashboardPress = () => {
    onTabChange('Dashboard');
  };

  const handleArenaPress = () => {
    onTabChange('Arena');
  };

  const handleClanPress = () => {
    onTabChange('Clan');
  };

  return (
    <View style={[styles.container, { borderColor: themeColors.border, backgroundColor: themeColors.surface }]}>
      <Tooltip text="Dashboard" theme={theme}>
        <AnimatedNavButton
          onPress={handleDashboardPress}
          isActive={activeTab === 'Dashboard'}
          backgroundColor={themeColors.surface}
          borderColor={themeColors.border}
          activeBackgroundColor={themeColors.activeSurface}
          activeBorderColor={themeColors.activeBorder}
          iconColor={themeColors.iconColor}
          activeIconColor={themeColors.activeIconColor}
          activeGlow={themeColors.activeGlow}
        >
          <DashboardIcon color={themeColors.iconColor} />
        </AnimatedNavButton>
      </Tooltip>

      <Tooltip text="Arena" theme={theme}>
        <AnimatedNavButton
          onPress={handleArenaPress}
          isActive={activeTab === 'Arena'}
          backgroundColor={themeColors.surface}
          borderColor={themeColors.border}
          activeBackgroundColor={themeColors.activeSurface}
          activeBorderColor={themeColors.activeBorder}
          iconColor={themeColors.iconColor}
          activeIconColor={themeColors.activeIconColor}
          activeGlow={themeColors.activeGlow}
        >
          <ArenaIcon color={themeColors.iconColor} />
        </AnimatedNavButton>
      </Tooltip>

      <Tooltip text="Clan" theme={theme}>
        <AnimatedNavButton
          onPress={handleClanPress}
          isActive={activeTab === 'Clan'}
          backgroundColor={themeColors.surface}
          borderColor={themeColors.border}
          activeBackgroundColor={themeColors.activeSurface}
          activeBorderColor={themeColors.activeBorder}
          iconColor={themeColors.iconColor}
          activeIconColor={themeColors.activeIconColor}
          activeGlow={themeColors.activeGlow}
        >
          <ClanIcon color={themeColors.iconColor} />
        </AnimatedNavButton>
      </Tooltip>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    marginHorizontal: 120,
    marginTop: 3,
    marginBottom: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  navButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0.5,
  },
});
