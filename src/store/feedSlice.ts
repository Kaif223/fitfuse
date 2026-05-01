import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { feedApi, likesApi } from '../api';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface Post {
  id: string;
  user_id: string;
  image_url: string;
  caption: string;
  created_at: string;
  like_count: number;
  comment_count: number;
  user_name: string;
  avatar_url: string | null;
}

interface FeedState {
  posts: Post[];
  likedIds: string[];
  activeTab: 'For You' | 'Following';
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

// ─── Initial state ────────────────────────────────────────────────────────────
const initialState: FeedState = {
  posts: [],
  likedIds: [],
  activeTab: 'For You',
  status: 'idle',
  error: null,
};

// ─── Async thunks ─────────────────────────────────────────────────────────────

export const fetchPosts = createAsyncThunk(
  'feed/fetchPosts',
  async (
    { userId, tab }: { userId: string; tab: 'For You' | 'Following' },
    { rejectWithValue }
  ) => {
    try {
      const posts =
        tab === 'Following'
          ? await feedApi.getFollowingPosts(userId)
          : await feedApi.getPosts();
      const likedIds = await likesApi.getUserLikes(userId);
      return { posts: posts ?? [], likedIds: likedIds ?? [] };
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  }
);

export const toggleLike = createAsyncThunk(
  'feed/toggleLike',
  async (
    { postId, userId, liked }: { postId: string; userId: string; liked: boolean },
    { rejectWithValue }
  ) => {
    try {
      if (liked) await likesApi.unlike(postId, userId);
      else await likesApi.like(postId, userId);
      return { postId, liked };
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  }
);

// ─── Slice ────────────────────────────────────────────────────────────────────
const feedSlice = createSlice({
  name: 'feed',
  initialState,
  reducers: {
    setActiveTab(state, action) {
      state.activeTab = action.payload;
      state.status = 'idle'; // triggers refetch
    },
    // Prepend a newly created post (realtime / optimistic)
    prependPost(state, action) {
      state.posts.unshift(action.payload);
    },
    // Update like count optimistically
    optimisticLike(state, action) {
      const { postId, liked } = action.payload;
      state.posts = state.posts.map((p) =>
        p.id === postId
          ? { ...p, like_count: p.like_count + (liked ? -1 : 1) }
          : p
      );
      if (liked) {
        state.likedIds = state.likedIds.filter((id) => id !== postId);
      } else {
        state.likedIds = [...state.likedIds, postId];
      }
    },
    // Revert optimistic like on failure
    revertLike(state, action) {
      const { postId, liked } = action.payload;
      state.posts = state.posts.map((p) =>
        p.id === postId
          ? { ...p, like_count: p.like_count + (liked ? 1 : -1) }
          : p
      );
      if (liked) {
        state.likedIds = [...state.likedIds, postId];
      } else {
        state.likedIds = state.likedIds.filter((id) => id !== postId);
      }
    },
    clearFeed(state) {
      state.posts = [];
      state.likedIds = [];
      state.status = 'idle';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPosts.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchPosts.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.posts = action.payload.posts;
        state.likedIds = action.payload.likedIds;
      })
      .addCase(fetchPosts.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      });
  },
});

export const { setActiveTab, prependPost, optimisticLike, revertLike, clearFeed } =
  feedSlice.actions;
export default feedSlice.reducer;
