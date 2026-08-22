import { db } from './firebase';
import { doc, setDoc, onSnapshot, getDoc } from 'firebase/firestore';

export interface WebActivityData {
  lastActiveTimestamp: number;
  lastOpenedTimestamp: number;
  lastOpenedFormatted: string;
  deviceType?: string;
  isOnline?: boolean;
}

const PRESENCE_DOC = 'web_activity';
const PRESENCE_COLLECTION = 'presence';

// Generate or get persistent anonymous visitor ID without any login
const getAnonymousClientId = (): string => {
  try {
    let clientId = localStorage.getItem('cherish_client_id');
    if (!clientId) {
      clientId = 'user_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
      localStorage.setItem('cherish_client_id', clientId);
    }
    return clientId;
  } catch {
    return 'guest_user';
  }
};

const formatTimestamp = (date: Date): string => {
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  
  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

  if (isToday) {
    return `Today at ${timeStr}`;
  } else if (isYesterday) {
    return `Yesterday at ${timeStr}`;
  } else {
    const month = date.toLocaleDateString([], { month: 'short' });
    const day = date.getDate();
    return `${day} ${month} at ${timeStr}`;
  }
};

// Record whenever someone opens or uses the website (100% automatic, zero login)
export const recordWebOpened = async () => {
  try {
    const now = Date.now();
    const nowDate = new Date(now);
    const formatted = formatTimestamp(nowDate);
    const clientId = getAnonymousClientId();

    const isMobile = typeof navigator !== 'undefined' && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
    const deviceType = isMobile ? 'Mobile' : 'Desktop/Web';

    const activityData: WebActivityData = {
      lastActiveTimestamp: now,
      lastOpenedTimestamp: now,
      lastOpenedFormatted: formatted,
      deviceType: deviceType,
      isOnline: true
    };

    // Save to Firestore so every device/browser can see the exact time the web was opened
    await setDoc(doc(db, PRESENCE_COLLECTION, PRESENCE_DOC), activityData, { merge: true });
    
    // Also save in a visitor history collection if needed
    try {
      await setDoc(doc(db, 'activity_logs', `${clientId}_${now}`), {
        clientId,
        timestamp: now,
        formatted,
        deviceType
      });
    } catch {}
  } catch (err) {
    console.warn('Presence update error:', err);
  }
};

// Heartbeat to keep active status alive while web tab is in use
export const startPresenceHeartbeat = (): (() => void) => {
  // 1. Immediately record that web was opened
  recordWebOpened();

  // 2. Heartbeat interval every 30 seconds
  const intervalId = setInterval(() => {
    if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
      recordWebOpened();
    }
  }, 30000);

  // 3. Update when tab becomes visible again
  const handleVisibilityChange = () => {
    if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
      recordWebOpened();
    }
  };

  // 4. Update when user focuses window
  const handleFocus = () => {
    recordWebOpened();
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
  }

  return () => {
    clearInterval(intervalId);
    if (typeof window !== 'undefined') {
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    }
  };
};

// Real-time subscription to see when the web was last opened
export const subscribeToWebActivity = (callback: (data: WebActivityData | null) => void): (() => void) => {
  try {
    const unsub = onSnapshot(doc(db, PRESENCE_COLLECTION, PRESENCE_DOC), (docSnap) => {
      if (docSnap.exists()) {
        callback(docSnap.data() as WebActivityData);
      } else {
        callback(null);
      }
    }, (error) => {
      console.warn('Presence listen error:', error);
      callback(null);
    });

    return () => unsub();
  } catch {
    return () => {};
  }
};

// Helper to get time elapsed string
export const getTimeElapsedString = (timestamp: number): { text: string; isOnline: boolean } => {
  if (!timestamp) return { text: 'Not available yet', isOnline: false };
  
  const diffMs = Date.now() - timestamp;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  // If active within the last 60 seconds -> Online
  if (diffSec < 60) {
    return { text: 'Active now', isOnline: true };
  }

  if (diffMin < 60) {
    return { text: `${diffMin} min ago`, isOnline: false };
  }

  if (diffHours < 24) {
    return { text: `${diffHours} hr${diffHours > 1 ? 's' : ''} ago`, isOnline: false };
  }

  return { text: `${diffDays} day${diffDays > 1 ? 's' : ''} ago`, isOnline: false };
};
