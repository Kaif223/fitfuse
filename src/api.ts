import { supabase, uploadImage, getPublicUrl } from './supabase';

const OPENWEATHER_KEY = process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY;
const GEMINI_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

// ============================================================
// FEED / POSTS
// ============================================================
export const feedApi = {
  // Fetch all posts with author profile + like count
  async getPosts() {
    const { data, error } = await supabase
      .from('posts_with_details')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) throw error;
    return data;
  },

  // Fetch posts only from users the current user follows
  async getFollowingPosts(userId: string) {
    const { data: follows, error: fErr } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', userId);
    if (fErr) throw fErr;
    const ids = follows.map((f: any) => f.following_id);
    if (ids.length === 0) return [];
    const { data, error } = await supabase
      .from('posts_with_details')
      .select('*')
      .in('user_id', ids)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  // Create a new post (upload image then insert row)
  async createPost(userId: string, imageUri: string, caption: string) {
    const path = await uploadImage('post-images', userId, imageUri);
    const imageUrl = getPublicUrl('post-images', path);
    const { data, error } = await supabase
      .from('posts')
      .insert({ user_id: userId, image_url: imageUrl, caption })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // Delete a post
  async deletePost(postId: string) {
    const { error } = await supabase.from('posts').delete().eq('id', postId);
    if (error) throw error;
  },
};

// ============================================================
// LIKES
// ============================================================
export const likesApi = {
  // Check which posts the user has liked (array of post ids)
  async getUserLikes(userId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('likes')
      .select('post_id')
      .eq('user_id', userId);
    if (error) throw error;
    return data.map((l: any) => l.post_id);
  },

  // Like a post
  async like(postId: string, userId: string) {
    const { error } = await supabase
      .from('likes')
      .insert({ post_id: postId, user_id: userId });
    if (error) throw error;
  },

  // Unlike a post
  async unlike(postId: string, userId: string) {
    const { error } = await supabase
      .from('likes')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', userId);
    if (error) throw error;
  },
};

// ============================================================
// COMMENTS
// ============================================================
export const commentsApi = {
  // Fetch all comments for a post
  async getComments(postId: string) {
    const { data, error } = await supabase
      .from('comments')
      .select('*, profiles(name, avatar_url)')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data;
  },

  // Add a comment
  async addComment(postId: string, userId: string, text: string) {
    const { data, error } = await supabase
      .from('comments')
      .insert({ post_id: postId, user_id: userId, text })
      .select('*, profiles(name, avatar_url)')
      .single();
    if (error) throw error;
    return data;
  },

  // Delete own comment
  async deleteComment(commentId: string) {
    const { error } = await supabase.from('comments').delete().eq('id', commentId);
    if (error) throw error;
  },
};

// ============================================================
// FOLLOWS
// ============================================================
export const followsApi = {
  // Follow a user
  async follow(followerId: string, followingId: string) {
    const { error } = await supabase
      .from('follows')
      .insert({ follower_id: followerId, following_id: followingId });
    if (error) throw error;
  },

  // Unfollow a user
  async unfollow(followerId: string, followingId: string) {
    const { error } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', followerId)
      .eq('following_id', followingId);
    if (error) throw error;
  },

  // Check if user A follows user B
  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const { data } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', followerId)
      .eq('following_id', followingId)
      .single();
    return !!data;
  },

  // Get follower count for a user
  async getFollowerCount(userId: string): Promise<number> {
    const { count } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', userId);
    return count ?? 0;
  },

  // Get following count for a user
  async getFollowingCount(userId: string): Promise<number> {
    const { count } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', userId);
    return count ?? 0;
  },

  // ── Follow Requests ──────────────────────────────────────

  // Send a follow request
  async sendRequest(fromId: string, toId: string) {
    const { error } = await supabase
      .from('follow_requests')
      .insert({ from_id: fromId, to_id: toId, status: 'pending' });
    if (error) throw error;
  },

  // Cancel a sent follow request
  async cancelRequest(fromId: string, toId: string) {
    const { error } = await supabase
      .from('follow_requests')
      .delete()
      .eq('from_id', fromId)
      .eq('to_id', toId);
    if (error) throw error;
  },

  // Accept a follow request — adds to follows table and removes request
  // Accept a follow request — adds to follows table and removes request
  async acceptRequest(fromId: string, toId: string) {
    // Step 1: insert into follows (toId = auth.uid() = following_id)
    const { error: followError } = await supabase
      .from('follows')
      .insert({ follower_id: fromId, following_id: toId });
    if (followError) throw followError;

    // Step 2: delete the follow request
    const { error: deleteError } = await supabase
      .from('follow_requests')
      .delete()
      .eq('from_id', fromId)
      .eq('to_id', toId);
    if (deleteError) throw deleteError;
  },

  // Decline a follow request
  async declineRequest(fromId: string, toId: string) {
    const { error } = await supabase
      .from('follow_requests')
      .delete()
      .eq('from_id', fromId)
      .eq('to_id', toId);
    if (error) throw error;
  },

  // Check if a pending request exists from A → B
  async hasPendingRequest(fromId: string, toId: string): Promise<boolean> {
    const { data } = await supabase
      .from('follow_requests')
      .select('id')
      .eq('from_id', fromId)
      .eq('to_id', toId)
      .single();
    return !!data;
  },

  // Get all pending follow requests sent TO this user (with sender's profile)
  async getPendingRequests(toId: string) {
    // Step 1: get pending request rows
    const { data: requests, error } = await supabase
      .from('follow_requests')
      .select('from_id, created_at')
      .eq('to_id', toId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    if (!requests || requests.length === 0) return [];

    // Step 2: fetch profiles for each sender
    const fromIds = requests.map((r: any) => r.from_id);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, name, bio, avatar_url')
      .in('id', fromIds);

    const profileMap: Record<string, any> = {};
    (profiles ?? []).forEach((p: any) => { profileMap[p.id] = p; });

    return requests.map((r: any) => ({
      ...(profileMap[r.from_id] ?? { id: r.from_id, name: 'Unknown' }),
      requestedAt: r.created_at,
    }));
  },
};

// ============================================================
// WARDROBE
// ============================================================
export const wardrobeApi = {
  // Fetch all wardrobe items for a user
  async getItems(userId: string) {
    const { data, error } = await supabase
      .from('wardrobe_items')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  // Add a new clothing item
  async addItem(userId: string, item: {
    name: string; type: string; style: string;
    color: string; season: string; imageUri: string;
  }) {
    const path = await uploadImage('wardrobe-images', userId, item.imageUri);
    // Use a signed URL (1 week expiry) since wardrobe-images is a private bucket
    const { data: signedData, error: signedError } = await supabase.storage
      .from('wardrobe-images')
      .createSignedUrl(path, 60 * 60 * 24 * 7);
    if (signedError) throw signedError;
    const imageUrl = signedData.signedUrl;
    const { data, error } = await supabase
      .from('wardrobe_items')
      .insert({
        user_id: userId,
        image_url: imageUrl,
        name: item.name,
        type: item.type,
        style: item.style,
        color: item.color,
        season: item.season,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // Delete a wardrobe item
  async deleteItem(itemId: string) {
    const { error } = await supabase.from('wardrobe_items').delete().eq('id', itemId);
    if (error) throw error;
  },
};

// ============================================================
// PROFILES
// ============================================================
export const profilesApi = {
  // Get any user's profile
  async getProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) throw error;
    return data;
  },

  // Get posts by a specific user
  async getUserPosts(userId: string) {
    const { data, error } = await supabase
      .from('posts_with_details')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  // Update profile (name, bio, city)
  async updateProfile(userId: string, updates: Partial<{ name: string; bio: string; city: string; avatar_url: string }>) {
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId);
    if (error) throw error;
  },

  // Search users by name
  async searchUsers(query: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .ilike('name', `%${query}%`)
      .limit(20);
    if (error) throw error;
    return data;
  },
};

// ============================================================
// OUTFIT RECOMMENDATIONS (Weather + Gemini AI + Wardrobe)
// ============================================================
export const recommendApi = {
  // Get current weather for a city
  async getWeather(city: string) {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${OPENWEATHER_KEY}&units=metric`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Weather fetch failed');
    return res.json();
  },

  // Suggest an outfit from the wardrobe based purely on temperature.
  // No AI/Gemini call — works offline, instant, and never fails.
  //
  // Temperature bands:
  //   < 10°C  → very cold  → winter season items preferred
  //   10–15°C → cold       → winter/all season items preferred
  //   15–25°C → mild       → spring/all season items preferred
  //   > 25°C  → hot        → summer/all season items preferred
  suggestOutfit(params: {
    wardrobeItems: any[];
    tempC: number;           // actual degrees Celsius from weather API
    eventType?: string;
  }) {
    const { wardrobeItems, tempC } = params;

    // Decide which seasons are relevant for this temperature
    let preferredSeasons: string[];
    let tempLabel: string;
    if (tempC < 15) {
      preferredSeasons = ['winter'];
      tempLabel = `very cold (${Math.round(tempC)}°C) — heavy winter outfit`;
    } else if (tempC < 25) {
      preferredSeasons = ['autumn'];
      tempLabel = `cool (${Math.round(tempC)}°C) — light layers outfit`;
    } else if (tempC < 30) {
      preferredSeasons = ['spring'];
      tempLabel = `warm (${Math.round(tempC)}°C) — warm weather outfit`;
    } else {
      preferredSeasons = ['summer'];
      tempLabel = `hot (${Math.round(tempC)}°C) — light summer outfit`;
    }

    // Pick best item for a category: only pick items that match the preferred season
    const pick = (type: string) => {
      const ofType = wardrobeItems.filter(i => i.type === type);
      if (ofType.length === 0) return null;
      const preferred = ofType.filter(i => preferredSeasons.includes(i.season ?? 'all'));
      if (preferred.length === 0) return null;  // no season-matching item — skip slot
      const chosen = preferred[Math.floor(Math.random() * preferred.length)];
      return { name: chosen.name, color: chosen.color, image_url: chosen.image_url ?? null };
    };

    const top    = pick('shirt') ?? pick('jacket');
    const bottom = pick('pants') ?? pick('other');
    const shoes  = pick('shoes');

    // If nothing at all found, return null so UI shows "add clothes" prompt
    if (!top && !bottom && !shoes) return null;

    return {
      top,
      bottom,
      shoes,
      reason: `Suggested for ${tempLabel}`,
    };
  },

  // Analyze a scanned outfit photo and match with wardrobe
  async analyzeOutfitPhoto(base64Image: string, wardrobeItems: any[]) {
    const prompt = `You are a fashion AI. Analyze this outfit photo and match it with the user's wardrobe items.

User's wardrobe:
${wardrobeItems.map(i => `- ${i.name} (${i.type}, ${i.color}, ${i.style})`).join('\n')}

Return a JSON object with:
{
  "analysis": "What you see in the photo",
  "matches": [
    { "name": "item name", "type": "type", "color": "color", "reason": "why it matches" }
  ]
}`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              { inline_data: { mime_type: 'image/jpeg', data: base64Image } },
            ],
          }],
        }),
      }
    );
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : { analysis: text, matches: [] };
    } catch {
      return { analysis: text, matches: [] };
    }
  },
};
