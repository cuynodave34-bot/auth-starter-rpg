import React, { useEffect, useState } from 'react';
import { Alert, Platform, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormField, SubmitButton, StrengthBar } from '../components/Form';
import { colors } from '../theme/colors';
import { Dropdown } from '../components/Dropdown';
import { useNavigation } from '@react-navigation/native';
import { AuthService, AuthError } from '../services/AuthService';
import { AuthErrorPopup } from '../components/AuthErrorPopup';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters').regex(/[a-z]/, 'Must include lowercase').regex(/[A-Z]/, 'Must include uppercase').regex(/[0-9]/, 'Must include a digit').regex(/[^a-zA-Z0-9]/, 'Must include a symbol'),
  confirmPassword: z.string(),
  displayName: z.string().min(1).max(50),
  race: z.enum(['Human', 'Demon']),
}).refine((data) => data.password === data.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] });

type FormData = z.infer<typeof schema>;

export const WebSignUpScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { setValue, watch, formState: { errors }, handleSubmit } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '', confirmPassword: '', displayName: '', race: 'Human' },
  });
  const [loading, setLoading] = useState(false);
  const [nameAvailable, setNameAvailable] = useState<null | boolean>(null);
  const [emailTaken, setEmailTaken] = useState<null | boolean>(null);
  const [authError, setAuthError] = useState<AuthError | null>(null);
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const passwordScore = (pwd: string): 0 | 1 | 2 | 3 | 4 => {
    if (!pwd) return 0;
    let score = 0 as 0 | 1 | 2 | 3 | 4;
    if (pwd.length >= 6) score = (score + 1) as any;
    if (/[a-z]/.test(pwd)) score = (score + 1) as any;
    if (/[A-Z]/.test(pwd)) score = (score + 1) as any;
    if (/[0-9]/.test(pwd) && /[^a-zA-Z0-9]/.test(pwd)) score = 4 as any; // full strength when digit+symbol
    return score;
  };

  const onSubmit = async (values: FormData) => {
    try {
      setLoading(true);
      setAuthError(null);
      setShowErrorPopup(false);
      
      if (emailTaken === true) {
        setAuthError({
          type: 'EMAIL_NOT_FOUND', // Reuse this type for "email already exists"
          message: 'This email address is already registered. Please try signing in instead.',
        });
        setShowErrorPopup(true);
        return;
      }
      
      const result = await AuthService.signUp(values.email, values.password, values.displayName, values.race);
      
      if (result.success) {
        // Navigate using navigation stack (works on web and respects transitions)
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

  const handleSignIn = () => {
    setShowErrorPopup(false);
    setAuthError(null);
    navigation.navigate('WebLogin');
  };

  // Display name availability check (profiles + auth.users metadata)
  useEffect(() => {
    let active = true;
    const name = watch('displayName');
    const check = async () => {
      if (!name) { setNameAvailable(null); return; }
      const { data, error } = await supabase.from('profiles').select('id').eq('display_name', name).limit(1);
      if (!active) return;
      if (error) { setNameAvailable(null); return; }
      setNameAvailable((data?.length ?? 0) === 0);
    };
    const t = setTimeout(check, 400);
    return () => { active = false; clearTimeout(t); };
  }, [watch('displayName')]);

  // Email uniqueness: requires a security definer RPC (email_taken)
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

  return (
    <View style={styles.root}>
      <View style={styles.left}/>
      <View style={styles.right}>
        <Text style={styles.hello}>Create Account</Text>
        <View style={{ height: 16 }} />
        <FormField
          label="Display Name"
          value={watch('displayName')}
          onChangeText={(t) => setValue('displayName', t, { shouldValidate: true })}
          placeholder="RimuruTempest"
          autoCapitalize="none"
          error={errors.displayName?.message || (nameAvailable === false ? 'Display name already taken' : undefined)}
        />
        <View style={styles.pickerField}>
          <Text style={styles.pickerLabel}>Race</Text>
          <Dropdown value={watch('race')} onChange={(v) => setValue('race', v as any, { shouldValidate: true })} options={[{ label: 'Human', value: 'Human' }, { label: 'Demon', value: 'Demon' }]} />
          {errors.race ? <Text style={styles.errorText}>{errors.race.message as any}</Text> : null}
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
          marginBottom={6}
        />
        <StrengthBar score={passwordScore(watch('password'))} />
        <FormField
          label="Confirm Password"
          value={watch('confirmPassword')}
          onChangeText={(t) => setValue('confirmPassword', t, { shouldValidate: true })}
          placeholder="••••••••"
          secureTextEntry
          autoCapitalize="none"
          error={errors.confirmPassword?.message}
        />
        <View style={{ height: 8 }} />
        <SubmitButton title="Submit" onPress={handleSubmit(onSubmit)} loading={loading} disabled={emailTaken === true} />
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
        onSignUp={handleSignIn}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: 'row', backgroundColor: colors.surface },
  left: { flex: 1, backgroundColor: colors.brandStart, opacity: 0.9 },
  right: { flex: 1, paddingHorizontal: 64, justifyContent: 'center' },
  hello: { color: '#fff', fontWeight: '800', fontSize: 34, marginBottom: 12, alignSelf: 'center', textAlign: 'center' },
  pickerField: { marginBottom: 16, alignSelf: 'center', width: '100%', maxWidth: 420 },
  pickerLabel: { color: '#E6E8EB', marginBottom: 8, fontSize: 14, fontWeight: '600' },
  pickerWrapper: { },
  inputLike: { },
  picker: { },
  errorText: { color: '#FF6B6B', marginTop: 6, fontSize: 12 },
  linkCenter: { color: colors.brandAccent, textAlign: 'center' },
});

if (Platform.OS !== 'web') {
  console.warn('WebSignUpScreen is intended for Web platform only.');
}


