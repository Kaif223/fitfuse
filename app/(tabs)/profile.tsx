import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet,
  TextInput, Alert, ActivityIndicator, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LogOut, Edit2, Users, Shirt, MapPin, Heart, X, Search, UserPlus, UserMinus, Camera } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../src/AuthContext';
import { profilesApi, wardrobeApi, followsApi } from '../../src/api';
import { uploadImage, getPublicUrl } from '../../src/supabase';
import { colors, radius } from '../../src/theme';

export default function Profile() {
  const { user, profile, logout, refreshProfile } = useAuth();

  const [editing, setEditing]     = useState(false);
  const [name, setName]           = useState(profile?.name ?? '');
  const [city, setCity]           = useState(profile?.city ?? '');
  const [bio, setBio]             = useState(profile?.bio ?? '');
  const [saving, setSaving]       = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);

  const pickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || !user) return;
    setAvatarUploading(true);
    try {
      const path = await uploadImage('avatars', user.id, result.assets[0].uri);
      const url = getPublicUrl('avatars', path);
      await profilesApi.updateProfile(user.id, { avatar_url: url });
      await refreshProfile();
    } catch (e: any) {
      Alert.alert('Upload failed', e.message ?? String(e));
    } finally {
      setAvatarUploading(false);
    }
  };

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
    profilesApi.getUserPosts(user.id)
      .then(d => { setMyPosts(d ?? []); setPostsLoading(false); })
      .catch(() => setPostsLoading(false));
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
      if (already) {
        // Unfollow
        await followsApi.unfollow(user.id, targetId);
        followsApi.getFollowingCount(user.id).then(setFollowingCount);
        setSearchResults(prev => prev.map(u => u.id === targetId ? { ...u, _following: false, _pending: false } : u));
        return;
      }
      const pending = await followsApi.hasPendingRequest(user.id, targetId);
      if (pending) {
        // Cancel request
        await followsApi.cancelRequest(user.id, targetId);
        setSearchResults(prev => prev.map(u => u.id === targetId ? { ...u, _pending: false } : u));
      } else {
        // Send request
        await followsApi.sendRequest(user.id, targetId);
        setSearchResults(prev => prev.map(u => u.id === targetId ? { ...u, _pending: true } : u));
      }
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
          <Pressable onPress={pickAvatar} style={styles.avatarWrapper}>
            {profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.avatarImg} />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
            )}
            <View style={styles.cameraBtn}>
              {avatarUploading
                ? <ActivityIndicator size="small" color={colors.white} />
                : <Camera size={14} color={colors.white} strokeWidth={2} />
              }
            </View>
          </Pressable>
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
                      : u._pending
                        ? <X size={16} color={colors.inkSoft} strokeWidth={1.8} />
                        : <UserPlus size={16} color={colors.ink} strokeWidth={1.8} />
                    }
                  </Pressable>
                </View>
              ))}
            </>
          )}
        </View>

        {/* My Posts */}
        {/* <View style={[styles.section, { padding: 0, overflow: 'hidden' }]}>
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
        </View> */}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 8, paddingBottom: 16 },
  title: { fontSize: 28, fontWeight: '700', color: colors.ink },
  iconBtn: { width: 40, height: 40, borderRadius: radius.full, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  avatarSection: { alignItems: 'center', paddingVertical: 20 },
  avatar: { width: 88, height: 88, borderRadius: 44, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' },
  avatarWrapper: { position: 'relative', marginBottom: 12 },
  avatarImg: { width: 88, height: 88, borderRadius: 44 },
  cameraBtn: { position: 'absolute', bottom: 0, right: 0, width: 26, height: 26, borderRadius: 13, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.bg },
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
  badge: { minWidth: 18, height: 18, borderRadius: 9, backgroundColor: '#EF4444', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5, marginLeft: 6 },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  acceptBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' },
  declineBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.line },
});

