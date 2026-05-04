import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, Image, Pressable, StyleSheet,
  ActivityIndicator, Modal, TextInput, Alert, FlatList,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { Heart, MessageCircle, Bookmark, Search, Plus, X, Send, Trash2 } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../src/AuthContext';
import { feedApi, likesApi, commentsApi } from '../../src/api';
import { supabase } from '../../src/supabase';
import { colors, radius } from '../../src/theme';

export default function Feed() {
  const { user } = useAuth();

  const [posts, setPosts] = useState<any[]>([]);
  const [likedIds, setLikedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('For You');
  const [showPost, setShowPost] = useState(false);
  const [caption, setCaption] = useState('');
  const [newImageUri, setNewImageUri] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [activePostId, setActivePostId] = useState<string | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState('');
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [sendingComment, setSendingComment] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const loadPosts = useCallback(async () => {
    try {
      const data =
        activeTab === 'Following' && user
          ? await feedApi.getFollowingPosts(user.id)
          : await feedApi.getPosts();
      setPosts(data ?? []);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  }, [activeTab, user]);

  useEffect(() => { setLoading(true); loadPosts(); }, [loadPosts]);

  useEffect(() => {
    if (!user) return;
    likesApi.getUserLikes(user.id).then(setLikedIds).catch(() => {});
  }, [user]);

  useEffect(() => {
    const ch = supabase.channel('likes-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'likes' }, () => {
        loadPosts();
        if (user) likesApi.getUserLikes(user.id).then(setLikedIds);
      }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, loadPosts]);

  useEffect(() => {
    const ch = supabase.channel('posts-rt')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, () => loadPosts())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [loadPosts]);

  const toggleLike = async (post: any) => {
    if (!user) return;
    const liked = likedIds.includes(post.id);
    setLikedIds(prev => liked ? prev.filter(id => id !== post.id) : [...prev, post.id]);
    setPosts(prev => prev.map(p =>
      p.id === post.id ? { ...p, like_count: (p.like_count ?? 0) + (liked ? -1 : 1) } : p
    ));
    try {
      if (liked) await likesApi.unlike(post.id, user.id);
      else await likesApi.like(post.id, user.id);
    } catch {
      setLikedIds(prev => liked ? [...prev, post.id] : prev.filter(id => id !== post.id));
      setPosts(prev => prev.map(p =>
        p.id === post.id ? { ...p, like_count: (p.like_count ?? 0) + (liked ? 1 : -1) } : p
      ));
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (!result.canceled) setNewImageUri(result.assets[0].uri);
  };

  const submitPost = async () => {
    if (!newImageUri) return Alert.alert('Error', 'Please pick a photo first');
    if (!user) return;
    setPosting(true);
    try {
      await feedApi.createPost(user.id, newImageUri, caption || 'Outfit of the day');
      setShowPost(false); setCaption(''); setNewImageUri(null);
    } catch (e: any) {
      Alert.alert('Error posting', e.message);
    } finally { setPosting(false); }
  };

  const openComments = async (postId: string) => {
    setActivePostId(postId); setShowComments(true); setCommentsLoading(true);
    try {
      const data = await commentsApi.getComments(postId);
      setComments(data ?? []);
    } catch (e: any) { Alert.alert('Error', e.message); }
    finally { setCommentsLoading(false); }
  };

  const sendComment = async () => {
    if (!commentText.trim() || !activePostId || !user) return;
    setSendingComment(true);
    try {
      const nc = await commentsApi.addComment(activePostId, user.id, commentText.trim());
      setComments(prev => [...prev, nc]);
      setCommentText('');
      setPosts(prev => prev.map(p =>
        p.id === activePostId ? { ...p, comment_count: (p.comment_count ?? 0) + 1 } : p
      ));
    } catch (e: any) { Alert.alert('Error', e.message); }
    finally { setSendingComment(false); }
  };

  const deleteComment = async (commentId: string) => {
    try {
      await commentsApi.deleteComment(commentId);
      setComments(prev => prev.filter(c => c.id !== commentId));
      setPosts(prev => prev.map(p =>
        p.id === activePostId ? { ...p, comment_count: Math.max(0, (p.comment_count ?? 1) - 1) } : p
      ));
    } catch (e: any) { Alert.alert('Error', e.message); }
  };

  const getInitials = (name: string) =>
    (name ?? '?').split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.bg }}>

      <View style={styles.header}>
        {showSearch ? (
          /* ── Expanded search bar ── */
          <View style={styles.searchBar}>
            <Search size={15} color={colors.inkSoft} strokeWidth={1.8} />
            <TextInput
              autoFocus
              style={styles.searchInput}
              placeholder="Search posts or people..."
              placeholderTextColor={colors.inkSoft}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <Pressable onPress={() => { setShowSearch(false); setSearchQuery(''); }}>
              <X size={16} color={colors.inkSoft} strokeWidth={2} />
            </Pressable>
          </View>
        ) : (
          /* ── Normal header ── */
          <>
            <Text style={styles.h1}>The <Text style={styles.italic}>Feed</Text></Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Pressable style={styles.iconBtn} onPress={() => setShowSearch(true)}>
                <Search size={16} color={colors.ink} strokeWidth={1.8} />
              </Pressable>
              <Pressable style={styles.iconBtn} onPress={() => setShowPost(true)}>
                <Plus size={16} color={colors.ink} strokeWidth={2} />
              </Pressable>
            </View>
          </>
        )}
      </View>

      {/* Hide tabs while searching */}
      {!showSearch && (
        <View style={styles.tabs}>
          {['For You', 'Following'/* , 'Trending' */].map(tab => (
            <Pressable key={tab} onPress={() => setActiveTab(tab)}>
              <Text style={[styles.tab, activeTab === tab && styles.tabActive]}>{tab}</Text>
            </Pressable>
          ))}
        </View>
      )}

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={colors.ink} />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 24, gap: 28, paddingBottom: 40 }}>
          {(() => {
            const q = searchQuery.toLowerCase().trim();
            const visiblePosts = q
              ? posts.filter(p =>
                  p.caption?.toLowerCase().includes(q) ||
                  p.user_name?.toLowerCase().includes(q)
                )
              : posts;
            if (visiblePosts.length === 0) return (
              <View style={styles.empty}>
                <Text style={styles.emptyText}>{q ? 'No results' : 'No posts yet'}</Text>
                <Text style={styles.emptySubtext}>{q ? `Nothing matched "${searchQuery}"` : 'Be the first to share an outfit'}</Text>
              </View>
            );
            return visiblePosts.map((p) => {
              const liked = likedIds.includes(p.id);
              return (
                <View key={p.id}>
                  <View style={styles.userRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      {p.user_avatar
                        ? <Image source={{ uri: p.user_avatar }} style={styles.avatar} />
                        : <View style={styles.avatarFallback}><Text style={styles.avatarText}>{getInitials(p.user_name)}</Text></View>
                      }
                      <View>
                        <Text style={styles.userName}>{p.user_name}</Text>
                        <Text style={styles.subtle}>{timeAgo(p.created_at)}</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.imgWrap}>
                    <Image source={{ uri: p.image_url }} style={styles.postImg} />
                  </View>

                  <View style={styles.actions}>
                    <View style={{ flexDirection: 'row', gap: 20, alignItems: 'center' }}>
                      <Pressable style={styles.action} onPress={() => toggleLike(p)}>
                        <Heart size={20} color={liked ? '#E53935' : colors.ink} fill={liked ? '#E53935' : 'none'} strokeWidth={1.6} />
                        <Text style={styles.actionText}>{p.like_count ?? 0}</Text>
                      </Pressable>
                      <Pressable style={styles.action} onPress={() => openComments(p.id)}>
                        <MessageCircle size={20} color={colors.ink} strokeWidth={1.6} />
                        <Text style={styles.actionText}>{p.comment_count ?? 0}</Text>
                      </Pressable>
                    </View>
                    {/* <Pressable><Bookmark size={20} color={colors.ink} strokeWidth={1.6} /></Pressable> */}
                  </View>

                  {p.caption ? (
                    <Text style={styles.caption}>
                      <Text style={{ fontWeight: '600' }}>{p.user_name} </Text>{p.caption}
                    </Text>
                  ) : null}
                </View>
              );
            });
          })()}
        </ScrollView>
      )}

      {/* Create Post Modal */}
      <Modal visible={showPost} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Share Outfit</Text>
            <Pressable onPress={() => { setShowPost(false); setNewImageUri(null); setCaption(''); }}>
              <X size={22} color={colors.ink} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }}>
            <Pressable style={styles.imagePicker} onPress={pickImage}>
              {newImageUri
                ? <Image source={{ uri: newImageUri }} style={{ width: '100%', height: '100%', borderRadius: radius.lg }} />
                : <View style={{ alignItems: 'center', gap: 8 }}><Plus size={28} color={colors.inkSoft} strokeWidth={1.5} /><Text style={{ color: colors.inkSoft, fontSize: 14 }}>Tap to pick outfit photo</Text></View>
              }
            </Pressable>
            <TextInput style={styles.input} placeholder="Write a caption..." placeholderTextColor={colors.inkSoft} value={caption} onChangeText={setCaption} multiline />
            <Pressable style={styles.postBtn} onPress={submitPost} disabled={posting}>
              {posting ? <ActivityIndicator color={colors.white} /> : <Text style={styles.postBtnText}>Post to Feed</Text>}
            </Pressable>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Comments Modal */}
      <Modal visible={showComments} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Comments</Text>
            <Pressable onPress={() => { setShowComments(false); setComments([]); setCommentText(''); }}>
              <X size={22} color={colors.ink} />
            </Pressable>
          </View>
          {commentsLoading ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={colors.ink} /></View>
          ) : (
            <FlatList
              data={comments}
              keyExtractor={item => item.id}
              contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 80 }}
              ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptySubtext}>No comments yet. Be the first!</Text></View>}
              renderItem={({ item }) => (
                <View style={styles.commentRow}>
                  <View style={styles.commentAvatar}>
                    <Text style={styles.avatarText}>{getInitials(item.profiles?.name ?? '?')}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.commentName}>{item.profiles?.name}</Text>
                    <Text style={styles.commentBody}>{item.text}</Text>
                  </View>
                  {item.user_id === user?.id && (
                    <Pressable onPress={() => deleteComment(item.id)}>
                      <Trash2 size={14} color={colors.inkSoft} strokeWidth={1.6} />
                    </Pressable>
                  )}
                </View>
              )}
            />
          )}
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={styles.commentInputRow}>
              <TextInput style={{ flex: 1, fontSize: 14, color: colors.ink }} placeholder="Add a comment..." placeholderTextColor={colors.inkSoft} value={commentText} onChangeText={setCommentText} />
              <Pressable onPress={sendComment} disabled={sendingComment}>
                {sendingComment
                  ? <ActivityIndicator size="small" color={colors.ink} />
                  : <Send size={18} color={commentText.trim() ? colors.ink : colors.inkSoft} strokeWidth={1.8} />}
              </Pressable>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 8, paddingBottom: 4 },
  h1: { fontSize: 28, color: colors.ink, fontWeight: '500' },
  italic: { fontStyle: 'italic' },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  tabs: { flexDirection: 'row', gap: 20, paddingHorizontal: 24, paddingBottom: 12 },
  tab: { fontSize: 12, fontWeight: '500', color: colors.inkSoft, paddingBottom: 6 },
  tabActive: { color: colors.ink, borderBottomWidth: 2, borderBottomColor: colors.ink },
  userRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  avatarFallback: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.warm, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 13, fontWeight: '600', color: colors.ink },
  userName: { fontSize: 14, fontWeight: '500', color: colors.ink },
  subtle: { fontSize: 11, color: colors.inkSoft, marginTop: 2 },
  imgWrap: { borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.surface },
  postImg: { width: '100%', aspectRatio: 4 / 5 },
  actions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12 },
  action: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionText: { fontSize: 12, fontWeight: '500', color: colors.ink },
  caption: { fontSize: 13, color: colors.ink, marginTop: 6, lineHeight: 18 },
  empty: { paddingTop: 60, alignItems: 'center', gap: 8 },
  emptyText: { fontSize: 18, fontWeight: '500', color: colors.ink },
  emptySubtext: { fontSize: 13, color: colors.inkSoft },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.line },
  modalTitle: { fontSize: 18, fontWeight: '600', color: colors.ink },
  imagePicker: { width: '100%', aspectRatio: 1, backgroundColor: colors.surface, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  input: { backgroundColor: colors.surface, borderRadius: radius.md, paddingHorizontal: 16, paddingVertical: 14, fontSize: 14, color: colors.ink, minHeight: 80, textAlignVertical: 'top' },
  commentRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  commentAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.warm, alignItems: 'center', justifyContent: 'center' },
  commentName: { fontSize: 13, fontWeight: '600', color: colors.ink },
  commentBody: { fontSize: 13, color: colors.ink, marginTop: 2, lineHeight: 18 },
  commentInputRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 12, borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: colors.bg },
  postBtn: { backgroundColor: colors.ink, borderRadius: radius.full, paddingVertical: 16, alignItems: 'center' },
  postBtnText: { color: colors.white, fontWeight: '600', fontSize: 15 },
  searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.surface, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 10 },
  searchInput: { flex: 1, fontSize: 14, color: colors.ink },
});
