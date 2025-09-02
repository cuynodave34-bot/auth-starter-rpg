import React, { useState, useEffect } from 'react';
import { Alert, Platform, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useForm } from 'react-hook-form';
import { useNavigation } from '@react-navigation/native';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormField, SubmitButton } from '../components/Form';
import { colors } from '../theme/colors';
import { WebLeftWaves } from '../components/WebLeftWaves';
import { usePlayer } from '../providers/PlayerProvider';
import { AuthService, AuthError } from '../services/AuthService';
import { AuthErrorPopup } from '../components/AuthErrorPopup';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type FormData = z.infer<typeof schema>;

export const WebLoginScreen: React.FC = () => {
  const { setValue, watch, formState: { errors }, handleSubmit } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<AuthError | null>(null);
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const navigation = useNavigation<any>();
  const { player, loading: playerLoading, isActive, evolutionPath, refreshPlayer } = usePlayer();

  // Redirect to appropriate dashboard if user is already authenticated and active
  useEffect(() => {
    if (!playerLoading && player && isActive && evolutionPath) {
      if (evolutionPath === 'Human') {
        navigation.navigate('HumanDashboard');
      } else if (evolutionPath === 'Demon') {
        navigation.navigate('DemonDashboard');
      }
    }
  }, [player, playerLoading, isActive, evolutionPath, navigation]);

  const onSubmit = async (values: FormData) => {
    try {
      setLoading(true);
      setAuthError(null);
      setShowErrorPopup(false);
      
      const result = await AuthService.signIn(values.email, values.password);
      
      if (result.success) {
        // Refresh player data after successful login
        await refreshPlayer();
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

  const handleResetPassword = () => {
    setShowErrorPopup(false);
    setAuthError(null);
    navigation.navigate('WebResetPassword');
  };

  return (
    <View style={styles.root}>
      <View style={styles.left}><WebLeftWaves /></View>
      <View style={styles.right}>
        <Text style={styles.kicker}>Welcome back</Text>
        <Text style={styles.title}>Log-in to SLIME</Text>
        <View style={{ height: 16 }} />
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
        <View style={{ height: 8 }} />
        <SubmitButton title="Login" onPress={handleSubmit(onSubmit)} loading={loading} />
        <View style={{ height: 10 }} />
        <View style={styles.linksRow}>
          <TouchableOpacity onPress={() => navigation.navigate('WebSignUp')}><Text style={styles.link}>Create account</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('WebResetPassword')}><Text style={styles.link}>Forgot password?</Text></TouchableOpacity>
        </View>
      </View>

      {/* Auth Error Popup */}
      <AuthErrorPopup
        visible={showErrorPopup}
        error={authError}
        onClose={handleErrorPopupClose}
        onRetry={handleRetry}
        onSignUp={handleSignUp}
        onResetPassword={handleResetPassword}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: 'row', backgroundColor: colors.surface },
  left: { flex: 1 },
  right: { flex: 1, paddingHorizontal: 64, justifyContent: 'center', alignItems: 'center' },
  kicker: { color: colors.brandAccent, fontWeight: '700', fontSize: 16, letterSpacing: 0.3, textAlign: 'center' },
  title: { color: '#fff', fontWeight: '800', fontSize: 34, marginTop: 6, marginBottom: 12, textAlign: 'center' },
  link: { color: colors.brandAccent, marginTop: 6, marginRight: 16 },
  linksRow: { flexDirection: 'row', justifyContent: 'space-between', maxWidth: 420, alignSelf: 'center' },
});

// Ensure this component is only used on web
if (Platform.OS !== 'web') {
  console.warn('WebLoginScreen is intended for Web platform only.');
}


