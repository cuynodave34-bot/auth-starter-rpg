import React, { useRef } from 'react';
import { TouchableOpacity, Animated, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Tooltip } from './Tooltip';

interface HeaderButtonsProps {
  theme: 'blue' | 'red';
}

const VipIcon: React.FC<{ color: string }> = ({ color }) => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 2L15.09 8.26L22 9L17 14L18.18 21L12 17.77L5.82 21L7 14L2 9L8.91 8.26L12 2Z"
      fill={color}
    />
  </Svg>
);

const NotificationIcon: React.FC<{ color: string }> = ({ color }) => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 22C13.1 22 14 21.1 14 20H10C10 21.1 10.9 22 12 22ZM18 16V11C18 7.93 16.36 5.36 13.5 4.68V4C13.5 3.17 12.83 2.5 12 2.5S10.5 3.17 10.5 4V4.68C7.63 5.36 6 7.92 6 11V16L4 18V19H20V18L18 16Z"
      fill={color}
    />
  </Svg>
);

const SettingsIcon: React.FC<{ color: string }> = ({ color }) => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <Path
      d="M19.14 12.94C19.18 12.64 19.2 12.33 19.2 12C19.2 11.67 19.18 11.36 19.14 11.06L21.16 9.48C21.34 9.34 21.39 9.07 21.28 8.87L19.36 5.44C19.24 5.24 18.99 5.17 18.77 5.25L16.38 6.05C16.04 5.66 15.66 5.28 15.27 4.94L15.07 2.5C15.05 2.26 14.85 2.08 14.61 2.08H9.39C9.15 2.08 8.95 2.26 8.93 2.5L8.73 4.94C8.34 5.28 7.96 5.66 7.62 6.05L5.23 5.25C5.01 5.17 4.76 5.24 4.64 5.44L2.72 8.87C2.61 9.07 2.66 9.34 2.84 9.48L4.86 11.06C4.82 11.36 4.8 11.67 4.8 12C4.8 12.33 4.82 12.64 4.86 12.94L2.84 14.52C2.66 14.66 2.61 14.93 2.72 15.13L4.64 18.56C4.76 18.76 5.01 18.83 5.23 18.75L7.62 17.95C7.96 18.34 8.34 18.72 8.73 19.06L8.93 21.5C8.95 21.74 9.15 21.92 9.39 21.92H14.61C14.85 21.92 15.05 21.74 15.07 21.5L15.27 19.06C15.66 18.72 16.04 18.34 16.38 17.95L18.77 18.75C18.99 18.83 19.24 18.76 19.36 18.56L21.28 15.13C21.39 14.93 21.34 14.66 21.16 14.52L19.14 12.94ZM12 15.6C10.02 15.6 8.4 13.98 8.4 12C8.4 10.02 10.02 8.4 12 8.4C13.98 8.4 15.6 10.02 15.6 12C15.6 13.98 13.98 15.6 12 15.6Z"
      fill={color}
    />
  </Svg>
);

const AnimatedHeaderButton: React.FC<{
  children: React.ReactNode;
  onPress: () => void;
  iconColor: string;
}> = ({ children, onPress, iconColor }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.9,
        useNativeDriver: true,
        tension: 300,
        friction: 10,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0.7,
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
          styles.headerButton,
          {
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
          },
        ]}
      >
        {React.cloneElement(children as React.ReactElement<any>, {
          color: iconColor,
        })}
      </Animated.View>
    </TouchableOpacity>
  );
};

export const HeaderButtons: React.FC<HeaderButtonsProps> = ({ theme }) => {
  const iconColor = theme === 'blue' 
    ? '#A5B4FC' // Lighter blue
    : '#FCA5A5'; // Lighter red

  const handleVipPress = () => {
    console.log('VIP pressed');
    // Handle VIP logic
  };

  const handleNotificationPress = () => {
    console.log('Notification pressed');
    // Handle notification logic
  };

  const handleSettingsPress = () => {
    console.log('Settings pressed');
    // Handle settings logic
  };

  return (
    <View style={styles.container}>
      <Tooltip text="VIP" theme={theme}>
        <AnimatedHeaderButton
          onPress={handleVipPress}
          iconColor={iconColor}
        >
          <VipIcon color={iconColor} />
        </AnimatedHeaderButton>
      </Tooltip>

      <Tooltip text="Notification" theme={theme}>
        <AnimatedHeaderButton
          onPress={handleNotificationPress}
          iconColor={iconColor}
        >
          <NotificationIcon color={iconColor} />
        </AnimatedHeaderButton>
      </Tooltip>

      <Tooltip text="Settings" theme={theme}>
        <AnimatedHeaderButton
          onPress={handleSettingsPress}
          iconColor={iconColor}
        >
          <SettingsIcon color={iconColor} />
        </AnimatedHeaderButton>
      </Tooltip>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24, // Better spacing between buttons
  },
  headerButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
