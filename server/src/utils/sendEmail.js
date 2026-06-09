const Resend = require('resend');

function getResendApiKey() {
  return String(process.env.RESEND_API_KEY || '').trim();
}

function getDefaultFrom() {
  const explicitFrom = String(process.env.EMAIL_FROM || '').trim();
  if (explicitFrom) return explicitFrom;
  return process.env.NODE_ENV && process.env.NODE_ENV !== 'production'
    ? 'AI Interview Team <onboarding@resend.dev>'
    : 'AI Interview Team <support@aiinterviewplatform.com>';
}

const DEFAULT_FROM = getDefaultFrom();

let resendClient = null;
function getResendClient() {
  if (resendClient) return resendClient;
  const apiKey = getResendApiKey();
  if (!apiKey) return null;

  try {
    resendClient = new Resend(apiKey);
    return resendClient;
  } catch (e) {
    console.error('Failed to initialize Resend client:', e.message);
    return null;
  }
}

function isResendConfigured() {
  return Boolean(getResendApiKey());
}

async function sendEmail({ to, subject, html, from, cc, bcc, text }) {
  const apiKey = getResendApiKey();
  const client = getResendClient();

  if (!apiKey || !client) {
    console.error('Missing RESEND_API_KEY in runtime environment');
    const err = new Error('Resend email service is not configured. Set RESEND_API_KEY in the environment.');
    err.code = 'ERR_EMAIL_NOT_CONFIGURED';
    throw err;
  }

  if (!to) {
    const err = new Error('Email recipient is required.');
    err.code = 'ERR_EMAIL_NO_RECIPIENT';
    throw err;
  }

  if (!subject) {
    const err = new Error('Email subject is required.');
    err.code = 'ERR_EMAIL_NO_SUBJECT';
    throw err;
  }

  if (!html && !text) {
    const err = new Error('Email html or text content is required.');
    err.code = 'ERR_EMAIL_NO_CONTENT';
    throw err;
  }

  const senderEmail = from || getDefaultFrom();
  console.log('Sending email to:', to);
  console.log('Using sender:', senderEmail);

  try {
    const payload = {
      from: senderEmail,
      to,
      subject,
    };

    if (html) payload.html = html;
    if (text) payload.text = text;
    if (cc) payload.cc = cc;
    if (bcc) payload.bcc = bcc;

    console.log('Resend payload:', { from: payload.from, to: payload.to, subject: payload.subject });
    const result = await client.emails.send(payload);
    console.log('Email sent successfully:', result);
    return result;
  } catch (err) {
    console.error('RESEND ERROR:', err);
    let details = null;
    try {
      details = err?.response?.data || err?.response || err?.message || String(err);
    } catch (e) {
      details = String(err);
    }

    const error = new Error(`Resend API error: ${details}`);
    error.code = err?.code || 'ERR_RESEND_API';
    error.details = details;
    throw error;
  }
}

module.exports = {
  sendEmail,
  isResendConfigured,
  DEFAULT_FROM,
  getDefaultFrom,
};
