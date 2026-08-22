import React, { useState, useRef } from 'react';
import { NavigationTab, PhotoRecord } from '../types';
import { soundEngine } from '../utils/audio';
import { optimizeImageDataUrl } from '../utils/imageOptimizer';
import confetti from 'canvas-confetti';
import { Sparkles, Trash2, Settings, Send, Bell, ArrowRight, Check, X, Copy, Mail, MessageCircle, ImagePlus, Camera } from 'lucide-react';
import { NotificationModal } from './NotificationModal';

interface HomeScreenProps {
  onSelectTab: (tab: NavigationTab) => void;
  onOpenDeleteAllModal: () => void;
  photos: PhotoRecord[];
  onOpenPhotoDetail?: (photo: PhotoRecord) => void;
  onSavePhoto?: (photo: PhotoRecord) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onSelectTab,
  onOpenDeleteAllModal,
  photos,
  onOpenPhotoDetail,
  onSavePhoto,
}) => {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    soundEngine.playChime();
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Upload from personal device gallery
  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const dataUrl = await optimizeImageDataUrl(file, 800, 0.75);
      const now = new Date();
      const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const dateString = now.toLocaleDateString([], { month: 'short', day: 'numeric' });
      
      const fileNameClean = file.name.replace(/\.[^/.]+$/, "").substring(0, 24);
      const photoTitle = fileNameClean.length > 1 ? fileNameClean : `Gallery Snap (${timeString})`;

      const newPhoto: PhotoRecord = {
        id: `photo-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        imageUrl: dataUrl,
        title: photoTitle,
        caption: 'Added from personal system gallery',
        timestamp: Date.now(),
        dateFormatted: `Today • ${dateString}`,
        favorite: false,
        tag: 'Gallery',
        filter: 'normal',
        location: 'System Gallery'
      };

      if (onSavePhoto) {
        onSavePhoto(newPhoto);
      }

      soundEngine.playChime();

      try {
        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#5843d1', '#a8e6cf', '#ffd1dc', '#fed330']
        });
      } catch {
        // Safe fallback
      }

      showToast(`✨ "${photoTitle}" added to Memories!`);

      setTimeout(() => {
        onSelectTab('memories');
      }, 300);
    } catch (err) {
      console.warn('Gallery upload error:', err);
    }

    e.target.value = '';
  };

  const handleAction = (tab: NavigationTab) => {
    soundEngine.playPop();
    onSelectTab(tab);
  };

  // Direct 1: Delete all photos from database / server
  const handleDirectDeleteAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    soundEngine.playPop();
    onOpenDeleteAllModal();
  };

  // Direct 2: Universal Share (Send photos / app link anywhere)
  const handleDirectShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    soundEngine.playPop();

    const shareUrl = window.location.href;
    const shareText = `Check out my cozy pastel photo memories on Buddy Camera! 📸✨ (${photos.length} photos captured)`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Buddy Camera - Soft Clay Photo Memories',
          text: shareText,
          url: shareUrl,
        });
        showToast('Shared successfully!');
        return;
      } catch (err) {
        // User dismissed native share sheet, fallback to custom modal
      }
    }
    setIsShareModalOpen(true);
  };

  // Direct 3: Bell Icon Notification Email to uniquegksaurabh@gmail.com
  const handleDirectBellAlert = (e: React.MouseEvent) => {
    e.stopPropagation();
    soundEngine.playChime();
    setIsNotificationModalOpen(true);
  };

  // Direct 4: Settings Interface
  const handleDirectSettings = (e: React.MouseEvent) => {
    e.stopPropagation();
    soundEngine.playPop();
    onSelectTab('tools');
  };

  const handleCopyShareLink = () => {
    soundEngine.playPop();
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    showToast('🔗 Link copied to clipboard! Share anywhere.');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div id="home-screen" className="w-full min-h-screen pt-16 sm:pt-20 pb-28 px-4 sm:px-8 max-w-7xl mx-auto flex flex-col items-center justify-start relative">
      
      {/* Dynamic Floating Toast Alert */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-[#1a1c1d]/95 text-white px-5 py-3 rounded-2xl shadow-[0_12px_32px_rgba(0,0,0,0.3)] backdrop-blur-md flex items-center gap-3 border border-white/20 animate-fade-in max-w-md w-[90%]">
          <div className="w-7 h-7 rounded-xl bg-[#5843d1] flex items-center justify-center text-white shrink-0 shadow-inner">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="text-xs sm:text-sm font-medium leading-snug flex-1">{toastMessage}</span>
          <button 
            onClick={() => setToastMessage(null)}
            className="text-white/60 hover:text-white ml-2 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Background Soft Floating Ambient Orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-20 left-[15%] w-96 h-96 bg-[#e4deff]/40 blur-[90px] rounded-full mix-blend-multiply" />
        <div className="absolute top-40 right-[15%] w-96 h-96 bg-[#b1efd8]/35 blur-[100px] rounded-full mix-blend-multiply" />
        <div className="absolute bottom-24 left-[30%] w-96 h-96 bg-[#ffd9e2]/30 blur-[110px] rounded-full mix-blend-multiply" />
      </div>

      <div className="relative z-10 w-full flex flex-col items-center text-center mt-1 sm:mt-3">
        
        {/* Main Heading as seen in Image 4 */}
        <div className="max-w-2xl mx-auto mb-5 sm:mb-7">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/70 border border-white/80 shadow-[0_2px_8px_rgba(90,70,211,0.06)] text-xs font-semibold text-[#5843d1] mb-3">
            <Sparkles className="w-3.5 h-3.5 text-[#5843d1]" />
            <span>Welcome to your cozy sanctuary</span>
          </div>

          <h1 className="font-heading font-bold text-xl sm:text-2xl md:text-3xl text-[#1a1c1d] tracking-tight leading-snug drop-shadow-sm whitespace-nowrap">
            What would you like to do?
          </h1>
        </div>

        {/* 3 Main Hero Clay Cards (Exact UI from Image 4 with Enlarged Logos & Compact Headings) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 w-full max-w-4xl px-2">
          
          {/* Card 1: CAPTURE & ADD */}
          <div
            id="hero-card-capture"
            className="clay-card rounded-[2.5rem] p-7 sm:p-8 flex flex-col items-center justify-center text-center transition-all duration-300 hover:shadow-2xl group relative overflow-hidden bg-gradient-to-b from-white/95 to-white/75 border border-white/80"
          >
            {/* Hidden file input for personal gallery image upload */}
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleGalleryUpload}
            />

            {/* Shimmer accent */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#e4deff]/30 rounded-full blur-2xl group-hover:scale-150 transition-transform pointer-events-none" />

            {/* Dual Big 3D Graphic Logos: 1 for Live Camera Capture & 1 for Add From Gallery/System */}
            <div className="flex items-center justify-center gap-4 sm:gap-5 my-3 z-10">
              
              {/* Logo 1: Big 3D Purple/Blue Camera Shutter Logo (Click to Open Camera) */}
              <button 
                id="capture-camera-logo"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAction('capture');
                }}
                title="Open Camera Viewfinder"
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-br from-[#8d7aff] to-[#5843d1] flex flex-col items-center justify-center p-2.5 shadow-[0_16px_32px_rgba(88,67,209,0.35),inset_2px_2px_6px_rgba(255,255,255,0.65),inset_-2px_-2px_6px_rgba(0,0,0,0.25)] hover:scale-110 active:scale-95 transition-all group/cam cursor-pointer border-2 border-white/40"
              >
                <div className="w-full h-full rounded-2xl bg-white/20 backdrop-blur-xs flex flex-col items-center justify-center border border-white/30">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white flex items-center justify-center shadow-inner group-hover/cam:scale-110 transition-transform">
                    <Camera className="w-5 h-5 sm:w-6 sm:h-6 text-[#5843d1] stroke-[2.5]" />
                  </div>
                  <span className="text-[11px] sm:text-xs font-bold text-white mt-1.5 tracking-tight">Camera</span>
                </div>
              </button>

              {/* Logo 2: Big 3D Mint/Lilac System Gallery Upload Logo (Click to Add from Personal Gallery) */}
              <button
                id="capture-gallery-logo"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  soundEngine.playPop();
                  galleryInputRef.current?.click();
                }}
                title="Upload photo from Device / System Gallery"
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-br from-[#a8e6cf] to-[#2c6956] flex flex-col items-center justify-center p-2.5 shadow-[0_16px_32px_rgba(44,105,86,0.3),inset_2px_2px_6px_rgba(255,255,255,0.75),inset_-2px_-2px_6px_rgba(0,0,0,0.2)] hover:scale-110 active:scale-95 transition-all group/gal cursor-pointer border-2 border-white/50"
              >
                <div className="w-full h-full rounded-2xl bg-white/25 backdrop-blur-xs flex flex-col items-center justify-center border border-white/40">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white flex items-center justify-center shadow-inner group-hover/gal:scale-110 transition-transform">
                    <ImagePlus className="w-5 h-5 sm:w-6 sm:h-6 text-[#2c6956] stroke-[2.5]" />
                  </div>
                  <span className="text-[11px] sm:text-xs font-bold text-white mt-1.5 tracking-tight">Add Pic</span>
                </div>
              </button>

            </div>

            <div className="mt-3 z-10">
              <h2 className="font-heading font-bold text-base sm:text-lg text-[#1a1c1d] transition-colors">
                Capture &amp; Add
              </h2>
            </div>
          </div>

          {/* Card 2: MEMORIES */}
          <div
            id="hero-card-memories"
            onClick={() => handleAction('memories')}
            className="clay-card rounded-[2.5rem] p-7 sm:p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 hover:scale-[1.04] hover:-translate-y-1.5 active:scale-95 group relative overflow-hidden bg-gradient-to-b from-white/90 to-white/70"
          >
            {/* Shimmer accent */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#a8e6cf]/30 rounded-full blur-2xl group-hover:scale-150 transition-transform" />

            {/* Big 3D Mint/Green Photo Card Graphic */}
            <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-[2rem] bg-gradient-to-br from-[#53dca8] to-[#2c6956] flex items-center justify-center p-3.5 shadow-[0_20px_40px_rgba(44,105,86,0.3),inset_3px_3px_8px_rgba(255,255,255,0.7),inset_-3px_-3px_8px_rgba(0,0,0,0.2)] group-hover:-rotate-3 group-hover:scale-105 transition-transform my-1 border-2 border-white/40">
              <div className="w-full h-full rounded-2xl bg-[#d4f8eb] flex flex-col justify-end p-2.5 relative overflow-hidden border border-white/60 shadow-inner">
                <div className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-[#8d7aff] shadow-md" />
                <div className="w-full h-11 bg-[#8d7aff] rounded-t-xl opacity-90 shadow-sm" />
              </div>
            </div>

            <div className="mt-3">
              <h2 className="font-heading font-bold text-base sm:text-lg text-[#1a1c1d] group-hover:text-[#2c6956] transition-colors">
                Memories
              </h2>
            </div>
          </div>

          {/* Card 3: TOOLS (Direct 1-Tap Access for All 4 Large Clay Icons) */}
          <div
            id="hero-card-tools"
            className="clay-card rounded-[2.5rem] p-7 sm:p-8 flex flex-col items-center justify-center text-center transition-all duration-300 hover:scale-[1.04] hover:-translate-y-1.5 group relative overflow-hidden bg-gradient-to-b from-white/90 to-white/70"
          >
            {/* Shimmer accent */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#ffd9e2]/30 rounded-full blur-2xl group-hover:scale-150 transition-transform" />

            {/* Big 4-Icon Clay Interactive Grid (Settings, Trash, Airplane, Bell) */}
            <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-[2rem] bg-white/80 border-2 border-white/90 p-3 shadow-[0_20px_40px_rgba(90,70,211,0.14),inset_2px_2px_6px_rgba(255,255,255,0.95)] grid grid-cols-2 gap-2.5 group-hover:scale-105 transition-transform z-10 my-1">
              
              {/* 1. Purple Gear -> Open Settings interface directly */}
              <button 
                id="tool-btn-settings"
                onClick={handleDirectSettings}
                className="rounded-2xl bg-gradient-to-br from-[#c7bfff] to-[#8d79ff] flex items-center justify-center text-white shadow-md hover:scale-110 active:scale-90 transition-transform cursor-pointer group/item relative border border-white/40"
                title="Open Settings"
                aria-label="Open Settings"
              >
                <Settings className="w-6 h-6 drop-shadow-sm group-hover/item:rotate-45 transition-transform" />
              </button>

              {/* 2. Mint Trash Can -> Delete all photos from server / database */}
              <button 
                id="tool-btn-delete-all"
                onClick={handleDirectDeleteAll}
                className="rounded-2xl bg-gradient-to-br from-[#aeedd5] to-[#53dca8] flex items-center justify-center text-[#1a5643] shadow-md hover:scale-110 active:scale-90 transition-transform cursor-pointer group/item relative border border-white/40"
                title="Delete All Database Photos"
                aria-label="Delete All Photos"
              >
                <Trash2 className="w-6 h-6 drop-shadow-sm" />
              </button>

              {/* 3. Coral Paper Airplane -> Universal Share (Send to anyone anywhere) */}
              <button 
                id="tool-btn-share"
                onClick={handleDirectShare}
                className="rounded-2xl bg-gradient-to-br from-[#ffb3b8] to-[#ff7582] flex items-center justify-center text-white shadow-md hover:scale-110 active:scale-90 transition-transform cursor-pointer group/item relative border border-white/40"
                title="Share & Send Anywhere"
                aria-label="Share Photos"
              >
                <Send className="w-6 h-6 -rotate-12 drop-shadow-sm" />
              </button>

              {/* 4. Yellow Bell -> Direct notification email to uniquegksaurabh@gmail.com */}
              <button 
                id="tool-btn-bell"
                onClick={handleDirectBellAlert}
                className="rounded-2xl bg-gradient-to-br from-[#ffeaa7] to-[#fed330] flex items-center justify-center text-[#795503] shadow-md hover:scale-110 active:scale-90 transition-transform cursor-pointer group/item relative border border-white/40"
                title="Send 'Photos Coming from Buddy' Alert to Email"
                aria-label="Send Buddy Alert"
              >
                <Bell className="w-6 h-6 drop-shadow-sm group-hover/item:animate-bounce" />
              </button>

            </div>

            <div className="mt-3">
              <h2 className="font-heading font-bold text-base sm:text-lg text-[#1a1c1d] group-hover:text-[#5843d1] transition-colors">
                Tools
              </h2>
            </div>
          </div>

        </div>

      </div>

      {/* Direct Quick Share Modal */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-[2.5rem] p-6 sm:p-8 max-w-md w-full shadow-2xl border border-white relative">
            <button
              onClick={() => setIsShareModalOpen(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-[#f4f2fb] hover:bg-[#e4deff] text-[#787586] flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-14 h-14 rounded-2xl bg-[#ffd9e2] text-[#e04f67] flex items-center justify-center mb-4 mx-auto shadow-sm">
              <Send className="w-7 h-7 -rotate-12" />
            </div>

            <h3 className="font-heading font-bold text-xl text-[#1a1c1d] text-center">
              Share Buddy Camera
            </h3>
            <p className="text-xs text-[#787586] text-center mt-1">
              Send your memories link to anyone across any platform
            </p>

            <div className="grid grid-cols-2 gap-3 mt-6">
              {/* WhatsApp */}
              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Check out my cozy pastel photo memories on Buddy Camera! 📸✨ ${window.location.href}`)}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-[#e8f8f2] text-[#1a7f5a] font-semibold text-xs hover:bg-[#d0f2e5] transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp</span>
              </a>

              {/* Email */}
              <a
                href={`mailto:?subject=${encodeURIComponent('📸 Photos Coming from Buddy!')}&body=${encodeURIComponent(`Check out my Buddy Camera memories: ${window.location.href}`)}`}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-[#e4deff] text-[#5843d1] font-semibold text-xs hover:bg-[#d5ccff] transition-colors"
              >
                <Mail className="w-4 h-4" />
                <span>Email</span>
              </a>
            </div>

            {/* Copy Link */}
            <button
              onClick={handleCopyShareLink}
              className="w-full mt-3 py-3 px-4 rounded-2xl bg-[#1a1c1d] text-white font-semibold text-xs flex items-center justify-center gap-2 hover:bg-[#333] transition-colors shadow-md cursor-pointer"
            >
              {copiedLink ? <Check className="w-4 h-4 text-[#a8e6cf]" /> : <Copy className="w-4 h-4" />}
              <span>{copiedLink ? 'Link Copied!' : 'Copy Direct Link'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Direct Email Notification Modal */}
      <NotificationModal
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
        photosCount={photos.length}
      />

      {/* Footer as seen in Image 4 */}
      <footer className="w-full max-w-4xl mt-16 sm:mt-20 pt-6 pb-20 sm:pb-24 border-t border-[#c9c4d7]/40 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#787586] relative z-10">
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="text-[#5843d1] font-bold">Buddy to Buddy</span>
            <span>•</span>
            <span className="px-2.5 py-1 rounded-full bg-[#f2f0ff] text-[#5843d1] font-semibold border border-[#dcd7f9]">
              The web made by Saurabh ✨
            </span>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <button onClick={() => handleAction('community')} className="hover:text-[#5843d1] transition-colors">Privacy</button>
          <button onClick={() => handleAction('community')} className="hover:text-[#5843d1] transition-colors">Terms</button>
          <button onClick={() => handleAction('chat')} className="hover:text-[#5843d1] transition-colors">Contact</button>
        </div>
      </footer>

    </div>
  );
};
