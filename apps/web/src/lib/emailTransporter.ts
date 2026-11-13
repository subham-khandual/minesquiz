import nodemailer from 'nodemailer';

export function createGmailTransporter() {
  const email = process.env.SMTP_EMAIL || 'subhamkhandual215@gmail.com';
  const pass = (process.env.SMTP_PASSWORD || '').replace(/\s+/g, '');

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: email,
      pass: pass,
    },
  });
}

export async function sendAdminOtpEmail(
  toEmail: string,
  otp: string,
  reason: 'setup' | 'forgot_password' = 'setup'
): Promise<boolean> {
  const transporter = createGmailTransporter();

  const isSetup = reason === 'setup';
  const subjectTitle = isSetup
    ? `🔐 MinesQuiz Super Admin Setup Code: ${otp}`
    : `🔐 MinesQuiz Super Admin Password Reset OTP: ${otp}`;
  const actionSubtitle = isSetup
    ? 'Super Administrator First-Time Setup'
    : 'Super Administrator Password Reset Verification';

  const mailOptions = {
    from: `"MinesQuiz Security" <${process.env.SMTP_EMAIL || 'subhamkhandual215@gmail.com'}>`,
    to: toEmail,
    subject: subjectTitle,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 20px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="color: #4338ca; margin: 0; font-size: 26px; font-weight: 900; letter-spacing: -0.5px;">Mines<span style="color: #6d28d9;">Quiz</span></h2>
          <p style="color: #64748b; font-size: 13px; margin: 6px 0 0 0;">${actionSubtitle}</p>
        </div>

        <div style="background-color: #faf5ff; border: 1px solid #e9d5ff; border-radius: 16px; padding: 24px; text-align: center; margin-bottom: 24px;">
          <p style="color: #581c87; font-size: 14px; margin: 0 0 12px 0; font-weight: 600;">Your 6-Digit Admin Verification Code:</p>
          <div style="font-size: 38px; font-weight: 900; letter-spacing: 8px; color: #6d28d9; padding: 12px 0;">
            ${otp}
          </div>
          <p style="color: #7e22ce; font-size: 12px; margin: 8px 0 0 0;">Code is valid for 5 minutes. Do not share this with anyone.</p>
        </div>

        <p style="color: #475569; font-size: 13px; line-height: 1.6; margin: 0 0 16px 0;">
          This verification request was initiated for Super Admin email: <strong>${toEmail}</strong>. If you did not request this action, please secure your account immediately.
        </p>

        <div style="border-top: 1px solid #f1f5f9; padding-top: 16px; text-align: center;">
          <p style="color: #94a3b8; font-size: 11px; margin: 0;">MinesQuiz Examination & Proctoring Platform</p>
        </div>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('[Admin OTP] Email sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error('[Admin OTP Error] Failed to send email via Gmail SMTP:', error);
    return false;
  }
}
