const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const buildPlainText = (html) => {
  if (!html) return '';
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<li>/gi, '- ')
    .replace(/<\/li>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

const sendEmail = async ({
  to,
  subject,
  html,
}) => {
  try {
    console.log('========== EMAIL DEBUG START ==========', {
      MAIL_PROVIDER: process.env.MAIL_PROVIDER,
      RESEND_API_KEY_present: !!process.env.RESEND_API_KEY,
      MAIL_FROM: process.env.MAIL_FROM,
      to,
      subject,
    });

    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY missing');
    }

    if (!process.env.MAIL_FROM) {
      throw new Error('MAIL_FROM missing');
    }

    const response = await resend.emails.send({
      from: process.env.MAIL_FROM,
      to,
      subject,
      html,
      text: buildPlainText(html),
    });

    console.log('FULL RESEND RESPONSE:', response);

    if (response?.error) {
      console.error('RESEND ERROR:', response.error);

      throw new Error(
        response.error.message || 'Failed to send email'
      );
    }

    console.log('EMAIL REQUEST ACCEPTED');

    return response;
  } catch (error) {
    console.error('FINAL EMAIL SEND ERROR:', error);
    throw error;
  }
};

module.exports = {
  sendEmail,
};
