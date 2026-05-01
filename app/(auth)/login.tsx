import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/AuthContext';
import { colors, radius } from '../../src/theme';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) return Alert.alert('Error', 'Please fill in all fields');
    setLoading(true);
    try {
      await login(email, password);
    } catch (e: any) {
      Alert.alert('Login Failed', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        <Text style={styles.brand}>FitFuse</Text>
        <Text style={styles.sub}>Your AI wardrobe assistant</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={colors.inkSoft}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={colors.inkSoft}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <Pressable style={styles.btn} onPress={handleLogin} disabled={loading}>
          {loading ? <ActivityIndicator color={colors.white} /> : <Text style={styles.btnText}>Sign In</Text>}
        </Pressable>

        <Pressable onPress={() => router.push('/(auth)/register')}>
          <Text style={styles.link}>Don't have an account? <Text style={styles.linkBold}>Register</Text></Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  inner: { flex: 1, paddingHorizontal: 32, justifyContent: 'center', gap: 16 },
  brand: { fontSize: 40, fontWeight: '700', color: colors.ink, marginBottom: 4 },
  sub: { fontSize: 14, color: colors.inkSoft, marginBottom: 24 },
  input: { backgroundColor: colors.surface, borderRadius: radius.md, paddingHorizontal: 16, paddingVertical: 14, fontSize: 14, color: colors.ink },
  btn: { backgroundColor: colors.ink, borderRadius: radius.full, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  btnText: { color: colors.white, fontWeight: '600', fontSize: 15 },
  link: { textAlign: 'center', color: colors.inkSoft, fontSize: 13, marginTop: 8 },
  linkBold: { color: colors.ink, fontWeight: '600' },
});
