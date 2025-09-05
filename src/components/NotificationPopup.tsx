import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { colors } from '../theme/colors';

interface NotificationPopupProps {
  visible: boolean;
  title: string;
  message: string;
  onAccept?: () => void;
  onDecline?: () => void;
  acceptText?: string;
  declineText?: string;
  theme?: 'blue' | 'red';
}

export const NotificationPopup: React.FC<NotificationPopupProps> = ({
  visible,
  title,
  message,
  onAccept,
  onDecline,
  acceptText = 'Accept',
  declineText = 'Decline',
  theme = 'blue',
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const scrollAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  const themeColors = {
    blue: {
      primary: '#3B82F6',
      secondary: '#1E40AF',
      accent: '#60A5FA',
      glow: 'rgba(59, 130, 246, 0.3)',
    },
    red: {
      primary: '#EF4444',
      secondary: '#DC2626',
      accent: '#F87171',
      glow: 'rgba(239, 68, 68, 0.3)',
    },
  };

  const currentTheme = themeColors[theme];

  useEffect(() => {
    if (visible) {
      // Scroll-like opening animation
      Animated.sequence([
        // Initial scroll unroll
        Animated.timing(scrollAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        // Scale and fade in
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 400,
            easing: Easing.out(Easing.back(1.2)),
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
      ]).start();

      // Continuous glow animation
      const glowLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 2000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 2000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      );
      glowLoop.start();

      return () => {
        glowLoop.stop();
      };
    } else {
      // Close animation
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0,
          duration: 300,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(scrollAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  const scrollTransform = scrollAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  return (
    <View style={styles.overlay}>
      <Animated.View
        style={[
          styles.scrollContainer,
          {
            transform: [{ scaleY: scrollTransform }],
          },
        ]}
      >
        <Animated.View
          style={[
            styles.popup,
            {
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
            },
          ]}
        >
          {/* Glow effect */}
          <Animated.View
            style={[
              styles.glow,
              {
                backgroundColor: currentTheme.glow,
                opacity: glowOpacity,
              },
            ]}
          />
          
          {/* Main popup content */}
          <View style={[styles.content, { backgroundColor: currentTheme.secondary }]}>
            {/* Header with exclamation mark */}
            <View style={styles.header}>
              <View style={[styles.exclamationContainer, { backgroundColor: currentTheme.primary }]}>
                <Text style={styles.exclamation}>!</Text>
              </View>
              <Text style={[styles.title, { color: currentTheme.accent }]}>{title}</Text>
            </View>

            {/* Message */}
            <Text style={[styles.message, { color: '#FFFFFF' }]}>{message}</Text>

            {/* Action buttons */}
            <View style={styles.buttonContainer}>
              {onDecline && (
                <TouchableOpacity
                  style={[styles.button, styles.declineButton]}
                  onPress={onDecline}
                >
                  <Text style={styles.declineButtonText}>{declineText}</Text>
                </TouchableOpacity>
              )}
              {onAccept && (
                <TouchableOpacity
                  style={[styles.button, { backgroundColor: currentTheme.primary }]}
                  onPress={onAccept}
                >
                  <Text style={styles.acceptButtonText}>{acceptText}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </Animated.View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  scrollContainer: {
    width: '90%',
    maxWidth: 400,
    transformOrigin: 'center',
  },
  popup: {
    position: 'relative',
  },
  glow: {
    position: 'absolute',
    top: -20,
    left: -20,
    right: -20,
    bottom: -20,
    borderRadius: 20,
    zIndex: -1,
  },
  content: {
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  exclamationContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  exclamation: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  message: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  declineButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  declineButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  acceptButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
