const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_API_URL = 'https://api.resend.com/emails';
const DEFAULT_FROM = 'AI Interview Team <support@aiinterviewplatform.com>';

function isResendConfigured() {
  return Boolean(RESEND_API_KEY && String(RESEND_API_KEY).trim());
}

async function sendEmail({ to, subject, html, from = DEFAULT_FROM }) {
  if (!isResendConfigured()) {
    throw new Error('Resend email service is not configured. Set RESEND_API_KEY in the environment.');
  }

  if (!to) {
    throw new Error('Email recipient is required.');
  }

  if (!subject) {
    throw new Error('Email subject is required.');
  }

  if (!html) {
    throw new Error('Email html content is required.');
  }

  const payload = {
    from,
    to,
    subject,
    html,
  };

  let response;
  let responseBody;

  try {
    response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  } catch (fetchError) {
    throw new Error(`Resend API request failed: ${fetchError.message}`);
  }

  try {
    responseBody = await response.text();
  } catch (bodyError) {
    throw new Error(`Unable to read Resend response: ${bodyError.message}`);
  }

  let parsedBody;
  try {
    parsedBody = JSON.parse(responseBody);
  } catch {
    parsedBody = null;
  }

  if (!response.ok) {
    const errorDetail = parsedBody?.error || parsedBody?.message || responseBody || response.statusText;
    throw new Error(`Resend API error (${response.status}): ${errorDetail}`);
  }

  return parsedBody || null;
}

module.exports = {
  sendEmail,
  isResendConfigured,
  DEFAULT_FROM,
};
