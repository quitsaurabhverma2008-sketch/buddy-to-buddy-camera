interface NotifyRequestBody {
  type?: 'NEW_PHOTO' | 'VISITOR_ONLINE' | 'BELL_RING' | 'TEST';
  title?: string;
  message?: string;
  senderId?: string;
  deviceType?: string;
  timestamp?: string;
  photoUrl?: string;
  subject?: string;
  senderName?: string;
  web3formsKey?: string;
  formsubmitTarget?: string;
}

const DEFAULT_EMAIL = 'uniquegksaurabh@gmail.com';
const BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ success: false, message: 'Method not allowed' });
    return;
  }

  let body: NotifyRequestBody = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      body = {};
    }
  }
  body = body || {};

  const type = body.type || 'BELL_RING';
  const title = body.title || 'Cherish App Alert';
  const message = body.message || 'New activity detected on Cherish App.';
  const senderId = body.senderId || 'Anonymous_Visitor';
  const deviceType = body.deviceType || 'Web';
  const timeFormatted =
    body.timestamp ||
    new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

  let subject = body.subject || 'Cherish Notification';
  if (!body.subject) {
    if (type === 'NEW_PHOTO') {
      subject = 'New Photo Added on Cherish!';
    } else if (type === 'VISITOR_ONLINE') {
      subject = 'Someone just opened Cherish Website!';
    } else if (type === 'BELL_RING') {
      subject = 'Ring! Someone tapped the Bell Icon on Cherish!';
    } else if (type === 'TEST') {
      subject = 'Cherish Test Email Notification';
    }
  }

  const web3Key = (body.web3formsKey || process.env.WEB3FORMS_ACCESS_KEY || '').trim();
  const resendKey = (process.env.RESEND_API_KEY || '').trim();
  const target = (body.formsubmitTarget || process.env.NOTIFICATION_EMAIL || DEFAULT_EMAIL).trim();

  // 0. Try Resend if RESEND_API_KEY env var is configured on Vercel
  if (resendKey) {
    try {
      const rRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Cherish Alerts <onboarding@resend.dev>',
          to: [target],
          subject,
          text: `${title}\n\n${message}\n\nTime (IST): ${timeFormatted}\nDevice: ${deviceType}\nVisitor ID: ${senderId}\nApp Link: https://cherishapp.vercel.app`,
        }),
      });
      const rData = await rRes.json().catch(() => ({}));
      if (rRes.ok && rData.id) {
        res.status(200).json({
          success: true,
          provider: 'resend',
          message: 'Email delivered via Resend',
        });
        return;
      }
    } catch (err: any) {
      console.warn('Resend error, continuing to next relay:', err?.message);
    }
  }

  // 1. Try Web3Forms if an access key is configured (works reliably from server & browser)
  if (web3Key) {
    try {
      const w3Res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          access_key: web3Key,
          subject,
          from_name: body.senderName || 'Cherish App Alerts',
          name: body.senderName || `Cherish (${deviceType})`,
          email: 'alerts@cherishapp.vercel.app',
          message: `${title}\n\n${message}\n\nTime (IST): ${timeFormatted}\nDevice: ${deviceType}\nVisitor ID: ${senderId}\nApp Link: https://cherishapp.vercel.app`,
        }),
      });

      const w3Data = await w3Res.json().catch(() => ({}));
      if (w3Res.ok && w3Data.success === true) {
        res.status(200).json({
          success: true,
          provider: 'web3forms',
          message: w3Data.message || 'Email delivered via Web3Forms',
        });
        return;
      }
      console.warn('Web3Forms dispatch non-success:', w3Data);
    } catch (err: any) {
      console.warn('Web3Forms error, falling back to FormSubmit:', err?.message);
    }
  }

  // 2. Fallback Zero-Signup Relay: FormSubmit (note: datacenter IPs may hit Cloudflare challenge; client browser will retry if so)
  const formSubmitUrl = `https://formsubmit.co/ajax/${encodeURIComponent(target)}`;

  const payloads = [
    {
      name: body.senderName || `Cherish (${deviceType})`,
      email: 'alerts@cherishapp.vercel.app',
      _subject: subject,
      _template: 'table',
      _captcha: 'false',
      Notification_Type: type,
      Title: title,
      Message: message,
      Time_IST: timeFormatted,
      Device: deviceType,
      Sender_ID: senderId,
      Website_Link: 'https://cherishapp.vercel.app',
    },
    {
      name: body.senderName || 'Cherish App',
      email: 'alerts@cherishapp.vercel.app',
      _subject: subject,
      _captcha: 'false',
      message: `${title} — ${message} | Time: ${timeFormatted} | Device: ${deviceType} | ID: ${senderId}`,
    },
  ];

  let lastErrorMsg = 'Email relay unavailable';
  let needsActivation = false;

  for (const payload of payloads) {
    try {
      const fsRes = await fetch(formSubmitUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'User-Agent': BROWSER_UA,
          Referer: 'https://cherishapp.vercel.app/',
          Origin: 'https://cherishapp.vercel.app',
        },
        body: JSON.stringify(payload),
      });

      const rawText = await fsRes.text();
      if (rawText.trim().startsWith('<')) {
        lastErrorMsg = 'FormSubmit blocked server IP with Cloudflare challenge';
        continue;
      }

      let fsData: any = {};
      try {
        fsData = JSON.parse(rawText);
      } catch {
        fsData = { message: rawText.slice(0, 140) };
      }

      const isSuccess = fsData.success === true || fsData.success === 'true';
      if (fsRes.ok && isSuccess) {
        res.status(200).json({
          success: true,
          provider: 'formsubmit',
          message: fsData.message || 'Email notification sent successfully.',
        });
        return;
      }

      lastErrorMsg = fsData.message || `HTTP ${fsRes.status}`;
      if (typeof lastErrorMsg === 'string' && lastErrorMsg.toLowerCase().includes('activat')) {
        needsActivation = true;
        break;
      }
    } catch (err: any) {
      lastErrorMsg = err?.message || 'Network error calling email relay';
    }
  }

  res.status(200).json({
    success: false,
    provider: 'formsubmit',
    needsActivation,
    message: lastErrorMsg,
  });
}
