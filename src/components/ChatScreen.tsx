import React, { useState, useEffect } from 'react';
import { soundEngine } from '../utils/audio';
import { Send, Sparkles, Smile, Bot, CheckCheck, Cloud } from 'lucide-react';
import { db } from '../services/firebase';
import { collection, query, orderBy, limit, onSnapshot, addDoc, getDocs, writeBatch, doc } from 'firebase/firestore';

interface ChatMessage {
  id: string;
  sender: 'user' | 'buddy';
  text: string;
  timestamp: string;
  createdAt?: number;
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'm-1',
    sender: 'buddy',
    text: 'Hello there! 🌸 How was your day? Have you captured any squishy soft moments today?',
    timestamp: '10:14 AM',
    createdAt: Date.now() - 60000 * 3
  },
  {
    id: 'm-2',
    sender: 'user',
    text: 'Yes! Took a lovely walk by the lake and got a sunset picture.',
    timestamp: '10:16 AM',
    createdAt: Date.now() - 60000 * 2
  },
  {
    id: 'm-3',
    sender: 'buddy',
    text: 'That sounds so peaceful! All your memories are stored safely in your cloud database. Relive them whenever you need a boost of warmth. ✨',
    timestamp: '10:17 AM',
    createdAt: Date.now() - 60000 * 1
  }
];

export const ChatScreen: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState('');

  // Sync chat messages with Cloud Firestore
  useEffect(() => {
    async function initChat() {
      try {
        const snap = await getDocs(collection(db, 'chat_messages'));
        if (snap.empty) {
          const batch = writeBatch(db);
          for (const msg of INITIAL_MESSAGES) {
            batch.set(doc(db, 'chat_messages', msg.id), msg);
          }
          await batch.commit();
        }
      } catch (err) {
        console.warn('Chat Firestore init error:', err);
      }
    }
    initChat();

    const q = query(collection(db, 'chat_messages'), orderBy('createdAt', 'asc'), limit(50));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const liveMsgs: ChatMessage[] = [];
      snapshot.forEach(docSnap => {
        liveMsgs.push({ id: docSnap.id, ...docSnap.data() } as ChatMessage);
      });
      if (liveMsgs.length > 0) {
        setMessages(liveMsgs);
      }
    }, (error) => {
      console.warn('Chat snapshot listener fallback:', error);
    });

    return () => unsubscribe();
  }, []);

  const handleSend = async (e: React.FormEvent) => {
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
      
      {/* Header */}
      <div className="pt-4 pb-6 flex items-center justify-between border-b border-zinc-200">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#5843d1] to-[#8d79ff] flex items-center justify-center text-white shadow-md relative">
            <Sparkles className="w-6 h-6" />
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-[#53dca8] border-2 border-white rounded-full" />
          </div>
          <div>
            <h1 className="font-heading font-bold text-xl text-[#1a1c1d]">
              Buddy Companion
            </h1>
            <span className="text-xs text-[#53dca8] font-semibold flex items-center gap-1">
              ● Online &amp; Caring
            </span>
          </div>
        </div>

        {/* Cloud Synced Badge */}
        <div className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200/80 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold shadow-xs">
          <Cloud className="w-3.5 h-3.5 text-emerald-600" />
          <span>Cloud Synced</span>
        </div>
      </div>

      {/* Message Stream */}
      <div className="flex-1 py-6 space-y-4 overflow-y-auto max-h-[60vh]">
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
      <form onSubmit={handleSend} className="clay-card rounded-full p-2 bg-white/95 flex items-center gap-2 shadow-[0_8px_24px_rgba(90,70,211,0.1)] border border-white">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Share a soft thought with Buddy..."
          className="flex-1 px-4 py-2.5 rounded-full bg-transparent focus:outline-none text-sm font-medium text-[#1a1c1d]"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="w-11 h-11 rounded-full clay-btn-primary flex items-center justify-center text-white disabled:opacity-50 disabled:scale-100 hover:scale-105 active:scale-95 transition-transform cursor-pointer"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

    </div>
  );
};
