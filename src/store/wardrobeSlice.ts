import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { wardrobeApi } from '../api';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface WardrobeItem {
  id: string;
  user_id: string;
  name: string;
  type: string;
  style: string;
  color: string;
  season: string;
  image_url: string | null;
  worn_count: number;
  created_at: string;
}

interface WardrobeState {
  items: WardrobeItem[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

// ─── Initial state ────────────────────────────────────────────────────────────
const initialState: WardrobeState = {
  items: [],
  status: 'idle',
  error: null,
};

// ─── Async thunks ─────────────────────────────────────────────────────────────

// Fetch all wardrobe items for a user
export const fetchWardrobe = createAsyncThunk(
  'wardrobe/fetchAll',
  async (userId: string, { rejectWithValue }) => {
    try {
      const data = await wardrobeApi.getItems(userId);
      return data ?? [];
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  }
);

// Add a new item to the wardrobe
export const addWardrobeItem = createAsyncThunk(
  'wardrobe/addItem',
  async (
    { userId, item }: { userId: string; item: any },
    { rejectWithValue }
  ) => {
    try {
      const data = await wardrobeApi.addItem(userId, item);
      return data;
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  }
);

// Delete an item from the wardrobe
export const deleteWardrobeItem = createAsyncThunk(
  'wardrobe/deleteItem',
  async (itemId: string, { rejectWithValue }) => {
    try {
      await wardrobeApi.deleteItem(itemId);
      return itemId;
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  }
);

// ─── Slice ────────────────────────────────────────────────────────────────────
const wardrobeSlice = createSlice({
  name: 'wardrobe',
  initialState,
  reducers: {
    // Reset wardrobe state (e.g. on logout)
    clearWardrobe(state) {
      state.items = [];
      state.status = 'idle';
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // fetchWardrobe
    builder
      .addCase(fetchWardrobe.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchWardrobe.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchWardrobe.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      });

    // addWardrobeItem
    builder
      .addCase(addWardrobeItem.fulfilled, (state, action) => {
        if (action.payload) {
          state.items.unshift(action.payload);
        }
      })
      .addCase(addWardrobeItem.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    // deleteWardrobeItem
    builder
      .addCase(deleteWardrobeItem.fulfilled, (state, action) => {
        state.items = state.items.filter((item) => item.id !== action.payload);
      })
      .addCase(deleteWardrobeItem.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const { clearWardrobe } = wardrobeSlice.actions;
export default wardrobeSlice.reducer;
