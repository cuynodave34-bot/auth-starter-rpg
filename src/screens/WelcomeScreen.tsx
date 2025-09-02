import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { SubmitButton } from '../components/Form';
import { RippleBackground } from '../components/RippleBackground';
import { WaveHeader } from '../components/WaveHeader';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

type RootStackParamList = {
  Welcome: undefined;
  Login: undefined;
  SignUp: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, 'Welcome'>;

export const WelcomeScreen: React.FC<Props> = ({ navigation }) => {
  return (
    <RippleBackground>
      <WaveHeader />
      <View style={styles.hero}>
        <Image source={require('../../assets/splash-icon.png')} style={styles.illustration} />
        <Text style={styles.title}>SLIME</Text>
        <Text style={styles.subtitle}>Welcome!</Text>
      </View>
      <View style={styles.actions}>
        <SubmitButton title="Create Account" onPress={() => navigation.navigate('SignUp')} />
        <View style={{ height: 12 }} />
        <SubmitButton title="Login" onPress={() => navigation.navigate('Login')} />
      </View>
    </RippleBackground>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  hero: {
    marginTop: 48,
    alignItems: 'center',
  },
  illustration: {
    width: 220,
    height: 220,
    marginBottom: 24,
    resizeMode: 'contain',
  },
  title: { color: '#E6E8EB', fontSize: 28, fontWeight: '800', textAlign: 'center', marginBottom: 8 },
  subtitle: {
    color: '#9BA1A6',
    textAlign: 'center',
  },
  actions: {
    marginBottom: 32,
  },
});


