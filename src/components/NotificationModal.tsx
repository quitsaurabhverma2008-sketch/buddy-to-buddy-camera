import React, { useState } from 'react';
import { soundEngine } from '../utils/audio';
import { sendNotificationEmail } from '../services/emailNotification';
import { Bell, Mail, Send, CheckCircle2, AlertCircle, Loader2, X, Sparkles } from 'lucide-react';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  photosCount: number;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  photosCount
}) => {
  const [senderName, setSenderName] = useState('Buddy App Companion');
  const [customNote, setCustomNote] = useState('📸 Hey! Someone just tapped the notification bell on your Buddy to Buddy app. Everything is running smoothly!');
  const [isSending, setIsSending] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const targetEmail = 'uniquegksaurabh@gmail.com';

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.playPop();
    setIsSending(true);
    setStatus('idle');
    setErrorMessage('');

    try {
      const result = await sendNotificationEmail({
        toEmail: targetEmail,
        senderName: senderName.trim() || 'Buddy App User',
        subject: `🔔 Buddy App Live Alert: Photos & Activity (${photosCount} Memories)`,
        message: customNote.trim(),
        photoCount: photosCount,
        timestamp: new Date().toLocaleString()
      });

      if (result.success) {
        soundEngine.playChime();
        setStatus('success');
      } else {
        setStatus('error');
        setErrorMessage(result.error || 'Failed to send email. Please ensure Google login is authorized.');
      }
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.message || 'An unexpected error occurred.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
      <div 
        className="clay-card rounded-[2.5rem] p-6 sm:p-8 bg-white/95 max-w-md w-full shadow-[0_20px_50px_rgba(88,67,209,0.25)] border border-white relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-9 h-9 rounded-full bg-zinc-100 text-zinc-500 hover:bg-zinc-200 flex items-center justify-center transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#ffeaa7] to-[#fed330] flex items-center justify-center text-[#795503] shadow-md">
            <Bell className="w-6 h-6 animate-bounce" />
          </div>
          <div>
            <h2 className="font-heading font-bold text-xl text-[#1a1c1d]">
              Send Email Notification
            </h2>
            <p className="text-xs text-[#787586] flex items-center gap-1 mt-0.5">
              <Mail className="w-3 h-3 text-[#5843d1]" />
              Direct to <span className="font-semibold text-[#5843d1]">{targetEmail}</span>
            </p>
          </div>
        </div>

        {status === 'success' ? (
          <div className="py-6 flex flex-col items-center text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="font-heading font-bold text-lg text-emerald-800">
              Notification Sent Successfully!
            </h3>
            <p className="text-xs text-zinc-600 max-w-xs">
              Live alert email has been delivered to <strong>{targetEmail}</strong> via Google Workspace Gmail API.
            </p>
            <button
              onClick={onClose}
              className="mt-4 px-6 py-2.5 rounded-full clay-btn-primary text-white text-xs font-bold shadow-md cursor-pointer hover:scale-105 transition-transform"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSendEmail} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#1a1c1d] mb-1">
                Sender Name / Identifier
              </label>
              <input
                type="text"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-xs font-medium text-[#1a1c1d] focus:outline-none focus:border-[#5843d1]"
                placeholder="Your Name / Buddy App"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1a1c1d] mb-1">
                Notification Message
              </label>
              <textarea
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                rows={3}
                className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-xs font-medium text-[#1a1c1d] focus:outline-none focus:border-[#5843d1] resize-none"
                placeholder="Enter custom message to send..."
                required
              />
            </div>

            <div className="bg-[#f5f3ff] border border-[#e4deff] rounded-xl p-3 flex items-center justify-between text-xs text-[#5843d1]">
              <span className="flex items-center gap-1.5 font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                Active Gallery Count
              </span>
              <span className="font-bold bg-[#e4deff] px-2 py-0.5 rounded-md">
                {photosCount} Photos
              </span>
            </div>

            {status === 'error' && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-xs text-red-600">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-600 bg-zinc-100 hover:bg-zinc-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSending}
                className="px-5 py-2 rounded-xl clay-btn-primary text-white text-xs font-bold flex items-center gap-2 shadow-md hover:scale-105 active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
              >
                {isSending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Sending Mail...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Send to {targetEmail}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
