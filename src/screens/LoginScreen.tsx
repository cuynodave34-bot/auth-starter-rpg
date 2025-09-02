import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { RippleBackground } from '../components/RippleBackground';
import { WaveHeader } from '../components/WaveHeader';
import { FormField, SubmitButton } from '../components/Form';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '../lib/supabase';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type FormData = z.infer<typeof schema>;

type RootStackParamList = {
  Login: undefined;
  SignUp: undefined;
  ResetPassword: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const { register, setValue, watch, formState: { errors }, handleSubmit } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });
  const [loading, setLoading] = useState(false);

  const onSubmit = async (values: FormData) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword(values);
      if (error) throw error;
    } catch (err: any) {
      Alert.alert('Sign in failed', err?.message ?? 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <RippleBackground>
      <WaveHeader />
      <View>
        <Text style={styles.heading}>Let's sign you in.</Text>
        <Text style={styles.subheading}>Welcome back. You've been missed!</Text>
      </View>

      <View>
        <FormField
          label="Email"
          value={watch('email')}
          onChangeText={(t) => setValue('email', t, { shouldValidate: true })}
          placeholder="you@example.com"
          autoCapitalize="none"
          keyboardType="email-address"
          error={errors.email?.message}
        />
        <FormField
          label="Password"
          value={watch('password')}
          onChangeText={(t) => setValue('password', t, { shouldValidate: true })}
          placeholder="••••••••"
          secureTextEntry
          autoCapitalize="none"
          error={errors.password?.message}
        />
        <TouchableOpacity onPress={() => navigation.navigate('ResetPassword')}>
          <Text style={styles.link}>Forgot password?</Text>
        </TouchableOpacity>
      </View>

      <View>
        <SubmitButton title="Login" onPress={handleSubmit(onSubmit)} loading={loading} />
        <View style={{ height: 12 }} />
        <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
          <Text style={styles.linkCenter}>Don't have an account? Register</Text>
        </TouchableOpacity>
      </View>
    </RippleBackground>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  heading: { color: '#E6E8EB', fontSize: 28, fontWeight: '800', marginTop: 12 },
  subheading: { color: '#A9B0BC', marginTop: 6 },
  link: { color: '#E6F14A', marginTop: 4 },
  linkCenter: { color: '#E6F14A', textAlign: 'center' },
});


