import pathlib
p = pathlib.Path('/home/kaif/Downloads/fitfuse-complete/fitfuse/app/(tabs)/profile.tsx')
lines = p.read_text().splitlines(keepends=True)
# Find the index of the orphaned first line after new styles close
for i, line in enumerate(lines):
    if i > 250 and '  const [editing, setEditing]' in line:
        p.write_text(''.join(lines[:i]))
        print(f'Truncated at line {i+1}, file now has {i} lines')
        break


# ── closet.tsx ───────────────────────────────────────────────
closet = r"""import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Image, Pressable, TextInput, StyleSheet, Modal, ActivityIndicator, Alert } from 'react-native';
import { Search, Plus, SlidersHorizontal, X, Trash2 } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../src/AuthContext';
import { wardrobeApi } from '../../src/api';
import { colors, radius } from '../../src/theme';

const TYPES   = ['All', 'shirt', 'pants', 'shoes', 'jacket', 'accessory', 'other'];
const STYLES  = ['casual', 'formal', 'sporty', 'traditional'];
const SEASONS = ['all', 'summer', 'winter', 'spring', 'autumn'];

export default function Closet() {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [activeType, setActiveType] = useState('All');
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // New item form state
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState('shirt');
  const [newStyle, setNewStyle] = useState('casual');
  const [newColor, setNewColor] = useState('');
  const [newSeason, setNewSeason] = useState('all');
  const [newImageUri, setNewImageUri] = useState<string | null>(null);

  // Load wardrobe from Supabase
  const loadItems = async () => {
    if (!user) return;
    try {
      const data = await wardrobeApi.getItems(user.id);
      setItems(data ?? []);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadItems(); }, [user]);

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
      const added = await wardrobeApi.addItem(user.id, {
        name: newName,
        type: newType,
        style: newStyle,
        color: newColor,
        season: newSeason,
        imageUri: newImageUri,
      });
      setItems(prev => [added, ...prev]);
      setShowAdd(false);
      resetForm();
    } catch (e: any) {
      Alert.alert('Error adding item', e.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteItem = async (itemId: string) => {
    Alert.alert('Delete Item', 'Remove this item from your closet?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await wardrobeApi.deleteItem(itemId);
            setItems(prev => prev.filter(i => i.id !== itemId));
          } catch (e: any) { Alert.alert('Error', e.message); }
        },
      },
    ]);
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
                  <Pressable style={styles.deleteBtn} onPress={() => deleteItem(item.id)}>
                    <Trash2 size={12} color={colors.inkSoft} strokeWidth={1.8} />
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
});
"""

