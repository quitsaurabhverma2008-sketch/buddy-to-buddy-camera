import React, { useState, useEffect } from 'react';
import { Lock, ArrowRight, Eye, EyeOff, KeyRound } from 'lucide-react';
import { soundEngine } from '../utils/audio';

interface PasswordGateProps {
  onUnlock: () => void;
}

export const PasswordGate: React.FC<PasswordGateProps> = ({ onUnlock }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isShaking, setIsShaking] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanInput = password.trim().toLowerCase();

    if (cleanInput === 'pagalworld') {
      soundEngine.playChime();
      setError(false);
      sessionStorage.setItem('cherish_app_unlocked', 'true');
      onUnlock();
    } else {
      soundEngine.playPop();
      setError(true);
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
    }
  };

  return (
    <div className="min-h-screen w-full bg-white flex flex-col items-center justify-center px-4 selection:bg-purple-100">
      <div className="w-full max-w-sm flex flex-col items-center text-center">
        
        {/* Minimalist Lock Icon */}
        <div className="w-16 h-16 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-center text-zinc-700 mb-6 shadow-xs">
          <KeyRound className="w-7 h-7 text-zinc-800" />
        </div>

        {/* Heading */}
        <h1 className="text-2xl font-bold text-zinc-900 tracking-tight mb-2 font-heading">
          Enter Password
        </h1>
        <p className="text-xs text-zinc-400 mb-8 max-w-xs leading-relaxed">
          Please enter the password to access this page
        </p>

        {/* Password Form */}
        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <div className="relative w-full">
            <input
              type={showPassword ? 'text' : 'password'}
              autoFocus
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError(false);
              }}
              placeholder="Enter password..."
              className={`w-full bg-zinc-50 border ${
                error 
                  ? 'border-red-400 focus:ring-2 focus:ring-red-200' 
                  : 'border-zinc-200/90 focus:border-zinc-800 focus:ring-2 focus:ring-zinc-100'
              } rounded-2xl py-3.5 pl-4 pr-12 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none transition-all ${
                isShaking ? 'animate-bounce' : ''
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors p-1"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {error && (
            <p className="text-xs text-red-500 font-medium tracking-wide animate-in fade-in">
              Incorrect password. Please try again.
            </p>
          )}

          <button
            type="submit"
            disabled={!password.trim()}
            className="w-full bg-zinc-900 hover:bg-black text-white font-semibold py-3.5 px-6 rounded-2xl text-sm flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <span>Continue</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

      </div>
    </div>
  );
};
