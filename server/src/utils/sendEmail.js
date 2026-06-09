const { Resend } = require('resend');

function getMailProvider() {
  return String(process.env.MAIL_PROVIDER || '').trim();
}

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

function validateMailProvider() {
  const provider = getMailProvider();
  
  if (!provider) {
    throw new Error("MAIL_PROVIDER is not configured");
  }
  
  if (provider !== "resend") {
    throw new Error(`Unsupported mail provider: ${provider}`);
  }
  
  return provider;
}

async function sendEmail({ to, subject, html, from, cc, bcc, text }) {
  const provider = getMailProvider();
  const apiKey = getResendApiKey();
  const client = getResendClient();

  console.log("MAIL_PROVIDER:", provider);

  // Validate mail provider
  try {
    validateMailProvider();
  } catch (err) {
    console.error('Mail provider validation failed:', err.message);
    throw err;
  }

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
  console.log('Attempting Resend email...');
  console.log('Recipient:', to);
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
    
    const response = await client.emails.send(payload);

    console.log("RESEND RAW RESPONSE:", response);

    if (!response) {
      throw new Error("No response from Resend");
    }

    if (response.error) {
      console.error("RESEND API ERROR:", response.error);
      throw new Error(response.error.message || "Resend send failed");
    }

    const messageId =
      response?.data?.id ||
      response?.id ||
      null;

    if (!messageId) {
      console.warn("Resend response missing ID but send may still have succeeded");
    } else {
      console.log("Resend email accepted:", messageId);
    }

    return response;
  } catch (err) {
    console.error('FINAL EMAIL ERROR:', err);
    const error = new Error(err?.message || 'Email send failed');
    error.code = 'ERR_RESEND_API';
    error.details = err;
    throw error;
  }
}

module.exports = {
  sendEmail,
  isResendConfigured,
  validateMailProvider,
  getMailProvider,
  DEFAULT_FROM,
  getDefaultFrom,
};
