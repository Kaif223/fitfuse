import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator, Image, Modal } from 'react-native';
import { Bell, Sun, Cloud, CloudRain, MapPin, Sparkles, RefreshCw, Check, X } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius } from '../../src/theme';
import { useAuth } from '../../src/AuthContext';
import { wardrobeApi, recommendApi, followsApi } from '../../src/api';

interface WeatherData {
  temp: number;
  high: number;
  low: number;
  condition: string;
  city: string;
}

interface OutfitData {
  top: { name: string; color: string; image_url?: string | null } | null;
  bottom: { name: string; color: string; image_url?: string | null } | null;
  shoes: { name: string; color: string; image_url?: string | null } | null;
  reason: string;
}

export default function Dashboard() {
  const { user, profile } = useAuth();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [outfit, setOutfit] = useState<OutfitData | null>(null);
  const [loading, setLoading] = useState(false);
  const [wardrobeCount, setWardrobeCount] = useState(0);

  // Follow requests
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [showRequests, setShowRequests] = useState(false);

  const name = profile?.name?.split(' ')[0] ?? 'there';
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }).toUpperCase();

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning,';
    if (h < 17) return 'Good afternoon,';
    return 'Good evening,';
  };

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const city = profile?.city ?? 'London';

      // Fetch wardrobe and weather independently so one failure doesn't block the other
      const wardrobe = await wardrobeApi.getItems(user.id).catch(() => []);
      setWardrobeCount(wardrobe?.length ?? 0);

      // Weather — silently keep old value on failure (rate limit / network)
      let currentTempC = weather?.temp ?? 20; // default to mild if no weather yet
      try {
        const weatherData = await recommendApi.getWeather(city);
        if (weatherData) {
          currentTempC = weatherData.main?.temp ?? 20;
          setWeather({
            temp: currentTempC,
            high: weatherData.main?.temp_max ?? currentTempC,
            low:  weatherData.main?.temp_min ?? currentTempC,
            condition: weatherData.weather?.[0]?.description ?? '',
            city: weatherData.name ?? city,
          });
        }
      } catch {
        // Keep existing weather if refresh fails (rate limit etc.)
      }

      // Temperature-based outfit suggestion — instant, no AI call needed
      if (wardrobe && wardrobe.length > 0) {
        const suggestion = recommendApi.suggestOutfit({
          wardrobeItems: wardrobe,
          tempC: currentTempC,
          eventType: 'casual',
        });
        if (suggestion) setOutfit(suggestion);
      }
    } catch (e: any) {
      console.error('loadData error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) loadData();
  }, [user, profile?.city]);

  useEffect(() => {
    if (!user) return;
    followsApi.getPendingRequests(user.id)
      .then(setPendingRequests)
      .catch(() => {});
  }, [user]);

  const WeatherIcon = () => {
    const c = weather?.condition?.toLowerCase() || '';
    if (c.includes('rain')) return <CloudRain size={22} color={colors.ink} strokeWidth={1.6} />;
    if (c.includes('cloud')) return <Cloud size={22} color={colors.ink} strokeWidth={1.6} />;
    return <Sun size={22} color={colors.ink} strokeWidth={1.6} />;
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.kicker}>{today}</Text>
            <Text style={styles.h1}>{getGreeting()}</Text>
            <Text style={[styles.h1, styles.italic]}>{name}</Text>
          </View>
          <Pressable style={styles.iconBtn} onPress={() => setShowRequests(true)}>
            <Bell size={18} color={colors.ink} strokeWidth={1.6} />
            {pendingRequests.length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{pendingRequests.length}</Text>
              </View>
            )}
          </Pressable>
        </View>

        {/* Follow Requests Modal */}
        <Modal visible={showRequests} animationType="slide" transparent onRequestClose={() => setShowRequests(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalSheet}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Follow Requests</Text>
                <Pressable onPress={() => setShowRequests(false)}>
                  <X size={20} color={colors.ink} strokeWidth={1.6} />
                </Pressable>
              </View>
              {pendingRequests.length === 0 ? (
                <Text style={styles.emptyText}>No pending requests</Text>
              ) : (
                pendingRequests.map((req) => (
                  <View key={req.id} style={styles.requestRow}>
                    {req.avatar_url ? (
                      <Image source={{ uri: req.avatar_url }} style={styles.reqAvatar} />
                    ) : (
                      <View style={[styles.reqAvatar, { backgroundColor: colors.warm, alignItems: 'center', justifyContent: 'center' }]}>
                        <Text style={{ fontSize: 16 }}>👤</Text>
                      </View>
                    )}
                    <Text style={styles.reqName}>{req.name ?? 'Someone'}</Text>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <Pressable style={styles.acceptBtn} onPress={async () => {
                        if (!user) return;
                        await followsApi.acceptRequest(req.id, user.id).catch(() => {});
                        setPendingRequests(prev => prev.filter(r => r.id !== req.id));
                      }}>
                        <Check size={14} color={colors.white} strokeWidth={2} />
                      </Pressable>
                      <Pressable style={styles.declineBtn} onPress={async () => {
                        if (!user) return;
                        await followsApi.declineRequest(req.id, user.id).catch(() => {});
                        setPendingRequests(prev => prev.filter(r => r.id !== req.id));
                      }}>
                        <X size={14} color={colors.ink} strokeWidth={2} />
                      </Pressable>
                    </View>
                  </View>
                ))
              )}
            </View>
          </View>
        </Modal>

        {/* Weather Card */}
        {weather && (
          <View style={styles.weather}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={styles.weatherIcon}><WeatherIcon /></View>
              <View>
                <Text style={styles.temp}>{Math.round(weather.temp)}°</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                  <MapPin size={10} color={colors.inkSoft} />
                  <Text style={styles.subtle}>{weather.city} · {weather.condition}</Text>
                </View>
              </View>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.kickerXs}>HIGH / LOW</Text>
              <Text style={styles.tempSm}>{Math.round(weather.high)}° / {Math.round(weather.low)}°</Text>
            </View>
          </View>
        )}

        {/* AI Outfit Recommendation */}
        <View style={{ paddingHorizontal: 24, marginTop: 28 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Sparkles size={12} color={colors.inkSoft} />
              <Text style={styles.kicker}>AI RECOMMENDATION</Text>
            </View>
            <Pressable onPress={loadData}>
              <RefreshCw size={16} color={colors.inkSoft} strokeWidth={1.6} />
            </Pressable>
          </View>

          {loading ? (
            <View style={styles.loadingCard}>
              <ActivityIndicator color={colors.ink} />
              <Text style={styles.loadingText}>AI is picking your outfit...</Text>
            </View>
          ) : outfit ? (
            <>
              <Text style={[styles.h2, { marginTop: 4 }]}>{outfit.reason}</Text>
              <View style={styles.outfitCard}>
                <OutfitRow label="TOP" item={outfit.top} />
                <View style={styles.divider} />
                <OutfitRow label="BOTTOM" item={outfit.bottom} />
                <View style={styles.divider} />
                <OutfitRow label="SHOES" item={outfit.shoes} />
              </View>
              <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
                <Pressable style={styles.primaryBtn}><Text style={styles.primaryBtnText}>Wear today ✓</Text></Pressable>
                <Pressable style={styles.ghostBtn} onPress={loadData}><Text style={styles.ghostBtnText}>Shuffle</Text></Pressable>
              </View>
            </>
          ) : (
            <View style={styles.loadingCard}>
              <Text style={styles.loadingText}>Add clothes to your closet to get suggestions!</Text>
            </View>
          )}

          {/* Stats */}
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 24 }}>
            {[
              { v: wardrobeCount.toString(), l: 'ITEMS' },
              { v: outfit ? '1' : '0', l: 'TODAY' },
              { v: '🔥', l: 'ACTIVE' },
            ].map((s) => (
              <View key={s.l} style={styles.stat}>
                <Text style={styles.statV}>{s.v}</Text>
                <Text style={styles.kickerXs}>{s.l}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function OutfitRow({ label, item }: { label: string; item: { name: string; color: string; image_url?: string | null } | null }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', padding: 12, gap: 12 }}>
      {/* Item image or placeholder */}
      {item?.image_url ? (
        <Image source={{ uri: item.image_url }} style={outfitRowStyles.thumb} resizeMode="cover" />
      ) : (
        <View style={[outfitRowStyles.thumb, outfitRowStyles.thumbPlaceholder]}>
          <Text style={{ fontSize: 20 }}>
            {label === 'TOP' ? '👕' : label === 'BOTTOM' ? '👖' : '👟'}
          </Text>
        </View>
      )}
      {/* Text info */}
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 10, fontWeight: '600', letterSpacing: 1.5, color: colors.inkSoft }}>{label}</Text>
        <Text style={{ fontSize: 14, fontWeight: '600', color: colors.ink, marginTop: 2 }}>
          {item?.name || 'Not available'}
        </Text>
        {item?.color ? (
          <Text style={{ fontSize: 11, color: colors.inkSoft, marginTop: 1 }}>{item.color}</Text>
        ) : null}
      </View>
    </View>
  );
}

