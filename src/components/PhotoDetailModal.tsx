import React, { useState, useEffect, useCallback } from 'react';
import { PhotoRecord } from '../types';
import { soundEngine } from '../utils/audio';
import { 
  X, 
  Heart, 
  Trash2, 
  Download, 
  Calendar, 
  MapPin, 
  Edit3, 
  Check, 
  Maximize2, 
  Minimize2, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  ChevronLeft, 
  ChevronRight,
  Sparkles
} from 'lucide-react';

interface PhotoDetailModalProps {
  photo: PhotoRecord | null;
  photos?: PhotoRecord[];
  onClose: () => void;
  onToggleFavorite: (id: string) => void;
  onDeletePhoto: (id: string) => void;
  onUpdatePhoto: (photo: PhotoRecord) => void;
  onSelectPhoto?: (photo: PhotoRecord) => void;
}

export const PhotoDetailModal: React.FC<PhotoDetailModalProps> = ({
  photo,
  photos = [],
  onClose,
  onToggleFavorite,
  onDeletePhoto,
  onUpdatePhoto,
  onSelectPhoto
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedCaption, setEditedCaption] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Sync edits when photo changes
  useEffect(() => {
    if (photo) {
      setEditedTitle(photo.title || '');
      setEditedCaption(photo.caption || '');
      setZoomLevel(1);
      setShowDeleteConfirm(false);
      setIsEditing(false);
    }
  }, [photo]);

  // Find index for next/prev navigation
  const currentIndex = photos.findIndex(p => p.id === photo?.id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < photos.length - 1;

  const handlePrev = useCallback(() => {
    if (hasPrev && onSelectPhoto) {
      soundEngine.playPop();
      setZoomLevel(1);
      onSelectPhoto(photos[currentIndex - 1]);
    }
  }, [hasPrev, onSelectPhoto, photos, currentIndex]);

  const handleNext = useCallback(() => {
    if (hasNext && onSelectPhoto) {
      soundEngine.playPop();
      setZoomLevel(1);
      onSelectPhoto(photos[currentIndex + 1]);
    }
  }, [hasNext, onSelectPhoto, photos, currentIndex]);

  // Keyboard navigation & escape listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!photo) return;
      if (e.key === 'Escape') {
        if (isFullscreen) {
          setIsFullscreen(false);
          setZoomLevel(1);
        } else {
          onClose();
        }
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [photo, isFullscreen, onClose, handlePrev, handleNext]);

  if (!photo) return null;

  const handleDownload = () => {
    soundEngine.playPop();
    const link = document.createElement('a');
    link.href = photo.imageUrl;
    link.download = `${photo.title.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSaveEdit = () => {
    soundEngine.playPop();
    onUpdatePhoto({
      ...photo,
      title: editedTitle.trim() || photo.title,
      caption: editedCaption.trim() || photo.caption
    });
    setIsEditing(false);
  };

  const handleDelete = () => {
    soundEngine.playDelete();
    onDeletePhoto(photo.id);
    onClose();
  };

  const handleZoomIn = () => {
    soundEngine.playPop();
    setZoomLevel(prev => Math.min(prev + 0.5, 3));
  };

  const handleZoomOut = () => {
    soundEngine.playPop();
    setZoomLevel(prev => Math.max(prev - 0.5, 1));
  };

  const handleResetZoom = () => {
    soundEngine.playPop();
    setZoomLevel(1);
  };

  const toggleFullscreen = () => {
    soundEngine.playPop();
    setIsFullscreen(prev => !prev);
    setZoomLevel(1);
  };

  // FULLSCREEN IMMERSIVE VIEW
  if (isFullscreen) {
    return (
      <div 
        id="fullscreen-photo-viewer"
        className="fixed inset-0 z-50 bg-black/95 flex flex-col justify-between select-none animate-in fade-in duration-200"
      >
        {/* Fullscreen Floating Top Controls */}
        <div className="w-full p-4 sm:p-6 flex items-center justify-between z-30 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
          
          {/* Photo Info / Counter */}
          <div className="flex items-center gap-3 text-white">
            <div className="flex flex-col">
              <span className="font-heading font-bold text-base sm:text-lg drop-shadow-md text-white">
                {photo.title}
              </span>
              <span className="text-xs text-white/70 flex items-center gap-2">
                {photo.dateFormatted}
                {photos.length > 1 && (
                  <span className="bg-white/20 px-2 py-0.5 rounded-full text-[11px] font-bold">
                    {currentIndex + 1} / {photos.length}
                  </span>
                )}
              </span>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Zoom Controls */}
            <div className="hidden sm:flex items-center gap-1 bg-white/15 backdrop-blur-md p-1 rounded-full border border-white/20">
              <button
                onClick={handleZoomOut}
                disabled={zoomLevel <= 1}
                title="Zoom Out"
                className="w-8 h-8 rounded-full flex items-center justify-center text-white/80 hover:bg-white/20 disabled:opacity-30 transition-all cursor-pointer"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={handleResetZoom}
                title="Reset Zoom"
                className="px-2 h-8 rounded-full text-xs font-bold text-white hover:bg-white/20 transition-all cursor-pointer"
              >
                {Math.round(zoomLevel * 100)}%
              </button>
              <button
                onClick={handleZoomIn}
                disabled={zoomLevel >= 3}
                title="Zoom In"
                className="w-8 h-8 rounded-full flex items-center justify-center text-white/80 hover:bg-white/20 disabled:opacity-30 transition-all cursor-pointer"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>

            {/* Favorite */}
            <button
              onClick={() => {
                soundEngine.playPop();
                onToggleFavorite(photo.id);
              }}
              title={photo.favorite ? 'Remove Favorite' : 'Add to Favorites'}
              className={`w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md transition-all cursor-pointer ${
                photo.favorite 
                  ? 'bg-red-500 text-white shadow-lg shadow-red-500/30' 
                  : 'bg-white/15 text-white hover:bg-white/30 border border-white/20'
              }`}
            >
              <Heart className={`w-4 h-4 ${photo.favorite ? 'fill-white' : ''}`} />
            </button>

            {/* Download */}
            <button
              onClick={handleDownload}
              title="Download High Quality Photo"
              className="w-10 h-10 rounded-full bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
            </button>

            {/* Delete Photo */}
            <button
              onClick={() => {
                if (window.confirm('Delete this photo permanently from database?')) {
                  handleDelete();
                }
              }}
              title="Delete Photo from Database"
              className="w-10 h-10 rounded-full bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-red-600 hover:border-red-600 transition-all cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            {/* Exit Fullscreen */}
            <button
              onClick={toggleFullscreen}
              title="Exit Full Screen View"
              className="w-10 h-10 rounded-full bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-all cursor-pointer"
            >
              <Minimize2 className="w-4 h-4" />
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              title="Close"
              className="w-10 h-10 rounded-full bg-white/25 backdrop-blur-md border border-white/30 flex items-center justify-center text-white hover:bg-white/40 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

          </div>
        </div>

        {/* Central Full Screen Interactive Image Canvas */}
        <div 
          className="flex-1 relative flex items-center justify-center p-2 sm:p-6 overflow-hidden"
          onClick={() => {
            // Clicking background toggles zoom or keeps full screen
          }}
        >
          {/* Previous Arrow Button */}
          {hasPrev && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePrev();
              }}
              title="Previous Photo (Left Arrow)"
              className="absolute left-3 sm:left-6 z-40 w-12 h-12 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-md border border-white/20 text-white flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all cursor-pointer"
            >
              <ChevronLeft className="w-7 h-7" />
            </button>
          )}

          {/* High Quality Main Fullscreen Image */}
          <div 
            className="w-full h-full flex items-center justify-center cursor-zoom-in overflow-auto transition-transform duration-200 ease-out"
            onDoubleClick={(e) => {
              e.stopPropagation();
              soundEngine.playPop();
              setZoomLevel(prev => (prev === 1 ? 2 : 1));
            }}
          >
            <img
              src={photo.imageUrl}
              alt={photo.title}
              style={{
                transform: `scale(${zoomLevel})`,
                transition: 'transform 0.25s cubic-bezier(0.2, 0, 0, 1)'
              }}
              className="max-h-[88vh] max-w-[94vw] object-contain rounded-2xl shadow-2xl drop-shadow-[0_20px_50px_rgba(0,0,0,0.8)] pointer-events-auto"
            />
          </div>

          {/* Next Arrow Button */}
          {hasNext && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              title="Next Photo (Right Arrow)"
              className="absolute right-3 sm:right-6 z-40 w-12 h-12 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-md border border-white/20 text-white flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all cursor-pointer"
            >
              <ChevronRight className="w-7 h-7" />
            </button>
          )}
        </div>

        {/* Fullscreen Bottom Caption Overlay */}
        <div className="w-full p-4 sm:p-6 bg-gradient-to-t from-black/90 via-black/50 to-transparent z-30 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="max-w-2xl">
            {photo.caption && (
              <p className="text-sm text-white/90 font-medium drop-shadow-md">
                "{photo.caption}"
              </p>
            )}
            {photo.location && (
              <span className="text-xs text-white/60 flex items-center justify-center sm:justify-start gap-1 mt-1">
                <MapPin className="w-3.5 h-3.5 text-[#a8e6cf]" />
                {photo.location}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-white/50 bg-white/10 px-3 py-1 rounded-full border border-white/10">
              Double-click photo to zoom • Esc to exit
            </span>
          </div>
        </div>

      </div>
    );
  }

  // STANDARD MODAL VIEW (Tap on image opens Full Screen)
  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div className="clay-card w-full max-w-2xl bg-white text-[#1a1c1d] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh] border border-white/80">
        
        {/* Top Header Controls */}
        <div className="p-4 sm:p-5 flex items-center justify-between border-b border-zinc-100 bg-white/80 backdrop-blur-md">
          <div className="flex items-center gap-2">
            {photo.tag && (
              <span className="bg-[#e4deff] text-[#4228bb] text-xs font-bold px-3 py-1 rounded-full font-heading">
                {photo.tag}
              </span>
            )}
            <span className="text-xs text-[#787586] flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {photo.dateFormatted}
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Fullscreen Expand Button */}
            <button
              id="modal-fullscreen-btn"
              onClick={toggleFullscreen}
              title="Open Full Screen View"
              className="w-10 h-10 rounded-full bg-[#5843d1]/10 text-[#5843d1] flex items-center justify-center hover:bg-[#5843d1] hover:text-white transition-all cursor-pointer"
            >
              <Maximize2 className="w-4 h-4" />
            </button>

            {/* Download */}
            <button
              onClick={handleDownload}
              title="Download Photo"
              className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-700 hover:bg-[#5843d1] hover:text-white transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
            </button>

            {/* Favorite */}
            <button
              onClick={() => {
                soundEngine.playPop();
                onToggleFavorite(photo.id);
              }}
              title={photo.favorite ? 'Favorited' : 'Add to Favorites'}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                photo.favorite
                  ? 'bg-red-50 text-red-500 shadow-sm'
                  : 'bg-zinc-100 text-zinc-600 hover:text-red-500'
              }`}
            >
              <Heart className={`w-4 h-4 ${photo.favorite ? 'fill-red-500' : ''}`} />
            </button>

            {/* Delete single */}
            <button
              onClick={() => setShowDeleteConfirm(true)}
              title="Delete this photo"
              className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-600 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              title="Close modal"
              className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-600 hover:bg-zinc-200 transition-colors ml-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Photo Image Display (Tap to Open Full Screen) */}
        <div 
          id="photo-modal-image-container"
          onClick={toggleFullscreen}
          title="Tap photo to view Full Screen"
          className="relative w-full bg-black flex items-center justify-center max-h-[52vh] sm:max-h-[58vh] overflow-hidden group cursor-pointer"
        >
          <img
            src={photo.imageUrl}
            alt={photo.title}
            className="w-full h-auto max-h-[52vh] sm:max-h-[58vh] object-contain transition-transform duration-300 group-hover:scale-[1.02]"
          />

          {/* Full Screen Badge Overlay on Hover */}
          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
            <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2 text-xs font-bold text-[#1a1c1d] shadow-xl transform translate-y-2 group-hover:translate-y-0 transition-transform">
              <Maximize2 className="w-4 h-4 text-[#5843d1]" />
              <span>Tap to Open Full Screen</span>
            </div>
          </div>

          {/* Quick Corner Fullscreen Hint */}
          <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md text-white text-[11px] font-bold px-3 py-1 rounded-full flex items-center gap-1.5 pointer-events-none border border-white/20">
            <Maximize2 className="w-3 h-3" />
            <span>Full Screen</span>
          </div>
        </div>

        {/* Photo Information & Caption */}
        <div className="p-5 sm:p-6 bg-white flex flex-col gap-4 overflow-y-auto">
          
          {isEditing ? (
            <div className="flex flex-col gap-3">
              <input
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                placeholder="Photo title"
                className="w-full px-4 py-2 rounded-xl bg-zinc-100 border border-zinc-300 font-heading font-bold text-lg focus:outline-[#5843d1]"
              />
              <textarea
                value={editedCaption}
                onChange={(e) => setEditedCaption(e.target.value)}
                placeholder="Add a sweet memory note..."
                className="w-full px-4 py-2 rounded-xl bg-zinc-100 border border-zinc-300 text-sm resize-none h-20 focus:outline-[#5843d1]"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-full text-xs font-bold text-zinc-600 bg-zinc-100 hover:bg-zinc-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-5 py-2 rounded-full text-xs font-bold clay-btn-primary flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  Save Changes
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-heading font-bold text-2xl text-[#1a1c1d] mb-1">
                  {photo.title}
                </h2>
                {photo.caption && (
                  <p className="text-sm text-[#474554] leading-relaxed">
                    {photo.caption}
                  </p>
                )}
                {photo.location && (
                  <p className="text-xs text-[#787586] flex items-center gap-1 mt-2">
                    <MapPin className="w-3.5 h-3.5 text-[#5843d1]" />
                    {photo.location}
                  </p>
                )}
              </div>

              <button
                onClick={() => {
                  soundEngine.playPop();
                  setIsEditing(true);
                }}
                className="p-2.5 rounded-full bg-zinc-100 text-zinc-600 hover:bg-[#5843d1] hover:text-white transition-colors cursor-pointer"
                title="Edit title & note"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Delete Confirmation Prompt */}
          {showDeleteConfirm && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in">
              <span className="text-xs font-semibold text-red-700">
                Are you sure you want to delete this photo permanently?
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-3 py-1.5 rounded-full text-xs font-bold text-zinc-600 bg-white shadow-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-1.5 rounded-full text-xs font-bold bg-red-600 text-white shadow-xs hover:bg-red-700 cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
