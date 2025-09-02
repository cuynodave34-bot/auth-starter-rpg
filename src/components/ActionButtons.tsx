import React, { useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Animated } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Tooltip } from './Tooltip';

interface ActionButtonsProps {
  theme: 'blue' | 'red';
}

const MarketplaceIcon = ({ color }: { color: string }) => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 7V5C3 4.448 3.448 4 4 4H20C20.552 4 21 4.448 21 5V7C21 7.552 20.552 8 20 8H18V17C18 18.103 17.103 19 16 19H8C6.897 19 6 18.103 6 17V8H4C3.448 8 3 7.552 3 7ZM8 8V17H16V8H8ZM5 6V7H19V6H5Z"
      fill={color}
    />
    <Path
      d="M10 10H14V12H10V10ZM10 13H14V15H10V13Z"
      fill={color}
    />
  </Svg>
);

const EventsIcon = ({ color }: { color: string }) => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <Path
      d="M19 3H18V2C18 1.448 17.552 1 17 1C16.448 1 16 1.448 16 2V3H8V2C8 1.448 7.552 1 7 1C6.448 1 6 1.448 6 2V3H5C3.897 3 3 3.897 3 5V19C3 20.103 3.897 21 5 21H19C20.103 21 21 20.103 21 19V5C21 3.897 20.103 3 19 3ZM19 19H5V8H19V19ZM19 6H5V5H6V6C6 6.552 6.448 7 7 7C7.552 7 8 6.552 8 6V5H16V6C16 6.552 16.448 7 17 7C17.552 7 18 6.552 18 6V5H19V6Z"
      fill={color}
    />
    <Path
      d="M7 10H9V12H7V10ZM11 10H13V12H11V10ZM15 10H17V12H15V10ZM7 14H9V16H7V14ZM11 14H13V16H11V14ZM15 14H17V16H15V14Z"
      fill={color}
    />
  </Svg>
);

const TradeIcon = ({ color }: { color: string }) => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <Path
      d="M18 17L22 12L18 7V10H14V14H18V17Z"
      fill={color}
    />
    <Path
      d="M6 7L2 12L6 17V14H10V10H6V7Z"
      fill={color}
    />
  </Svg>
);

const AnimatedButton: React.FC<{
  children: React.ReactNode;
  onPress: () => void;
  backgroundColor: string;
  borderColor: string;
}> = ({ children, onPress, backgroundColor, borderColor }) => {
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
          styles.actionButton,
          {
            backgroundColor,
            borderColor,
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
          },
        ]}
      >
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
};

export const ActionButtons: React.FC<ActionButtonsProps> = ({ theme }) => {
  const themeColors = theme === 'blue' 
    ? {
        primary: '#4F46E5',
        accent: '#818CF8',
        surface: 'rgba(79, 70, 229, 0.15)',
        border: 'rgba(129, 140, 248, 0.3)',
        iconColor: '#818CF8',
      }
    : {
        primary: '#DC2626',
        accent: '#F87171',
        surface: 'rgba(220, 38, 38, 0.15)',
        border: 'rgba(248, 113, 113, 0.3)',
        iconColor: '#F87171',
      };

  const handleMarketplacePress = () => {
    console.log('Marketplace pressed');
    // Navigate to marketplace
  };

  const handleEventsPress = () => {
    console.log('Events pressed');
    // Navigate to events
  };

  const handleTradePress = () => {
    console.log('Trade pressed');
    // Navigate to trade
  };

  return (
    <View style={[styles.container, { borderColor: themeColors.border, backgroundColor: themeColors.surface }]}>
      <Tooltip text="Marketplace" theme={theme}>
        <AnimatedButton
          onPress={handleMarketplacePress}
          backgroundColor={themeColors.surface}
          borderColor={themeColors.border}
        >
          <MarketplaceIcon color={themeColors.iconColor} />
        </AnimatedButton>
      </Tooltip>

      <Tooltip text="Events" theme={theme}>
        <AnimatedButton
          onPress={handleEventsPress}
          backgroundColor={themeColors.surface}
          borderColor={themeColors.border}
        >
          <EventsIcon color={themeColors.iconColor} />
        </AnimatedButton>
      </Tooltip>

      <Tooltip text="Trade" theme={theme}>
        <AnimatedButton
          onPress={handleTradePress}
          backgroundColor={themeColors.surface}
          borderColor={themeColors.border}
        >
          <TradeIcon color={themeColors.iconColor} />
        </AnimatedButton>
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
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0.5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
});
