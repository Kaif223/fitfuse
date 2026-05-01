import { Tabs } from 'expo-router';
import { Home, Shirt, ScanLine, Users, UserCircle } from 'lucide-react-native';
import { colors } from '../../src/theme';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: '#9A9A9A',
        tabBarStyle: {
          backgroundColor: colors.bg,
          borderTopColor: colors.line,
          height: 84,
          paddingTop: 8,
          paddingBottom: 24,
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
