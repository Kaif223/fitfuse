import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, Image, Pressable, StyleSheet,
  ActivityIndicator, ScrollView, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ImageIcon, X, Sparkles, UserX, ShoppingBag } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions, CameraView as CameraViewType } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { colors, radius } from '../../src/theme';
import { useAuth } from '../../src/AuthContext';
import { recommendApi } from '../../src/api';
import { useAppDispatch, useAppSelector } from '../../src/store/store';
import { fetchWardrobe } from '../../src/store/wardrobeSlice';

export default function Scan() {
  const { user, profile } = useAuth();
  const dispatch = useAppDispatch();
  const { items: wardrobe, status } = useAppSelector((state) => state.wardrobe);

  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<InstanceType<typeof CameraViewType>>(null);

  const [mode, setMode] = useState<'camera' | 'result'>('camera');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Pre-load wardrobe on mount
  useEffect(() => {
    if (user && (status === 'idle' || status === 'failed')) {
      dispatch(fetchWardrobe(user.id));
    }
  }, [user]);

  const analyzeImage = async (base64: string, uri: string) => {
    if (!user) return;
    setCapturedImage(uri);
    setLoading(true);
    setMode('result');
    try {
      let items = wardrobe;
      if (status === 'idle' || status === 'failed') {
        items = await dispatch(fetchWardrobe(user.id)).unwrap();
      }
      // Run outfit suggestion + 3s minimum loading in parallel
      const [data] = await Promise.all([
        recommendApi.analyzeOutfitPhoto(base64, items, profile?.city),
        new Promise(resolve => setTimeout(resolve, 3000)),
      ]);
      setResult(data);
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Could not analyze image.');
      reset();
    } finally {
      setLoading(false);
    }
  };

  // Capture from live camera
  const takePicture = async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.7 });
      if (photo?.base64) await analyzeImage(photo.base64, photo.uri);
    } catch (e: any) {
      Alert.alert('Error', 'Could not take picture');
    }
  };

  // Pick from gallery
  const pickFromGallery = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      base64: true,
      quality: 0.7,
    });
    if (!res.canceled && res.assets[0].base64) {
      await analyzeImage(res.assets[0].base64, res.assets[0].uri);
    }
  };

  const reset = () => {
    setMode('camera');
    setCapturedImage(null);
    setResult(null);
  };

  // ── Result Screen ──────────────────────────────────────────
  if (mode === 'result') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
        {/* Header */}
        <View style={styles.resultHeader}>
          <Pressable onPress={reset} style={styles.backBtn}>
            <X size={18} color={colors.ink} />
          </Pressable>
          <Text style={styles.resultTitle}>AI Outfit Match</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={{ padding: 24, gap: 20 }}>
          {/* Captured photo */}
          {capturedImage && (
            <Image source={{ uri: capturedImage }} style={styles.previewImg} />
          )}

          {/* Loading */}
          {loading && (
            <View style={styles.loadingBox}>
              <ActivityIndicator color={colors.ink} size="large" />
              <Text style={styles.loadingText}>AI is scanning the outfit...</Text>
              <Text style={[styles.loadingText, { fontSize: 12 }]}>Matching with your closet...</Text>
            </View>
          )}

          {/* No Human Error */}
          {!loading && result && !result.human_detected && (
            <View style={styles.errorBox}>
              <UserX size={40} color="#e74c3c" strokeWidth={1.5} />
              <Text style={styles.errorTitle}>No Person Detected</Text>
              <Text style={styles.errorMsg}>
                Please take a photo of a person wearing clothes. Non-human images are not supported.
              </Text>
              <Pressable style={styles.tryAgainBtn} onPress={reset}>
                <Text style={styles.tryAgainText}>Try Again</Text>
              </Pressable>
            </View>
          )}

          {/* Outfit Suggestion */}
          {!loading && result?.human_detected && (
            <>
              {/* Style detected */}
              <View style={styles.styleCard}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <Sparkles size={14} color={colors.inkSoft} />
                  <Text style={styles.kicker}>DETECTED STYLE</Text>
                </View>
                <Text style={styles.styleSummary}>{result.style_summary}</Text>
                <View style={styles.tagRow}>
                  {result.detected_style && <View style={styles.tag}><Text style={styles.tagText}>{result.detected_style?.toUpperCase()}</Text></View>}
                  {result.detected_occasion && <View style={styles.tag}><Text style={styles.tagText}>{result.detected_occasion?.toUpperCase()}</Text></View>}
                </View>
              </View>

              {/* Suggested combo label */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <ShoppingBag size={14} color={colors.inkSoft} />
                <Text style={styles.kicker}>SUGGESTED FROM YOUR CLOSET</Text>
              </View>

              {/* Shirt */}
              <SlotCard label="SHIRT / TOP" item={result.suggestion?.shirt} />

              {/* Pants */}
              <SlotCard label="PANTS / BOTTOM" item={result.suggestion?.pants} />

              {/* Shoes */}
              <SlotCard label="SHOES" item={result.suggestion?.shoes} />

              <Pressable style={styles.tryAgainBtn} onPress={reset}>
                <Text style={styles.tryAgainText}>Scan Another</Text>
              </Pressable>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Camera Permission Screens ──────────────────────────────
  if (!permission) {
    return <View style={{ flex: 1, backgroundColor: '#000' }} />;
  }

  if (!permission.granted) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <Text style={{ color: colors.white, fontSize: 16, textAlign: 'center', paddingHorizontal: 32 }}>
          Camera access is needed to scan outfits
        </Text>
        <Pressable style={styles.tryAgainBtn} onPress={requestPermission}>
          <Text style={styles.tryAgainText}>Grant Camera Access</Text>
        </Pressable>
      </View>
    );
  }

  // ── Camera Screen ──────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <CameraView ref={cameraRef as any} style={StyleSheet.absoluteFillObject} facing="back" />

      <LinearGradient
        colors={['rgba(0,0,0,0.55)', 'transparent', 'rgba(0,0,0,0.75)']}
        style={StyleSheet.absoluteFillObject}
      />

      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <View style={styles.glassBtn} />
          <View style={styles.glassPill}><Text style={styles.pillText}>AI OUTFIT SCANNER</Text></View>
          <View style={styles.glassBtn} />
        </View>

        {/* Frame + hint */}
        <View style={styles.centerArea}>
          <View style={styles.frame}>
            <View style={[styles.corner, styles.tl]} />
            <View style={[styles.corner, styles.tr]} />
            <View style={[styles.corner, styles.bl]} />
            <View style={[styles.corner, styles.br]} />
          </View>
          <Text style={styles.title}>Point at a Person</Text>
          <Text style={styles.subtitle}>
            AI will detect the outfit style and suggest the best shirt + pant combo from your closet.
          </Text>
        </View>

        {/* Capture row */}
        <View style={styles.captureRow}>
          {/* Gallery */}
          <Pressable style={styles.glassSquare} onPress={pickFromGallery}>
            <ImageIcon size={20} color={colors.white} strokeWidth={1.6} />
          </Pressable>

          {/* Shutter */}
          <Pressable style={styles.shutter} onPress={takePicture}>
            <View style={styles.shutterInner} />
          </Pressable>

          {/* Placeholder */}
          <View style={styles.glassSquare} />
        </View>
      </SafeAreaView>
    </View>
  );
}

