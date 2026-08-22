import React, { useState } from 'react';
import { NavigationTab } from '../types';
import { ArrowLeft, Camera, Heart, Sparkles, User } from 'lucide-react';
import { soundEngine } from '../utils/audio';

interface NavbarProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  photoCount?: number;
  onOpenQuickCapture?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
}) => {
  const [imgError, setImgError] = useState(false);
  const logoUrl = 'https://lh3.googleusercontent.com/aida/AEtjO1XK7AozNef2VjvEkYl9rDMHtR_HcBB7_nuuITdilrVBuev2dlkmt1X9zW9RFgK6vdgOOgjZfJqQcQBxQLhrR31y1J1uervAvu2oakO2u67Z2pqN5cVruL19AeUqyy4PBQmMOog3RrRdAAKHGZO0pWLCY0zSZTAj2ONtF717xfkWfgb9OVhYpZp9-ly0ye5ro9WYDDISe6dUZvBNKozYM2mj002IVzi5xmQKZIM27OqNRWb5e2tYnu3S8w';

  const handleNav = (tab: NavigationTab) => {
    soundEngine.playPop();
    onSelectTab(tab);
  };

  const isCamera = currentTab === 'capture';

  return (
    <header 
      id="main-header" 
      className={`fixed top-0 w-full z-40 transition-colors duration-300 ${
        isCamera 
          ? 'bg-transparent border-none shadow-none pointer-events-none' 
          : 'bg-[#f9f9fb]/85 backdrop-blur-2xl border-b border-white/80 shadow-[0_4px_24px_rgba(90,70,211,0.06)]'
      }`}
    >
      <div className="h-20 max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 flex items-center justify-between pointer-events-auto">
        
        {/* Left Action: Back Arrow in Camera Mode OR Brand Logo in Normal Mode */}
        {isCamera ? (
          <button
            id="brand-logo-btn"
            onClick={() => handleNav('home')}
            className="w-11 h-11 rounded-2xl bg-black/40 hover:bg-black/60 active:scale-95 border border-white/30 text-white flex items-center justify-center shadow-lg transition-all hover:scale-105 group pointer-events-auto cursor-pointer"
            title="Back to Home"
          >
            <div className="w-8 h-8 rounded-xl flex items-center justify-center">
              <ArrowLeft className="w-5 h-5 text-white stroke-[2.5]" />
            </div>
          </button>
        ) : (
          <button 
            id="brand-logo-btn"
            onClick={() => handleNav('home')}
            className="flex items-center gap-3 group text-left transition-transform hover:scale-[1.02] active:scale-98 cursor-pointer select-none"
          >
            {/* Logo Icon / Avatar */}
            <div className="relative w-11 h-11 rounded-2xl flex items-center justify-center bg-gradient-to-tr from-[#5843d1] via-[#7864eb] to-[#a8e6cf] p-0.5 shadow-[0_4px_14px_rgba(88,67,209,0.22)] overflow-hidden transition-all group-hover:shadow-[0_6px_20px_rgba(88,67,209,0.35)]">
              <div className="w-full h-full rounded-[14px] bg-white flex items-center justify-center overflow-hidden relative">
                {!imgError ? (
                  <img 
                    src={logoUrl} 
                    alt="Buddy to Buddy Logo" 
                    onError={() => setImgError(true)}
                    className="w-9 h-9 object-contain transition-transform group-hover:scale-110 group-hover:rotate-3"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#f2f0ff] to-[#e4deff] text-[#5843d1]">
                    <Camera className="w-6 h-6 text-[#5843d1] stroke-[2.2]" />
                  </div>
                )}
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#a8e6cf] rounded-full border-2 border-white" />
              </div>
            </div>

            {/* Brand Title & Tagline */}
            <div className="flex flex-col">
              <span className="font-heading font-extrabold text-xl sm:text-2xl text-[#5843d1] tracking-tight flex items-center gap-1.5 leading-tight">
                Buddy to Buddy
                <Sparkles className="w-4 h-4 text-[#ffd3b6] fill-[#ffd3b6] animate-pulse" />
              </span>
              <span className="text-[11px] font-semibold text-[#787586] tracking-wide flex items-center gap-1">
                Cherish Moments <Heart className="w-2.5 h-2.5 text-[#ff8b94] fill-[#ff8b94] inline" />
              </span>
            </div>
          </button>
        )}

        {/* Right Action Buttons (Hidden in Camera View) */}
        {!isCamera && (
          <div className="flex items-center gap-3">
            {/* User Profile Badge */}
            <div
              id="nav-user-avatar"
              title="Profile"
              className="relative w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#5843d1] to-[#8d79ff] flex items-center justify-center text-white shadow-[0_6px_16px_rgba(88,67,209,0.25),inset_2px_2px_4px_rgba(255,255,255,0.5),inset_-2px_-2px_4px_rgba(0,0,0,0.15)] border border-white/40 select-none cursor-pointer hover:scale-105 active:scale-95 transition-all"
            >
              <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center border border-white/30 shadow-inner">
                <User className="w-4 h-4 text-white drop-shadow-sm stroke-[2.5]" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#a8e6cf] border-2 border-white" />
            </div>
          </div>
        )}

      </div>
    </header>
  );
};
