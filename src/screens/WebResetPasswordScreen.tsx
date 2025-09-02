import React, { useEffect, useState } from 'react';
import { Alert, Platform, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormField, SubmitButton } from '../components/Form';
import { colors } from '../theme/colors';
import { useNavigation } from '@react-navigation/native';
import { AuthService, AuthError } from '../services/AuthService';
import { AuthErrorPopup } from '../components/AuthErrorPopup';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
});

type FormData = z.infer<typeof schema>;

export const WebResetPasswordScreen: React.FC = () => {
  const { setValue, watch, formState: { errors }, handleSubmit } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  });
  const [loading, setLoading] = useState(false);
  const [emailExists, setEmailExists] = useState<null | boolean>(null);
  const [authError, setAuthError] = useState<AuthError | null>(null);
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const navigation = useNavigation<any>();

  const onSubmit = async (values: FormData) => {
    try {
      setLoading(true);
      setAuthError(null);
      setShowErrorPopup(false);
      
      if (emailExists === false) {
        setAuthError({
          type: 'EMAIL_NOT_FOUND',
          message: 'No account found for this email address. Please check your email or create a new account.',
        });
        setShowErrorPopup(true);
        return;
      }
      
      const result = await AuthService.resetPassword(values.email);
      
      if (result.success) {
        navigation.navigate('EmailSent');
      } else {
        // Show error popup
        setAuthError(result.error!);
        setShowErrorPopup(true);
      }
    } catch (err: any) {
      setAuthError({
        type: 'UNKNOWN_ERROR',
        message: 'An unexpected error occurred. Please try again.',
      });
      setShowErrorPopup(true);
    } finally {
      setLoading(false);
    }
  };

  const handleErrorPopupClose = () => {
    setShowErrorPopup(false);
    setAuthError(null);
  };

  const handleRetry = () => {
    setShowErrorPopup(false);
    setAuthError(null);
    // Form will be ready for retry
  };

  const handleSignUp = () => {
    setShowErrorPopup(false);
    setAuthError(null);
    navigation.navigate('WebSignUp');
  };

  // realtime email existence check via RPC
  useEffect(() => {
    let active = true;
    const email = watch('email');
    const check = async () => {
      if (!email) { setEmailExists(null); return; }
      const { data, error } = await supabase.rpc('email_taken', { p_email: email });
      if (!active) return;
      if (error) { setEmailExists(null); return; }
      setEmailExists(Boolean(data));
    };
    const t = setTimeout(check, 400);
    return () => { active = false; clearTimeout(t); };
  }, [watch('email')]);

  return (
    <View style={styles.root}>
      <View style={styles.left}/>
      <View style={styles.right}>
        <Text style={styles.hello}>Reset Password</Text>
        <View style={{ height: 16 }} />
        <FormField
          label="Email"
          value={watch('email')}
          onChangeText={(t) => setValue('email', t, { shouldValidate: true })}
          placeholder="you@example.com"
          autoCapitalize="none"
          keyboardType="email-address"
          error={errors.email?.message || (emailExists === false ? 'Email not found' : undefined)}
        />
        <View style={{ height: 8 }} />
        <SubmitButton title="Submit" onPress={handleSubmit(onSubmit)} loading={loading} disabled={emailExists === false} />
        <View style={{ height: 10 }} />
        <TouchableOpacity onPress={() => navigation.reset({ index: 0, routes: [{ name: 'WebLogin' }] })}>
          <Text style={styles.linkCenter}>Back to log-in</Text>
        </TouchableOpacity>
      </View>

      {/* Auth Error Popup */}
      <AuthErrorPopup
        visible={showErrorPopup}
        error={authError}
        onClose={handleErrorPopupClose}
        onRetry={handleRetry}
        onSignUp={handleSignUp}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: 'row', backgroundColor: colors.surface },
  left: { flex: 1, backgroundColor: colors.brandEnd, opacity: 0.9 },
  right: { flex: 1, paddingHorizontal: 48, justifyContent: 'center', alignItems: 'center' },
  hello: { color: '#fff', fontWeight: '800', fontSize: 28, textAlign: 'center' },
  linkCenter: { color: colors.brandAccent, textAlign: 'center' },
});

if (Platform.OS !== 'web') {
  console.warn('WebResetPasswordScreen is intended for Web platform only.');
}


