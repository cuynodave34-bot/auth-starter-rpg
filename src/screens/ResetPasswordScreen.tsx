import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
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
});

type FormData = z.infer<typeof schema>;
type RootStackParamList = { ResetPassword: undefined; EmailSent: undefined; Login: undefined };
type Props = NativeStackScreenProps<RootStackParamList, 'ResetPassword'>;

export const ResetPasswordScreen: React.FC<Props> = ({ navigation }) => {
  const { setValue, watch, formState: { errors }, handleSubmit } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  });
  const [loading, setLoading] = useState(false);
  const [emailExists, setEmailExists] = useState<null | boolean>(null);

  const onSubmit = async (values: FormData) => {
    try {
      setLoading(true);
      if (emailExists === false) {
        Alert.alert('Unknown email', 'No account found for this email address.');
        return;
      }
      const { error } = await supabase.auth.resetPasswordForEmail(values.email);
      if (error) throw error;
      navigation.navigate('EmailSent');
    } catch (err: any) {
      Alert.alert('Failed', err?.message ?? 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <RippleBackground>
      <WaveHeader />
      <View>
        <Text style={styles.heading}>Reset Password</Text>
        <Text style={styles.subheading}>We'll send you a reset link.</Text>
      </View>
      <View>
        <FormField
          label="Email"
          value={watch('email')}
          onChangeText={(t) => setValue('email', t, { shouldValidate: true })}
          placeholder="you@example.com"
          autoCapitalize="none"
          keyboardType="email-address"
          error={errors.email?.message || (emailExists === false ? 'Email not found' : undefined)}
        />
      </View>
      <View>
        <SubmitButton title="Send reset link" onPress={handleSubmit(onSubmit)} loading={loading} disabled={emailExists === false} />
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
  heading: { color: '#E6E8EB', fontSize: 28, fontWeight: '800', marginTop: 12, textAlign: 'center' },
  subheading: { color: '#A9B0BC', marginTop: 6 },
});


