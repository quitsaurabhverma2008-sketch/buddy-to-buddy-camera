import React, { useState } from 'react';
import { PhotoRecord, NavigationTab } from '../types';
import { soundEngine } from '../utils/audio';
import confetti from 'canvas-confetti';
import { 
  Heart, 
  Share2, 
  Calendar, 
  Sparkles, 
  Camera, 
  Trash2, 
  Download, 
  X, 
  ChevronDown, 
  Filter, 
  Eye, 
  Check, 
  Layers 
} from 'lucide-react';

interface MemoriesScreenProps {
  photos: PhotoRecord[];
  onToggleFavorite: (id: string) => void;
  onDeletePhoto: (id: string) => void;
  onSelectTab: (tab: NavigationTab) => void;
  onOpenPhotoDetail: (photo: PhotoRecord) => void;
  onOpenDeleteAllModal?: () => void;
}

export const MemoriesScreen: React.FC<MemoriesScreenProps> = ({
  photos,
  onToggleFavorite,
  onDeletePhoto,
  onSelectTab,
  onOpenPhotoDetail,
  onOpenDeleteAllModal
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'month' | 'favorites'>('all');
  const [showRecapModal, setShowRecapModal] = useState<boolean>(false);
  const [copiedToast, setCopiedToast] = useState<string | null>(null);
  const [deletingPhotoId, setDeletingPhotoId] = useState<string | null>(null);

  const filteredPhotos = photos.filter(photo => {
    if (activeFilter === 'favorites') return photo.favorite;
    if (activeFilter === 'month') {
      const photoDate = new Date(photo.timestamp);
      const now = new Date();
      return photoDate.getMonth() === now.getMonth() && photoDate.getFullYear() === now.getFullYear();
    }
    return true;
  });

  const handleRecapClick = () => {
    soundEngine.playChime();
    confetti({
      particleCount: 80,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#5843d1', '#a8e6cf', '#ffd1dc', '#fed330']
    });
    setShowRecapModal(true);
  };

  const handleShare = (photo: PhotoRecord, e: React.MouseEvent) => {
    e.stopPropagation();
    soundEngine.playPop();
    if (navigator.share) {
      navigator.share({
        title: photo.title,
        text: `Look at this cozy moment: ${photo.title}`,
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(`${photo.title} - ${window.location.href}`);
      setCopiedToast(`Copied "${photo.title}" link!`);
      setTimeout(() => setCopiedToast(null), 2500);
    }
  };

  const handleFav = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    soundEngine.playPop();
    onToggleFavorite(id);
  };

  const handleDeleteCardPhoto = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    soundEngine.playDelete();
    onDeletePhoto(id);
    setCopiedToast('Photo deleted from database!');
    setTimeout(() => setCopiedToast(null), 2000);
  };

  return (
    <div id="memories-screen" className="w-full min-h-screen pt-24 pb-36 px-4 sm:px-8 lg:px-12 max-w-7xl mx-auto relative">
      
      {/* Toast Notification */}
      {copiedToast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-[#5843d1] text-white px-5 py-2.5 rounded-full shadow-xl text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-4">
          <Check className="w-4 h-4 text-[#a8e6cf]" />
          <span>{copiedToast}</span>
        </div>
      )}

      {/* Header Section (Exact typography & layout from Image 12) */}
      <div className="pt-6 sm:pt-10 pb-8 flex flex-col md:flex-row items-start md:items-end justify-between gap-6 relative z-10">
        <div>
          <h1 className="font-heading font-bold text-3xl sm:text-5xl text-[#1a1c1d] mb-2 tracking-tight flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#5843d1] to-[#8d79ff] flex items-center justify-center text-white shadow-md">
              <span className="material-symbols-outlined text-[28px]">collections_bookmark</span>
            </div>
            Your Memories
          </h1>
          <p className="text-sm sm:text-base text-[#474554] max-w-lg font-normal">
            A collection of the soft, squishy moments you've captured together. Relive the warmth.
          </p>
        </div>

        {/* Filter Action Pills (From Image 12) */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            id="filter-all-snaps"
            onClick={() => {
              soundEngine.playPop();
              setActiveFilter('all');
            }}
            className={`px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
              activeFilter === 'all'
                ? 'bg-[#5843d1] text-white shadow-[0_4px_12px_rgba(88,67,209,0.3)] scale-105'
                : 'clay-card text-[#474554] hover:scale-105'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>All ({photos.length})</span>
          </button>

          <button
            id="filter-this-month"
            onClick={() => {
              soundEngine.playPop();
              setActiveFilter('month');
            }}
            className={`px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
              activeFilter === 'month'
                ? 'bg-[#5843d1] text-white shadow-[0_4px_12px_rgba(88,67,209,0.3)] scale-105'
                : 'clay-card text-[#474554] hover:scale-105'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>This Month</span>
          </button>

          <button
            id="filter-favorites"
            onClick={() => {
              soundEngine.playPop();
              setActiveFilter('favorites');
            }}
            className={`px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
              activeFilter === 'favorites'
                ? 'bg-[#5843d1] text-white shadow-[0_4px_12px_rgba(88,67,209,0.3)] scale-105'
                : 'clay-card text-[#474554] hover:scale-105'
            }`}
          >
            <Heart className={`w-4 h-4 ${activeFilter === 'favorites' ? 'fill-white' : 'text-red-500 fill-red-500'}`} />
            <span>Favorites</span>
          </button>

          {/* Delete All / Clean Database Button */}
          {photos.length > 0 && onOpenDeleteAllModal && (
            <button
              id="memories-clean-db-btn"
              onClick={() => {
                soundEngine.playPop();
                onOpenDeleteAllModal();
              }}
              title="Delete All / Clean Database"
              className="px-4 py-2.5 rounded-full text-xs sm:text-sm font-bold flex items-center gap-1.5 bg-red-50 text-red-600 hover:bg-red-100 hover:scale-105 transition-all cursor-pointer border border-red-200"
            >
              <Trash2 className="w-4 h-4 text-red-500" />
              <span>Clean All</span>
            </button>
          )}

          {/* Quick Capture trigger */}
          <button
            id="memories-quick-capture"
            onClick={() => onSelectTab('capture')}
            className="clay-btn-mint px-4 py-2.5 rounded-full text-xs sm:text-sm font-bold flex items-center gap-1.5 hover:scale-105 transition-all ml-auto"
          >
            <Camera className="w-4 h-4" />
            <span>Snap New</span>
          </button>
        </div>
      </div>

      {/* Empty State */}
      {filteredPhotos.length === 0 && (
        <div className="clay-card rounded-[2.5rem] p-12 text-center max-w-xl mx-auto my-12 flex flex-col items-center">
          <div className="w-20 h-20 rounded-3xl bg-[#e4deff] flex items-center justify-center text-[#5843d1] mb-4 shadow-inner">
            <span className="material-symbols-outlined text-4xl">photo_library</span>
          </div>
          <h3 className="font-heading font-bold text-2xl text-[#1a1c1d] mb-2">
            No memories found
          </h3>
          <p className="text-sm text-[#787586] mb-6">
            {activeFilter === 'favorites'
              ? 'You have not marked any memories as favorite yet.'
              : 'Start taking cozy snapshots with the live camera!'}
          </p>
          <button
            onClick={() => onSelectTab('capture')}
            className="clay-btn-primary px-6 py-3 rounded-full font-heading font-bold text-sm"
          >
            Open Live Camera
          </button>
        </div>
      )}

      {/* Main Gallery Grid (Exact Layout & Styling from Image 12) */}
      {filteredPhotos.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-[340px] relative z-10">
          
          {filteredPhotos.map((photo, index) => {
            // First item is featured (spans 2 columns on wide screens) as designed in Image 12
            const isFeatured = index === 0 && activeFilter === 'all';

            return (
              <div
                key={photo.id}
                id={`memory-card-${photo.id}`}
                onClick={() => onOpenPhotoDetail(photo)}
                className={`clay-card rounded-[2.5rem] p-3.5 flex flex-col group overflow-hidden relative transition-all duration-300 hover:scale-[1.02] cursor-pointer bg-white/80 ${
                  isFeatured ? 'sm:col-span-2' : ''
                }`}
              >
                {/* Photo container with soft clay inner shadows */}
                <div className="w-full h-full rounded-[2rem] overflow-hidden relative shadow-[inset_4px_4px_12px_rgba(255,255,255,0.7),inset_-4px_-4px_12px_rgba(0,0,0,0.1)] bg-zinc-100">
                  <img
                    src={photo.imageUrl}
                    alt={photo.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  {/* Subtle bottom gradient for readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
                </div>

                {/* Overlay details */}
                <div className="absolute inset-0 p-6 flex flex-col justify-between pointer-events-none">
                  
                  {/* Top Bar on Card */}
                  <div className="flex justify-between items-start">
                    {photo.tag ? (
                      <span className="bg-white/85 backdrop-blur-md px-3.5 py-1.5 rounded-full font-heading font-bold text-xs text-[#1a1c1d] shadow-sm pointer-events-auto border border-white/60">
                        {photo.tag}
                      </span>
                    ) : (
                      <div />
                    )}

                    <div className="flex gap-2 pointer-events-auto">
                      {/* Favorite Button */}
                      <button
                        onClick={(e) => handleFav(photo.id, e)}
                        title={photo.favorite ? 'Remove Favorite' : 'Add to Favorites'}
                        className={`w-10 h-10 rounded-full backdrop-blur-md flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-[2px_2px_6px_rgba(0,0,0,0.15),inset_1px_1px_3px_rgba(255,255,255,0.8)] ${
                          photo.favorite
                            ? 'bg-white text-red-500'
                            : 'bg-white/80 text-zinc-600 hover:text-red-500'
                        }`}
                      >
                        <Heart className={`w-5 h-5 ${photo.favorite ? 'fill-red-500' : ''}`} />
                      </button>

                      {/* Share Button (featured card or hover) */}
                      <button
                        onClick={(e) => handleShare(photo, e)}
                        title="Share memory"
                        className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center text-zinc-700 shadow-[2px_2px_6px_rgba(0,0,0,0.15),inset_1px_1px_3px_rgba(255,255,255,0.8)] hover:text-[#5843d1] hover:scale-110 active:scale-95 transition-all"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>

                      {/* Quick Delete Button */}
                      <button
                        onClick={(e) => handleDeleteCardPhoto(photo.id, e)}
                        title="Delete photo from database"
                        className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center text-zinc-600 shadow-[2px_2px_6px_rgba(0,0,0,0.15),inset_1px_1px_3px_rgba(255,255,255,0.8)] hover:bg-red-50 hover:text-red-600 hover:scale-110 active:scale-95 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Bottom Text */}
                  <div className="text-white">
                    <h3 className={`font-heading font-bold text-white mb-0.5 leading-tight ${
                      isFeatured ? 'text-xl sm:text-2xl' : 'text-lg'
                    }`}>
                      {photo.title}
                    </h3>
                    <p className="text-xs text-white/80 font-normal">
                      {photo.dateFormatted || 'Recently'}
                    </p>
                  </div>

                </div>
              </div>
            );
          })}

          {/* Milestone 100 Snaps Card (Exact Component from Image 12) */}
          <div
            id="milestone-snaps-card"
            className="clay-card rounded-[2.5rem] p-6 flex flex-col items-center justify-center text-center bg-gradient-to-br from-[#e4deff]/70 to-[#c7bfff]/50 border-none transition-transform hover:-translate-y-1.5 shadow-[0_16px_36px_rgba(88,67,209,0.15)] relative overflow-hidden group"
          >
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#5843d1] to-[#8d79ff] text-white flex items-center justify-center shadow-[0_8px_20px_rgba(88,67,209,0.3),inset_2px_2px_6px_rgba(255,255,255,0.4)] mb-4 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-4xl">celebration</span>
            </div>

            <h3 className="font-heading font-bold text-2xl text-[#1a1c1d] mb-1">
              100 Snaps!
            </h3>
            <p className="text-xs sm:text-sm text-[#474554] mb-5 max-w-xs font-normal">
              You've captured so many soft moments together.
            </p>

            <button
              id="view-recap-btn"
              onClick={handleRecapClick}
              className="bg-white text-[#5843d1] px-6 py-2.5 rounded-full font-heading font-bold text-xs sm:text-sm clay-card hover:scale-105 active:scale-95 transition-all flex items-center gap-2 shadow-md"
            >
              <span>View Recap</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>

        </div>
      )}

      {/* Bouncy Load More indicator from Image 12 */}
      <div className="mt-14 flex justify-center w-full">
        <button
          onClick={() => {
            soundEngine.playPop();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          title="Scroll to top"
          className="w-14 h-14 rounded-full clay-card flex items-center justify-center text-[#5843d1] hover:-translate-y-1.5 transition-all duration-300"
        >
          <ChevronDown className="w-6 h-6 animate-bounce" />
        </button>
      </div>

      {/* Footer */}
      <footer className="w-full max-w-5xl mt-12 pt-6 pb-20 sm:pb-24 border-t border-[#c9c4d7]/40 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#787586] relative z-10">
        <div className="flex items-center gap-2">
          <span className="text-[#5843d1] font-bold">Buddy to Buddy</span>
          <span>•</span>
          <span className="px-2.5 py-1 rounded-full bg-[#f2f0ff] text-[#5843d1] font-semibold border border-[#dcd7f9]">
            The web made by Saurabh ✨
          </span>
        </div>
        <div className="flex items-center gap-6">
          <button onClick={() => onSelectTab('community')} className="hover:text-[#5843d1] transition-colors">Privacy</button>
          <button onClick={() => onSelectTab('community')} className="hover:text-[#5843d1] transition-colors">Terms</button>
          <button onClick={() => onSelectTab('chat')} className="hover:text-[#5843d1] transition-colors">Contact</button>
        </div>
      </footer>

      {/* 100 Snaps Recap Modal */}
      {showRecapModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="clay-card w-full max-w-lg p-6 sm:p-8 bg-gradient-to-b from-white to-[#f9f9fb] text-[#1a1c1d] rounded-[3rem] shadow-2xl relative flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
            
            <button
              onClick={() => setShowRecapModal(false)}
              className="absolute top-6 right-6 w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500 hover:bg-zinc-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-[#5843d1] to-[#a8e6cf] flex items-center justify-center text-white shadow-xl mb-4">
              <Sparkles className="w-12 h-12 text-white animate-spin-slow" />
            </div>

            <h2 className="font-heading font-bold text-3xl text-[#5843d1] mb-2">
              Your Memory Journey
            </h2>
            <p className="text-sm text-[#787586] mb-6 max-w-sm">
              Over {photos.length} timeless moments stored securely in your private local database.
            </p>

            {/* Fun Stats Grid */}
            <div className="grid grid-cols-3 gap-3 w-full mb-6">
              <div className="clay-card-secondary p-3 rounded-2xl">
                <span className="font-heading font-bold text-xl text-[#5843d1]">{photos.length}</span>
                <p className="text-[10px] text-[#787586] font-semibold uppercase">Total Snaps</p>
              </div>
              <div className="clay-card-secondary p-3 rounded-2xl">
                <span className="font-heading font-bold text-xl text-red-500">
                  {photos.filter(p => p.favorite).length}
                </span>
                <p className="text-[10px] text-[#787586] font-semibold uppercase">Favorites</p>
              </div>
              <div className="clay-card-secondary p-3 rounded-2xl">
                <span className="font-heading font-bold text-xl text-[#2c6956]">100%</span>
                <p className="text-[10px] text-[#787586] font-semibold uppercase">Private</p>
              </div>
            </div>

            {/* Highlight Carousel */}
            {photos.length > 0 && (
              <div className="w-full h-44 rounded-2xl overflow-hidden shadow-inner border border-zinc-200 mb-6 relative">
                <img
                  src={photos[0].imageUrl}
                  alt="Featured"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-3 text-white text-xs font-bold">
                  Top Highlight: {photos[0].title}
                </div>
              </div>
            )}

            <button
              onClick={() => {
                soundEngine.playPop();
                setShowRecapModal(false);
              }}
              className="clay-btn-primary w-full py-3 rounded-full font-heading font-bold text-sm"
            >
              Continue Making Memories
            </button>

          </div>
        </div>
      )}

    </div>
  );
};
