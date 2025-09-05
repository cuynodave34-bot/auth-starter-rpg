import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { AuthError } from '../services/AuthService';

interface AuthErrorPopupProps {
  visible: boolean;
  error: AuthError | null;
  onClose: () => void;
  onRetry?: () => void;
  onSignUp?: () => void;
  onResetPassword?: () => void;
}

export const AuthErrorPopup: React.FC<AuthErrorPopupProps> = ({
  visible,
  error,
  onClose,
  onRetry,
  onSignUp,
  onResetPassword,
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const scrollAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  const getErrorTheme = (errorType: AuthError['type']) => {
    switch (errorType) {
      case 'EMAIL_NOT_FOUND':
        return {
          primary: '#F59E0B',
          secondary: '#D97706',
          accent: '#FBBF24',
          glow: 'rgba(245, 158, 11, 0.3)',
        };
      case 'WRONG_PASSWORD':
        return {
          primary: '#EF4444',
          secondary: '#DC2626',
          accent: '#F87171',
          glow: 'rgba(239, 68, 68, 0.3)',
        };
      case 'NETWORK_ERROR':
        return {
          primary: '#6B7280',
          secondary: '#4B5563',
          accent: '#9CA3AF',
          glow: 'rgba(107, 114, 128, 0.3)',
        };
      default:
        return {
          primary: '#EF4444',
          secondary: '#DC2626',
          accent: '#F87171',
          glow: 'rgba(239, 68, 68, 0.3)',
        };
    }
  };

  const getErrorIcon = (errorType: AuthError['type']) => {
    switch (errorType) {
      case 'EMAIL_NOT_FOUND':
        return '?';
      case 'WRONG_PASSWORD':
        return '!';
      case 'NETWORK_ERROR':
        return '⚠';
      default:
        return '!';
    }
  };

  const getErrorTitle = (errorType: AuthError['type']) => {
    switch (errorType) {
      case 'EMAIL_NOT_FOUND':
        return 'EMAIL NOT FOUND';
      case 'WRONG_PASSWORD':
        return 'INVALID PASSWORD';
      case 'NETWORK_ERROR':
        return 'CONNECTION ERROR';
      default:
        return 'ERROR';
    }
  };

  useEffect(() => {
    if (visible && error) {
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
  }, [visible, error]);

  if (!visible || !error) return null;

  const currentTheme = getErrorTheme(error.type);
  const errorIcon = getErrorIcon(error.type);
  const errorTitle = getErrorTitle(error.type);

  const scrollTransform = scrollAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  const renderActionButtons = () => {
    const buttons = [];

    // Always show close button
    buttons.push(
      <TouchableOpacity
        key="close"
        style={[styles.button, styles.closeButton]}
        onPress={onClose}
      >
        <Text style={styles.closeButtonText}>Close</Text>
      </TouchableOpacity>
    );

    // Add specific action buttons based on error type
    switch (error.type) {
      case 'EMAIL_NOT_FOUND':
        if (onSignUp) {
          buttons.push(
            <TouchableOpacity
              key="signup"
              style={[styles.button, { backgroundColor: currentTheme.primary }]}
              onPress={onSignUp}
            >
              <Text style={styles.actionButtonText}>Create Account</Text>
            </TouchableOpacity>
          );
        }
        break;
      case 'WRONG_PASSWORD':
        if (onResetPassword) {
          buttons.push(
            <TouchableOpacity
              key="reset"
              style={[styles.button, { backgroundColor: currentTheme.primary }]}
              onPress={onResetPassword}
            >
              <Text style={styles.actionButtonText}>Reset Password</Text>
            </TouchableOpacity>
          );
        }
        if (onRetry) {
          buttons.push(
            <TouchableOpacity
              key="retry"
              style={[styles.button, styles.retryButton]}
              onPress={onRetry}
            >
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          );
        }
        break;
      case 'NETWORK_ERROR':
        if (onRetry) {
          buttons.push(
            <TouchableOpacity
              key="retry"
              style={[styles.button, { backgroundColor: currentTheme.primary }]}
              onPress={onRetry}
            >
              <Text style={styles.actionButtonText}>Retry</Text>
            </TouchableOpacity>
          );
        }
        break;
    }

    return buttons;
  };

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
            {/* Header with error icon */}
            <View style={styles.header}>
              <View style={[styles.iconContainer, { backgroundColor: currentTheme.primary }]}>
                <Text style={styles.icon}>{errorIcon}</Text>
              </View>
              <Text style={[styles.title, { color: currentTheme.accent }]}>{errorTitle}</Text>
            </View>

            {/* Error message */}
            <Text style={[styles.message, { color: '#FFFFFF' }]}>{error.message}</Text>

            {/* Action buttons */}
            <View style={styles.buttonContainer}>
              {renderActionButtons()}
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
    maxWidth: 450,
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
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  icon: {
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
    flexWrap: 'wrap',
  },
  button: {
    flex: 1,
    minWidth: 120,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  retryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
