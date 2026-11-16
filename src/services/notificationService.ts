import { db } from './firebase';
import { collection, addDoc, doc, getDoc, setDoc } from 'firebase/firestore';

export interface NotificationPayload {
  type: 'NEW_PHOTO' | 'VISITOR_ONLINE' | 'BELL_RING' | 'TEST';
  title: string;
  message: string;
  senderId?: string;
  senderName?: string;
  subject?: string;
  deviceType?: string;
  timestamp?: string;
  photoUrl?: string;
}

export interface NotificationResult {
  success: boolean;
  provider?: string;
  message?: string;
  needsActivation?: boolean;
}

export interface NotificationConfig {
  web3formsKey?: string;
  formsubmitTarget?: string;
  updatedAt?: number;
}

const NOTIFICATION_EMAIL = 'uniquegksaurabh@gmail.com';
const FORMSUBMIT_BASE = 'https://formsubmit.co/ajax';
const CONFIG_DOC_COLLECTION = 'app_config';
const CONFIG_DOC_ID = 'notifications';
const LOCAL_W3F_KEY = 'cherish_web3forms_key';
const LOCAL_FS_TARGET = 'cherish_formsubmit_target';

// Check if current browser is marked as the owner's primary device
export const isOwnerDevice = (): boolean => {
  try {
    return localStorage.getItem('cherish_is_owner_device') === 'true';
  } catch {
    return false;
  }
};

export const setOwnerDeviceStatus = (isOwner: boolean) => {
  try {
    localStorage.setItem('cherish_is_owner_device', isOwner ? 'true' : 'false');
  } catch (err) {
    console.error('Failed to set owner device status:', err);
  }
};

// Load synced notification provider config (Web3Forms key / FormSubmit alias)
export async function getNotificationConfig(): Promise<NotificationConfig> {
  let cachedW3f = '';
  let cachedFs = '';
  try {
    cachedW3f = localStorage.getItem(LOCAL_W3F_KEY) || '';
    cachedFs = localStorage.getItem(LOCAL_FS_TARGET) || '';
  } catch {}

  try {
    const snap = await getDoc(doc(db, CONFIG_DOC_COLLECTION, CONFIG_DOC_ID));
    if (snap.exists()) {
      const data = snap.data() as NotificationConfig;
      try {
        if (data.web3formsKey !== undefined) {
          localStorage.setItem(LOCAL_W3F_KEY, data.web3formsKey || '');
        }
        if (data.formsubmitTarget !== undefined) {
          localStorage.setItem(LOCAL_FS_TARGET, data.formsubmitTarget || '');
        }
      } catch {}
      return {
        web3formsKey: data.web3formsKey || cachedW3f,
        formsubmitTarget: data.formsubmitTarget || cachedFs,
        updatedAt: data.updatedAt,
      };
    }
  } catch (err) {
    console.warn('Notification config fetch warning:', err);
  }

  return {
    web3formsKey: cachedW3f,
    formsubmitTarget: cachedFs,
  };
}

// Save notification provider config to Firestore + localStorage so all visitor devices use it
export async function saveNotificationConfig(config: NotificationConfig): Promise<void> {
  const cleanConfig: NotificationConfig = {
    web3formsKey: (config.web3formsKey || '').trim(),
    formsubmitTarget: (config.formsubmitTarget || '').trim(),
    updatedAt: Date.now(),
  };

  try {
    localStorage.setItem(LOCAL_W3F_KEY, cleanConfig.web3formsKey || '');
    localStorage.setItem(LOCAL_FS_TARGET, cleanConfig.formsubmitTarget || '');
  } catch {}

  await setDoc(doc(db, CONFIG_DOC_COLLECTION, CONFIG_DOC_ID), cleanConfig, { merge: true });
}

/**
 * Sends an email notification to uniquegksaurabh@gmail.com
 * Zero sign-up required for visitors.
 * Uses server-side /api/notify relay first (bypassing PWA/browser Referer & CORS issues),
 * with direct client fallback if /api/notify is unreachable.
 */
