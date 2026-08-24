import React, { useState, useEffect } from 'react';
import { AppSettings, PhotoRecord, NavigationTab } from '../types';
import { soundEngine } from '../utils/audio';
import { 
  Settings, 
  Trash2, 
  Download, 
  Upload, 
  Volume2, 
  VolumeX, 
  Clock, 
  Zap, 
  Grid, 
  ShieldCheck, 
  HardDrive, 
  Sparkles, 
  Check, 
  RefreshCw, 
  Cloud, 
  ExternalLink,
  Bell,
  Smartphone,
  Mail,
  Send,
  Eye
} from 'lucide-react';
import { isOwnerDevice, setOwnerDeviceStatus, sendEmailNotification } from '../services/notificationService';

interface ToolsScreenProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onOpenDeleteAllModal: () => void;
  photos: PhotoRecord[];
  onImportPhotos: (photos: PhotoRecord[]) => void;
  onResetDemoPhotos: () => void;
  onSelectTab: (tab: NavigationTab) => void;
}

export const ToolsScreen: React.FC<ToolsScreenProps> = ({
  settings,
  onUpdateSettings,
  onOpenDeleteAllModal,
  photos,
  onImportPhotos,
  onResetDemoPhotos,
  onSelectTab
}) => {
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState<boolean>(false);
  const [isTestingMail, setIsTestingMail] = useState<boolean>(false);

  useEffect(() => {
    setIsOwner(isOwnerDevice());
  }, []);

  const handleToggleOwnerDevice = () => {
    soundEngine.playPop();
    const nextVal = !isOwner;
    setIsOwner(nextVal);
    setOwnerDeviceStatus(nextVal);
    showToast(nextVal ? "Marked as Saurabh's Phone (Owner Device)" : "Marked as Guest / Visitor Device");
  };

  const handleSendTestEmail = async () => {
    soundEngine.playPop();
    setIsTestingMail(true);
    showToast('Sending test email notification to uniquegksaurabh@gmail.com...');
    
    await sendEmailNotification({
      type: 'BELL_RING',
      title: '🧪 Test Notification Alert',
      message: 'This is a test alert from Cherish App Settings to verify your email notifications are working perfectly!'
    });

    setIsTestingMail(false);
    showToast('✨ Test email dispatched to uniquegksaurabh@gmail.com');
  };

  const showToast = (msg: string) => {
    soundEngine.playChime();
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const handleToggleSound = () => {
    soundEngine.playPop();
    const updated = { ...settings, soundEffects: !settings.soundEffects };
    onUpdateSettings(updated);
    showToast(updated.soundEffects ? 'Sound effects enabled' : 'Sound effects muted');
  };

  const handleToggleGrid = () => {
    soundEngine.playPop();
    const updated = { ...settings, gridOverlay: !settings.gridOverlay };
    onUpdateSettings(updated);
    showToast(updated.gridOverlay ? 'Camera grid enabled' : 'Camera grid disabled');
  };

  const handleTimerChange = (val: 0 | 3 | 5 | 10) => {
    soundEngine.playPop();
    const updated = { ...settings, timerSeconds: val };
    onUpdateSettings(updated);
    showToast(`Default timer set to ${val === 0 ? 'Off' : val + ' seconds'}`);
  };

  const handleFlashChange = (val: 'auto' | 'on' | 'off') => {
    soundEngine.playPop();
    const updated = { ...settings, flashMode: val };
    onUpdateSettings(updated);
    showToast(`Default flash set to ${val.toUpperCase()}`);
  };

  // Export JSON backup
  const handleExportBackup = () => {
    soundEngine.playPop();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(photos, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `buddy-to-buddy-backup-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast(`Exported ${photos.length} photos to JSON backup!`);
  };

  // Import JSON backup
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (Array.isArray(imported)) {
          onImportPhotos(imported);
          showToast(`Successfully imported ${imported.length} photos!`);
        } else {
          alert('Invalid backup file format.');
        }
      } catch {
        alert('Could not read backup file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div id="tools-screen" className="w-full min-h-screen pt-24 pb-36 px-4 sm:px-8 max-w-5xl mx-auto relative">
      
      {/* Toast */}
      {successToast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-[#5843d1] text-white px-5 py-2.5 rounded-full shadow-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-4">
          <Check className="w-4 h-4 text-[#a8e6cf]" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Screen Title */}
      <div className="pt-6 sm:pt-10 pb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#5843d1] to-[#c7bfff] flex items-center justify-center text-white shadow-md">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-heading font-bold text-3xl sm:text-4xl text-[#1a1c1d] tracking-tight">
              Tools & Settings
            </h1>
            <p className="text-sm text-[#787586]">
              Manage storage, camera preferences, backups, and photo deletion.
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Card 1: DELETE & CLEAN SLATE (Explicit User Request) */}
        <div className="clay-card rounded-[2.5rem] p-6 sm:p-8 bg-gradient-to-br from-white/90 to-red-50/40 border border-red-100 flex flex-col justify-between shadow-[0_12px_32px_rgba(225,29,72,0.08)]">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#ff8a93] to-[#ba1a1a] text-white flex items-center justify-center shadow-md mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h2 className="font-heading font-bold text-xl text-[#1a1c1d] mb-1">
              Delete All Photos
            </h2>
            <p className="text-xs sm:text-sm text-[#787586] mb-4">
              Instantly wipe all stored photos from your device and database. Currently holding <span className="font-bold text-red-600">{photos.length} photos</span>.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              id="btn-delete-all-photos-trigger"
              onClick={() => {
                soundEngine.playPop();
                onOpenDeleteAllModal();
              }}
              className="flex-1 py-3 px-4 rounded-full font-heading font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-red-600 to-rose-500 shadow-[0_6px_16px_rgba(225,29,72,0.3)] hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete All Photos Now</span>
            </button>

            <button
              onClick={() => {
                soundEngine.playPop();
                onResetDemoPhotos();
                showToast('Reset starter demo photos!');
              }}
              className="py-3 px-4 rounded-full font-heading font-semibold text-xs text-[#5843d1] bg-white border border-[#e4deff] hover:bg-[#e4deff]/40 transition-colors flex items-center justify-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Demos</span>
            </button>
          </div>
        </div>

        {/* Card 2: DATABASE & FREE STORAGE (Vercel Ready) */}
        <div className="clay-card rounded-[2.5rem] p-6 sm:p-8 bg-gradient-to-br from-white/90 to-[#aeedd5]/20 border border-emerald-100 flex flex-col justify-between shadow-[0_12px_32px_rgba(44,105,86,0.08)]">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#53dca8] to-[#2c6956] text-white flex items-center justify-center shadow-md mb-4">
              <HardDrive className="w-6 h-6" />
            </div>
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-heading font-bold text-xl text-[#1a1c1d]">
                Free Local Database
              </h2>
              <span className="bg-[#aeedd5] text-[#1a5643] text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                Vercel Ready
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#787586] mb-4">
              Powered by persistent IndexedDB client database. Zero cloud hosting cost, instant photo loading, and full privacy.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={handleExportBackup}
              className="flex-1 py-3 px-4 rounded-full font-heading font-bold text-xs sm:text-sm text-[#1a5643] bg-white border border-[#a8e6cf] shadow-sm hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>Export JSON Backup</span>
            </button>

            <label className="flex-1 py-3 px-4 rounded-full font-heading font-bold text-xs sm:text-sm text-white bg-[#2c6956] shadow-sm hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer text-center">
              <Upload className="w-4 h-4" />
              <span>Import Backup</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportBackup}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Card 3: CAMERA PREFERENCES */}
        <div className="clay-card rounded-[2.5rem] p-6 sm:p-8 bg-white/90 flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#e4deff] text-[#5843d1] flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-lg text-[#1a1c1d]">
                Camera Preferences
              </h2>
              <p className="text-xs text-[#787586]">Customize capture defaults</p>
            </div>
          </div>

          {/* Sound toggle */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-[#f3f3f5]">
            <div className="flex items-center gap-2.5">
              {settings.soundEffects ? <Volume2 className="w-4 h-4 text-[#5843d1]" /> : <VolumeX className="w-4 h-4 text-zinc-400" />}
              <span className="text-xs sm:text-sm font-semibold text-[#1a1c1d]">Shutter Sound & Feedback</span>
            </div>
            <button
              onClick={handleToggleSound}
              className={`w-12 h-7 rounded-full p-1 transition-colors ${
                settings.soundEffects ? 'bg-[#5843d1]' : 'bg-zinc-300'
              }`}
            >
              <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                settings.soundEffects ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </button>
          </div>

          {/* Grid overlay toggle */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-[#f3f3f5]">
            <div className="flex items-center gap-2.5">
              <Grid className="w-4 h-4 text-[#5843d1]" />
              <span className="text-xs sm:text-sm font-semibold text-[#1a1c1d]">Framing Grid Overlay</span>
            </div>
            <button
              onClick={handleToggleGrid}
              className={`w-12 h-7 rounded-full p-1 transition-colors ${
                settings.gridOverlay ? 'bg-[#5843d1]' : 'bg-zinc-300'
              }`}
            >
              <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                settings.gridOverlay ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </button>
          </div>

          {/* Default Timer */}
          <div>
            <span className="text-xs font-bold text-[#787586] uppercase mb-2 block">Default Shutter Timer</span>
            <div className="grid grid-cols-4 gap-2">
              {([0, 3, 5, 10] as const).map(t => (
                <button
                  key={t}
                  onClick={() => handleTimerChange(t)}
                  className={`py-2 rounded-xl text-xs font-bold transition-all ${
                    settings.timerSeconds === t
                      ? 'bg-[#5843d1] text-white shadow-sm'
                      : 'bg-[#f3f3f5] text-zinc-600 hover:bg-[#e4deff]'
                  }`}
                >
                  {t === 0 ? 'Off' : `${t}s`}
                </button>
              ))}
            </div>
          </div>

          {/* Default Flash */}
          <div>
            <span className="text-xs font-bold text-[#787586] uppercase mb-2 block">Default Flash Mode</span>
            <div className="grid grid-cols-3 gap-2">
              {(['auto', 'on', 'off'] as const).map(m => (
                <button
                  key={m}
                  onClick={() => handleFlashChange(m)}
                  className={`py-2 rounded-xl text-xs font-bold transition-all ${
                    settings.flashMode === m
                      ? 'bg-[#fed330] text-[#795503] shadow-sm'
                      : 'bg-[#f3f3f5] text-zinc-600 hover:bg-[#ffeaa7]'
                  }`}
                >
                  {m.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Card 4: INSTANT EMAIL NOTIFICATION HUB */}
        <div className="clay-card rounded-[2.5rem] p-6 sm:p-8 bg-white/90 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-500 to-purple-600 text-white flex items-center justify-center shadow-md">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-heading font-bold text-lg text-[#1a1c1d]">
                  Email Alerts Hub
                </h2>
                <p className="text-xs text-[#787586]">Instant alerts to your inbox</p>
              </div>
            </div>

            {/* Config & status info */}
            <div className="space-y-3 text-xs text-[#474554] bg-[#fdfcff] p-4 rounded-2xl border border-purple-100">
              <div className="flex items-center justify-between pb-2 border-b border-purple-50">
                <span className="text-[#787586] font-semibold">Recipient Mail:</span>
                <span className="font-mono font-bold text-[#5843d1]">uniquegksaurabh@gmail.com</span>
              </div>

              <div className="space-y-1.5 text-[11px]">
                <p className="flex items-center gap-2 text-zinc-700">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span><strong>New Photo Alert:</strong> Triggers when any photo is saved.</span>
                </p>
                <p className="flex items-center gap-2 text-zinc-700">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span><strong>Visitor Online Alert:</strong> Triggers when web is opened.</span>
                </p>
                <p className="flex items-center gap-2 text-zinc-700">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span><strong>Bell Icon Tap:</strong> Triggers on bell ring in Navbar/Chat.</span>
                </p>
              </div>

              {/* Toggle: This device is Saurabh's phone */}
              <div className="pt-2 border-t border-purple-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-[#5843d1]" />
                  <span className="text-[11px] font-bold text-zinc-800">This is My Primary Phone</span>
                </div>
                <button
                  onClick={handleToggleOwnerDevice}
                  className={`w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer ${
                    isOwner ? 'bg-[#5843d1]' : 'bg-zinc-300'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    isOwner ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-between gap-2">
            <button
              onClick={handleSendTestEmail}
              disabled={isTestingMail}
              className="w-full py-2.5 px-4 rounded-xl bg-[#5843d1] hover:bg-[#4834be] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-98 cursor-pointer disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isTestingMail ? 'Sending...' : 'Send Test Mail to Saurabh'}</span>
            </button>
          </div>
        </div>

        {/* Card 5: VERCEL DEPLOYMENT GUIDE */}
        <div className="clay-card rounded-[2.5rem] p-6 sm:p-8 bg-white/90 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-black text-white flex items-center justify-center">
                <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
                  <path d="M12 1L24 22H0L12 1Z" />
                </svg>
              </div>
              <div>
                <h2 className="font-heading font-bold text-lg text-[#1a1c1d]">
                  Vercel Deployment
                </h2>
                <p className="text-xs text-[#787586]">Ready for free instant hosting</p>
              </div>
            </div>

            <div className="space-y-2.5 text-xs text-[#474554] bg-[#f9f9fb] p-4 rounded-2xl border border-zinc-200">
              <p className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#aeedd5] text-[#1a5643] font-bold flex items-center justify-center text-[10px]">1</span>
                <span>Push this code to GitHub repository</span>
              </p>
              <p className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#aeedd5] text-[#1a5643] font-bold flex items-center justify-center text-[10px]">2</span>
                <span>Import into Vercel Dashboard (Framework: Vite)</span>
              </p>
              <p className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#aeedd5] text-[#1a5643] font-bold flex items-center justify-center text-[10px]">3</span>
                <span>Build Command: <code className="bg-zinc-200 px-1 py-0.5 rounded text-[11px]">npm run build</code></span>
              </p>
              <p className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#aeedd5] text-[#1a5643] font-bold flex items-center justify-center text-[10px]">4</span>
                <span>Output Directory: <code className="bg-zinc-200 px-1 py-0.5 rounded text-[11px]">dist</code></span>
              </p>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-between text-xs text-[#787586]">
            <span className="flex items-center gap-1 text-emerald-600 font-bold">
              <ShieldCheck className="w-4 h-4" /> 100% Client Compatible
            </span>
            <button
              onClick={() => onSelectTab('home')}
              className="text-[#5843d1] font-bold hover:underline"
            >
              Back to Home →
            </button>
          </div>
        </div>

      </div>

      {/* Footer */}
      <footer className="w-full max-w-4xl mt-12 pt-6 pb-20 sm:pb-24 border-t border-[#c9c4d7]/40 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#787586] relative z-10">
        <div className="flex items-center gap-2">
          <span className="text-[#5843d1] font-bold">Buddy to Buddy</span>
          <span>•</span>
          <span className="px-2.5 py-1 rounded-full bg-[#f2f0ff] text-[#5843d1] font-semibold border border-[#dcd7f9]">
            The web made by Saurabh ✨
          </span>
        </div>
        <div className="flex items-center gap-6">
          <button onClick={() => onSelectTab('chat')} className="hover:text-[#5843d1] transition-colors">Privacy</button>
          <button onClick={() => onSelectTab('chat')} className="hover:text-[#5843d1] transition-colors">Terms</button>
          <button onClick={() => onSelectTab('chat')} className="hover:text-[#5843d1] transition-colors">Contact</button>
        </div>
      </footer>

    </div>
  );
};
