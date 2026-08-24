import { db } from './firebase';
import { collection, addDoc } from 'firebase/firestore';

export interface NotificationPayload {
  type: 'NEW_PHOTO' | 'VISITOR_ONLINE' | 'BELL_RING';
  title: string;
  message: string;
  senderId?: string;
  deviceType?: string;
  timestamp?: string;
  photoUrl?: string;
}

const NOTIFICATION_EMAIL = 'uniquegksaurabh@gmail.com';
const FORMSUBMIT_URL = `https://formsubmit.co/ajax/${NOTIFICATION_EMAIL}`;

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

/**
 * Sends an email notification to uniquegksaurabh@gmail.com
 * No sign up or registration needed by the user.
 */
export async function sendEmailNotification(payload: NotificationPayload): Promise<boolean> {
  const timeFormatted = payload.timestamp || new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  const isMobile = typeof navigator !== 'undefined' && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
  const device = payload.deviceType || (isMobile ? 'Mobile' : 'Desktop / Laptop');
  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown';

  let subject = '🔔 Cherish Notification';
  if (payload.type === 'NEW_PHOTO') {
    subject = '📸 Cherish: New Photo Added on Website!';
  } else if (payload.type === 'VISITOR_ONLINE') {
    subject = '🌐 Cherish: Someone just opened the Website!';
  } else if (payload.type === 'BELL_RING') {
    subject = '🔔 Ring! Someone tapped the Bell Icon on Cherish!';
  }

  // 1. Prepare form payload for FormSubmit email dispatcher
  const emailBody = {
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
    Photo_Preview: payload.photoUrl ? 'Available in Cherish App' : 'N/A'
  };

  // 2. Also log to Firestore database for 100% audit log
  try {
    await addDoc(collection(db, 'email_notifications'), {
      ...payload,
      sentTo: NOTIFICATION_EMAIL,
      createdAt: Date.now(),
      timeFormatted,
      device,
      userAgent
    });
  } catch (err) {
    console.warn('Firestore notification log warning:', err);
  }

  // 3. Dispatch HTTP Post to FormSubmit service (Free, zero-signup email relay)
  try {
    const response = await fetch(FORMSUBMIT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(emailBody)
    });

    if (response.ok) {
      console.log('✅ Email notification successfully dispatched to', NOTIFICATION_EMAIL);
      return true;
    }
  } catch (err) {
    console.warn('FormSubmit email send notice:', err);
  }

  return false;
}

/**
 * Triggered when a new photo is captured or uploaded
 */
export async function notifyNewPhoto(photoTitle: string, photoId?: string) {
  try {
    const isMobile = typeof navigator !== 'undefined' && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
    const clientId = localStorage.getItem('cherish_client_id') || 'Anonymous';

    await sendEmailNotification({
      type: 'NEW_PHOTO',
      title: 'New Photo Captured / Uploaded',
      message: `A new photo "${photoTitle || 'Memory'}" was just saved to Cherish.\nOpen the web app to view it!`,
      senderId: clientId,
      deviceType: isMobile ? 'Mobile' : 'Desktop/Web'
    });
  } catch (err) {
    console.warn('notifyNewPhoto error:', err);
  }
}

/**
 * Triggered when a visitor/anonymous device opens/unlocks the website
 */
export async function notifyVisitorOnline(clientId: string) {
  try {
    // If this browser is marked as owner's device, skip to avoid self-alert spam if desired
    const isOwner = isOwnerDevice();
    
    // Throttle: Send once per visit session to prevent duplicate email flooding on page refreshes
    const sessionAlertKey = `cherish_notified_visit_${new Date().toISOString().slice(0, 13)}`; // 1 hour bucket
    if (sessionStorage.getItem(sessionAlertKey)) {
      return; // Already notified for this hour/session
    }
    sessionStorage.setItem(sessionAlertKey, 'true');

    const isMobile = typeof navigator !== 'undefined' && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
    const visitorType = isOwner ? 'Your Phone (Owner)' : 'Guest / Visitor (Sakshi / Anonymous)';

    await sendEmailNotification({
      type: 'VISITOR_ONLINE',
      title: 'Website Opened / Online Alert',
      message: `The website was just opened by ${visitorType}.\nDevice: ${isMobile ? 'Mobile' : 'Desktop'}\nVisitor ID: ${clientId}`,
      senderId: clientId,
      deviceType: isMobile ? 'Mobile' : 'Desktop/Web'
    });
  } catch (err) {
    console.warn('notifyVisitorOnline error:', err);
  }
}

/**
 * Triggered when someone taps the Bell Icon (Ring/Ping button)
 */
export async function notifyBellRing(senderName?: string): Promise<boolean> {
  try {
    const clientId = localStorage.getItem('cherish_client_id') || 'Anonymous';
    const isMobile = typeof navigator !== 'undefined' && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);

    return await sendEmailNotification({
      type: 'BELL_RING',
      title: '🔔 Ding Dong! Bell Icon Rung!',
      message: `Someone just tapped the Bell Icon on Cherish to get your attention! 💖\nCaller: ${senderName || 'Sakshi / Friend'}\nDevice: ${isMobile ? 'Mobile' : 'Desktop'}`,
      senderId: clientId,
      deviceType: isMobile ? 'Mobile' : 'Desktop/Web'
    });
  } catch (err) {
    console.warn('notifyBellRing error:', err);
    return false;
  }
}