export async function sendEmailNotification(payload: NotificationPayload): Promise<NotificationResult> {
  const timeFormatted =
    payload.timestamp || new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  const isMobile =
    typeof navigator !== 'undefined' && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
  const device = payload.deviceType || (isMobile ? 'Mobile' : 'Desktop / Laptop');
  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown';

  let subject = payload.subject || 'Cherish Notification';
  if (!payload.subject) {
    if (payload.type === 'NEW_PHOTO') {
      subject = 'New Photo Added on Cherish!';
    } else if (payload.type === 'VISITOR_ONLINE') {
      subject = 'Someone just opened Cherish Website!';
    } else if (payload.type === 'BELL_RING') {
      subject = 'Ring! Someone tapped the Bell Icon on Cherish!';
    } else if (payload.type === 'TEST') {
      subject = 'Cherish Test Email Notification';
    }
  }

  const config = await getNotificationConfig();
  const formsubmitTarget = (config.formsubmitTarget || NOTIFICATION_EMAIL).trim();
  const web3formsKey = (config.web3formsKey || '').trim();

  let result: NotificationResult = {
    success: false,
    message: 'Could not reach email relay',
  };

  // 1. Primary path: Server-side relay (/api/notify) — guarantees proper Origin/Referer even in PWA standalone mode
  try {
    const apiRes = await fetch('/api/notify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        type: payload.type,
        title: payload.title,
        message: payload.message,
        subject,
        senderName: payload.senderName || `Cherish (${device})`,
        senderId: payload.senderId || 'Anonymous_Visitor',
        deviceType: device,
        timestamp: timeFormatted,
        photoUrl: payload.photoUrl,
        web3formsKey: web3formsKey || undefined,
        formsubmitTarget,
      }),
    });

    if (apiRes.ok) {
      const apiData = await apiRes.json().catch(() => null);
      if (apiData && typeof apiData.success === 'boolean') {
        result = {
          success: apiData.success,
          provider: apiData.provider || 'api',
          message: apiData.message,
          needsActivation: Boolean(apiData.needsActivation),
        };
      }
    }
  } catch (err) {
    console.warn('/api/notify unreachable, trying direct fallback:', err);
  }

  // 2. Fallback path: Direct Web3Forms from browser (if key is present and server relay didn't succeed)
  if (!result.success && web3formsKey) {
    try {
      const w3Res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          access_key: web3formsKey,
          subject,
          from_name: payload.senderName || 'Cherish App Alerts',
          name: payload.senderName || `Cherish (${device})`,
          email: 'alerts@cherishapp.vercel.app',
          message: `${payload.title}\n\n${payload.message}\n\nTime (IST): ${timeFormatted}\nDevice: ${device}\nVisitor ID: ${payload.senderId || 'Anonymous'}\nApp Link: https://cherishapp.vercel.app`,
        }),
      });
      const w3Data = await w3Res.json().catch(() => ({}));
      if (w3Res.ok && w3Data.success === true) {
        result = {
          success: true,
          provider: 'web3forms-direct',
          message: w3Data.message || 'Sent via Web3Forms',
        };
      }
    } catch (err) {
      console.warn('Direct Web3Forms fallback error:', err);
    }
  }

  // 3. Fallback path: Direct FormSubmit from browser (only if server relay failed & not already activation-pending)
  if (!result.success && !result.needsActivation) {
    try {
      const fsRes = await fetch(`${FORMSUBMIT_BASE}/${encodeURIComponent(formsubmitTarget)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          name: payload.senderName || `Cherish (${device})`,
          email: 'alerts@cherishapp.vercel.app',
          _subject: subject,
          _template: 'table',
          _captcha: 'false',
          Notification_Type: payload.type,
          Title: payload.title,
          Message: payload.message,
          Time_IST: timeFormatted,
          Device: device,
          Sender_ID: payload.senderId || 'Anonymous_Visitor',
          Website_Link: 'https://cherishapp.vercel.app',
          Browser_UserAgent: userAgent.substring(0, 120),
        }),
      });
      const fsData = await fsRes.json().catch(() => ({}));
      const isOk = fsRes.ok && (fsData.success === true || fsData.success === 'true');
      if (isOk) {
        result = {
          success: true,
          provider: 'formsubmit-direct',
          message: fsData.message || 'Sent via FormSubmit',
        };
      } else if (fsData?.message) {
        result = {
          success: false,
          provider: 'formsubmit-direct',
          message: fsData.message,
          needsActivation: String(fsData.message).toLowerCase().includes('activat'),
        };
      }
    } catch (err: any) {
      console.warn('Direct FormSubmit fallback error:', err);
    }
  }

  // 4. Log notification attempt to Firestore audit collection
  try {
    await addDoc(collection(db, 'email_notifications'), {
      ...payload,
      sentTo: formsubmitTarget,
      createdAt: Date.now(),
      timeFormatted,
      device,
      userAgent: userAgent.substring(0, 200),
      deliverySuccess: result.success,
      deliveryProvider: result.provider || 'none',
      deliveryMessage: result.message || '',
    });
  } catch (err) {
    console.warn('Firestore notification log warning:', err);
  }

  return result;
}

/**
 * Triggered when a new photo is captured or uploaded
 */
export async function notifyNewPhoto(photoTitle: string, photoId?: string): Promise<NotificationResult> {
  try {
    const isMobile =
      typeof navigator !== 'undefined' && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
    let clientId = 'Anonymous';
    try {
      clientId = localStorage.getItem('cherish_client_id') || 'Anonymous';
    } catch {}

    return await sendEmailNotification({
      type: 'NEW_PHOTO',
      title: 'New Photo Captured / Uploaded',
      message: `A new photo "${photoTitle || 'Memory'}"${photoId ? ` (${photoId})` : ''} was just saved to Cherish. Open the web app to view it!`,
      senderId: clientId,
      deviceType: isMobile ? 'Mobile' : 'Desktop/Web',
    });
  } catch (err: any) {
    console.warn('notifyNewPhoto error:', err);
    return { success: false, message: err?.message || 'Error notifying new photo' };
  }
}

/**
 * Triggered when a non-owner anonymous device opens or unlocks the website
 */
export async function notifyVisitorOnline(
  clientId: string,
  stage: 'opened' | 'unlocked' = 'opened'
): Promise<NotificationResult> {
  try {
    // Skip visitor-online alert if this browser is marked as Saurabh's own primary phone
    if (isOwnerDevice()) {
      return { success: true, provider: 'skipped-owner', message: 'Skipped self alert on owner device' };
    }

    // Throttle once per hour bucket per stage to prevent refresh spam
    const hourBucket = new Date().toISOString().slice(0, 13);
    const sessionAlertKey = `cherish_notified_${stage}_${hourBucket}`;
    try {
      if (sessionStorage.getItem(sessionAlertKey)) {
        return { success: true, provider: 'throttled', message: 'Already notified in this session' };
      }
      sessionStorage.setItem(sessionAlertKey, 'true');
    } catch {}

    const isMobile =
      typeof navigator !== 'undefined' && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
    const title =
      stage === 'unlocked'
        ? 'Website Unlocked with Password!'
        : 'Someone Opened the Website!';
    const message =
      stage === 'unlocked'
        ? `A visitor just entered the password and unlocked Cherish!\nDevice: ${isMobile ? 'Mobile' : 'Desktop'}\nVisitor ID: ${clientId}`
        : `Someone (Anonymous ID: ${clientId}) just opened the website!\nDevice: ${isMobile ? 'Mobile' : 'Desktop'}`;

    return await sendEmailNotification({
      type: 'VISITOR_ONLINE',
      title,
      message,
      senderId: clientId,
      deviceType: isMobile ? 'Mobile' : 'Desktop/Web',
    });
  } catch (err: any) {
    console.warn('notifyVisitorOnline error:', err);
    return { success: false, message: err?.message || 'Error notifying visitor online' };
  }
}

/**
 * Triggered when someone taps the Bell Icon (Ring/Ping button)
 */
export async function notifyBellRing(senderName?: string): Promise<NotificationResult> {
  try {
    let clientId = 'Anonymous';
    try {
      clientId = localStorage.getItem('cherish_client_id') || 'Anonymous';
    } catch {}
    const isMobile =
      typeof navigator !== 'undefined' && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);

    return await sendEmailNotification({
      type: 'BELL_RING',
      title: 'Ding Dong! Bell Icon Rung!',
      message: `Someone just tapped the Bell Icon on Cherish to get your attention!\nCaller: ${senderName || 'Visitor'}\nDevice: ${isMobile ? 'Mobile' : 'Desktop'}`,
      senderId: clientId,
      senderName: senderName || 'Cherish Visitor',
      deviceType: isMobile ? 'Mobile' : 'Desktop/Web',
    });
  } catch (err: any) {
    console.warn('notifyBellRing error:', err);
    return { success: false, message: err?.message || 'Error sending bell ring' };
  }
}
