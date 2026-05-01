import { configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
import wardrobeReducer from './wardrobeSlice';
import feedReducer from './feedSlice';

// ─── Store ────────────────────────────────────────────────────────────────────
export const store = configureStore({
  reducer: {
    wardrobe: wardrobeReducer,
    feed: feedReducer,
  },
});

// ─── Types ────────────────────────────────────────────────────────────────────
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// ─── Typed hooks (use these everywhere instead of plain useDispatch/useSelector)
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
