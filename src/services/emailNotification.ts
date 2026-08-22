import { getCachedAccessToken, googleSignIn } from './firebase';

export interface EmailNotificationPayload {
  toEmail: string;
  senderName: string;
  subject: string;
  message: string;
  photoCount?: number;
  timestamp?: string;
}

// Convert string to URL-safe Base64 for RFC 2822 email format
function createEmailRaw(to: string, fromName: string, subject: string, bodyText: string, htmlBody: string): string {
  const utf8Subject = `=?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`;
  const emailLines = [
    `To: ${to}`,
    `Subject: ${utf8Subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    htmlBody
  ];

  const email = emailLines.join('\r\n');
  return btoa(unescape(encodeURIComponent(email)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export async function sendNotificationEmail(payload: EmailNotificationPayload): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    let token = getCachedAccessToken();
    if (!token) {
      const authResult = await googleSignIn();
      if (!authResult?.accessToken) {
        throw new Error('Google Sign-in required to authorize sending notification emails.');
      }
      token = authResult.accessToken;
    }

    const { toEmail, senderName, subject, message, photoCount = 0, timestamp = new Date().toLocaleString() } = payload;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f7f6f8; margin: 0; padding: 24px; color: #1a1c1d; }
          .container { max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 24px; padding: 32px; box-shadow: 0 10px 30px rgba(88,67,209,0.08); border: 1px solid #eee; }
          .header { text-align: center; margin-bottom: 24px; }
          .badge { display: inline-block; background: #e4deff; color: #5843d1; font-weight: 700; font-size: 12px; padding: 6px 14px; border-radius: 999px; }
          .title { font-size: 22px; font-weight: bold; margin-top: 14px; color: #1a1c1d; }
          .card { background: #faf9fd; border: 1px solid #ece8fc; border-radius: 16px; padding: 20px; margin: 20px 0; }
          .message-text { font-size: 15px; line-height: 1.6; color: #333; }
          .footer { text-align: center; font-size: 12px; color: #888; margin-top: 24px; border-top: 1px solid #f0f0f0; padding-top: 16px; }
          .stat { display: inline-block; background: #d4f8eb; color: #2c6956; font-size: 12px; font-weight: bold; padding: 4px 10px; border-radius: 8px; margin-top: 8px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <span class="badge">🔔 Buddy to Buddy Instant Alert</span>
            <div class="title">New Notification from Buddy App</div>
          </div>
          <div class="card">
            <p style="margin:0 0 8px 0; font-size: 13px; color: #666;"><strong>Sender:</strong> ${senderName}</p>
            <p style="margin:0 0 12px 0; font-size: 13px; color: #666;"><strong>Time:</strong> ${timestamp}</p>
            <div class="message-text">
              <strong>Message:</strong><br/>
              ${message}
            </div>
            ${photoCount > 0 ? `<div class="stat">📸 Active Memories in App: ${photoCount} Photos</div>` : ''}
          </div>
          <p style="font-size: 13px; color: #555; text-align: center;">
            Someone interacted with your Buddy to Buddy app and triggered this live notification alert to your email!
          </p>
          <div class="footer">
            Delivered directly via Google Workspace Gmail API to <strong>${toEmail}</strong>
          </div>
        </div>
      </body>
      </html>
    `;

    const rawMessage = createEmailRaw(
      toEmail,
      senderName,
      subject,
      message,
      htmlContent
    );

    const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ raw: rawMessage })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error?.message || `Gmail API error HTTP ${response.status}`);
    }

    const data = await response.json();
    return { success: true, messageId: data.id };
  } catch (error: any) {
    console.error('Failed to send email alert:', error);
    return { success: false, error: error.message || 'Unknown error sending email' };
  }
}