# ── profile.tsx ──────────────────────────────────────────────
profile = r"""import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet,
  TextInput, Alert, ActivityIndicator, Image, FlatList, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LogOut, Edit2, Users, Shirt, MapPin, Heart, X, Search, UserPlus, UserMinus } from 'lucide-react-native';
import { useAuth } from '../../src/AuthContext';
import { profilesApi, wardrobeApi, followsApi, feedApi } from '../../src/api';
import { colors, radius } from '../../src/theme';

export default function Profile() {
  const { user, profile, logout, refreshProfile } = useAuth();

  const [editing, setEditing]     = useState(false);
  const [name, setName]           = useState(profile?.name ?? '');
  const [city, setCity]           = useState(profile?.city ?? '');
  const [bio, setBio]             = useState(profile?.bio ?? '');
  const [saving, setSaving]       = useState(false);

  const [wardrobeCount, setWardrobeCount]   = useState(0);
  const [followerCount, setFollowerCount]   = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [myPosts, setMyPosts]               = useState<any[]>([]);
  const [postsLoading, setPostsLoading]     = useState(true);

  const [searchQuery, setSearchQuery]     = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching]         = useState(false);
  const [showSearch, setShowSearch]       = useState(false);

  // Load stats on mount
  useEffect(() => {
    if (!user) return;
    wardrobeApi.getItems(user.id).then(d => setWardrobeCount(d?.length ?? 0)).catch(() => {});
    followsApi.getFollowerCount(user.id).then(setFollowerCount).catch(() => {});
    followsApi.getFollowingCount(user.id).then(setFollowingCount).catch(() => {});
    feedApi.getUserPosts ? profilesApi.getUserPosts(user.id).then(d => { setMyPosts(d ?? []); setPostsLoading(false); }).catch(() => setPostsLoading(false)) : setPostsLoading(false);
  }, [user]);

  // Sync form fields when profile loads
  useEffect(() => {
    if (profile) { setName(profile.name); setCity(profile.city); setBio(profile.bio ?? ''); }
  }, [profile]);

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await profilesApi.updateProfile(user.id, { name, city, bio });
      await refreshProfile();
      setEditing(false);
      Alert.alert('Saved', 'Profile updated successfully');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  };

  const searchUsers = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const results = await profilesApi.searchUsers(searchQuery.trim());
      setSearchResults((results ?? []).filter((u: any) => u.id !== user?.id));
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setSearching(false);
    }
  };

  const handleFollow = async (targetId: string) => {
    if (!user) return;
    try {
      const already = await followsApi.isFollowing(user.id, targetId);
      if (already) await followsApi.unfollow(user.id, targetId);
      else await followsApi.follow(user.id, targetId);
      // Refresh following count
      followsApi.getFollowingCount(user.id).then(setFollowingCount);
      // Update search results UI
      setSearchResults(prev => prev.map(u => u.id === targetId ? { ...u, _following: !already } : u));
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const initials = (profile?.name ?? user?.email ?? 'U')
    .split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Pressable onPress={() => setEditing(!editing)} style={styles.iconBtn}>
              <Edit2 size={18} color={colors.ink} strokeWidth={1.8} />
            </Pressable>
            <Pressable onPress={logout} style={styles.iconBtn}>
              <LogOut size={18} color={colors.ink} strokeWidth={1.8} />
            </Pressable>
          </View>
        </View>

        {/* Avatar + Name */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          {editing ? (
            <TextInput style={styles.nameInput} value={name} onChangeText={setName} placeholder="Your name" placeholderTextColor={colors.inkSoft} />
          ) : (
            <Text style={styles.nameText}>{profile?.name ?? user?.email}</Text>
          )}
          <Text style={styles.emailText}>{user?.email}</Text>
          {editing ? (
            <TextInput style={[styles.nameInput, { fontSize: 14, marginTop: 8 }]} value={bio} onChangeText={setBio} placeholder="Bio (optional)" placeholderTextColor={colors.inkSoft} />
          ) : (
            profile?.bio ? <Text style={styles.bioText}>{profile.bio}</Text> : null
          )}
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Shirt size={20} color={colors.ink} strokeWidth={1.8} />
            <Text style={styles.statNum}>{wardrobeCount}</Text>
            <Text style={styles.statLabel}>Items</Text>
          </View>
          <View style={styles.statBox}>
            <Users size={20} color={colors.ink} strokeWidth={1.8} />
            <Text style={styles.statNum}>{followerCount}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
          <View style={styles.statBox}>
            <Heart size={20} color={colors.ink} strokeWidth={1.8} />
            <Text style={styles.statNum}>{followingCount}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </View>
        </View>

        {/* City */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MapPin size={16} color={colors.inkSoft} strokeWidth={1.8} />
            <Text style={styles.sectionTitle}>City</Text>
          </View>
          {editing ? (
            <TextInput style={styles.input} value={city} onChangeText={setCity} placeholder="Your city for weather" placeholderTextColor={colors.inkSoft} />
          ) : (
            <Text style={styles.valueText}>{profile?.city ?? 'Not set'}</Text>
          )}
        </View>

        {/* Save */}
        {editing && (
          <Pressable onPress={saveProfile} style={styles.saveBtn} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
          </Pressable>
        )}

        {/* Find People */}
        <View style={styles.section}>
          <Pressable style={styles.sectionHeader} onPress={() => setShowSearch(v => !v)}>
            <Search size={16} color={colors.inkSoft} strokeWidth={1.8} />
            <Text style={styles.sectionTitle}>Find People to Follow</Text>
          </Pressable>
          {showSearch && (
            <>
              <View style={styles.searchRow}>
                <TextInput
                  style={styles.searchInput}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search by name..."
                  placeholderTextColor={colors.inkSoft}
                  onSubmitEditing={searchUsers}
                />
                <Pressable onPress={searchUsers} style={styles.searchBtn}>
                  {searching ? <ActivityIndicator size="small" color="#fff" /> : <Search size={16} color="#fff" strokeWidth={2} />}
                </Pressable>
              </View>
              {searchResults.map(u => (
                <View key={u.id} style={styles.userRow}>
                  <View style={styles.userAvatar}>
                    <Text style={{ fontWeight: '600' }}>{(u.name ?? '?')[0].toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.userName}>{u.name}</Text>
                    <Text style={styles.userSub}>{u.bio ?? 'No bio'}</Text>
                  </View>
                  <Pressable onPress={() => handleFollow(u.id)} style={styles.followBtn}>
                    {u._following
                      ? <UserMinus size={16} color={colors.ink} strokeWidth={1.8} />
                      : <UserPlus size={16} color={colors.ink} strokeWidth={1.8} />}
                  </Pressable>
                </View>
              ))}
            </>
          )}
        </View>

        {/* My Posts */}
        <View style={[styles.section, { padding: 0, overflow: 'hidden' }]}>
          <View style={[styles.sectionHeader, { padding: 16 }]}>
            <Text style={styles.sectionTitle}>My Posts</Text>
          </View>
          {postsLoading ? (
            <View style={{ padding: 24, alignItems: 'center' }}><ActivityIndicator color={colors.ink} /></View>
          ) : myPosts.length === 0 ? (
            <Text style={{ padding: 16, color: colors.inkSoft, fontSize: 13 }}>No posts yet</Text>
          ) : (
            <View style={styles.postsGrid}>
              {myPosts.map(p => (
                <Image key={p.id} source={{ uri: p.image_url }} style={styles.postThumb} />
              ))}
            </View>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 8, paddingBottom: 16 },
  title: { fontSize: 28, fontWeight: '700', color: colors.ink },
  iconBtn: { width: 40, height: 40, borderRadius: radius.full, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  avatarSection: { alignItems: 'center', paddingVertical: 20 },
  avatar: { width: 88, height: 88, borderRadius: 44, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText: { color: '#fff', fontSize: 28, fontWeight: '700' },
  nameInput: { fontSize: 22, fontWeight: '600', color: colors.ink, borderBottomWidth: 1.5, borderBottomColor: colors.ink, paddingBottom: 4, minWidth: 200, textAlign: 'center' },
  nameText: { fontSize: 22, fontWeight: '700', color: colors.ink },
  emailText: { fontSize: 14, color: colors.inkSoft, marginTop: 4 },
  bioText: { fontSize: 13, color: colors.inkSoft, marginTop: 8, textAlign: 'center', paddingHorizontal: 32 },
  statsRow: { flexDirection: 'row', marginHorizontal: 24, marginBottom: 8, gap: 12 },
  statBox: { flex: 1, backgroundColor: colors.surface, borderRadius: radius.md, padding: 16, alignItems: 'center', gap: 4 },
  statNum: { fontSize: 22, fontWeight: '700', color: colors.ink },
  statLabel: { fontSize: 12, color: colors.inkSoft },
  section: { marginHorizontal: 24, marginTop: 16, backgroundColor: colors.surface, borderRadius: radius.md, padding: 16 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: colors.ink },
  input: { backgroundColor: colors.bg, borderRadius: radius.sm, padding: 12, fontSize: 15, color: colors.ink, borderWidth: 1, borderColor: colors.line },
  valueText: { fontSize: 15, color: colors.ink },
  saveBtn: { marginHorizontal: 24, marginTop: 16, backgroundColor: colors.ink, borderRadius: radius.full, padding: 16, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  searchRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  searchInput: { flex: 1, backgroundColor: colors.bg, borderRadius: radius.sm, padding: 12, fontSize: 15, color: colors.ink, borderWidth: 1, borderColor: colors.line },
  searchBtn: { width: 46, height: 46, borderRadius: radius.sm, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.line },
  userAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  userName: { fontSize: 15, fontWeight: '600', color: colors.ink },
  userSub: { fontSize: 12, color: colors.inkSoft },
  followBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.line },
  postsGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  postThumb: { width: '33.33%', aspectRatio: 1 },
});
"""

base = pathlib.Path('/home/kaif/Downloads/fitfuse-complete/fitfuse/app/(tabs)')
(base / 'closet.tsx').write_text(closet)
(base / 'profile.tsx').write_text(profile)
print("Both files written successfully")
