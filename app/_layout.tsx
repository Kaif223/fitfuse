import 'react-native-url-polyfill/auto';
import { Stack, useRouter, useSegments } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { Provider, useDispatch } from 'react-redux';
import { AuthProvider, useAuth } from '../src/AuthContext';
import { store } from '../src/store/store';
import { clearWardrobe } from '../src/store/wardrobeSlice';

function RootLayoutNav() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const dispatch = useDispatch();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    if (loading) return;

    const prevUserId = prevUserIdRef.current;
    const currentUserId = user?.id ?? null;

    // User changed (logout or switched account) → clear stale wardrobe from Redux
    if (prevUserId !== undefined && prevUserId !== currentUserId) {
      dispatch(clearWardrobe());
    }
    prevUserIdRef.current = currentUserId;

    const inAuthGroup = segments[0] === '(auth)';
    if (!user && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (user && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [user, loading]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(auth)" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <StatusBar style="auto" />
        <AuthProvider>
          <RootLayoutNav />
        </AuthProvider>
      </SafeAreaProvider>
    </Provider>
  );
}
