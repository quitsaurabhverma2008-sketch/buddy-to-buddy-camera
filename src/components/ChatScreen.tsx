import React, { useState, useEffect } from 'react';
import { soundEngine } from '../utils/audio';
import { 
  Send, 
  Sparkles, 
  Smile, 
  Bot, 
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
  Radio
} from 'lucide-react';
import { db } from '../services/firebase';
import { collection, query, orderBy, limit, onSnapshot, addDoc, getDocs, writeBatch, doc } from 'firebase/firestore';
import { 
  subscribeToWebActivity, 
  subscribeToRecentSessions, 
  getTimeElapsedString, 
  WebActivityData, 
  WebSessionLog,
  formatTimeOnly 
} from '../services/presence';

interface ChatMessage {
  id: string;
  sender: 'user' | 'buddy';
  text: string;
  timestamp: string;
  createdAt?: number;
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: '1',
    sender: 'buddy',
    text: "Hey Saurabh! ✨ I'm your Buddy Companion. Ask me anything, share your memories, or track your live activity!",
    timestamp: 'Just now'
  }
];

export const ChatScreen: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [webActivity, setWebActivity] = useState<WebActivityData | null>(null);
  const [sessions, setSessions] = useState<WebSessionLog[]>([]);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [elapsedInfo, setElapsedInfo] = useState<{ text: string; isOnline: boolean }>({ text: 'Active now', isOnline: true });

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

  // 2. Sync chat messages with Cloud Firestore
  useEffect(() => {
    async function initChat() {
      try {
        const chatCol = collection(db, 'chat_messages');
        const q = query(chatCol, orderBy('createdAt', 'asc'), limit(50));
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
          if (!snapshot.empty) {
            const loadedMessages: ChatMessage[] = [];
            snapshot.forEach(docSnap => {
              const data = docSnap.data();
              loadedMessages.push({
                id: docSnap.id,
                sender: data.sender || 'buddy',
                text: data.text || '',
                timestamp: data.timestamp || 'Just now',
                createdAt: data.createdAt
              });
            });
            setMessages(loadedMessages);
          } else {
            // Seed initial message to cloud
            INITIAL_MESSAGES.forEach(async (m) => {
              try {
                await addDoc(chatCol, { ...m, createdAt: Date.now() });
              } catch {}
            });
          }
        }, (error) => {
          console.warn('Firestore chat onSnapshot fallback to local state:', error);
        });

        return () => unsubscribe();
      } catch (e) {
        console.warn('Chat init error:', e);
      }
    }

    initChat();
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    soundEngine.playPop();
    const textToSend = inputText.trim();

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      createdAt: Date.now()
    };

    setInputText('');
    setMessages(prev => [...prev, userMsg]);

    // Save user message to Cloud Firestore
    try {
      await addDoc(collection(db, 'chat_messages'), userMsg);
    } catch (err) {
      console.warn('Failed to save chat to Firestore:', err);
    }

    // Buddy automated response
    setTimeout(async () => {
      soundEngine.playChime();
      const buddyResponses = [
        "Aww, that's truly lovely! Keep cherishing these moments 💖",
        "Your sanctuary is looking so vibrant! Love seeing your new snaps. ✨",
        "All your photos and memories are safe in the cloud database! 🌿",
        "Every small moment of comfort counts. Hope you have a wonderful day ahead! ☀️"
      ];
      const randomResponse = buddyResponses[Math.floor(Math.random() * buddyResponses.length)];
      
      const buddyMsg: ChatMessage = {
        id: `buddy-${Date.now()}`,
        sender: 'buddy',
        text: randomResponse,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        createdAt: Date.now()
      };

      setMessages(prev => [...prev, buddyMsg]);
      try {
        await addDoc(collection(db, 'chat_messages'), buddyMsg);
      } catch (err) {
        console.warn('Failed to save buddy reply to Firestore:', err);
      }
    }, 800);
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
                Buddy Companion
              </h1>
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

          {/* Cloud Synced Badge */}
          <div className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200/80 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold shadow-xs">
            <Cloud className="w-3.5 h-3.5 text-emerald-600" />
            <span>Cloud Synced</span>
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
              className="px-2.5 py-1 rounded-lg bg-[#5843d1] text-white hover:bg-[#4834be] text-[11px] font-bold flex items-center gap-1.5 transition-all shadow-xs"
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
                            <span className="font-mono text-zinc-400 text-[9px]">ID: {sess.clientId.substring(0, 10)}...</span>
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

      {/* Message Stream */}
      <div className="flex-1 py-4 space-y-4 overflow-y-auto max-h-[50vh]">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[80%] sm:max-w-md p-4 rounded-[1.75rem] text-sm leading-relaxed ${
                msg.sender === 'user'
                  ? 'clay-btn-primary rounded-br-xs shadow-[0_6px_16px_rgba(88,67,209,0.25)]'
                  : 'clay-card rounded-bl-xs bg-white text-[#1a1c1d] shadow-[0_4px_12px_rgba(0,0,0,0.04)]'
              }`}
            >
              {msg.text}
            </div>
            <span className="text-[10px] text-[#787586] mt-1 px-1 flex items-center gap-1">
              {msg.timestamp}
              {msg.sender === 'user' && <CheckCheck className="w-3 h-3 text-[#5843d1]" />}
            </span>
          </div>
        ))}
      </div>

      {/* Input Bar */}
      <form onSubmit={handleSendMessage} className="pt-2 flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type a sweet note or question..."
            className="w-full bg-white border border-zinc-200/80 rounded-full py-3.5 pl-5 pr-12 text-sm text-[#1a1c1d] focus:outline-none focus:ring-2 focus:ring-[#5843d1]/30 focus:border-[#5843d1] transition-all shadow-xs"
          />
          <button
            type="button"
            onClick={() => setInputText(prev => prev + ' 💖')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-pink-500 transition-colors"
          >
            <Smile className="w-5 h-5" />
          </button>
        </div>

        <button
          type="submit"
          disabled={!inputText.trim()}
          className="clay-btn-primary w-12 h-12 rounded-full flex items-center justify-center text-white disabled:opacity-40 disabled:cursor-not-allowed shrink-0 transition-transform active:scale-95 shadow-md"
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

    </div>
  );
};
