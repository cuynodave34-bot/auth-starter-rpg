import React, { useRef, useEffect, useState } from 'react';
import { Animated, View, StyleSheet, Easing } from 'react-native';

interface TransitionWrapperProps {
  children: React.ReactNode;
  isTransitioning: boolean;
  direction: 'left' | 'right';
  onTransitionComplete?: () => void;
}

export const TransitionWrapper: React.FC<TransitionWrapperProps> = ({
  children,
  isTransitioning,
  direction,
  onTransitionComplete,
}) => {
  const slideAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isTransitioning && !isAnimating) {
      setIsAnimating(true);
      
      // Stop any running animations
      slideAnim.stopAnimation();
      opacityAnim.stopAnimation();
      
      // Animate out
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: direction === 'left' ? -1 : 1,
          duration: 200,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.3,
          duration: 150,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Animate back in
        Animated.parallel([
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 300,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 250,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ]).start(() => {
          setIsAnimating(false);
          if (onTransitionComplete) {
            onTransitionComplete();
          }
        });
      });
    }
  }, [isTransitioning, direction, isAnimating, slideAnim, opacityAnim, onTransitionComplete]);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [
            {
              translateX: slideAnim.interpolate({
                inputRange: [-1, 0, 1],
                outputRange: [-60, 0, 60],
              }),
            },
          ],
          opacity: opacityAnim,
        },
      ]}
    >
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
});
