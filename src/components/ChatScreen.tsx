import React, { useState, useEffect, useRef } from 'react';
import { soundEngine } from '../utils/audio';
import { 
  Send, 
  Sparkles, 
  Smile, 
  CheckCheck, 
  Cloud, 
  Clock, 
  Smartphone, 
  Monitor, 
  Activity, 
  History, 
  ChevronDown, 
  ChevronUp, 
  Timer,
  Calendar,
  Radio,
  Trash2,
  User,
  MessageCircle,
  AlertTriangle,
  Heart
} from 'lucide-react';
import { db } from '../services/firebase';
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  onSnapshot, 
  addDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  writeBatch 
} from 'firebase/firestore';
import { 
  subscribeToWebActivity, 
  subscribeToRecentSessions, 
  getTimeElapsedString, 
  WebActivityData, 
  WebSessionLog,
  formatTimeOnly,
  getAnonymousClientId 
} from '../services/presence';

interface ChatMessage {
  id: string;
  senderId: string; // Anonymous Client ID
  senderName?: string;
  senderRole?: 'user' | 'buddy';
  text: string;
  timestamp: string;
  createdAt: number;
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: '1',
    senderId: 'system_buddy',
    senderRole: 'buddy',
    senderName: 'Buddy ✨',
    text: "Hey! Welcome to your private Chat Space. Messages sent from your device will appear on your side, and incoming messages or replies appear on the other side! 💖",
    timestamp: 'Just now',
    createdAt: Date.now() - 60000
  }
];

