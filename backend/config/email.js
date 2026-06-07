const nodemailer = require('nodemailer');

function hasRealEnvValue(value) {
  return Boolean(value && value.trim() && !value.startsWith('replace-with-') && !value.includes('placeholder') && !value.startsWith('your-'));
}

const APP_URL = process.env.APP_BASE_URL || process.env.APP_URL || 'http://localhost:5173';
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587', 10);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const EMAIL_FROM = process.env.EMAIL_FROM || process.env.SMTP_FROM || 'Grevya HR Portal <noreply@grevya.com>';

const enabled = hasRealEnvValue(SMTP_HOST) && hasRealEnvValue(SMTP_USER) && hasRealEnvValue(SMTP_PASS);

const transporter = enabled
  ? nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    })
  : null;

async function sendEmail(to, subject, html) {
  if (!transporter) {
    console.log(`[Email skipped] To: ${to} | Subject: ${subject}`);
    return { ok: false, skipped: true, reason: 'SMTP is not configured' };
  }

  try {
    const info = await transporter.sendMail({ from: EMAIL_FROM, to, subject, html });
    console.log(`[Email sent] -> ${to}`);
    return { ok: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[Email error] ${err.message}`);
    return { ok: false, error: err.message };
  }
}

function sendEmailNotification(to, template) {
  if (!to || !template) return;
  sendEmail(to, template.subject, template.html).catch((err) => {
    console.error(`[Email notification error] ${err.message}`);
  });
}

async function verifyEmailTransport() {
  if (!transporter) return { ok: false, skipped: true, reason: 'SMTP is not configured' };
  try {
    await transporter.verify();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

const shell = (title, body) => `
  <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:24px;background:#f8fafc;border-radius:12px;color:#172033">
    <div style="border-left:4px solid #16a34a;padding-left:16px;margin-bottom:20px">
      <h2 style="margin:0;color:#0f172a">${title}</h2>
    </div>
    ${body}
    <p style="color:#64748b;font-size:12px;margin-top:24px">Grevya HR Portal · <a href="${APP_URL}">Open portal</a></p>
  </div>`;

const templates = {
  test: () => ({
    subject: 'Grevya HR email test',
    html: shell('Email is working', '<p>This is a test email from the HR Portal backend notification service.</p>'),
  }),
  pendingAccess: (name, email) => ({
    subject: `Access approval required - ${email}`,
    html: shell('New access request', `<p><strong>${name || email}</strong> requested access to Grevya HR.</p><p>Email: <strong>${email}</strong></p><p>Please review and approve or reject this account in the portal.</p>`),
  }),
  userApproved: (name) => ({
    subject: 'Your Grevya HR access is approved',
    html: shell('Access approved', `<p>Hi <strong>${name}</strong>, your HR Portal access has been approved. You can now log in.</p><p><a href="${APP_URL}" style="display:inline-block;background:#16a34a;color:white;text-decoration:none;padding:10px 14px;border-radius:8px;font-weight:700">Open HR Portal</a></p>`),
  }),
  userRejected: (name) => ({
    subject: 'Your Grevya HR access request was reviewed',
    html: shell('Access request reviewed', `<p>Hi <strong>${name}</strong>, your HR Portal access request was not approved. Please contact HR for details.</p>`),
  }),
  passwordReset: (name, token) => ({
    subject: 'Reset your Grevya HR password',
    html: shell('Password reset requested', `<p>Hi <strong>${name}</strong>, a password reset was requested for your account.</p><p>Use the reset flow in the portal. Reference token: <strong>${token}</strong></p>`),
  }),
  employeeInvited: (name, email) => ({
    subject: 'You have been invited to Grevya HR',
    html: shell('Welcome to Grevya HR', `<p>Hi <strong>${name}</strong>, your HR Portal account has been created for <strong>${email}</strong>.</p><p>Please use your Supabase invite or reset-password email to set your own password.</p>`),
  }),
  welcome: (name, email) => ({
    subject: 'Welcome to Grevya HR',
    html: shell('Welcome to Grevya HR', `<p>Hi <strong>${name}</strong>, your HR Portal account has been prepared for <strong>${email}</strong>.</p><p>Please use the invite or reset-password flow to set your own password.</p>`),
  }),
  leaveApplied: (name, type, days, startDate) => ({
    subject: `Leave request submitted - ${name}`,
    html: shell('Leave request submitted', `<p><strong>${name}</strong> applied for <strong>${type}</strong> leave.</p><p>Days: <strong>${days}</strong><br/>Start: <strong>${startDate}</strong></p>`),
  }),
  leaveApproved: (name, type, days, startDate) => ({
    subject: `Leave approved - ${type}`,
    html: shell('Leave approved', `<p>Hi <strong>${name}</strong>, your <strong>${type}</strong> leave for <strong>${days}</strong> day(s) from <strong>${startDate}</strong> has been approved.</p>`),
  }),
  leaveRejected: (name, type, days, reason) => ({
    subject: `Leave rejected - ${type}`,
    html: shell('Leave rejected', `<p>Hi <strong>${name}</strong>, your <strong>${type}</strong> leave for <strong>${days}</strong> day(s) was rejected.</p>${reason ? `<p>Reason: ${reason}</p>` : ''}`),
  }),
  payslip: (name, month, year, net) => ({
    subject: `Payslip ready - ${month} ${year}`,
    html: shell('Payslip ready', `<p>Hi <strong>${name}</strong>, your payslip for <strong>${month} ${year}</strong> is ready.</p><p>Net salary: <strong>INR ${Number(net).toLocaleString('en-IN')}</strong></p>`),
  }),
  payrollProcessed: (month, year) => ({
    subject: `Payroll processed - ${month} ${year}`,
    html: shell('Payroll processed', `<p>Payroll for <strong>${month} ${year}</strong> has been processed.</p>`),
  }),
  performanceReview: (name, period, overall) => ({
    subject: `Performance review ready - ${period || 'Current cycle'}`,
    html: shell('Performance review ready', `<p>Hi <strong>${name}</strong>, your performance review for <strong>${period || 'the current cycle'}</strong> is ready.</p>${overall ? `<p>Overall score: <strong>${overall}/100</strong></p>` : ''}`),
  }),
  recruitmentEvent: (candidateName, stage) => ({
    subject: `Recruitment update - ${candidateName}`,
    html: shell('Recruitment update', `<p>Candidate <strong>${candidateName}</strong> moved to stage <strong>${stage}</strong>.</p>`),
  }),
  candidateHired: (candidateName) => ({
    subject: `Candidate hired - ${candidateName}`,
    html: shell('Candidate hired', `<p><strong>${candidateName}</strong> has been marked as hired in recruitment.</p>`),
  }),
  documentEvent: (name, action) => ({
    subject: `Document ${action} - ${name}`,
    html: shell(`Document ${action}`, `<p>Document <strong>${name}</strong> was <strong>${action}</strong>.</p>`),
  }),
  expenseSubmitted: (name, amount, category) => ({
    subject: `Expense submitted - ${name}`,
    html: shell('Expense submitted', `<p><strong>${name}</strong> submitted an expense claim.</p><p>Amount: <strong>INR ${Number(amount).toLocaleString('en-IN')}</strong><br/>Category: <strong>${category}</strong></p>`),
  }),
  expenseDecision: (name, amount, category, status, comments) => ({
    subject: `Expense ${status} - ${category}`,
    html: shell(`Expense ${status}`, `<p>Hi <strong>${name}</strong>, your <strong>${category}</strong> claim for <strong>INR ${Number(amount).toLocaleString('en-IN')}</strong> was <strong>${status}</strong>.</p>${comments ? `<p>Comment: ${comments}</p>` : ''}`),
  }),
  generic: (title, message) => ({
    subject: title,
    html: shell(title, `<p>${message}</p>`),
  }),
};

module.exports = { sendEmail, sendEmailNotification, verifyEmailTransport, templates, enabled };
