import React, { useRef } from 'react';
import { TouchableOpacity, Animated, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Tooltip } from './Tooltip';

interface MainButtonsGridProps {
  theme: 'blue' | 'red';
}

const InventoryIcon: React.FC<{ color: string }> = ({ color }) => (
  <Svg width="28" height="28" viewBox="0 0 24 24" fill="none">
    <Path
      d="M20 6H16V4C16 2.9 15.1 2 14 2H10C8.9 2 8 2.9 8 4V6H4C2.9 6 2 6.9 2 8V19C2 20.1 2.9 21 4 21H20C21.1 21 22 20.1 22 19V8C22 6.9 21.1 6 20 6ZM10 4H14V6H10V4ZM20 19H4V8H6V10C6 10.6 6.4 11 7 11C7.6 11 8 10.6 8 10V8H16V10C16 10.6 16.4 11 17 11C17.6 11 18 10.6 18 10V8H20V19Z"
      fill={color}
    />
  </Svg>
);

const EvolutionIcon: React.FC<{ color: string }> = ({ color }) => (
  <Svg width="28" height="28" viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 2L15.09 8.26L22 9L17 14L18.18 21L12 17.77L5.82 21L7 14L2 9L8.91 8.26L12 2ZM12 4.5L10.5 8.5L6.5 8.75L9 11L8.5 15L12 13L15.5 15L15 11L17.5 8.75L13.5 8.5L12 4.5Z"
      fill={color}
    />
  </Svg>
);

const RecordsIcon: React.FC<{ color: string }> = ({ color }) => (
  <Svg width="28" height="28" viewBox="0 0 24 24" fill="none">
    <Path
      d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2ZM18 20H6V4H13V9H18V20ZM16 11H8V13H16V11ZM8 15H16V17H8V15Z"
      fill={color}
    />
  </Svg>
);

const PlaceholderIcon: React.FC<{ color: string }> = ({ color }) => (
  <Svg width="28" height="28" viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z"
      fill={color}
    />
  </Svg>
);

const AnimatedMainButton: React.FC<{
  children: React.ReactNode;
  onPress: () => void;
  iconColor: string;
  backgroundColor: string;
  borderColor: string;
}> = ({ children, onPress, iconColor, backgroundColor, borderColor }) => {
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
          styles.mainButton,
          {
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
            backgroundColor,
            borderColor,
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

export const MainButtonsGrid: React.FC<MainButtonsGridProps> = ({ theme }) => {
  // Theme-based colors with translucent effects
  const iconColor = theme === 'blue' 
    ? '#FFFFFF' // White icons for better contrast
    : '#FFFFFF'; // White icons for better contrast

  const backgroundColor = theme === 'blue' 
    ? 'rgba(129, 140, 248, 0.15)' // Translucent blue
    : 'rgba(248, 113, 113, 0.15)'; // Translucent red

  const borderColor = theme === 'blue' 
    ? 'rgba(129, 140, 248, 0.4)' // Semi-transparent blue border
    : 'rgba(248, 113, 113, 0.4)'; // Semi-transparent red border

  const handleInventoryPress = () => {
    console.log('Inventory pressed');
    // Handle inventory logic
  };

  const handleEvolutionPress = () => {
    console.log('Evolution pressed');
    // Handle evolution logic
  };

  const handleRecordsPress = () => {
    console.log('Records pressed');
    // Handle records logic
  };

  const handlePlaceholderPress = () => {
    console.log('Placeholder pressed');
    // Handle placeholder logic
  };

  return (
    <View style={styles.container}>
      <View style={styles.gridRow}>
        <Tooltip text="Inventory" theme={theme}>
          <AnimatedMainButton
            onPress={handleInventoryPress}
            iconColor={iconColor}
            backgroundColor={backgroundColor}
            borderColor={borderColor}
          >
            <InventoryIcon color={iconColor} />
          </AnimatedMainButton>
        </Tooltip>

        <Tooltip text="Evolution" theme={theme}>
          <AnimatedMainButton
            onPress={handleEvolutionPress}
            iconColor={iconColor}
            backgroundColor={backgroundColor}
            borderColor={borderColor}
          >
            <EvolutionIcon color={iconColor} />
          </AnimatedMainButton>
        </Tooltip>
      </View>

      <View style={styles.gridRow}>
        <Tooltip text="Records" theme={theme}>
          <AnimatedMainButton
            onPress={handleRecordsPress}
            iconColor={iconColor}
            backgroundColor={backgroundColor}
            borderColor={borderColor}
          >
            <RecordsIcon color={iconColor} />
          </AnimatedMainButton>
        </Tooltip>

        <Tooltip text="[PLACEHOLDER]" theme={theme}>
          <AnimatedMainButton
            onPress={handlePlaceholderPress}
            iconColor={iconColor}
            backgroundColor={backgroundColor}
            borderColor={borderColor}
          >
            <PlaceholderIcon color={iconColor} />
          </AnimatedMainButton>
        </Tooltip>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 24,
    marginVertical: 16,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginBottom: 16,
  },
  mainButton: {
    width: 100, // Wider but not too wide
    height: 80,
    borderRadius: 16, // Slightly rounded corners
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2, // Thicker border for better visibility
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 8,
  },
});
