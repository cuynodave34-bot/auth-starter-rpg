import React, { useEffect, useRef } from 'react';
import { Animated, Platform, StyleSheet, Text, View } from 'react-native';
import { SubmitButton } from '../components/Form';
import { useNavigation } from '@react-navigation/native';

export const EmailSentScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slide, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();

    const t = setTimeout(() => {
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    }, 5000);
    return () => clearTimeout(t);
  }, [fade, slide, navigation]);
  return (
    <View style={styles.container}>
      <Animated.View style={[styles.card, { opacity: fade, transform: [{ translateY: slide }] }]}>
        <Text style={styles.title}>Verify your email</Text>
        <Text style={styles.subtitle}>
          We’ve sent a confirmation link to your email address.
          Please check your inbox and follow the link to complete your registration.
          You’ll be redirected to the sign‑in page shortly.
        </Text>
        <View style={{ height: 16 }} />
        <SubmitButton title="Back to Login" onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Login' }] })} />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0B0C', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { alignItems: 'center', maxWidth: 520, paddingHorizontal: 12 },
  title: { color: '#E6E8EB', fontSize: 28, fontWeight: '800', textAlign: 'center', marginTop: 12 },
  subtitle: { color: '#A9B0BC', textAlign: 'center', marginTop: 8, lineHeight: 22 },
});


