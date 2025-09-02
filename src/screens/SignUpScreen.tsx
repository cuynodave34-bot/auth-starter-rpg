import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { RippleBackground } from '../components/RippleBackground';
import { WaveHeader } from '../components/WaveHeader';
import { FormField, SubmitButton } from '../components/Form';
import { useForm, SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '../lib/supabase';
import { Dropdown } from '../components/Dropdown';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters').regex(/[a-z]/, 'Must include lowercase').regex(/[A-Z]/, 'Must include uppercase').regex(/[0-9]/, 'Must include a digit').regex(/[^a-zA-Z0-9]/, 'Must include a symbol'),
  confirmPassword: z.string(),
  displayName: z.string().min(1, 'Required').max(50, 'Too long'),
  // phone removed
  race: z.enum(['Human', 'Demon']),
}).refine((d) => d.password === d.confirmPassword, { path: ['confirmPassword'], message: 'Passwords do not match' });

type FormData = z.infer<typeof schema>;

type RootStackParamList = {
  SignUp: undefined;
  EmailSent: undefined;
  Login: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, 'SignUp'>;

export const SignUpScreen: React.FC<Props> = ({ navigation }) => {
  const { register, setValue, watch, formState: { errors }, handleSubmit, trigger } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: { email: '', password: '', confirmPassword: '', displayName: '', race: 'Human' },
  });
  const [loading, setLoading] = useState(false);
  const [nameAvailable, setNameAvailable] = useState<null | boolean>(null);
  const [emailTaken, setEmailTaken] = useState<null | boolean>(null);
  const displayName = watch('displayName');

  useEffect(() => {
    let active = true;
    const check = async () => {
      const valid = await trigger('displayName');
      if (!valid) { setNameAvailable(null); return; }
      if (!displayName) { setNameAvailable(null); return; }
      // Check only the public.profiles table which holds the unique display_name
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('display_name', displayName)
        .limit(1);
      if (!active) return;
      if (error) { setNameAvailable(null); return; }
      setNameAvailable((data?.length ?? 0) === 0);
    };
    const t = setTimeout(check, 400);
    return () => { active = false; clearTimeout(t); };
  }, [displayName, trigger]);

  // Email uniqueness check (uses RPC public.email_taken)
  useEffect(() => {
    let active = true;
    const email = watch('email');
    const check = async () => {
      if (!email) { setEmailTaken(null); return; }
      const { data, error } = await supabase.rpc('email_taken', { p_email: email });
      if (!active) return;
      if (error) { setEmailTaken(null); return; }
      setEmailTaken(Boolean(data));
    };
    const t = setTimeout(check, 400);
    return () => { active = false; clearTimeout(t); };
  }, [watch('email')]);

  const onSubmit: SubmitHandler<FormData> = async (values) => {
    try {
      setLoading(true);
      if (nameAvailable === false) {
        Alert.alert('Display name taken', 'Please choose another display name.');
        return;
      }
      if (emailTaken === true) {
        Alert.alert('Email already registered', 'Please use a different email address.');
        return;
      }
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: { display_name: values.displayName, race: values.race },
        },
      });
      if (error) throw error;
      const userId = data.user?.id;
      if (userId) {
        await supabase.from('profiles').insert({ id: userId, display_name: values.displayName, race: values.race });
      }
      // Navigate to EmailSent screen on native
      navigation.navigate('EmailSent');
    } catch (err: any) {
      Alert.alert('Sign up failed', err?.message ?? 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <RippleBackground>
      <WaveHeader />
      <View>
        <Text style={styles.heading}>Create account</Text>
        <Text style={styles.subheading}>Choose a unique display name.</Text>
      </View>
      <View>
        <FormField
          label="Display Name"
          value={watch('displayName')}
          onChangeText={(t) => setValue('displayName', t, { shouldValidate: true })}
          placeholder="RimuruTempest"
          autoCapitalize="none"
          error={errors.displayName?.message || (nameAvailable === false ? 'Display name already taken' : undefined)}
        />
        <View style={{ marginBottom: 16, alignSelf: 'center', width: '100%', maxWidth: 420 }}>
          <Text style={{ color: '#E6E8EB', marginBottom: 8, fontSize: 14, fontWeight: '600' }}>Race</Text>
          <Dropdown value={watch('race')} onChange={(v) => setValue('race', v as any, { shouldValidate: true })} options={[{ label: 'Human', value: 'Human' }, { label: 'Demon', value: 'Demon' }]} />
        </View>
        {/* Phone field removed per request */}
        <FormField
          label="Email"
          value={watch('email')}
          onChangeText={(t) => setValue('email', t, { shouldValidate: true })}
          placeholder="you@example.com"
          autoCapitalize="none"
          keyboardType="email-address"
          error={errors.email?.message || (emailTaken ? 'Email already registered' : undefined)}
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
        <FormField
          label="Confirm Password"
          value={watch('confirmPassword')}
          onChangeText={(t) => setValue('confirmPassword', t, { shouldValidate: true })}
          placeholder="••••••••"
          secureTextEntry
          autoCapitalize="none"
          error={errors.confirmPassword?.message}
        />
      </View>

      <View>
        <SubmitButton title="Create Account" onPress={handleSubmit(onSubmit)} loading={loading} disabled={emailTaken === true} />
        <View style={{ height: 12 }} />
        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={{ color: '#E6F14A', textAlign: 'center' }}>Back to log-in</Text>
        </TouchableOpacity>
      </View>
    </RippleBackground>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  heading: { color: '#E6E8EB', fontSize: 28, fontWeight: '800', marginTop: 12 },
  subheading: { color: '#A9B0BC', marginTop: 6 },
});


