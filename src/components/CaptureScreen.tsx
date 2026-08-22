import React, { useState, useRef, useEffect, useCallback } from 'react';
import { PhotoRecord, AppSettings, NavigationTab } from '../types';
import { soundEngine } from '../utils/audio';
import { optimizeImageDataUrl } from '../utils/imageOptimizer';
import confetti from 'canvas-confetti';
import { 
  Sparkles, 
  Upload, 
  RotateCw, 
  Zap, 
  Clock, 
  Grid, 
  Sliders, 
  Check, 
  X, 
  Heart, 
  Eye, 
  Camera,
  ShieldAlert,
  RefreshCw,
  Lock
} from 'lucide-react';

interface CaptureScreenProps {
  onSavePhoto: (photo: PhotoRecord) => void;
  recentPhotos: PhotoRecord[];
  onOpenPhotoDetail: (photo: PhotoRecord) => void;
  onNavigate: (tab: NavigationTab) => void;
  settings: AppSettings;
}

const FILTER_PRESETS = [
  { id: 'normal', name: 'Original', css: 'none' },
  { id: 'warm', name: 'Warm Sun', css: 'sepia(0.2) saturate(1.2) contrast(1.05) brightness(1.03)' },
  { id: 'pastel', name: 'Soft Pastel', css: 'contrast(0.95) brightness(1.08) saturate(1.15) hue-rotate(-5deg)' },
  { id: 'lavender', name: 'Lavender Dream', css: 'hue-rotate(240deg) saturate(1.1) brightness(1.05) contrast(0.95)' },
  { id: 'mint', name: 'Mint Meadow', css: 'hue-rotate(75deg) saturate(1.2) brightness(1.02)' },
  { id: 'vintage', name: 'Vintage Clay', css: 'sepia(0.35) contrast(1.1) brightness(0.98)' },
  { id: 'bw', name: 'Monochrome', css: 'grayscale(1) contrast(1.15) brightness(1.05)' },
];