export const ChatScreen: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [webActivity, setWebActivity] = useState<WebActivityData | null>(null);
  const [sessions, setSessions] = useState<WebSessionLog[]>([]);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [elapsedInfo, setElapsedInfo] = useState<{ text: string; isOnline: boolean }>({ text: 'Active now', isOnline: true });
  
  // Anonymous ID for this device/browser
  const [myClientId, setMyClientId] = useState<string>('');
  
  // Delete confirm modal state
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null);
  const [showClearAllModal, setShowClearAllModal] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = getAnonymousClientId();
    setMyClientId(id);
  }, []);

  // 1. Subscribe to Live Firestore Web Activity (Last opened tracker)
  useEffect(() => {
    const unsubPresence = subscribeToWebActivity((activity) => {
      if (activity) {
        setWebActivity(activity);
        setElapsedInfo(getTimeElapsedString(activity.lastActiveTimestamp));
      }
    });

    // Subscribe to last 10 session logs
    const unsubSessions = subscribeToRecentSessions((logs) => {
      setSessions(logs);
    });

    // Update relative elapsed time every 10 seconds
    const interval = setInterval(() => {
      if (webActivity?.lastActiveTimestamp) {
        setElapsedInfo(getTimeElapsedString(webActivity.lastActiveTimestamp));
      }
    }, 10000);

    return () => {
      unsubPresence();
      unsubSessions();
      clearInterval(interval);
    };
  }, [webActivity?.lastActiveTimestamp]);

  // 2. Sync chat messages with Cloud Firestore (Real-time 2-way sync)
  useEffect(() => {
    const chatCol = collection(db, 'chat_messages');
    const q = query(chatCol, orderBy('createdAt', 'asc'), limit(100));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const loadedMessages: ChatMessage[] = [];
        snapshot.forEach(docSnap => {
          const data = docSnap.data();
          loadedMessages.push({
            id: docSnap.id,
            senderId: data.senderId || (data.sender === 'user' ? 'legacy_user' : 'system_buddy'),
            senderRole: data.senderRole || data.sender || 'user',
            senderName: data.senderName || (data.sender === 'buddy' ? 'Buddy' : 'Anonymous'),
            text: data.text || '',
            timestamp: data.timestamp || 'Just now',
            createdAt: data.createdAt || Date.now()
          });
        });
        setMessages(loadedMessages);
      } else {
        setMessages(INITIAL_MESSAGES);
      }
    }, (error) => {
      console.warn('Firestore chat onSnapshot error:', error);
    });

    return () => unsubscribe();
  }, []);

  // Auto scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    soundEngine.playPop();
    const textToSend = inputText.trim();
    const currentClientId = myClientId || getAnonymousClientId();
    const now = Date.now();
    const timeFormatted = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

    const newMsg = {
      senderId: currentClientId,
      senderRole: 'user' as const,
      senderName: 'You',
      text: textToSend,
      timestamp: timeFormatted,
      createdAt: now
    };

    setInputText('');

    // Save to Cloud Firestore
    try {
      await addDoc(collection(db, 'chat_messages'), newMsg);
    } catch (err) {
      console.warn('Failed to save chat to Firestore:', err);
    }
  };

  // Delete a single message
  const handleDeleteMessage = async (msgId: string) => {
    try {
      soundEngine.playPop();
      await deleteDoc(doc(db, 'chat_messages', msgId));
      setMessageToDelete(null);
    } catch (err) {
      console.warn('Failed to delete message:', err);
      // Fallback local remove
      setMessages(prev => prev.filter(m => m.id !== msgId));
      setMessageToDelete(null);
    }
  };

  // Clear all chat history
  const handleClearAllChat = async () => {
    try {
      soundEngine.playChime();
      const snapshot = await getDocs(collection(db, 'chat_messages'));
      const batch = writeBatch(db);
      snapshot.forEach(docSnap => {
        batch.delete(docSnap.ref);
      });
      await batch.commit();
      setMessages([]);
      setShowClearAllModal(false);
    } catch (err) {
      console.warn('Failed to clear chat batch:', err);
      setMessages([]);
      setShowClearAllModal(false);
    }
  };

  return (
    <div id="chat-screen" className="w-full min-h-screen pt-24 pb-36 px-4 sm:px-8 max-w-3xl mx-auto flex flex-col justify-between">
      
      {/* Header & Activity Log Section */}
      <div className="pt-2 pb-4 flex flex-col gap-3 border-b border-zinc-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#5843d1] to-[#8d79ff] flex items-center justify-center text-white shadow-md relative">
              <Sparkles className="w-6 h-6" />
              <span 
                className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 border-2 border-white rounded-full ${
                  elapsedInfo.isOnline ? 'bg-[#53dca8] animate-pulse' : 'bg-amber-400'
                }`} 
              />
            </div>
            <div>
              <h1 className="font-heading font-bold text-xl text-[#1a1c1d] flex items-center gap-2">
                Live Chat &amp; Presence
              </h1>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-semibold flex items-center gap-1.5 ${
                  elapsedInfo.isOnline ? 'text-emerald-600' : 'text-zinc-600'
                }`}>
                  <span className={`inline-block w-2 h-2 rounded-full ${
                    elapsedInfo.isOnline ? 'bg-emerald-500 animate-ping' : 'bg-zinc-400'
                  }`} />
                  {elapsedInfo.isOnline ? '● Online & Active on Web' : `○ Last active: ${elapsedInfo.text}`}
                </span>
              </div>
            </div>
          </div>

          {/* Device ID Badge & Clear Chat Action */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:inline-flex items-center gap-1 bg-[#f4f2ff] border border-[#e2ddfc] text-[#5843d1] px-2.5 py-1 rounded-full text-[11px] font-bold">
              <User className="w-3 h-3 text-[#5843d1]" />
              <span className="font-mono">{myClientId ? myClientId.substring(0, 10) : 'Guest'}...</span>
            </div>

            {messages.length > 0 && (
              <button
                onClick={() => setShowClearAllModal(true)}
                title="Clear All Chat History"
                className="p-2 rounded-xl bg-zinc-100 hover:bg-red-50 text-zinc-500 hover:text-red-600 transition-colors text-xs font-bold flex items-center gap-1 cursor-pointer border border-zinc-200/60"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline text-[11px]">Clear</span>
              </button>
            )}
          </div>
        </div>

        {/* Live Active Tracker Card */}
        <div className="w-full bg-gradient-to-r from-[#f5f3ff] via-[#faf8ff] to-[#eef9f5] rounded-2xl p-3.5 border border-[#e0dbff] flex flex-wrap items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#5843d1]/10 flex items-center justify-center text-[#5843d1]">
              <Clock className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-bold text-[#5843d1] uppercase tracking-wider flex items-center gap-1">
                <Activity className="w-3 h-3 inline" /> Last Web Opened Time
              </span>
              <span className="text-xs font-extrabold text-[#1a1c1d]">
                {webActivity?.lastOpenedFormatted || 'Today (Active)'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 ${
              elapsedInfo.isOnline 
                ? 'bg-emerald-100/90 text-emerald-800 border border-emerald-200' 
                : 'bg-amber-100/90 text-amber-800 border border-amber-200'
            }`}>
              <span className={`w-2 h-2 rounded-full ${elapsedInfo.isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              {elapsedInfo.isOnline ? 'Active Now' : elapsedInfo.text}
            </div>

            <button
              onClick={() => {
                soundEngine.playPop();
                setShowHistory(!showHistory);
              }}
              className="px-2.5 py-1 rounded-lg bg-[#5843d1] text-white hover:bg-[#4834be] text-[11px] font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <History className="w-3 h-3" />
              <span>Last 10 Visits</span>
              {showHistory ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>
        </div>

        {/* Accordion: Last 10 Web Logins & Active Duration History */}
        {showHistory && (
          <div className="w-full bg-white rounded-2xl p-4 border border-purple-200 shadow-sm animate-in fade-in slide-in-from-top duration-200">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#5843d1]" />
                <h3 className="text-xs font-extrabold text-[#1a1c1d] uppercase tracking-wider">
                  Recent Web Sessions (Last 10 Open &amp; Duration Logs)
                </h3>
              </div>
              <span className="text-[11px] text-[#5843d1] bg-[#f0edff] px-2 py-0.5 rounded-full font-bold">
                {sessions.length} recorded
              </span>
            </div>

            {sessions.length === 0 ? (
              <p className="text-xs text-zinc-500 text-center py-3">
                Tracking initial sessions... Open web or refresh to see detailed history.
              </p>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {sessions.map((sess, idx) => {
                  const isCurrent = idx === 0 && (Date.now() - sess.endTime < 60000);
                  const isThisDevice = myClientId && sess.clientId === myClientId;
                  return (
                    <div 
                      key={sess.id || idx}
                      className={`p-2.5 rounded-xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition-colors ${
                        isCurrent 
                          ? 'bg-emerald-50/70 border-emerald-200' 
                          : 'bg-zinc-50/80 border-zinc-100 hover:bg-purple-50/40'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-white border border-zinc-200 text-[10px] font-bold text-zinc-600 flex items-center justify-center shrink-0">
                          #{idx + 1}
                        </span>
                        <div>
                          <div className="font-bold text-[#1a1c1d] flex items-center gap-1.5">
                            <span>{sess.startTimeFormatted}</span>
                            <span className="text-zinc-400 font-normal">➔</span>
                            <span className={isCurrent ? 'text-emerald-700 font-bold' : 'text-zinc-700'}>
                              {isCurrent ? 'Now (In Progress)' : formatTimeOnly(new Date(sess.endTime))}
                            </span>
                          </div>
                          <div className="text-[10px] text-zinc-500 flex items-center gap-2 mt-0.5">
                            <span className="flex items-center gap-1">
                              {sess.deviceType === 'Mobile' ? <Smartphone className="w-2.5 h-2.5" /> : <Monitor className="w-2.5 h-2.5" />}
                              {sess.deviceType || 'Web'}
                            </span>
                            <span>•</span>
                            <span className={`font-mono text-[9px] ${isThisDevice ? 'text-[#5843d1] font-bold' : 'text-zinc-400'}`}>
                              {isThisDevice ? '✨ This Device' : `ID: ${sess.clientId.substring(0, 10)}...`}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-center">
                        <div className="px-2 py-0.5 rounded-md bg-white border border-purple-100 text-[#5843d1] font-bold text-[11px] flex items-center gap-1 shadow-2xs">
                          <Timer className="w-3 h-3 text-[#5843d1]" />
                          <span>Stayed: {sess.durationFormatted}</span>
                        </div>
                        {isCurrent && (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white font-bold text-[10px] flex items-center gap-1">
                            <Radio className="w-2.5 h-2.5 animate-pulse" /> Live
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>

      {/* Message Stream: Split by Anonymous Client ID */}
      <div className="flex-1 py-4 space-y-4 overflow-y-auto max-h-[52vh] min-h-[260px] px-1">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-12 text-zinc-400 space-y-2">
            <MessageCircle className="w-10 h-10 stroke-1 text-zinc-300" />
            <p className="text-sm font-medium">No messages yet</p>
            <p className="text-xs text-zinc-400 max-w-xs">Type a message below to start chatting across devices in real-time!</p>
          </div>
        ) : (
          messages.map(msg => {
            // Is this message sent by current anonymous device?
            const isMe = myClientId && msg.senderId === myClientId;
            const isBuddySystem = msg.senderId === 'system_buddy';

            return (
              <div
                key={msg.id}
                className={`group flex flex-col ${isMe ? 'items-end' : 'items-start'} relative transition-all`}
              >
                {/* Sender badge if not me */}
                {!isMe && (
                  <span className="text-[10px] font-bold text-[#5843d1] mb-1 px-2 flex items-center gap-1">
                    {isBuddySystem ? (
                      <span className="flex items-center gap-1 text-[#8d79ff]">
                        <Sparkles className="w-2.5 h-2.5" /> Buddy
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-zinc-500">
                        <Smartphone className="w-2.5 h-2.5 text-zinc-400" /> 
                        {msg.senderName || `User (${msg.senderId.substring(0, 7)})`}
                      </span>
                    )}
                  </span>
                )}

                {/* Message Bubble + Delete button */}
                <div className={`relative max-w-[84%] sm:max-w-md flex items-center gap-1.5 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div
                    className={`p-4 rounded-[1.75rem] text-sm leading-relaxed ${
                      isMe
                        ? 'clay-btn-primary rounded-br-xs text-white shadow-[0_6px_16px_rgba(88,67,209,0.25)]'
                        : isBuddySystem
                        ? 'bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200/70 text-[#1a1c1d] rounded-bl-xs shadow-xs'
                        : 'clay-card rounded-bl-xs bg-white text-[#1a1c1d] shadow-[0_4px_12px_rgba(0,0,0,0.04)] border border-zinc-100'
                    }`}
                  >
                    {msg.text}
                  </div>

                  {/* Individual Delete Button (Appears on hover or touch) */}
                  <button
                    onClick={() => setMessageToDelete(msg.id)}
                    title="Delete message"
                    className="opacity-40 group-hover:opacity-100 hover:opacity-100 p-1.5 rounded-full hover:bg-red-50 text-zinc-400 hover:text-red-500 transition-all cursor-pointer shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Timestamp & Seen check */}
                <span className="text-[10px] text-[#787586] mt-1 px-2 flex items-center gap-1">
                  {msg.timestamp}
                  {isMe && <CheckCheck className="w-3.5 h-3.5 text-[#5843d1]" />}
                </span>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <form onSubmit={handleSendMessage} className="pt-2 flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type your message..."
            className="w-full bg-white border border-zinc-200/80 rounded-full py-3.5 pl-5 pr-12 text-sm text-[#1a1c1d] focus:outline-none focus:ring-2 focus:ring-[#5843d1]/30 focus:border-[#5843d1] transition-all shadow-xs"
          />
          <button
            type="button"
            onClick={() => setInputText(prev => prev + ' 💖')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-pink-500 transition-colors p-1"
          >
            <Smile className="w-5 h-5" />
          </button>
        </div>

        <button
          type="submit"
          disabled={!inputText.trim()}
          className="clay-btn-primary w-12 h-12 rounded-full flex items-center justify-center text-white disabled:opacity-40 disabled:cursor-not-allowed shrink-0 transition-transform active:scale-95 shadow-md cursor-pointer"
        >
          <Send className="w-5 h-5 ml-0.5" />
        </button>
      </form>

      {/* Footer Credit */}
      <div className="w-full mt-4 pt-3 border-t border-zinc-200/60 flex items-center justify-center text-xs text-[#787586]">
        <span className="px-2.5 py-0.5 rounded-full bg-[#f2f0ff] text-[#5843d1] font-semibold border border-[#dcd7f9]">
          The web made by Saurabh ✨
        </span>
      </div>

      {/* Single Message Delete Confirmation Modal */}
      {messageToDelete && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-xs w-full shadow-2xl border border-zinc-100 flex flex-col items-center text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-zinc-900">Delete Message?</h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Are you sure you want to delete this message? This action cannot be undone.
            </p>
            <div className="flex items-center gap-2 w-full pt-2">
              <button
                onClick={() => setMessageToDelete(null)}
                className="flex-1 py-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteMessage(messageToDelete)}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear All Messages Modal */}
      {showClearAllModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-xs w-full shadow-2xl border border-zinc-100 flex flex-col items-center text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-zinc-900">Clear All Chat?</h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              This will permanently delete all messages in this chat room for both devices.
            </p>
            <div className="flex items-center gap-2 w-full pt-2">
              <button
                onClick={() => setShowClearAllModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleClearAllChat()}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
