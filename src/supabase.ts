import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import * as FileSystem from 'expo-file-system';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// Custom storage adapter using expo-secure-store
// This keeps the user session alive between app restarts
const ExpoSecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// ─────────────────────────────────────────────
// Helper: get a public URL for a storage file
// ─────────────────────────────────────────────
export function getPublicUrl(bucket: string, path: string): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

// ─────────────────────────────────────────────
// Helper: upload a file from a local URI
// Returns the storage path (e.g. "userId/filename.jpg")
// ─────────────────────────────────────────────
export async function uploadImage(
  bucket: string,
  userId: string,
  uri: string,
): Promise<string> {
  const filename = `${userId}/${Date.now()}.jpg`;

  // Read the file as base64 — works reliably on React Native for local URIs
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  // Decode base64 → Uint8Array (what Supabase Storage expects)
  const byteCharacters = atob(base64);
  const byteArray = new Uint8Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteArray[i] = byteCharacters.charCodeAt(i);
  }

  const { error } = await supabase.storage
    .from(bucket)
    .upload(filename, byteArray, { contentType: 'image/jpeg', upsert: false });

  if (error) throw error;
  return filename;
}
