import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, Shirt, ScanLine, Users, UserCircle } from 'lucide-react-native';
import { colors } from '../../src/theme';

export default function TabsLayout() {
  // Android is edge-to-edge, so pad the tab bar above the system navigation bar
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 12);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: '#9A9A9A',
        tabBarStyle: {
          backgroundColor: colors.bg,
          borderTopColor: colors.line,
          height: 60 + bottomPad,
          paddingTop: 8,
          paddingBottom: bottomPad,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '500' },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Today', tabBarIcon: ({ color }) => <Home size={22} color={color} strokeWidth={1.8} /> }} />
      <Tabs.Screen name="closet" options={{ title: 'Closet', tabBarIcon: ({ color }) => <Shirt size={22} color={color} strokeWidth={1.8} /> }} />
      <Tabs.Screen name="scan" options={{ title: 'Scan', tabBarIcon: ({ color }) => <ScanLine size={22} color={color} strokeWidth={1.8} /> }} />
      <Tabs.Screen name="feed" options={{ title: 'Feed', tabBarIcon: ({ color }) => <Users size={22} color={color} strokeWidth={1.8} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ color }) => <UserCircle size={22} color={color} strokeWidth={1.8} /> }} />
    </Tabs>
  );
}