const outfitRowStyles = StyleSheet.create({
  thumb: { width: 56, height: 56, borderRadius: 10, backgroundColor: colors.warm },
  thumbPlaceholder: { alignItems: 'center', justifyContent: 'center' },
});

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 24, paddingTop: 8 },
  kicker: { fontSize: 10, fontWeight: '600', letterSpacing: 1.8, color: colors.inkSoft },
  kickerXs: { fontSize: 10, fontWeight: '500', letterSpacing: 1.5, color: colors.inkSoft },
  h1: { fontSize: 32, lineHeight: 36, color: colors.ink, fontWeight: '500' },
  h2: { fontSize: 18, color: colors.ink, fontWeight: '500' },
  italic: { fontStyle: 'italic' },
  iconBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  weather: { marginHorizontal: 24, marginTop: 24, padding: 16, borderRadius: radius.lg, backgroundColor: colors.warm, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  weatherIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  temp: { fontSize: 24, color: colors.ink, fontWeight: '500' },
  tempSm: { fontSize: 14, color: colors.ink, fontWeight: '500', marginTop: 2 },
  subtle: { fontSize: 11, color: colors.inkSoft },
  loadingCard: { marginTop: 12, padding: 32, borderRadius: radius.lg, backgroundColor: colors.surface, alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 13, color: colors.inkSoft, textAlign: 'center' },
  outfitCard: { marginTop: 12, borderRadius: radius.xl, backgroundColor: colors.surface, overflow: 'hidden' },
  divider: { height: 1, backgroundColor: colors.line, marginHorizontal: 16 },
  primaryBtn: { flex: 1, backgroundColor: colors.ink, borderRadius: radius.full, paddingVertical: 14, alignItems: 'center' },
  primaryBtnText: { color: colors.white, fontWeight: '500', fontSize: 14 },
  ghostBtn: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.full, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center' },
  ghostBtnText: { fontSize: 14, fontWeight: '500', color: colors.ink },
  stat: { flex: 1, backgroundColor: colors.surface, borderRadius: radius.md, paddingHorizontal: 16, paddingVertical: 12 },
  statV: { fontSize: 20, color: colors.ink, fontWeight: '500', marginBottom: 4 },
  badge: { position: 'absolute', top: 6, right: 6, width: 16, height: 16, borderRadius: 8, backgroundColor: '#EF4444', alignItems: 'center', justifyContent: 'center' },
  badgeText: { fontSize: 9, color: '#fff', fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: colors.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, minHeight: 200 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '600', color: colors.ink },
  emptyText: { fontSize: 14, color: colors.inkSoft, textAlign: 'center', marginTop: 16 },
  requestRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.line },
  reqAvatar: { width: 40, height: 40, borderRadius: 20 },
  reqName: { flex: 1, fontSize: 14, fontWeight: '500', color: colors.ink },
  acceptBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' },
  declineBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.line },
});
