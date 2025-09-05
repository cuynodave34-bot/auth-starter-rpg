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

const PetitionIcon: React.FC<{ color: string }> = ({ color }) => (
  <Svg width="28" height="28" viewBox="0 0 24 24" fill="none">
    <Path
      d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2ZM18 20H6V4H13V9H18V20ZM16 11H8V13H16V11ZM8 15H16V17H8V15ZM12 6H8V8H12V6ZM12 10H8V12H12V10Z"
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
  const rotationAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.95,
        useNativeDriver: true,
        tension: 400,
        friction: 8,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0.8,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(rotationAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(glowAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 400,
        friction: 8,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(rotationAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(glowAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleHoverIn = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1.05,
        useNativeDriver: true,
        tension: 300,
        friction: 8,
      }),
      Animated.timing(glowAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleHoverOut = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 300,
        friction: 8,
      }),
      Animated.timing(glowAnim, {
        toValue: 0,
        duration: 200,
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
             transform: [
               { scale: scaleAnim },
               { rotate: rotationAnim.interpolate({
                 inputRange: [0, 1],
                 outputRange: ['0deg', '2deg']
               })}
             ],
             opacity: opacityAnim,
             backgroundColor,
             borderColor,
             shadowOpacity: glowAnim.interpolate({
               inputRange: [0, 1],
               outputRange: [0.2, 0.4]
             }),
             shadowRadius: glowAnim.interpolate({
               inputRange: [0, 1],
               outputRange: [6, 12]
             }),
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

  const handlePetitionPress = () => {
    console.log('Petition pressed');
    // Handle petition logic
  };

  return (
    <View style={[styles.container, { borderColor }]}>
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

        <Tooltip text="Petition" theme={theme}>
          <AnimatedMainButton
            onPress={handlePetitionPress}
            iconColor={iconColor}
            backgroundColor={backgroundColor}
            borderColor={borderColor}
          >
            <PetitionIcon color={iconColor} />
          </AnimatedMainButton>
        </Tooltip>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
    marginVertical: 16,
    borderWidth: 2,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  mainButton: {
    width: 400, // Increased width by another 100px for better proportions
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
    // Ensure perfect centering of content
    textAlign: 'center',
    display: 'flex',
  },
});
