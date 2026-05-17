const nodemailer = require('nodemailer');

const enabled = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
const APP_URL = process.env.APP_URL || 'http://localhost:3001';

let transporter = null;
if (enabled) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_PORT === '465',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

async function sendEmail(to, subject, html) {
  if (!transporter) {
    console.log(`[Email skipped] To: ${to} | Subject: ${subject}`);
    return;
  }
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'Grevya HR <noreply@grevya.com>',
      to, subject, html,
    });
    console.log(`[Email sent] → ${to}`);
  } catch (err) {
    console.error(`[Email error] ${err.message}`);
  }
}

const templates = {
  leaveApproved: (name, type, days, startDate) => ({
    subject: `✅ Leave Approved — ${type} Leave`,
    html: `<div style="font-family:sans-serif;max-width:520px;margin:auto;padding:24px;background:#f9fafb;border-radius:12px">
      <div style="background:linear-gradient(135deg,#22c55e,#16a34a);padding:20px;border-radius:8px;text-align:center;margin-bottom:20px"><h2 style="color:white;margin:0">Leave Approved ✅</h2></div>
      <p>Hi <strong>${name}</strong>,</p>
      <p>Your <strong>${type}</strong> leave for <strong>${days} day(s)</strong> from <strong>${startDate}</strong> has been <strong style="color:#16a34a">approved</strong>. Enjoy! 🎉</p>
      <p style="color:#6b7280;font-size:12px">— Grevya HR Portal · <a href="${APP_URL}">Open Portal</a></p>
    </div>`,
  }),
  leaveRejected: (name, type, days, reason) => ({
    subject: `❌ Leave Rejected — ${type} Leave`,
    html: `<div style="font-family:sans-serif;max-width:520px;margin:auto;padding:24px;background:#f9fafb;border-radius:12px">
      <div style="background:linear-gradient(135deg,#ef4444,#dc2626);padding:20px;border-radius:8px;text-align:center;margin-bottom:20px"><h2 style="color:white;margin:0">Leave Rejected ❌</h2></div>
      <p>Hi <strong>${name}</strong>,</p>
      <p>Your <strong>${type}</strong> leave for <strong>${days} day(s)</strong> was <strong style="color:#dc2626">rejected</strong>.</p>
      ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
      <p style="color:#6b7280;font-size:12px">— Grevya HR Portal · <a href="${APP_URL}">Open Portal</a></p>
    </div>`,
  }),
  welcome: (name, email, password) => ({
    subject: `🎉 Welcome to Grevya HR Portal`,
    html: `<div style="font-family:sans-serif;max-width:520px;margin:auto;padding:24px;background:#f9fafb;border-radius:12px">
      <div style="background:linear-gradient(135deg,#7c3aed,#4f46e5);padding:20px;border-radius:8px;text-align:center;margin-bottom:20px"><h2 style="color:white;margin:0">Welcome to Grevya! 🌿</h2></div>
      <p>Hi <strong>${name}</strong>, your account is ready.</p>
      <div style="background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin:16px 0">
        <p style="margin:4px 0"><strong>Portal:</strong> <a href="${APP_URL}">${APP_URL}</a></p>
        <p style="margin:4px 0"><strong>Email:</strong> ${email}</p>
        <p style="margin:4px 0"><strong>Password:</strong> <code style="background:#f3f4f6;padding:2px 6px;border-radius:4px">${password}</code></p>
      </div>
      <p style="color:#ef4444;font-size:13px">⚠️ Change your password after first login.</p>
    </div>`,
  }),
  passwordReset: (name, token) => ({
    subject: `🔐 Reset Your Password — Grevya HR`,
    html: `<div style="font-family:sans-serif;max-width:520px;margin:auto;padding:24px;background:#f9fafb;border-radius:12px">
      <div style="background:linear-gradient(135deg,#7c3aed,#4f46e5);padding:20px;border-radius:8px;text-align:center;margin-bottom:20px"><h2 style="color:white;margin:0">Password Reset 🔐</h2></div>
      <p>Hi <strong>${name}</strong>, click below to reset your password. Expires in <strong>1 hour</strong>.</p>
      <div style="text-align:center;margin:24px 0">
        <a href="${APP_URL}/reset-password?token=${token}" style="background:linear-gradient(135deg,#7c3aed,#4f46e5);color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block">Reset Password</a>
      </div>
      <p style="color:#6b7280;font-size:13px">Didn't request this? Ignore this email.</p>
    </div>`,
  }),
  payslip: (name, month, year, net) => ({
    subject: `💰 Payslip for ${month} ${year} — Grevya HR`,
    html: `<div style="font-family:sans-serif;max-width:520px;margin:auto;padding:24px;background:#f9fafb;border-radius:12px">
      <div style="background:linear-gradient(135deg,#16a34a,#15803d);padding:20px;border-radius:8px;text-align:center;margin-bottom:20px"><h2 style="color:white;margin:0">Payslip Ready 💰</h2></div>
      <p>Hi <strong>${name}</strong>, your payslip for <strong>${month} ${year}</strong> is ready.</p>
      <div style="background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:16px;text-align:center;margin:16px 0">
        <p style="color:#6b7280;font-size:13px;margin:0">Net Salary</p>
        <p style="font-size:2rem;font-weight:800;color:#16a34a;margin:4px 0">₹${Number(net).toLocaleString('en-IN')}</p>
      </div>
      <div style="text-align:center"><a href="${APP_URL}" style="background:linear-gradient(135deg,#16a34a,#15803d);color:white;padding:10px 24px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block">View Payslip</a></div>
    </div>`,
  }),
};

module.exports = { sendEmail, templates, enabled };
