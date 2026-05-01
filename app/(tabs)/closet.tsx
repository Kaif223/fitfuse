import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Image, Pressable, TextInput, StyleSheet, Modal, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { Search, Plus, SlidersHorizontal, X, Trash2, Pencil, MoreVertical } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../src/AuthContext';
import { useAppDispatch, useAppSelector } from '../../src/store/store';
import { fetchWardrobe, addWardrobeItem, deleteWardrobeItem } from '../../src/store/wardrobeSlice';
import { supabase } from '../../src/supabase';
import { colors, radius } from '../../src/theme';

const TYPES   = ['All', 'shirt', 'pants', 'shoes', 'jacket', 'accessory', 'other'];
const STYLES  = ['casual', 'formal', 'sporty', 'traditional'];
const SEASONS = ['all', 'summer', 'winter', 'spring', 'autumn'];

export default function Closet() {
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const { items, status, error } = useAppSelector((state) => state.wardrobe);
  const loading = status === 'loading' || status === 'idle';

  const [filtered, setFiltered] = useState<any[]>([]);
  const [activeType, setActiveType] = useState('All');
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);

  // Action sheet
  const [actionItem, setActionItem] = useState<any | null>(null);

  // Edit modal
  const [showEdit, setShowEdit] = useState(false);
  const [editItem, setEditItem] = useState<any | null>(null);
  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState('shirt');
  const [editStyle, setEditStyle] = useState('casual');
  const [editColor, setEditColor] = useState('');
  const [editSeason, setEditSeason] = useState('all');

  // New item form state
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState('shirt');
  const [newStyle, setNewStyle] = useState('casual');
  const [newColor, setNewColor] = useState('');
  const [newSeason, setNewSeason] = useState('all');
  const [newImageUri, setNewImageUri] = useState<string | null>(null);

  // Fetch wardrobe via Redux (only when idle to avoid duplicate fetches)
  useEffect(() => {
    if (user && status === 'idle') {
      dispatch(fetchWardrobe(user.id));
    }
  }, [user, status, dispatch]);

  // Filter locally
  useEffect(() => {
    let result = items;
    if (activeType !== 'All') result = result.filter(i => i.type === activeType);
    if (search) result = result.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));
    setFiltered(result);
  }, [items, activeType, search]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled) setNewImageUri(result.assets[0].uri);
  };

  const addItem = async () => {
    if (!newName || !newColor) return Alert.alert('Error', 'Please fill in name and color');
    if (!newImageUri) return Alert.alert('Error', 'Please pick a photo');
    if (!user) return;
    setSaving(true);
    try {
      await dispatch(addWardrobeItem({
        userId: user.id,
        item: { name: newName, type: newType, style: newStyle, color: newColor, season: newSeason, imageUri: newImageUri },
      })).unwrap();
      setShowAdd(false);
      resetForm();
    } catch (e: any) {
      Alert.alert('Error adding item', e);
    } finally {
      setSaving(false);
    }
  };

  const deleteItem = (itemId: string) => {
    Alert.alert('Delete Item', 'Remove this item from your closet?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: () => {
          dispatch(deleteWardrobeItem(itemId)).catch((e: any) => Alert.alert('Error', e.message));
        },
      },
    ]);
  };

  const openEdit = (item: any) => {
    setEditItem(item);
    setEditName(item.name ?? '');
    setEditType(item.type ?? 'shirt');
    setEditStyle(item.style ?? 'casual');
    setEditColor(item.color ?? '');
    setEditSeason(item.season ?? 'all');
    setActionItem(null);
    setShowEdit(true);
  };

  const saveEdit = async () => {
    if (!editItem || !editName || !editColor) return Alert.alert('Error', 'Name and color are required');
    setSaving(true);
    try {
      const { error } = await supabase
        .from('wardrobe_items')
        .update({ name: editName, type: editType, style: editStyle, color: editColor, season: editSeason })
        .eq('id', editItem.id);
      if (error) throw error;
      // Refresh Redux store
      if (user) dispatch(fetchWardrobe(user.id));
      setShowEdit(false);
      setEditItem(null);
    } catch (e: any) {
      Alert.alert('Error saving', e.message ?? String(e));
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setNewName(''); setNewColor(''); setNewImageUri(null);
    setNewType('shirt'); setNewStyle('casual'); setNewSeason('all');
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={{ paddingHorizontal: 24, paddingTop: 8 }}>

          {/* Header */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View>
              <Text style={styles.kicker}>YOUR WARDROBE</Text>
              <Text style={styles.h1}>Digital <Text style={styles.italic}>Closet</Text></Text>
            </View>
            <Pressable style={styles.iconBtn}>
              <SlidersHorizontal size={18} color={colors.ink} strokeWidth={1.6} />
            </Pressable>
          </View>

          {/* Search */}
          <View style={styles.searchBox}>
            <Search size={16} color={colors.inkSoft} />
            <TextInput
              placeholder={`Search ${items.length} items`}
              placeholderTextColor={colors.inkSoft}
              style={styles.searchInput}
              value={search}
              onChangeText={setSearch}
            />
          </View>

          {/* Type filter chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 20 }}>
            {TYPES.map(t => (
              <Pressable key={t} style={[styles.chip, activeType === t && styles.chipActive]} onPress={() => setActiveType(t)}>
                <Text style={[styles.chipText, activeType === t && styles.chipTextActive]}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* Grid */}
          {loading ? (
            <View style={styles.empty}><ActivityIndicator color={colors.ink} /></View>
          ) : filtered.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No items yet</Text>
              <Text style={styles.emptySubtext}>Tap + to add your first clothing item</Text>
            </View>
          ) : (
            <View style={styles.grid}>
              {filtered.map(item => (
                <View key={item.id} style={styles.cell}>
                  {item.image_url ? (
                    <Image source={{ uri: item.image_url }} style={styles.cellImg} />
                  ) : (
                    <View style={[styles.cellImg, styles.noImg]}>
                      <Text style={{ fontSize: 32 }}>👕</Text>
                    </View>
                  )}
                  <View style={styles.cellTag}>
                    <Text style={styles.cellTagText}>{item.type?.toUpperCase()}</Text>
                  </View>
                  <Pressable style={styles.menuBtn} onPress={() => setActionItem(item)}>
                    <MoreVertical size={14} color={colors.ink} strokeWidth={2} />
                  </Pressable>
                  <View style={{ padding: 12 }}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.subtle}>{item.color} · {item.style}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* FAB */}
      <Pressable style={styles.fab} onPress={() => setShowAdd(true)}>
        <Plus size={24} color={colors.white} strokeWidth={2} />
      </Pressable>

      {/* Add Item Modal */}
      <Modal visible={showAdd} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Clothing Item</Text>
            <Pressable onPress={() => { setShowAdd(false); resetForm(); }}>
              <X size={22} color={colors.ink} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.modalBody}>

            {/* Image picker */}
            <Pressable style={styles.imagePicker} onPress={pickImage}>
              {newImageUri ? (
                <Image source={{ uri: newImageUri }} style={styles.pickedImage} />
              ) : (
                <View style={{ alignItems: 'center', gap: 8 }}>
                  <Plus size={28} color={colors.inkSoft} strokeWidth={1.5} />
                  <Text style={styles.imagePickerText}>Tap to add photo</Text>
                </View>
              )}
            </Pressable>

            <Text style={styles.label}>Name</Text>
            <TextInput style={styles.input} placeholder="e.g. White cotton shirt" placeholderTextColor={colors.inkSoft} value={newName} onChangeText={setNewName} />

            <Text style={styles.label}>Color</Text>
            <TextInput style={styles.input} placeholder="e.g. White" placeholderTextColor={colors.inkSoft} value={newColor} onChangeText={setNewColor} />

            <Text style={styles.label}>Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
              {['shirt', 'pants', 'shoes', 'jacket', 'accessory', 'other'].map(t => (
                <Pressable key={t} style={[styles.chip, newType === t && styles.chipActive, { marginRight: 8 }]} onPress={() => setNewType(t)}>
                  <Text style={[styles.chipText, newType === t && styles.chipTextActive]}>{t}</Text>
                </Pressable>
              ))}
            </ScrollView>

            <Text style={styles.label}>Style</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
              {STYLES.map(s => (
                <Pressable key={s} style={[styles.chip, newStyle === s && styles.chipActive, { marginRight: 8 }]} onPress={() => setNewStyle(s)}>
                  <Text style={[styles.chipText, newStyle === s && styles.chipTextActive]}>{s}</Text>
                </Pressable>
              ))}
            </ScrollView>

            <Text style={styles.label}>Season</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 24 }}>
              {SEASONS.map(s => (
                <Pressable key={s} style={[styles.chip, newSeason === s && styles.chipActive, { marginRight: 8 }]} onPress={() => setNewSeason(s)}>
                  <Text style={[styles.chipText, newSeason === s && styles.chipTextActive]}>{s}</Text>
                </Pressable>
              ))}
            </ScrollView>

            <Pressable style={styles.addBtn} onPress={addItem} disabled={saving}>
              {saving ? <ActivityIndicator color={colors.white} /> : <Text style={styles.addBtnText}>Add to Closet</Text>}
            </Pressable>
          </ScrollView>
        </SafeAreaView>
      </Modal>
      {/* ── Action Sheet ── */}
      <Modal visible={!!actionItem} transparent animationType="fade" onRequestClose={() => setActionItem(null)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setActionItem(null)}>
          <View style={styles.sheet}>
            {/* Item preview row */}
            <View style={styles.sheetPreview}>
              {actionItem?.image_url ? (
                <Image source={{ uri: actionItem.image_url }} style={styles.sheetThumb} />
              ) : (
                <View style={[styles.sheetThumb, { backgroundColor: colors.warm, alignItems: 'center', justifyContent: 'center' }]}>
                  <Text style={{ fontSize: 22 }}>👕</Text>
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.sheetItemName}>{actionItem?.name}</Text>
                <Text style={styles.sheetItemSub}>{actionItem?.color} · {actionItem?.style}</Text>
              </View>
            </View>

            <View style={styles.sheetDivider} />

            {/* Edit */}
            <TouchableOpacity style={styles.sheetRow} onPress={() => openEdit(actionItem)}>
              <View style={[styles.sheetIcon, { backgroundColor: '#EEF2FF' }]}>
                <Pencil size={16} color="#4F46E5" strokeWidth={2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sheetRowLabel}>Edit item</Text>
                <Text style={styles.sheetRowSub}>Update name, color, style or season</Text>
              </View>
            </TouchableOpacity>

            {/* Delete */}
            <TouchableOpacity
              style={styles.sheetRow}
              onPress={() => {
                setActionItem(null);
                deleteItem(actionItem.id);
              }}
            >
              <View style={[styles.sheetIcon, { backgroundColor: '#FEE2E2' }]}>
                <Trash2 size={16} color="#EF4444" strokeWidth={2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.sheetRowLabel, { color: '#EF4444' }]}>Delete item</Text>
                <Text style={styles.sheetRowSub}>Remove from your closet permanently</Text>
              </View>
            </TouchableOpacity>

            <Pressable style={styles.sheetCancel} onPress={() => setActionItem(null)}>
              <Text style={styles.sheetCancelText}>Cancel</Text>
            </Pressable>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── Edit Modal ── */}
      <Modal visible={showEdit} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Item</Text>
            <Pressable onPress={() => { setShowEdit(false); setEditItem(null); }}>
              <X size={22} color={colors.ink} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.modalBody}>

            {/* Item image preview */}
            {editItem?.image_url ? (
              <View style={styles.editImageWrapper}>
                <Image source={{ uri: editItem.image_url }} style={styles.editImage} resizeMode="cover" />
              </View>
            ) : (
              <View style={[styles.editImageWrapper, { backgroundColor: colors.warm, alignItems: 'center', justifyContent: 'center' }]}>
                <Text style={{ fontSize: 48 }}>👕</Text>
              </View>
            )}

            <Text style={styles.label}>Name</Text>
            <TextInput style={styles.input} placeholderTextColor={colors.inkSoft} value={editName} onChangeText={setEditName} />

            <Text style={styles.label}>Color</Text>
            <TextInput style={styles.input} placeholderTextColor={colors.inkSoft} value={editColor} onChangeText={setEditColor} />

            <Text style={styles.label}>Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
              {['shirt', 'pants', 'shoes', 'jacket', 'accessory', 'other'].map(t => (
                <Pressable key={t} style={[styles.chip, editType === t && styles.chipActive, { marginRight: 8 }]} onPress={() => setEditType(t)}>
                  <Text style={[styles.chipText, editType === t && styles.chipTextActive]}>{t}</Text>
                </Pressable>
              ))}
            </ScrollView>

            <Text style={styles.label}>Style</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
              {STYLES.map(s => (
                <Pressable key={s} style={[styles.chip, editStyle === s && styles.chipActive, { marginRight: 8 }]} onPress={() => setEditStyle(s)}>
                  <Text style={[styles.chipText, editStyle === s && styles.chipTextActive]}>{s}</Text>
                </Pressable>
              ))}
            </ScrollView>

            <Text style={styles.label}>Season</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 24 }}>
              {SEASONS.map(s => (
                <Pressable key={s} style={[styles.chip, editSeason === s && styles.chipActive, { marginRight: 8 }]} onPress={() => setEditSeason(s)}>
                  <Text style={[styles.chipText, editSeason === s && styles.chipTextActive]}>{s}</Text>
                </Pressable>
              ))}
            </ScrollView>

            <Pressable style={styles.addBtn} onPress={saveEdit} disabled={saving}>
              {saving ? <ActivityIndicator color={colors.white} /> : <Text style={styles.addBtnText}>Save Changes</Text>}
            </Pressable>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  kicker: { fontSize: 10, fontWeight: '600', letterSpacing: 1.8, color: colors.inkSoft },
  h1: { fontSize: 32, lineHeight: 36, color: colors.ink, fontWeight: '500' },
  italic: { fontStyle: 'italic' },
  iconBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  searchBox: { marginTop: 20, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.surface, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 12 },
  searchInput: { flex: 1, fontSize: 14, color: colors.ink },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999, backgroundColor: colors.surface, marginRight: 8 },
  chipActive: { backgroundColor: colors.ink },
  chipText: { fontSize: 12, fontWeight: '500', color: colors.inkSoft },
  chipTextActive: { color: colors.white },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 20 },
  cell: { width: '47%', backgroundColor: colors.surface, borderRadius: radius.lg, overflow: 'hidden' },
  cellImg: { width: '100%', aspectRatio: 1 },
  noImg: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.warm },
  cellTag: { position: 'absolute', top: 8, left: 8, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  cellTagText: { fontSize: 9, fontWeight: '700', color: '#fff', letterSpacing: 1 },
  deleteBtn: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(255,255,255,0.85)', width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  menuBtn: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(255,255,255,0.9)', width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  itemName: { fontSize: 13, fontWeight: '600', color: colors.ink },
  subtle: { fontSize: 11, color: colors.inkSoft, marginTop: 2 },
  empty: { paddingTop: 60, alignItems: 'center', gap: 8 },
  emptyText: { fontSize: 18, fontWeight: '500', color: colors.ink },
  emptySubtext: { fontSize: 13, color: colors.inkSoft },
  fab: { position: 'absolute', bottom: 32, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 8 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.line },
  modalTitle: { fontSize: 18, fontWeight: '600', color: colors.ink },
  modalBody: { padding: 24, gap: 4, paddingBottom: 40 },
  imagePicker: { width: '100%', aspectRatio: 1.2, backgroundColor: colors.surface, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: 20 },
  pickedImage: { width: '100%', height: '100%' },
  imagePickerText: { color: colors.inkSoft, fontSize: 14 },
  label: { fontSize: 12, fontWeight: '600', color: colors.inkSoft, letterSpacing: 1, marginBottom: 8, marginTop: 4 },
  input: { backgroundColor: colors.surface, borderRadius: radius.md, paddingHorizontal: 16, paddingVertical: 14, fontSize: 14, color: colors.ink, marginBottom: 16 },
  addBtn: { backgroundColor: colors.ink, borderRadius: radius.full, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  addBtnText: { color: colors.white, fontWeight: '600', fontSize: 15 },
  // Action sheet
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 36 },
  sheetPreview: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
  sheetThumb: { width: 52, height: 52, borderRadius: 12 },
  sheetItemName: { fontSize: 15, fontWeight: '600', color: colors.ink },
  sheetItemSub: { fontSize: 12, color: colors.inkSoft, marginTop: 2 },
  sheetDivider: { height: 1, backgroundColor: colors.line, marginBottom: 8 },
  sheetRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14 },
  sheetIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  sheetRowLabel: { fontSize: 15, fontWeight: '600', color: colors.ink },
  sheetRowSub: { fontSize: 12, color: colors.inkSoft, marginTop: 2 },
  sheetCancel: { marginTop: 8, backgroundColor: colors.surface, borderRadius: radius.full, paddingVertical: 14, alignItems: 'center' },
  sheetCancelText: { fontSize: 15, fontWeight: '600', color: colors.ink },
  editImageWrapper: { width: '100%', height: 220, borderRadius: radius.lg, overflow: 'hidden', marginBottom: 20 },
  editImage: { width: '100%', height: '100%' },
});
