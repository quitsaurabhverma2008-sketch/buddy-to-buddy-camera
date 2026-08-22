import React from 'react';
import { Trash2, AlertTriangle, X, RefreshCw } from 'lucide-react';
import { soundEngine } from '../utils/audio';

interface DeleteAllModalProps {
  isOpen: boolean;
  photoCount: number;
  onClose: () => void;
  onConfirmDeleteAll: () => void;
  onResetDemo: () => void;
}

export const DeleteAllModal: React.FC<DeleteAllModalProps> = ({
  isOpen,
  photoCount,
  onClose,
  onConfirmDeleteAll,
  onResetDemo
}) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    soundEngine.playDelete();
    onConfirmDeleteAll();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="clay-card w-full max-w-md p-6 sm:p-8 bg-white text-[#1a1c1d] rounded-[3rem] shadow-2xl flex flex-col items-center text-center relative animate-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 w-9 h-9 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500 hover:bg-zinc-200 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* 3D Trash Icon Indicator */}
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-[#ff8a93] to-[#ba1a1a] flex items-center justify-center text-white shadow-[0_12px_24px_rgba(186,26,26,0.3),inset_3px_3px_6px_rgba(255,255,255,0.6)] mb-4">
          <Trash2 className="w-10 h-10" />
        </div>

        <h2 className="font-heading font-bold text-2xl text-[#1a1c1d] mb-2">
          Delete All Photos?
        </h2>

        <p className="text-sm text-[#787586] mb-6 max-w-xs">
          This will permanently wipe all <span className="font-bold text-red-600">{photoCount} pictures</span> from the Cloud Database and local storage to keep your database storage free and clean.
        </p>

        {/* Action Buttons */}
        <div className="w-full flex flex-col gap-3">
          
          {/* Main Delete All Confirm Button */}
          <button
            id="confirm-delete-all-btn"
            onClick={handleConfirm}
            className="w-full py-3.5 rounded-full font-heading font-bold text-sm text-white bg-gradient-to-r from-red-600 to-rose-500 shadow-[0_8px_20px_rgba(225,29,72,0.35)] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            <span>Yes, Delete Everything</span>
          </button>

          {/* Reset Starter Photos Option */}
          <button
            onClick={() => {
              soundEngine.playPop();
              onResetDemo();
              onClose();
            }}
            className="w-full py-3 rounded-full font-heading font-semibold text-xs text-[#5843d1] bg-[#e4deff]/40 hover:bg-[#e4deff]/70 transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Demo Starter Photos</span>
          </button>

          {/* Cancel Button */}
          <button
            onClick={onClose}
            className="w-full py-3 rounded-full font-heading font-semibold text-xs text-zinc-600 bg-zinc-100 hover:bg-zinc-200 transition-colors"
          >
            Cancel
          </button>

        </div>

      </div>
    </div>
  );
};
