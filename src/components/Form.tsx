import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

type FormFieldProps = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: 'default' | 'email-address';
  error?: string;
  marginBottom?: number;
};

export const FormField: React.FC<FormFieldProps> = ({ label, error, marginBottom, ...inputProps }) => {
  return (
    <View style={[styles.fieldContainer, marginBottom != null ? { marginBottom } : undefined]}>
      <Text style={styles.label}>{label}</Text>
      <TextInput {...inputProps} style={[styles.input, error ? styles.inputError : undefined]} placeholderTextColor="#9BA1A6" />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
};

type SubmitButtonProps = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
};

export const SubmitButton: React.FC<SubmitButtonProps> = ({ title, onPress, disabled, loading }) => {
  const effectiveDisabled = disabled || loading;
  return (
    <TouchableOpacity disabled={effectiveDisabled} onPress={onPress} style={[styles.button, effectiveDisabled ? styles.buttonDisabled : undefined]}>
      {loading ? <ActivityIndicator color="#0B0B0C" /> : <Text style={styles.buttonText}>{title}</Text>}
    </TouchableOpacity>
  );
};

type StrengthBarProps = { score: 0 | 1 | 2 | 3 | 4 };
export const StrengthBar: React.FC<StrengthBarProps> = ({ score }) => {
  const segments = [0, 1, 2, 3];
  const colors = ['#FF6B6B', '#FFA94D', '#F2C94C', '#7EE787'];
  return (
    <View style={styles.strengthBarContainer}>
      {segments.map((i) => (
        <View key={i} style={[styles.strengthSegment, { backgroundColor: i < score ? colors[score - 1] : 'rgba(255,255,255,0.15)' }]} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  fieldContainer: { marginBottom: 14, alignSelf: 'center', width: '100%', maxWidth: 420 },
  label: {
    color: '#E6E8EB',
    marginBottom: 8,
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#2A2E33',
    backgroundColor: '#121417',
    color: '#E6E8EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    alignSelf: 'center',
    width: '100%',
    maxWidth: 420,
  },
  inputError: {
    borderColor: '#FF6B6B',
  },
  errorText: {
    color: '#FF6B6B',
    marginTop: 6,
    fontSize: 12,
  },
  button: {
    backgroundColor: '#E6F14A',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    alignSelf: 'center',
    width: '100%',
    maxWidth: 420,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#0B0B0C',
    fontSize: 16,
    fontWeight: '700',
  },
  strengthBarContainer: { flexDirection: 'row', gap: 6, marginTop: 2, marginBottom: 8, alignSelf: 'center', width: '100%', maxWidth: 420 },
  strengthSegment: { flex: 1, height: 6, borderRadius: 4 },
});


