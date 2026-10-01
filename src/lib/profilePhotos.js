import { supabase } from './supabase';

const PROFILE_PHOTO_BUCKET = 'profile-photos';
const MAX_PROFILE_PHOTO_SIZE = 15 * 1024 * 1024;
const ALLOWED_PROFILE_PHOTO_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/avif',
]);

export async function uploadProfilePhoto(file, category) {
  if (!file) return null;
  if (!ALLOWED_PROFILE_PHOTO_TYPES.has(file.type)) {
    throw new Error('Use a JPEG, PNG, GIF, WebP, or AVIF profile picture.');
  }
  if (file.size > MAX_PROFILE_PHOTO_SIZE) {
    throw new Error('Profile pictures must be 15 MB or smaller.');
  }

  const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const path = `${category}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage
    .from(PROFILE_PHOTO_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });

  if (error) throw error;

  return path;
}

export async function resolveProfilePhotoUrls(paths) {
  const photoPaths = [...new Set(paths.filter(
    (path) => typeof path === 'string' && path.includes('/') && !path.startsWith('http')
  ))];
  if (photoPaths.length === 0) return {};

  const { data, error } = await supabase.storage
    .from(PROFILE_PHOTO_BUCKET)
    .createSignedUrls(photoPaths, 24 * 60 * 60);
  if (error) throw error;

  const failedPhoto = data.find((photo) => photo.error);
  if (failedPhoto) {
    throw new Error(failedPhoto.error.message || 'Could not create signed profile photo URLs.');
  }

  return Object.fromEntries(
    data.flatMap((photo) => photo.signedUrl ? [[photo.path, photo.signedUrl]] : [])
  );
}
