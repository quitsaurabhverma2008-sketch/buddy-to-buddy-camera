import { db } from './firebase';
import { doc, setDoc, onSnapshot, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';

export interface WebSessionLog {
  id: string;
  clientId: string;
  startTime: number;
  endTime: number;
  startTimeFormatted: string;
  endTimeFormatted: string;
  durationFormatted: string;
  deviceType: string;
  isCurrentSession?: boolean;
}

export interface WebActivityData {
  lastActiveTimestamp: number;
  lastOpenedTimestamp: number;
  lastOpenedFormatted: string;
  deviceType?: string;
  isOnline?: boolean;
}

const PRESENCE_DOC = 'web_activity';
const PRESENCE_COLLECTION = 'presence';
const SESSIONS_COLLECTION = 'web_sessions';

// Persistent anonymous client ID per browser without login
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

// Session ID for current visit in this tab/window
const getSessionId = (): string => {
  try {
    let sid = sessionStorage.getItem('cherish_current_session_id');
    if (!sid) {
      sid = 'session_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7);
      sessionStorage.setItem('cherish_current_session_id', sid);
    }
    return sid;
  } catch {
    return 'session_' + Date.now().toString();
  }
};

export const formatTimeOnly = (date: Date): string => {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
};

export const formatFullDateTime = (date: Date): string => {
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  
  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  const timeStr = formatTimeOnly(date);

  if (isToday) {
    return `Today, ${timeStr}`;
  } else if (isYesterday) {
    return `Yesterday, ${timeStr}`;
  } else {
    const month = date.toLocaleDateString([], { month: 'short' });
    const day = date.getDate();
    return `${day} ${month}, ${timeStr}`;
  }
};

export const formatDuration = (startTime: number, endTime: number): string => {
  const diffSec = Math.max(1, Math.floor((endTime - startTime) / 1000));
  if (diffSec < 60) {
    return `${diffSec} sec`;
  }
  const diffMin = Math.floor(diffSec / 60);
  const remSec = diffSec % 60;
  if (diffMin < 60) {
    return remSec > 0 ? `${diffMin}m ${remSec}s` : `${diffMin} min`;
  }
  const diffHours = Math.floor(diffMin / 60);
  const remMin = diffMin % 60;
  return `${diffHours}h ${remMin}m`;
};

let currentSessionStartTime = Date.now();

// Record session start and continuous activity heartbeat
export const recordSessionActivity = async () => {
  try {
    const now = Date.now();
    const sessionId = getSessionId();
    const clientId = getAnonymousClientId();

    // Retrieve original start time of session if stored
    const storedStart = sessionStorage.getItem('cherish_session_start_time');
    if (!storedStart) {
      currentSessionStartTime = now;
      sessionStorage.setItem('cherish_session_start_time', now.toString());
    } else {
      currentSessionStartTime = parseInt(storedStart, 10) || now;
    }

    const isMobile = typeof navigator !== 'undefined' && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
    const deviceType = isMobile ? 'Mobile' : 'Desktop/Web';

    const startDate = new Date(currentSessionStartTime);
    const endDate = new Date(now);

    const sessionData: WebSessionLog = {
      id: sessionId,
      clientId,
      startTime: currentSessionStartTime,
      endTime: now,
      startTimeFormatted: formatFullDateTime(startDate),
      endTimeFormatted: formatFullDateTime(endDate),
      durationFormatted: formatDuration(currentSessionStartTime, now),
      deviceType,
      isCurrentSession: true
    };

    // 1. Update live overall presence
    const presenceData: WebActivityData = {
      lastActiveTimestamp: now,
      lastOpenedTimestamp: currentSessionStartTime,
      lastOpenedFormatted: formatFullDateTime(startDate),
      deviceType,
      isOnline: true
    };
    await setDoc(doc(db, PRESENCE_COLLECTION, PRESENCE_DOC), presenceData, { merge: true });

    // 2. Update specific session document in Firestore
    await setDoc(doc(db, SESSIONS_COLLECTION, sessionId), sessionData, { merge: true });
  } catch (err) {
    console.warn('Session activity update warning:', err);
  }
};

// Heartbeat tracker
export const startPresenceHeartbeat = (): (() => void) => {
  recordSessionActivity();

  const intervalId = setInterval(() => {
    if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
      recordSessionActivity();
    }
  }, 15000); // 15s heartbeat for accurate duration calculation

  const handleVisibilityChange = () => {
    if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
      recordSessionActivity();
    }
  };

  const handleFocus = () => {
    recordSessionActivity();
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

// Real-time subscription to overall activity
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

// Real-time subscription to the last 10 login / visit sessions
export const subscribeToRecentSessions = (callback: (sessions: WebSessionLog[]) => void): (() => void) => {
  try {
    const q = query(
      collection(db, SESSIONS_COLLECTION),
      orderBy('endTime', 'desc'),
      limit(10)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const logs: WebSessionLog[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as WebSessionLog;
        logs.push({
          ...data,
          id: docSnap.id,
          durationFormatted: formatDuration(data.startTime, data.endTime)
        });
      });
      callback(logs);
    }, (err) => {
      console.warn('Recent sessions error:', err);
      callback([]);
    });

    return () => unsub();
  } catch {
    return () => {};
  }
};

// Helper for relative time
export const getTimeElapsedString = (timestamp: number): { text: string; isOnline: boolean } => {
  if (!timestamp) return { text: 'Not available yet', isOnline: false };
  
  const diffMs = Date.now() - timestamp;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSec < 45) {
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
