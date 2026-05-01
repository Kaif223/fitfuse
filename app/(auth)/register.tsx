import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/AuthContext';
import { colors, radius } from '../../src/theme';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  const handleRegister = async () => {
    if (!name || !email || !password)
      return Alert.alert('Error', 'Please fill in name, email and password');
    setLoading(true);
    try {
      await register(email, password, name, city || 'Faisalabad');
    } catch (e: any) {
      Alert.alert('Registration Failed', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        <Text style={styles.brand}>FitFuse</Text>
        <Text style={styles.sub}>Create your account</Text>

        <TextInput style={styles.input} placeholder="Full Name" placeholderTextColor={colors.inkSoft} value={name} onChangeText={setName} />
        <TextInput style={styles.input} placeholder="Email" placeholderTextColor={colors.inkSoft} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
        <TextInput style={styles.input} placeholder="Password" placeholderTextColor={colors.inkSoft} value={password} onChangeText={setPassword} secureTextEntry />
        <TextInput style={styles.input} placeholder="Your City (e.g. Faisalabad)" placeholderTextColor={colors.inkSoft} value={city} onChangeText={setCity} />

        <Pressable style={styles.btn} onPress={handleRegister} disabled={loading}>
          {loading ? <ActivityIndicator color={colors.white} /> : <Text style={styles.btnText}>Create Account</Text>}
        </Pressable>

        <Pressable onPress={() => router.back()}>
          <Text style={styles.link}>Already have an account? <Text style={styles.linkBold}>Sign In</Text></Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  inner: { paddingHorizontal: 32, paddingTop: 80, gap: 16, paddingBottom: 40 },
  brand: { fontSize: 40, fontWeight: '700', color: colors.ink, marginBottom: 4 },
  sub: { fontSize: 14, color: colors.inkSoft, marginBottom: 24 },
  input: { backgroundColor: colors.surface, borderRadius: radius.md, paddingHorizontal: 16, paddingVertical: 14, fontSize: 14, color: colors.ink },
  btn: { backgroundColor: colors.ink, borderRadius: radius.full, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  btnText: { color: colors.white, fontWeight: '600', fontSize: 15 },
  link: { textAlign: 'center', color: colors.inkSoft, fontSize: 13, marginTop: 8 },
  linkBold: { color: colors.ink, fontWeight: '600' },
});
