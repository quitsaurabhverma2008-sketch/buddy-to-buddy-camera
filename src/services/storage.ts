import { PhotoRecord, AppSettings } from '../types';
import { db } from './firebase';
import { optimizeImageDataUrl } from '../utils/imageOptimizer';
import { 
  idbSavePhoto, 
  idbSaveAllPhotos, 
  idbGetAllPhotos, 
  idbDeletePhoto, 
  idbClearAllPhotos 
} from '../utils/indexedDbHelper';
import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  writeBatch 
} from 'firebase/firestore';

const SETTINGS_KEY = 'buddy_app_settings';
const PHOTOS_COLLECTION = 'photos';
const SETTINGS_COLLECTION = 'settings';

export const INITIAL_DEMO_PHOTOS: PhotoRecord[] = [
  {
    id: 'demo-1',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBsBz7UgjhHk9qruKn4dqHavEcgY0sfnlJ84qpcmtypJvBwGMRNw43qz0XBspucDe5ZxaeCM5o6i8B-rV3HacmX7VBxyYAIzrqufMu4D-AYRQ2vx8Nbo0idW15KsC6Y5BswsDzuD4AMqFYwliZB0ucAL2iqrcLyAMWq-_QE6HR62dB5chZe64fHkDMHwVmGHI7qQvDIbcTfBQwBFjLWoZmayzEu0eKFyeBnZSZoBRGX6dbevAnlPCT2',
    title: 'Golden Hour Laughs',
    caption: 'Soft sunlight, warm laughter in the park with our golden companion.',
    timestamp: Date.now() - 1000 * 60 * 60 * 24 * 5,
    dateFormatted: 'Aug 14 • with Sarah',
    favorite: true,
    tag: 'Summer Picnic',
    filter: 'warm',
    location: 'Meadow Park'
  },
  {
    id: 'demo-2',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAe4xINlE_ZqcwzJFEagoKxiJAvVe0j3N1ncyIfEItNYRnQ8KdZgEYG3wYi6cuJFyN_XzKn7exm7O6XLBV4adPdnhkWlrISWNp3ktazyPiqC6xLWY_JVzeh2XAbyTSyXqBmePQTygKKI34C12nURjJR3VBcvPKZZUaT8psc_7gcZpF7bo08KG8OkiQB-eHOXuT1OeUATRFt162bzXyxqnA2BdaQ4OjaWTZQgOSB3MBOumMoZgjCxvvy',
    title: 'Sleepy Buddy',
    caption: 'Coziest afternoon snooze on the chunky knit blanket.',
    timestamp: Date.now() - 1000 * 60 * 60 * 24 * 1,
    dateFormatted: 'Yesterday',
    favorite: true,
    tag: 'Cute Moment',
    filter: 'pastel',
    location: 'Cozy Nook'
  }
];

export const DEFAULT_SETTINGS: AppSettings = {
  storageType: 'indexeddb',
  flashMode: 'auto',
  soundEffects: true,
  timerSeconds: 0,
  cameraFacing: 'user',
  aspectRatio: '4:3',
  gridOverlay: true,
  filterPreset: 'normal',
  quality: 'high',
  autoSaveToDevice: false
};

class StorageService {
  private isCloudConnected: boolean = true;
  private pollIntervalId: any = null;
  private broadcastChannel: BroadcastChannel | null = null;

