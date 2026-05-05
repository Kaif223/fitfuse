import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { File, Paths } from 'expo-file-system';

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

  // expo-file-system v19 new API: create a File reference from the URI.
  // On Android the gallery may return a content:// URI — copy it to the
  // app cache first so we always have a readable file:// reference.
  let fileRef = new File(uri);
  if (!uri.startsWith('file://')) {
    const dest = new File(Paths.cache, `upload_${Date.now()}.jpg`);
    fileRef.copy(dest);
    fileRef = dest;
  }

  // Read the file as a Uint8Array (no base64 / atob needed)
  const bytes = await fileRef.bytes();

  const { error } = await supabase.storage
    .from(bucket)
    .upload(filename, bytes, { contentType: 'image/jpeg', upsert: false });

  if (error) throw error;
  return filename;
}
