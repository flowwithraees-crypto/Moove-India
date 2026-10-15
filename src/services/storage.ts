import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage, isFirebaseConfigured } from './firebase';

export async function uploadPhoto(
  file: File,
  folder: 'places' | 'hitchhikingSpots' | 'avatars' = 'places'
): Promise<string> {
  // If Firebase Storage is initialized and configured
  if (isFirebaseConfigured() && storage) {
    try {
      const filename = `${folder}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const storageRef = ref(storage, filename);
      const snapshot = await uploadBytes(storageRef, file, {
        contentType: file.type,
      });
      const downloadUrl = await getDownloadURL(snapshot.ref);
      return downloadUrl;
    } catch (error) {
      console.warn('Firebase Storage upload failed, falling back to local object URL:', error);
    }
  }

  // Graceful local preview fallback
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve(reader.result as string);
    };
    reader.readAsDataURL(file);
  });
}
