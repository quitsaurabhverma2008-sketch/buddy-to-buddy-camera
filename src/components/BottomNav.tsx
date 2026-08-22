import React from 'react';
import { NavigationTab } from '../types';
import { soundEngine } from '../utils/audio';
import { Home, BookOpen, MessageCircle } from 'lucide-react';

interface BottomNavProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  photoCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onSelectTab,
  photoCount = 0
}) => {
  const handleTabClick = (tab: NavigationTab) => {
    soundEngine.playPop();
    onSelectTab(tab);
  };

  const navItems: { id: NavigationTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'home', label: 'Home', icon: <Home className="w-5 h-5 sm:w-6 sm:h-6" /> },
    { id: 'memories', label: 'Memories', icon: <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" />, badge: photoCount },
    { id: 'chat', label: 'Chat', icon: <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6" /> },
  ];

  return (
    <nav id="bottom-navigation-bar" className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-auto">
      <div className="clay-card px-4 sm:px-6 py-2 sm:py-2.5 flex items-center gap-4 sm:gap-6 bg-white/80 backdrop-blur-2xl border border-white/70 shadow-[0_12px_36px_rgba(90,70,211,0.12)] rounded-full">
        {navItems.map((item) => {
          const isActive = currentTab === item.id || (item.id === 'tools' && currentTab === 'settings');
          return (
            <button
              key={item.id}
              id={`bottom-nav-${item.id}`}
              onClick={() => handleTabClick(item.id)}
              className={`flex flex-col items-center gap-1 transition-all duration-200 relative group px-2 py-1 rounded-2xl ${
                isActive
                  ? 'text-[#5843d1] scale-110'
                  : 'text-[#787586] hover:text-[#5843d1] hover:scale-105'
              }`}
            >
              <div className="relative flex items-center justify-center">
                <div className={`${isActive ? 'stroke-[2.5]' : 'stroke-2'}`}>
                  {item.icon}
                </div>

                {Boolean(item.badge && item.badge > 0) && (
                  <span className="absolute -top-1.5 -right-2.5 bg-[#5843d1] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
                    {item.badge}
                  </span>
                )}
              </div>

              <span className={`text-[10px] font-heading font-semibold uppercase tracking-wider ${
                isActive ? 'text-[#5843d1] font-bold' : 'text-[#787586]'
              }`}>
                {item.label}
              </span>

              {isActive && (
                <span className="absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-[#5843d1] shadow-[0_0_6px_rgba(88,67,209,0.6)]" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
