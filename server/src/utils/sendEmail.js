const Resend = require('resend');

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const DEFAULT_FROM =
  process.env.EMAIL_FROM ||
  (process.env.NODE_ENV && process.env.NODE_ENV !== 'production'
    ? 'AI Interview Team <onboarding@resend.dev>'
    : 'AI Interview Team <support@aiinterviewplatform.com>');

function isResendConfigured() {
  return Boolean(RESEND_API_KEY && String(RESEND_API_KEY).trim());
}

let resendClient = null;
if (isResendConfigured()) {
  try {
    resendClient = new Resend(RESEND_API_KEY);
  } catch (e) {
    // leave resendClient null and let sendEmail report configuration error
    resendClient = null;
  }
}

async function sendEmail({ to, subject, html, from = DEFAULT_FROM, cc, bcc, text }) {
  if (!isResendConfigured() || !resendClient) {
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

  try {
    const payload = {
      from,
      to,
      subject,
    };

    if (html) payload.html = html;
    if (text) payload.text = text;
    if (cc) payload.cc = cc;
    if (bcc) payload.bcc = bcc;

    const result = await resendClient.emails.send(payload);
    return result;
  } catch (err) {
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
};
