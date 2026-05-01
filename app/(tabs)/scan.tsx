import React, { useState } from 'react';
import { View, Text, Image, Pressable, StyleSheet, ActivityIndicator, ScrollView, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ImageIcon, Zap, RotateCw, X, Sparkles } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { colors, radius } from '../../src/theme';
import { useAuth } from '../../src/AuthContext';
import { recommendApi } from '../../src/api';
import { useAppDispatch, useAppSelector } from '../../src/store/store';
import { fetchWardrobe } from '../../src/store/wardrobeSlice';

export default function Scan() {
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const { items: wardrobe, status } = useAppSelector((state) => state.wardrobe);

  const [mode, setMode] = useState<'camera' | 'result'>('camera');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const pickFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      base64: true,
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0].base64) {
      await analyzeImage(result.assets[0].base64, result.assets[0].uri);
    }
  };

  const analyzeImage = async (base64: string, uri: string) => {
    if (!user) return;
    setCapturedImage(uri);
    setLoading(true);
    setMode('result');
    try {
      // Use cached wardrobe from Redux; fetch only if not yet loaded
      let items = wardrobe;
      if (status === 'idle' || status === 'failed') {
        const result = await dispatch(fetchWardrobe(user.id)).unwrap();
        items = result;
      }
      const data = await recommendApi.analyzeOutfitPhoto(base64, items);
      setSuggestion(data);
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Could not analyze image.');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setMode('camera');
    setCapturedImage(null);
    setSuggestion(null);
  };

  if (mode === 'result') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
        <View style={styles.resultHeader}>
          <Pressable onPress={reset} style={styles.backBtn}>
            <X size={18} color={colors.ink} />
          </Pressable>
          <Text style={styles.resultTitle}>AI Analysis</Text>
          <View style={{ width: 40 }} />
        </View>
        <ScrollView contentContainerStyle={{ padding: 24, gap: 20 }}>
          {capturedImage && (
            <Image source={{ uri: capturedImage }} style={styles.previewImg} />
          )}

          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color={colors.ink} size="large" />
              <Text style={styles.loadingText}>AI is analyzing the outfit...</Text>
            </View>
          ) : suggestion ? (
            <>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Sparkles size={14} color={colors.inkSoft} />
                <Text style={styles.kicker}>SUGGESTED FROM YOUR CLOSET</Text>
              </View>
              <Text style={styles.suggestionReason}>{suggestion.analysis}</Text>

              {suggestion.matches?.map((match: any, i: number) => (
                <View key={i} style={styles.matchCard}>
                  <View style={styles.matchBadge}><Text style={styles.matchBadgeText}>{match.type?.toUpperCase()}</Text></View>
                  <Text style={styles.matchName}>{match.name}</Text>
                  <Text style={styles.matchDetail}>{match.color} · {match.category}</Text>
                  <Text style={styles.matchReason}>{match.reason}</Text>
                </View>
              ))}

              {(!suggestion.matches || suggestion.matches.length === 0) && (
                <View style={styles.loadingBox}>
                  <Text style={styles.loadingText}>Add more items to your closet for better matches!</Text>
                </View>
              )}

              <Pressable style={styles.tryAgainBtn} onPress={reset}>
                <Text style={styles.tryAgainText}>Scan Another</Text>
              </Pressable>
            </>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <LinearGradient
        colors={['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.2)', 'rgba(0,0,0,0.85)']}
        style={StyleSheet.absoluteFillObject}
      />

      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <View style={styles.topBar}>
          <View style={styles.glassBtn} />
          <View style={styles.glassPill}><Text style={styles.pillText}>AI SCANNER</Text></View>
          <Pressable style={styles.glassBtn}><Zap size={18} color={colors.white} strokeWidth={1.8} /></Pressable>
        </View>

        <View style={styles.center}>
          <View style={styles.frame}>
            <View style={[styles.corner, styles.tl]} />
            <View style={[styles.corner, styles.tr]} />
            <View style={[styles.corner, styles.bl]} />
            <View style={[styles.corner, styles.br]} />
            <View style={styles.scanLine} />
          </View>
          <Text style={styles.title}>Scan Inspiration</Text>
          <Text style={styles.subtitle}>
            Point at any outfit or pick from gallery. AI will match it from your closet.
          </Text>
        </View>

        <View style={styles.modes}>
          <Text style={[styles.modeText, styles.modeActive]}>OUTFIT</Text>
          <Text style={styles.modeText}>ITEM</Text>
          <Text style={styles.modeText}>COLOR</Text>
        </View>

        <View style={styles.captureRow}>
          <Pressable style={styles.glassSquare} onPress={pickFromGallery}>
            <ImageIcon size={20} color={colors.white} strokeWidth={1.6} />
          </Pressable>
          <Pressable style={styles.shutter} onPress={pickFromGallery}>
            <View style={styles.shutterInner} />
          </Pressable>
          <Pressable style={styles.glassSquare} onPress={pickFromGallery}>
            <RotateCw size={20} color={colors.white} strokeWidth={1.6} />
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 8 },
  glassBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  glassPill: { backgroundColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 999 },
  pillText: { fontSize: 11, fontWeight: '700', letterSpacing: 2, color: colors.white },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  frame: { width: 240, aspectRatio: 3 / 4 },
  corner: { position: 'absolute', width: 44, height: 44, borderColor: colors.white },
  tl: { top: 0, left: 0, borderTopWidth: 2, borderLeftWidth: 2, borderTopLeftRadius: 28 },
  tr: { top: 0, right: 0, borderTopWidth: 2, borderRightWidth: 2, borderTopRightRadius: 28 },
  bl: { bottom: 0, left: 0, borderBottomWidth: 2, borderLeftWidth: 2, borderBottomLeftRadius: 28 },
  br: { bottom: 0, right: 0, borderBottomWidth: 2, borderRightWidth: 2, borderBottomRightRadius: 28 },
  scanLine: { position: 'absolute', left: 24, right: 24, top: '50%', height: 1, backgroundColor: 'rgba(255,255,255,0.7)' },
  title: { marginTop: 32, fontSize: 26, color: colors.white, fontWeight: '500' },
  subtitle: { marginTop: 8, fontSize: 12, lineHeight: 18, color: 'rgba(255,255,255,0.7)', textAlign: 'center', maxWidth: 260 },
  modes: { flexDirection: 'row', justifyContent: 'center', gap: 24, marginBottom: 20 },
  modeText: { fontSize: 11, fontWeight: '500', letterSpacing: 2, color: 'rgba(255,255,255,0.6)' },
  modeActive: { color: colors.white },
  captureRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingHorizontal: 40, marginBottom: 32 },
  glassSquare: { width: 48, height: 48, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  shutter: { width: 80, height: 80, borderRadius: 40, borderWidth: 3, borderColor: 'rgba(255,255,255,0.4)', alignItems: 'center', justifyContent: 'center' },
  shutterInner: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.white },
  resultHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.line },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  resultTitle: { fontSize: 16, fontWeight: '600', color: colors.ink },
  previewImg: { width: '100%', aspectRatio: 3 / 4, borderRadius: radius.lg },
  loadingBox: { padding: 32, backgroundColor: colors.surface, borderRadius: radius.lg, alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 14, color: colors.inkSoft, textAlign: 'center' },
  kicker: { fontSize: 10, fontWeight: '600', letterSpacing: 1.8, color: colors.inkSoft },
  suggestionReason: { fontSize: 16, color: colors.ink, fontWeight: '500', lineHeight: 24 },
  matchCard: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: 16, gap: 4 },
  matchBadge: { backgroundColor: colors.ink, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999, marginBottom: 4 },
  matchBadgeText: { fontSize: 9, fontWeight: '700', letterSpacing: 1.5, color: colors.white },
  matchName: { fontSize: 16, fontWeight: '500', color: colors.ink },
  matchDetail: { fontSize: 12, color: colors.inkSoft },
  matchReason: { fontSize: 13, color: colors.inkSoft, marginTop: 4, lineHeight: 18 },
  tryAgainBtn: { backgroundColor: colors.ink, borderRadius: radius.full, paddingVertical: 16, alignItems: 'center' },
  tryAgainText: { color: colors.white, fontWeight: '600', fontSize: 15 },
});
