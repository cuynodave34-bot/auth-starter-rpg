import React, { useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

interface TooltipProps {
  children: React.ReactNode;
  text: string;
  theme?: 'blue' | 'red';
}

export const Tooltip: React.FC<TooltipProps> = ({ children, text, theme = 'blue' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [opacity] = useState(new Animated.Value(0));

  const themeColors = theme === 'blue' 
    ? {
        background: 'rgba(79, 70, 229, 0.9)',
        text: '#FFFFFF',
        border: '#818CF8',
      }
    : {
        background: 'rgba(220, 38, 38, 0.9)',
        text: '#FFFFFF',
        border: '#F87171',
      };

  const showTooltip = () => {
    setIsVisible(true);
    Animated.timing(opacity, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const hideTooltip = () => {
    Animated.timing(opacity, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setIsVisible(false);
    });
  };

  return (
    <View style={styles.container}>
      <View
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        style={styles.trigger}
      >
        {children}
      </View>
      
      {isVisible && (
        <Animated.View
          style={[
            styles.tooltip,
            {
              backgroundColor: themeColors.background,
              borderColor: themeColors.border,
              opacity,
            },
          ]}
        >
          <Text style={[styles.tooltipText, { color: themeColors.text }]}>
            {text}
          </Text>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  trigger: {
    // This will be the touchable area for the tooltip
  },
  tooltip: {
    position: 'absolute',
    top: '100%', // Position below the button instead of above
    left: '50%',
    transform: [{ translateX: -50 }],
    marginTop: 8, // Add margin below instead of above
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1000,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80, // Ensure minimum width for better text display
  },
  tooltipText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    alignSelf: 'center',
    lineHeight: 16, // Add line height for better text spacing
  },
});
