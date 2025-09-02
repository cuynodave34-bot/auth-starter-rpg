import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../providers/AuthProvider';

export const HomeScreen: React.FC = () => {
  const { user, signOut } = useAuth();
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Welcome, {user?.email ?? 'adventurer'}!</Text>
      <TouchableOpacity onPress={signOut} style={styles.btn}><Text style={styles.btnText}>Sign out</Text></TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0B0B0C' },
  text: { color: '#E6E8EB', fontSize: 18, marginBottom: 12 },
  btn: { backgroundColor: '#E6F14A', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12 },
  btnText: { color: '#0B0B0C', fontWeight: '700' },
});


