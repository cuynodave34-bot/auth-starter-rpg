import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Platform, StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient as SvgLinear, Stop, Path } from 'react-native-svg';
import { colors } from '../theme/colors';

// Animated, eye-pleasing hero for web left panel: gradient crossfade, subtle waves and ripples.
export const WebLeftWaves: React.FC = () => {
  const progress = useRef(new Animated.Value(0)).current;
  const ripple = useRef(new Animated.Value(0)).current;
  const [pointer, setPointer] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(progress, { toValue: 1, duration: 9000, easing: Easing.inOut(Easing.quad), useNativeDriver: false })
    );
    const rippleLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(ripple, { toValue: 1, duration: 2800, easing: Easing.out(Easing.quad), useNativeDriver: false }),
        Animated.timing(ripple, { toValue: 0, duration: 0, useNativeDriver: false }),
      ])
    );
    loop.start();
    rippleLoop.start();
    return () => { loop.stop(); rippleLoop.stop(); };
  }, [progress, ripple]);

  const translateWave1 = progress.interpolate({ inputRange: [0, 1], outputRange: [0, -20] });
  const translateWave2 = progress.interpolate({ inputRange: [0, 1], outputRange: [0, -35] });
  const gradientFade = progress.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 1, 0] });
  const rippleScale = ripple.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1.2] });
  const rippleOpacity = ripple.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0] });

  const [layout, setLayout] = useState({ width: 1, height: 1 });
  const onMove = (e: any) => {
    const lx = e?.nativeEvent?.locationX ?? 0;
    const ly = e?.nativeEvent?.locationY ?? 0;
    setPointer({ x: Math.max(0, Math.min(1, lx / layout.width)), y: Math.max(0, Math.min(1, ly / layout.height)) });
  };

  const parallax = useMemo(() => ({
    transform: [{ translateX: (pointer.x - 0.5) * 12 }, { translateY: (pointer.y - 0.5) * 12 }],
  }), [pointer]);

  return (
    <View
      style={styles.root}
      onLayout={(e) => setLayout({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })}
      onResponderMove={onMove}
      onStartShouldSetResponder={() => true}
    >
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: 1 }]}> 
        <Svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 100 100">
          <Defs>
            <SvgLinear id="gradA" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={colors.brandEnd} />
              <Stop offset="1" stopColor={colors.brandStart} />
            </SvgLinear>
            <SvgLinear id="gradB" x1="1" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={colors.brandStart} />
              <Stop offset="1" stopColor={colors.brandAccent} />
            </SvgLinear>
          </Defs>
          <Path d="M0 0 H100 V100 H0 Z" fill="url(#gradA)" />
        </Svg>
      </Animated.View>

      <Animated.View style={[StyleSheet.absoluteFill, { opacity: gradientFade }]}> 
        <Svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 100 100">
          <Path d="M0 0 H100 V100 H0 Z" fill="url(#gradB)" />
        </Svg>
      </Animated.View>

      <Animated.View style={[styles.wave, { transform: [{ translateY: translateWave1 }], }, parallax]}>
        <Svg width="100%" height="100%" viewBox="0 0 375 180" preserveAspectRatio="none">
          <Path d="M0 60 C80 90 140 20 220 50 C300 80 340 40 375 60 L375 180 L0 180 Z" fill="rgba(255,255,255,0.05)" />
        </Svg>
      </Animated.View>

      <Animated.View style={[styles.wave, { transform: [{ translateY: translateWave2 }], opacity: 0.6 }, parallax]}>
        <Svg width="100%" height="100%" viewBox="0 0 375 180" preserveAspectRatio="none">
          <Path d="M0 80 C60 40 140 80 210 60 C300 35 330 75 375 55 L375 180 L0 180 Z" fill="rgba(255,255,255,0.04)" />
        </Svg>
      </Animated.View>

      <Animated.View style={[styles.ripple, { transform: [{ scale: rippleScale }], opacity: rippleOpacity }]} />
      <Animated.View style={[styles.rippleAlt, { transform: [{ scale: rippleScale }], opacity: rippleOpacity }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, overflow: 'hidden' },
  wave: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '40%' },
  ripple: { position: 'absolute', width: 260, height: 260, borderRadius: 130, backgroundColor: 'rgba(255,255,255,0.08)', top: 40, left: 40 },
  rippleAlt: { position: 'absolute', width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(255,255,255,0.06)', bottom: 60, right: 60 },
});