// ── Slot Card Component ──────────────────────────────────────
function SlotCard({ label, item }: { label: string; item: any }) {
  const hasItem = item && item.name;
  return (
    <View style={styles.slotCard}>
      <View style={styles.matchBadge}>
        <Text style={styles.matchBadgeText}>{label}</Text>
      </View>
      {hasItem ? (
        <View style={styles.slotContent}>
          {item.image_url ? (
            <Image source={{ uri: item.image_url }} style={styles.slotImage} />
          ) : (
            <View style={styles.slotImagePlaceholder}>
              <ShoppingBag size={24} color={colors.inkSoft} />
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.matchName}>{item.name}</Text>
            {item.color && <Text style={styles.matchDetail}>{item.color}</Text>}
          </View>
        </View>
      ) : (
        <View style={styles.notAvailableRow}>
          <Text style={styles.notAvailableText}>❌  Not available in your closet</Text>
          <Text style={styles.notAvailableHint}>Add this item in the Closet tab</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // Camera screen
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 8 },
  glassBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  glassPill: { backgroundColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 999 },
  pillText: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5, color: colors.white },
  centerArea: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  frame: { width: 220, height: 300 },
  corner: { position: 'absolute', width: 40, height: 40, borderColor: colors.white },
  tl: { top: 0, left: 0, borderTopWidth: 2, borderLeftWidth: 2, borderTopLeftRadius: 20 },
  tr: { top: 0, right: 0, borderTopWidth: 2, borderRightWidth: 2, borderTopRightRadius: 20 },
  bl: { bottom: 0, left: 0, borderBottomWidth: 2, borderLeftWidth: 2, borderBottomLeftRadius: 20 },
  br: { bottom: 0, right: 0, borderBottomWidth: 2, borderRightWidth: 2, borderBottomRightRadius: 20 },
  title: { marginTop: 24, fontSize: 22, color: colors.white, fontWeight: '600', textAlign: 'center' },
  subtitle: { marginTop: 8, fontSize: 12, lineHeight: 18, color: 'rgba(255,255,255,0.7)', textAlign: 'center', maxWidth: 280 },
  captureRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingHorizontal: 40, marginBottom: 36 },
  glassSquare: { width: 48, height: 48, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  shutter: { width: 80, height: 80, borderRadius: 40, borderWidth: 3, borderColor: 'rgba(255,255,255,0.5)', alignItems: 'center', justifyContent: 'center' },
  shutterInner: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.white },

  // Result screen
  resultHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.line },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  resultTitle: { fontSize: 16, fontWeight: '600', color: colors.ink },
  previewImg: { width: '100%', aspectRatio: 3 / 4, borderRadius: radius.lg },
  loadingBox: { padding: 36, backgroundColor: colors.surface, borderRadius: radius.lg, alignItems: 'center', gap: 10 },
  loadingText: { fontSize: 14, color: colors.inkSoft, textAlign: 'center' },

  // Error — no human
  errorBox: { padding: 32, backgroundColor: '#fff5f5', borderRadius: radius.lg, alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#fdc5c5' },
  errorTitle: { fontSize: 18, fontWeight: '700', color: '#e74c3c' },
  errorMsg: { fontSize: 14, color: '#c0392b', textAlign: 'center', lineHeight: 20 },

  // Style card
  styleCard: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: 16, gap: 8 },
  kicker: { fontSize: 10, fontWeight: '700', letterSpacing: 1.8, color: colors.inkSoft },
  styleSummary: { fontSize: 15, color: colors.ink, fontWeight: '500', lineHeight: 22 },
  tagRow: { flexDirection: 'row', gap: 8 },
  tag: { backgroundColor: colors.ink, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999 },
  tagText: { fontSize: 9, fontWeight: '700', letterSpacing: 1.5, color: colors.white },

  // Slot card
  slotCard: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: 16, gap: 12 },
  slotContent: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  slotImage: { width: 72, height: 72, borderRadius: radius.md, backgroundColor: colors.line },
  slotImagePlaceholder: { width: 72, height: 72, borderRadius: radius.md, backgroundColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  matchBadge: { backgroundColor: colors.ink, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999 },
  matchBadgeText: { fontSize: 9, fontWeight: '700', letterSpacing: 1.5, color: colors.white },
  matchName: { fontSize: 15, fontWeight: '600', color: colors.ink },
  matchDetail: { fontSize: 12, color: colors.inkSoft, marginTop: 2 },

  // Not available
  notAvailableRow: { gap: 4 },
  notAvailableText: { fontSize: 14, color: '#e74c3c', fontWeight: '500' },
  notAvailableHint: { fontSize: 12, color: colors.inkSoft },

  // Buttons
  tryAgainBtn: { backgroundColor: colors.ink, borderRadius: radius.md, paddingVertical: 10, paddingHorizontal: 20, alignItems: 'center', marginTop: 4 },
  tryAgainText: { color: colors.white, fontWeight: '600', fontSize: 15 },
});