  constructor() {
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        this.broadcastChannel = new BroadcastChannel('cherish_memory_sync');
      }
    } catch {}
  }

  // Real-time live listener with automatic Firestore onSnapshot + multi-device instant sync
  subscribeToPhotos(callback: (photos: PhotoRecord[]) => void): () => void {
    let lastPhotosJson = '';

    const syncWithFirestore = async () => {
      try {
        const q = query(collection(db, PHOTOS_COLLECTION), orderBy('timestamp', 'desc'));
        const snap = await getDocs(q);
        const fetched: PhotoRecord[] = [];
        snap.forEach((docSnap) => {
          fetched.push(docSnap.data() as PhotoRecord);
        });

        const currentJson = JSON.stringify(fetched.map(p => ({ id: p.id, t: p.timestamp })));
        if (currentJson !== lastPhotosJson) {
          lastPhotosJson = currentJson;
          await idbClearAllPhotos();
          if (fetched.length > 0) {
            await idbSaveAllPhotos(fetched);
          }
          this.saveLocalFallbackList(fetched);
          callback(fetched);
        }
      } catch (err) {
        // Fallback to local DB if offline
        const local = await idbGetAllPhotos();
        const localJson = JSON.stringify(local.map(p => ({ id: p.id, t: p.timestamp })));
        if (localJson !== lastPhotosJson && local.length > 0) {
          lastPhotosJson = localJson;
          callback(local);
        }
      }
    };

    // 1. Primary: Real-time Firestore onSnapshot listener
    let unsubscribeFirestore = () => {};
    try {
      const q = query(collection(db, PHOTOS_COLLECTION), orderBy('timestamp', 'desc'));
      unsubscribeFirestore = onSnapshot(q, async (snapshot) => {
        const firestorePhotos: PhotoRecord[] = [];
        snapshot.forEach((docSnap) => {
          firestorePhotos.push(docSnap.data() as PhotoRecord);
        });

        lastPhotosJson = JSON.stringify(firestorePhotos.map(p => ({ id: p.id, t: p.timestamp })));
        await idbClearAllPhotos();
        if (firestorePhotos.length > 0) {
          await idbSaveAllPhotos(firestorePhotos);
        }
        this.saveLocalFallbackList(firestorePhotos);
        this.isCloudConnected = true;
        callback(firestorePhotos);
      }, (err) => {
        console.warn('Firestore onSnapshot listener notice:', err);
      });
    } catch (e) {
      console.warn('Firestore init snapshot error:', e);
    }

    // 2. Periodic sync (every 3 seconds for instant multi-phone synchronization fallback)
    this.pollIntervalId = setInterval(syncWithFirestore, 3000);

    // 3. Sync immediately when user switches tabs or unlocks phone
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        syncWithFirestore();
      }
    };
    window.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('focus', syncWithFirestore);

    // 4. Cross-tab sync
    if (this.broadcastChannel) {
      this.broadcastChannel.onmessage = (event) => {
        if (event.data === 'sync_photos') {
          syncWithFirestore();
        }
      };
    }

    return () => {
      unsubscribeFirestore();
      if (this.pollIntervalId) clearInterval(this.pollIntervalId);
      window.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('focus', syncWithFirestore);
    };
  }

  // Load all photos with Instant Cache + Cloud Sync
  async getAllPhotos(): Promise<PhotoRecord[]> {
    try {
      const q = query(collection(db, PHOTOS_COLLECTION), orderBy('timestamp', 'desc'));
      const snap = await getDocs(q);
      const firestorePhotos: PhotoRecord[] = [];
      snap.forEach((docSnap) => {
        firestorePhotos.push(docSnap.data() as PhotoRecord);
      });

      await idbClearAllPhotos();
      if (firestorePhotos.length > 0) {
        await idbSaveAllPhotos(firestorePhotos);
      }
      this.saveLocalFallbackList(firestorePhotos);
      return firestorePhotos;
    } catch (err) {
      console.warn('getAllPhotos Firestore read notice:', err);
    }

    const localPhotos = await idbGetAllPhotos();
    if (localPhotos.length > 0) return localPhotos;
    return this.getLocalFallbackPhotos();
  }

  // Save or update photo across all devices & Cloud Firestore
  async savePhoto(photo: PhotoRecord): Promise<void> {
    let finalPhoto = { ...photo };

    // Optimize data URL image to guarantee it is lightweight & HD
    if (finalPhoto.imageUrl && finalPhoto.imageUrl.startsWith('data:image')) {
      try {
        finalPhoto.imageUrl = await optimizeImageDataUrl(finalPhoto.imageUrl, 800, 0.75);
      } catch (err) {
        console.warn('Image optimization step warning:', err);
      }
    }

    // 1. Immediately save to browser IndexedDB (Zero latency)
    await idbSavePhoto(finalPhoto);

    // 2. Save to LocalStorage backup
    await this.saveLocalFallbackPhoto(finalPhoto);

    // 3. Save to Cloud Firestore as primary database
    try {
      const photoRef = doc(db, PHOTOS_COLLECTION, finalPhoto.id);
      await setDoc(photoRef, finalPhoto, { merge: true });
      this.isCloudConnected = true;
    } catch (err) {
      console.warn('Firestore setDoc notice:', err);
    }

    // 4. Also post to /api/photos endpoint for complete server sync
    try {
      fetch('/api/photos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photo: finalPhoto })
      }).catch(() => {});
    } catch {}

    // 5. Broadcast to other tabs
    try {
      this.broadcastChannel?.postMessage('sync_photos');
    } catch {}
  }

  // Delete single photo from IndexedDB, Cloud API, and Cloud Firestore across ALL devices
  async deletePhoto(id: string): Promise<void> {
    // 1. Delete from local IndexedDB immediately
    await idbDeletePhoto(id);
    await this.deleteLocalFallbackPhoto(id);

    // 2. Delete from Firestore
    try {
      const photoRef = doc(db, PHOTOS_COLLECTION, id);
      await deleteDoc(photoRef);
      this.isCloudConnected = true;
    } catch (err) {
      console.warn('Firestore deleteDoc notice:', err);
    }

    // 3. Delete from /api/photos endpoint
    try {
      fetch(`/api/photos?id=${encodeURIComponent(id)}`, { method: 'DELETE' }).catch(() => {});
    } catch {}

    // 4. Broadcast to local tabs
    try {
      this.broadcastChannel?.postMessage('sync_photos');
    } catch {}
  }

  // Delete all photos from IndexedDB, Cloud API, and Cloud Firestore across ALL devices
  async deleteAllPhotos(): Promise<void> {
    await idbClearAllPhotos();
    await this.clearLocalFallbackPhotos();

    // 1. Clear all docs in Firestore
    try {
      const querySnapshot = await getDocs(collection(db, PHOTOS_COLLECTION));
      const batch = writeBatch(db);
      querySnapshot.forEach((docSnap) => {
        batch.delete(docSnap.ref);
      });
      await batch.commit();
      this.isCloudConnected = true;
    } catch (err) {
      console.warn('Firestore batch clear notice:', err);
    }

    // 2. Clear API endpoint
    try {
      fetch('/api/photos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear_all' })
      }).catch(() => {});
    } catch {}

    // 3. Broadcast to all open tabs
    try {
      this.broadcastChannel?.postMessage('sync_photos');
    } catch {}
  }

  // Reset to demo photos in IndexedDB, Cloud API, and Cloud Firestore across ALL devices
  async resetDemoPhotos(): Promise<PhotoRecord[]> {
    await idbClearAllPhotos();
    await idbSaveAllPhotos(INITIAL_DEMO_PHOTOS);
    this.saveLocalFallbackList(INITIAL_DEMO_PHOTOS);

    try {
      const batch = writeBatch(db);
      for (const p of INITIAL_DEMO_PHOTOS) {
        const photoRef = doc(db, PHOTOS_COLLECTION, p.id);
        batch.set(photoRef, p, { merge: true });
      }
      await batch.commit();
    } catch {}

    try {
      this.broadcastChannel?.postMessage('sync_photos');
    } catch {}
    
    return INITIAL_DEMO_PHOTOS;
  }

  // Toggle favorite in IndexedDB and Cloud
  async toggleFavorite(id: string): Promise<PhotoRecord | null> {
    try {
      const localPhotos = await idbGetAllPhotos();
      const photo = localPhotos.find(p => p.id === id);
      if (photo) {
        const updated = { ...photo, favorite: !photo.favorite };
        await idbSavePhoto(updated);
        await this.saveLocalFallbackPhoto(updated);

        try {
          const photoRef = doc(db, PHOTOS_COLLECTION, id);
          await setDoc(photoRef, { favorite: updated.favorite }, { merge: true });
        } catch {}

        try {
          fetch('/api/photos', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, favorite: updated.favorite })
          }).catch(() => {});
        } catch {}

        try {
          this.broadcastChannel?.postMessage('sync_photos');
        } catch {}

        return updated;
      }
    } catch (err) {
      console.warn('toggleFavorite error:', err);
    }
    return null;
  }

  // Check database connection status
  getDatabaseStatus(): { isConnected: boolean; provider: string } {
    return {
      isConnected: this.isCloudConnected,
      provider: 'Cloud Firestore + IndexedDB Multi-Device Sync'
    };
  }

  // LocalStorage secondary fallback helpers
  private saveLocalFallbackList(photos: PhotoRecord[]): void {
    try {
      const trimmed = photos.slice(0, 15);
      localStorage.setItem('buddy_photos_fallback', JSON.stringify(trimmed));
    } catch {}
  }

  private async getLocalFallbackPhotos(): Promise<PhotoRecord[]> {
    const local = localStorage.getItem('buddy_photos_fallback');
    if (local) {
      try {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        console.error('Error parsing fallback photos', e);
      }
    }
    return [];
  }

  private async saveLocalFallbackPhoto(photo: PhotoRecord): Promise<void> {
    try {
      const photos = await this.getLocalFallbackPhotos();
      const idx = photos.findIndex(p => p.id === photo.id);
      if (idx >= 0) photos[idx] = photo;
      else photos.unshift(photo);
      const trimmed = photos.slice(0, 15);
      localStorage.setItem('buddy_photos_fallback', JSON.stringify(trimmed));
    } catch {
      // Ignore
    }
  }

  private async deleteLocalFallbackPhoto(id: string): Promise<void> {
    try {
      const photos = (await this.getLocalFallbackPhotos()).filter(p => p.id !== id);
      localStorage.setItem('buddy_photos_fallback', JSON.stringify(photos));
    } catch {
      // Ignore
    }
  }

  private async clearLocalFallbackPhotos(): Promise<void> {
    try {
      localStorage.removeItem('buddy_photos_fallback');
    } catch {
      // Ignore
    }
  }

  // App Settings
  getSettings(): AppSettings {
    const local = localStorage.getItem(SETTINGS_KEY);
    if (local) {
      try {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(local) };
      } catch (e) {
        console.error('Error parsing settings', e);
      }
    }
    return DEFAULT_SETTINGS;
  }

  saveSettings(settings: AppSettings): void {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    try {
      const settingsRef = doc(db, SETTINGS_COLLECTION, 'user_preferences');
      setDoc(settingsRef, settings, { merge: true }).catch(() => {});
    } catch {
      // ignore
    }
  }
}

export const storageService = new StorageService();