export const CaptureScreen: React.FC<CaptureScreenProps> = ({
  onSavePhoto,
  recentPhotos,
  onOpenPhotoDetail,
  onNavigate,
  settings
}) => {
  const [hasCamera, setHasCamera] = useState<boolean | null>(null);
  const [isCameraLoading, setIsCameraLoading] = useState<boolean>(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [flashMode, setFlashMode] = useState<'off' | 'on' | 'auto'>('auto');
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [activeFilter, setActiveFilter] = useState<string>('normal');
  const [reticlePos, setReticlePos] = useState<{ x: number; y: number }>({ x: 50, y: 50 });
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [flashOverlay, setFlashOverlay] = useState<boolean>(false);
  const [customTitle, setCustomTitle] = useState<string>('');
  const [showTitleModal, setShowTitleModal] = useState<boolean>(false);
  const [capturedTempData, setCapturedTempData] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Reusable camera start and permission requester
  const requestCameraAccess = useCallback(async () => {
    setIsCameraLoading(true);
    setCameraError(null);
    setPermissionDenied(false);

    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: facingMode,
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          },
          audio: false
        });

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            setIsCameraLoading(false);
          };
          videoRef.current.play().catch(() => {});
        }
        setHasCamera(true);
        setPermissionDenied(false);
        setCameraError(null);
        
        // Safety timeout in case onloadedmetadata event is delayed
        setTimeout(() => {
          setIsCameraLoading(false);
        }, 400);
      } else {
        setHasCamera(false);
        setPermissionDenied(true);
        setCameraError('Camera API is not supported on this browser.');
        setIsCameraLoading(false);
      }
    } catch (err: unknown) {
      console.warn('Camera access error:', err);
      setHasCamera(false);
      setPermissionDenied(true);
      setCameraError('Camera permission was not granted. Please allow camera access in browser prompt.');
      setIsCameraLoading(false);
    }
  }, [facingMode]);

  // Start webcam on mount and on facingMode switch
  useEffect(() => {
    requestCameraAccess();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [requestCameraAccess]);

  // Click on viewfinder to refocus reticle
  const handleViewfinderClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setReticlePos({ x, y });
    soundEngine.playPop();
  };

  // Flip camera toggle
  const handleFlipCamera = () => {
    soundEngine.playPop();
    setFacingMode(prev => (prev === 'user' ? 'environment' : 'user'));
  };

  // Flash cycle: auto -> on -> off
  const handleToggleFlash = () => {
    soundEngine.playPop();
    setFlashMode(prev => (prev === 'auto' ? 'on' : prev === 'on' ? 'off' : 'auto'));
  };

  // Timer cycle: 0 -> 3 -> 5 -> 10 -> 0
  const handleToggleTimer = () => {
    soundEngine.playPop();
    setTimerSeconds(prev => (prev === 0 ? 3 : prev === 3 ? 5 : prev === 5 ? 10 : 0));
  };

  // Take photo trigger
  const handleShutterClick = () => {
    if (isCapturing) return;

    if (timerSeconds > 0) {
      setCountdown(timerSeconds);
      const interval = setInterval(() => {
        setCountdown(prev => {
          if (prev === null || prev <= 1) {
            clearInterval(interval);
            setCountdown(null);
            performCapture();
            return null;
          }
          soundEngine.playPop();
          return prev - 1;
        });
      }, 1000);
    } else {
      performCapture();
    }
  };

  const performCapture = async () => {
    setIsCapturing(true);
    soundEngine.playShutter();

    // Trigger flash visual effect
    if (flashMode !== 'off') {
      setFlashOverlay(true);
      setTimeout(() => setFlashOverlay(false), 200);
    }

    if (navigator.vibrate) {
      navigator.vibrate(60);
    }

    // Capture frame to canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    const filterObj = FILTER_PRESETS.find(f => f.id === activeFilter);
    const filterCss = filterObj?.css || 'none';

    if (hasCamera && videoRef.current && videoRef.current.videoWidth) {
      const vid = videoRef.current;
      canvas.width = vid.videoWidth;
      canvas.height = vid.videoHeight;
      if (ctx) {
        ctx.filter = filterCss;
        if (facingMode === 'user') {
          // Mirror for front camera
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
        }
        ctx.drawImage(vid, 0, 0, canvas.width, canvas.height);
      }
    } else {
      // High-res realistic ambient photo snapshot
      canvas.width = 1280;
      canvas.height = 720;
      if (ctx) {
        // Draw background simulated scene
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = 'https://lh3.googleusercontent.com/aida-public/AB6AXuDklahIjrG5rADN78SRLM5KrazsH1piikYv-sH7INRFUlQbFbQWySqUrKXXkZ6KNVxibzZkAjBmF0GYQI9yZvFB3finihrphiImmDNXSzEx91JGnqBdv128wbWf8Y_vIc1JBBjJSyUKXW7e0GVfa6FdbB2mrwX0xrOvr-UdsCWNRPKCLyqj-bLAI1v4R56pR5mcLUD-O8gtMCCVtR3KYZLnsPnImiPBx3bm5QFamnEill5t5kyNucqi';
        
        ctx.filter = filterCss;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      }
    }

    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    const optimized = await optimizeImageDataUrl(dataUrl, 800, 0.75);
    setCapturedTempData(optimized || dataUrl);
    
    // Auto generate title or prompt for name
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateString = now.toLocaleDateString([], { month: 'short', day: 'numeric' });
    const defaultTitle = `Snap at ${timeString}`;
    setCustomTitle(defaultTitle);
    setShowTitleModal(true);
    setIsCapturing(false);
  };

  const handleSaveConfirmedPhoto = async (title: string, tag: string) => {
    if (!capturedTempData) return;

    const now = new Date();
    const dateString = now.toLocaleDateString([], { month: 'short', day: 'numeric' });

    const newPhoto: PhotoRecord = {
      id: `photo-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      imageUrl: capturedTempData,
      title: title.trim() || 'Cozy Moment',
      caption: 'Captured with Buddy to Buddy camera',
      timestamp: Date.now(),
      dateFormatted: `Today • ${dateString}`,
      favorite: false,
      tag: tag || 'Snaps',
      filter: activeFilter,
      location: 'My Sanctuary'
    };

    // Save photo
    onSavePhoto(newPhoto);
    soundEngine.playChime();

    // Trigger sweet mini confetti
    try {
      confetti({
        particleCount: 40,
        spread: 65,
        origin: { y: 0.7 },
        colors: ['#5843d1', '#a8e6cf', '#ffd1dc', '#fed330']
      });
    } catch {}

    setShowTitleModal(false);
    setCapturedTempData(null);

    // Switch instantly to memories gallery screen so user sees photo right away
    setTimeout(() => {
      onNavigate('memories');
    }, 250);
  };

  // Upload local photo file
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const optimized = await optimizeImageDataUrl(file, 800, 0.75);
      setCapturedTempData(optimized);
      setCustomTitle(file.name.replace(/\.[^/.]+$/, ''));
      setShowTitleModal(true);
    } catch {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setCapturedTempData(dataUrl);
        setCustomTitle(file.name.replace(/\.[^/.]+$/, ''));
        setShowTitleModal(true);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const currentFilterObj = FILTER_PRESETS.find(f => f.id === activeFilter);

  return (
    <div id="capture-screen" className="fixed inset-0 z-20 flex flex-col bg-black text-white select-none overflow-hidden">
      
      {/* Hidden File Input for uploading custom pictures */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="image/*"
        className="hidden"
      />

      {/* Main Viewfinder Canvas/Stream */}
      <div
        ref={containerRef}
        onClick={handleViewfinderClick}
        className="absolute inset-0 w-full h-full overflow-hidden cursor-crosshair flex items-center justify-center bg-zinc-950 z-0"
      >
        {/* Real video stream */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover transition-all duration-300 ${
            facingMode === 'user' ? 'scale-x-[-1]' : ''
          }`}
          style={{
            filter: currentFilterObj?.css || 'none',
            display: hasCamera && !isCameraLoading ? 'block' : 'none'
          }}
        />

        {/* Black Screen: Camera Loading Overlay */}
        {isCameraLoading && (
          <div
            id="camera-loading-screen"
            className="absolute inset-0 z-40 bg-black flex flex-col items-center justify-center text-center p-6 select-none animate-in fade-in duration-200"
          >
            {/* 3D Animated Camera Lens Ring */}
            <div className="relative mb-6 flex items-center justify-center">
              {/* Outer soft spinning halo */}
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-white/10 border-t-[#8d79ff] border-r-[#5843d1] animate-spin" />
              
              {/* Center 3D Clay camera icon with breathing glow */}
              <div className="absolute w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-[#5843d1] to-[#8d79ff] flex items-center justify-center shadow-[0_0_30px_rgba(88,67,209,0.7)] border-2 border-white/40 animate-pulse">
                <Camera className="w-7 h-7 sm:w-8 sm:h-8 text-white stroke-[2.2]" />
              </div>
            </div>

            {/* User Requested Prominent Text Message */}
            <h3 className="font-heading font-extrabold text-2xl sm:text-3xl text-white tracking-wide mb-2 drop-shadow-md">
              Wait, camera is opening...
            </h3>
            
            <p className="text-xs sm:text-sm text-zinc-400 max-w-xs leading-relaxed">
              Initialising live lens &amp; adjusting viewfinder settings
            </p>

            {/* Subtle animated loading dots */}
            <div className="flex items-center gap-1.5 mt-4">
              <span className="w-2 h-2 rounded-full bg-[#8d79ff] animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 rounded-full bg-[#8d79ff] animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 rounded-full bg-[#8d79ff] animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}

        {/* Camera Permission Required / Access Prompt Card when Camera is not active */}
        {!hasCamera && !isCameraLoading && (
          <div
            id="camera-permission-prompt-card"
            className="absolute inset-0 z-40 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center select-none animate-in fade-in duration-200"
          >
            {/* Permission Icon with Soft Glow */}
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-tr from-[#5843d1] to-[#8d79ff] flex items-center justify-center shadow-[0_12px_32px_rgba(88,67,209,0.5)] border-2 border-white/40 mb-5 animate-pulse">
              <ShieldAlert className="w-10 h-10 sm:w-12 sm:h-12 text-white stroke-[2.2]" />
            </div>

            <h3 className="font-heading font-extrabold text-2xl sm:text-3xl text-white tracking-tight mb-2">
              Camera Permission Required
            </h3>

            <p className="text-xs sm:text-sm text-zinc-300 max-w-sm leading-relaxed mb-6">
              Photos snap karne ke liye camera permission allow karna zaroori hai. Please neeche diye gaye button par tap karke camera allow karein.
            </p>

            {/* Main Action Button: Allow Camera Permission */}
            <button
              id="grant-camera-permission-btn"
              type="button"
              onClick={() => {
                soundEngine.playPop();
                requestCameraAccess();
              }}
              className="px-6 py-3.5 rounded-full bg-gradient-to-r from-[#8d79ff] to-[#5843d1] hover:from-[#7a64fa] hover:to-[#4935b8] text-white font-heading font-bold text-sm sm:text-base shadow-[0_8px_24px_rgba(88,67,209,0.5)] border border-white/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-2.5 cursor-pointer"
            >
              <Camera className="w-5 h-5 stroke-[2.5]" />
              <span>Allow Camera Permission</span>
            </button>

            {/* Quick Unblock Instructions */}
            <div className="mt-6 max-w-xs p-3 rounded-2xl bg-white/10 border border-white/15 text-[11px] text-zinc-300 text-left flex items-start gap-2.5">
              <Lock className="w-4 h-4 text-[#a8e6cf] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-white block">Agar browser ne block kiya hai:</span>
                Browser address bar me 🔒 ya 📷 icon par tap karein aur Camera ko <b>"Allow"</b> set karein.
              </div>
            </div>

            {/* Try Again Secondary Link */}
            <button
              type="button"
              onClick={() => {
                soundEngine.playPop();
                requestCameraAccess();
              }}
              className="mt-4 text-xs font-semibold text-zinc-400 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Try Again</span>
            </button>
          </div>
        )}

        {/* Framing Grid Overlay */}
        {showGrid && (
          <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 z-10">
            <div className="border-r border-b border-white/20" />
            <div className="border-r border-b border-white/20" />
            <div className="border-b border-white/20" />
            <div className="border-r border-b border-white/20" />
            <div className="border-r border-b border-white/20" />
            <div className="border-b border-white/20" />
            <div className="border-r border-white/20" />
            <div className="border-r border-white/20" />
            <div />
          </div>
        )}

        {/* Dynamic Focus Reticle */}
        <div
          className="absolute pointer-events-none z-10 transition-all duration-300 ease-out"
          style={{
            top: `${reticlePos.y}%`,
            left: `${reticlePos.x}%`,
            transform: 'translate(-50%, -50%)'
          }}
        >
          <div className="w-24 h-24 border-2 border-white/60 rounded-3xl flex items-center justify-center shadow-lg animate-pulse-ring">
            <div className="w-2.5 h-2.5 bg-white rounded-full shadow-md" />
          </div>
        </div>

        {/* Countdown Visual Overlay */}
        {countdown !== null && (
          <div className="absolute inset-0 z-30 bg-black/40 backdrop-blur-xs flex items-center justify-center pointer-events-none">
            <div className="w-36 h-36 rounded-full bg-white/20 backdrop-blur-xl border-2 border-white/80 flex items-center justify-center shadow-2xl animate-ping">
              <span className="font-heading font-bold text-7xl text-white drop-shadow-md">
                {countdown}
              </span>
            </div>
          </div>
        )}

        {/* Flash White Screen Flashbang */}
        {flashOverlay && (
          <div className="absolute inset-0 bg-white z-50 pointer-events-none transition-opacity duration-150" />
        )}

        {/* Top Floating Quick Toolbar (Positioned at top) */}
        <div className="absolute top-4 sm:top-5 right-4 sm:right-8 z-30 pointer-events-auto">
          {/* Quick Toolbar */}
          <div className="flex items-center gap-2 bg-black/40 backdrop-blur-xl p-1.5 rounded-full border border-white/20 shadow-lg">
            
            {/* Flash button */}
            <button
              id="camera-flash-btn"
              onClick={handleToggleFlash}
              title={`Flash: ${flashMode.toUpperCase()}`}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                flashMode !== 'off' ? 'bg-[#fed330] text-black font-bold' : 'text-white/80 hover:bg-white/20'
              }`}
            >
              <Zap className="w-4 h-4" />
            </button>

            {/* Timer button */}
            <button
              id="camera-timer-btn"
              onClick={handleToggleTimer}
              title={`Timer: ${timerSeconds}s`}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all text-xs font-bold ${
                timerSeconds > 0 ? 'bg-[#5843d1] text-white' : 'text-white/80 hover:bg-white/20'
              }`}
            >
              {timerSeconds > 0 ? `${timerSeconds}s` : <Clock className="w-4 h-4" />}
            </button>

            {/* Grid toggle */}
            <button
              id="camera-grid-btn"
              onClick={() => {
                soundEngine.playPop();
                setShowGrid(!showGrid);
              }}
              title="Toggle Framing Grid"
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                showGrid ? 'bg-white text-black' : 'text-white/80 hover:bg-white/20'
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>

            {/* Upload File alternative */}
            <button
              id="camera-upload-btn"
              onClick={() => fileInputRef.current?.click()}
              title="Upload picture from device"
              className="w-9 h-9 rounded-full flex items-center justify-center text-white/80 hover:bg-white/20 transition-all"
            >
              <Upload className="w-4 h-4" />
            </button>

          </div>
        </div>

      </div>

      {/* Spacer to push floating bottom controls down */}
      <div className="flex-1 pointer-events-none z-10" />

      {/* Camera Shutter & Main Controls */}
      <div className="w-full px-6 pt-2 pb-8 sm:pb-12 flex items-center justify-between max-w-md mx-auto z-20 relative pointer-events-auto">
        
        {/* Flash 3D Button (Yellow Lightning) */}
        <button
          id="shutter-flash-toggle"
          onClick={handleToggleFlash}
          aria-label="Toggle Flash Mode"
          className="relative w-14 h-14 rounded-full flex items-center justify-center transition-transform hover:scale-105 active:scale-95 group cursor-pointer"
        >
          <div className="w-13 h-13 rounded-2xl bg-[#fed330] flex items-center justify-center shadow-[0_8px_20px_rgba(254,211,48,0.4),inset_2px_2px_4px_rgba(255,255,255,0.8),inset_-2px_-2px_4px_rgba(0,0,0,0.15)] border border-yellow-200">
            <Zap className={`w-6 h-6 text-[#795503] ${flashMode !== 'off' ? 'fill-[#795503]' : ''}`} />
          </div>
          {flashMode !== 'off' && (
            <span className="absolute -top-1 -right-1 bg-white text-black text-[10px] font-extrabold px-1.5 py-0.5 rounded-full shadow-md border border-zinc-300">
              {flashMode.toUpperCase()}
            </span>
          )}
        </button>

        {/* 3D Big Purple Shutter Button */}
        <button
          id="camera-shutter-trigger"
          onClick={handleShutterClick}
          disabled={isCapturing}
          aria-label="Take Photo"
          className="relative w-20 h-20 sm:w-22 sm:h-22 rounded-full flex items-center justify-center transition-transform hover:scale-105 active:scale-90 z-20 group cursor-pointer"
        >
          {/* Animated concentric soft ring */}
          <div className="absolute inset-0 rounded-full border-4 border-white/40 scale-110 group-hover:scale-115 transition-transform" />
          
          {/* 3D Clay Shutter Face */}
          <div className="w-full h-full rounded-full bg-gradient-to-tr from-[#5843d1] to-[#8d79ff] flex items-center justify-center shadow-[0_12px_28px_rgba(88,67,209,0.5),inset_4px_4px_8px_rgba(255,255,255,0.5),inset_-4px_-4px_8px_rgba(0,0,0,0.3)] border-2 border-white/30">
            <div className="w-12 h-12 rounded-full bg-white/25 flex items-center justify-center border-2 border-white/50 shadow-inner">
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-md">
                <Camera className="w-4 h-4 text-[#5843d1]" />
              </div>
            </div>
          </div>
        </button>

        {/* Flip Camera 3D Button (Lavender Arrow Ring) */}
        <button
          id="shutter-flip-camera"
          onClick={handleFlipCamera}
          aria-label="Flip Camera"
          className="relative w-14 h-14 rounded-full flex items-center justify-center transition-transform hover:scale-105 active:scale-95 cursor-pointer"
        >
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-[#e4deff] to-[#c7bfff] flex items-center justify-center text-[#4228bb] shadow-[0_8px_20px_rgba(199,191,255,0.4),inset_2px_2px_4px_rgba(255,255,255,0.9),inset_-2px_-2px_4px_rgba(66,40,187,0.15)] border border-white/60">
            <RotateCw className="w-6 h-6 stroke-[2.2]" />
          </div>
        </button>

      </div>

      {/* Photo Save Modal with Tag & Title selection */}
      {showTitleModal && capturedTempData && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="clay-card w-full max-w-md p-6 sm:p-8 bg-white text-[#1a1c1d] rounded-[2.5rem] shadow-2xl flex flex-col gap-4 animate-in fade-in zoom-in duration-200">
            
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-bold text-xl text-[#5843d1] flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#a8e6cf]" />
                New Memory Captured!
              </h3>
              <button
                onClick={() => setShowTitleModal(false)}
                className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500 hover:bg-zinc-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Preview image */}
            <div className="w-full h-48 rounded-2xl overflow-hidden shadow-inner border border-zinc-200 bg-zinc-100">
              <img
                src={capturedTempData}
                alt="Captured Preview"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Title Input */}
            <div>
              <label className="block text-xs font-bold text-[#787586] uppercase mb-1">
                Memory Title
              </label>
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="Name this cozy moment..."
                className="w-full px-4 py-2.5 rounded-2xl bg-[#f3f3f5] border border-[#c9c4d7]/60 focus:outline-none focus:ring-2 focus:ring-[#5843d1] font-heading font-semibold text-sm"
                autoFocus
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-2">
              <button
                onClick={() => setShowTitleModal(false)}
                className="flex-1 py-3 rounded-full text-sm font-bold text-[#787586] bg-zinc-100 hover:bg-zinc-200 transition-colors"
              >
                Discard
              </button>
              <button
                id="save-captured-memory-btn"
                onClick={() => handleSaveConfirmedPhoto(customTitle, 'Snaps')}
                className="flex-1 py-3 rounded-full text-sm font-bold clay-btn-primary flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                Save Memory
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
