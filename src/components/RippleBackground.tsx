import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/colors';

export const RippleBackground: React.FC<React.PropsWithChildren> = ({ children }) => {
  const scale1 = useRef(new Animated.Value(0.6)).current;
  const scale2 = useRef(new Animated.Value(0.8)).current;
  const opacity1 = useRef(new Animated.Value(0.18)).current;
  const opacity2 = useRef(new Animated.Value(0.12)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.stagger(1200, [
        Animated.parallel([
          Animated.timing(scale1, { toValue: 1.06, duration: 4000, easing: Easing.inOut(Easing.quad), useNativeDriver: false }),
          Animated.sequence([
            Animated.timing(opacity1, { toValue: 0.24, duration: 2000, useNativeDriver: false }),
            Animated.timing(opacity1, { toValue: 0.14, duration: 2000, useNativeDriver: false }),
          ]),
        ]),
        Animated.parallel([
          Animated.timing(scale2, { toValue: 1.12, duration: 4200, easing: Easing.inOut(Easing.quad), useNativeDriver: false }),
          Animated.sequence([
            Animated.timing(opacity2, { toValue: 0.20, duration: 2100, useNativeDriver: false }),
            Animated.timing(opacity2, { toValue: 0.10, duration: 2100, useNativeDriver: false }),
          ]),
        ]),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [scale1, scale2, opacity1, opacity2]);

  return (
    <View style={styles.root}>
      <LinearGradient colors={[colors.brandStart, colors.brandEnd]} style={StyleSheet.absoluteFill} />
      <Animated.View style={[styles.ring, { transform: [{ scale: scale1 }], opacity: opacity1 }]} />
      <Animated.View style={[styles.ringAlt, { transform: [{ scale: scale2 }], opacity: opacity2 }]} />
      <View style={styles.content}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  ring: {
    position: 'absolute',
    width: 600,
    height: 600,
    borderRadius: 300,
    backgroundColor: 'rgba(255,255,255,0.08)',
    top: -120,
    right: -120,
  },
  ringAlt: {
    position: 'absolute',
    width: 520,
    height: 520,
    borderRadius: 260,
    backgroundColor: 'rgba(255,255,255,0.06)',
    bottom: -100,
    left: -100,
  },
  content: { flex: 1, padding: 24, justifyContent: 'space-between' },
});


