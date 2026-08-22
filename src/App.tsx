import React, { useState, useEffect } from 'react';
import { NavigationTab, PhotoRecord, AppSettings } from './types';
import { storageService } from './services/storage';
import { startPresenceHeartbeat } from './services/presence';
import { soundEngine } from './utils/audio';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { HomeScreen } from './components/HomeScreen';
import { CaptureScreen } from './components/CaptureScreen';
import { MemoriesScreen } from './components/MemoriesScreen';
import { ToolsScreen } from './components/ToolsScreen';
import { CommunityScreen } from './components/CommunityScreen';
import { ChatScreen } from './components/ChatScreen';
import { PhotoDetailModal } from './components/PhotoDetailModal';
import { DeleteAllModal } from './components/DeleteAllModal';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavigationTab>('home');
  const [photos, setPhotos] = useState<PhotoRecord[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoRecord | null>(null);
  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false);
  const [settings, setSettings] = useState<AppSettings>(storageService.getSettings());
  const [isLoading, setIsLoading] = useState(true);

  // Load photos from Cloud Firestore on startup & subscribe to realtime updates
  useEffect(() => {
    async function loadData() {
      try {
        const loadedPhotos = await storageService.getAllPhotos();
        setPhotos(loadedPhotos);
      } catch (err) {
        console.error('Failed to load photos from database:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();

    // Subscribe to live Firestore updates
    const unsubscribe = storageService.subscribeToPhotos((livePhotos) => {
      setPhotos(livePhotos);
    });

    // Proactively request camera permission on website load if not granted yet
    async function initCameraPermission() {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) return;
      try {
        if (navigator.permissions && navigator.permissions.query) {
          const perm = await navigator.permissions.query({ name: 'camera' as PermissionName });
          if (perm.state === 'granted') {
            return; // Already granted, no need to re-prompt
          }
        }
        // Ask browser for camera permission on initial load
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        // Immediately stop stream after user clicks "Allow" so hardware camera doesn't run on Home screen
        stream.getTracks().forEach(track => track.stop());
      } catch (err) {
        console.log('Camera permission prompt on startup:', err);
      }
    }
    initCameraPermission();

    // Start automatic web activity / last opened presence tracker (no login required)
    const stopPresence = startPresenceHeartbeat();

    return () => {
      unsubscribe();
      stopPresence();
    };
  }, []);

  // Save new photo
  const handleSavePhoto = async (photo: PhotoRecord) => {
    await storageService.savePhoto(photo);
    setPhotos(prev => [photo, ...prev.filter(p => p.id !== photo.id)]);
  };

  // Delete single photo
  const handleDeletePhoto = async (id: string) => {
    await storageService.deletePhoto(id);
    setPhotos(prev => prev.filter(p => p.id !== id));
  };

  // Delete all photos (User explicit command: "delet wale pe tap karte hi sab pic delet ho jayngi")
  const handleConfirmDeleteAll = async () => {
    await storageService.deleteAllPhotos();
    setPhotos([]);
  };

  // Reset starter demo photos
  const handleResetDemoPhotos = async () => {
    const demos = await storageService.resetDemoPhotos();
    setPhotos(demos);
  };

  // Toggle favorite
  const handleToggleFavorite = async (id: string) => {
    const updated = await storageService.toggleFavorite(id);
    if (updated) {
      setPhotos(prev => prev.map(p => (p.id === id ? { ...p, favorite: updated.favorite } : p)));
      if (selectedPhoto && selectedPhoto.id === id) {
        setSelectedPhoto(prev => (prev ? { ...prev, favorite: updated.favorite } : null));
      }
    }
  };

  // Update photo title or caption
  const handleUpdatePhoto = async (updatedPhoto: PhotoRecord) => {
    await storageService.savePhoto(updatedPhoto);
    setPhotos(prev => prev.map(p => (p.id === updatedPhoto.id ? updatedPhoto : p)));
    setSelectedPhoto(updatedPhoto);
  };

  // Import photos from backup
  const handleImportPhotos = async (imported: PhotoRecord[]) => {
    for (const p of imported) {
      await storageService.savePhoto(p);
    }
    const fresh = await storageService.getAllPhotos();
    setPhotos(fresh);
  };

  // Update app settings
  const handleUpdateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    storageService.saveSettings(newSettings);
  };

  return (
    <div className="min-h-screen bg-[#f9f9fb] text-[#1a1c1d] relative flex flex-col font-sans selection:bg-[#5843d1]/20 selection:text-[#5843d1]">
      
      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        photoCount={photos.length}
      />

      {/* Main Tab Screen Render */}
      <main className="flex-1 w-full">
        {currentTab === 'home' && (
          <HomeScreen
            onSelectTab={setCurrentTab}
            onOpenDeleteAllModal={() => setIsDeleteAllModalOpen(true)}
            photos={photos}
            onOpenPhotoDetail={setSelectedPhoto}
            onSavePhoto={handleSavePhoto}
          />
        )}

        {currentTab === 'capture' && (
          <CaptureScreen
            onSavePhoto={handleSavePhoto}
            recentPhotos={photos.slice(0, 6)}
            onOpenPhotoDetail={setSelectedPhoto}
            onNavigate={setCurrentTab}
            settings={settings}
          />
        )}

        {currentTab === 'memories' && (
          <MemoriesScreen
            photos={photos}
            onToggleFavorite={handleToggleFavorite}
            onDeletePhoto={handleDeletePhoto}
            onSelectTab={setCurrentTab}
            onOpenPhotoDetail={setSelectedPhoto}
            onOpenDeleteAllModal={() => setIsDeleteAllModalOpen(true)}
          />
        )}

        {(currentTab === 'tools' || currentTab === 'settings') && (
          <ToolsScreen
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            onOpenDeleteAllModal={() => setIsDeleteAllModalOpen(true)}
            photos={photos}
            onImportPhotos={handleImportPhotos}
            onResetDemoPhotos={handleResetDemoPhotos}
            onSelectTab={setCurrentTab}
          />
        )}

        {currentTab === 'community' && (
          <CommunityScreen />
        )}

        {currentTab === 'chat' && (
          <ChatScreen />
        )}
      </main>

      {/* Bottom Floating Navigation Bar */}
      {currentTab !== 'capture' && (
        <BottomNav
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          photoCount={photos.length}
        />
      )}

      {/* Photo Detail Modal */}
      <PhotoDetailModal
        photo={selectedPhoto}
        photos={photos}
        onClose={() => setSelectedPhoto(null)}
        onToggleFavorite={handleToggleFavorite}
        onDeletePhoto={handleDeletePhoto}
        onUpdatePhoto={handleUpdatePhoto}
        onSelectPhoto={setSelectedPhoto}
      />

      {/* Delete All Modal */}
      <DeleteAllModal
        isOpen={isDeleteAllModalOpen}
        photoCount={photos.length}
        onClose={() => setIsDeleteAllModalOpen(false)}
        onConfirmDeleteAll={handleConfirmDeleteAll}
        onResetDemo={handleResetDemoPhotos}
      />

    </div>
  );
}
