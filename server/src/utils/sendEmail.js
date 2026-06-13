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

const formatFromAddress = (from) => {
  if (!from) return from;
  const trimmed = String(from).trim();
  if (trimmed.includes('<') && trimmed.includes('>')) {
    return trimmed;
  }
  return `AI Interview Team <${trimmed}>`;
};

const sendEmail = async ({
  to,
  subject,
  html,
}) => {
  try {
    console.log("========== EMAIL DEBUG START ==========");
    console.log("MAIL_PROVIDER:", process.env.MAIL_PROVIDER);
    console.log("RESEND_API_KEY exists:", !!process.env.RESEND_API_KEY);
    console.log("MAIL_FROM:", process.env.MAIL_FROM);
    console.log("Sending TO:", to);

    if (!process.env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY missing");
    }

    if (!process.env.MAIL_FROM) {
      throw new Error("MAIL_FROM missing");
    }

    const response = await resend.emails.send({
      from: formatFromAddress(process.env.MAIL_FROM),
      to,
      subject,
      html,
      text: buildPlainText(html),
      reply_to: process.env.MAIL_FROM,
    });

    console.log("FULL RESEND RESPONSE:", JSON.stringify(response, null, 2));

    if (response?.error) {
      console.error("RESEND API ERROR:", response.error);
      throw new Error(
        response.error.message || "Resend API failed"
      );
    }

    console.log("EMAIL SENT SUCCESSFULLY", { emailId: response?.id, status: response?.status });
    console.log("========== EMAIL DEBUG END ==========");

    return response;
  } catch (error) {
    console.error("FINAL EMAIL SEND ERROR:", error);
    console.log("========== EMAIL DEBUG END (WITH ERROR) ==========");

    throw error;
  }
};

module.exports = {
  sendEmail,
};
