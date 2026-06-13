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
    console.log("RESEND_API_KEY prefix:", process.env.RESEND_API_KEY?.substring(0, 10));
    console.log("MAIL_FROM:", process.env.MAIL_FROM);
    console.log("Sending TO:", to);

    if (!process.env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY missing");
    }

    if (!process.env.MAIL_FROM) {
      throw new Error("MAIL_FROM missing");
    }

    const fromAddress = formatFromAddress(process.env.MAIL_FROM);
    console.log("Formatted FROM address:", fromAddress);

    const emailPayload = {
      from: fromAddress,
      to,
      subject,
      html,
      text: buildPlainText(html),
      reply_to: fromAddress,
    };
    
    console.log("Email payload keys:", Object.keys(emailPayload));
    console.log("About to call resend.emails.send()");
    
    const response = await resend.emails.send(emailPayload);

    console.log("FULL RESEND RESPONSE:", JSON.stringify(response, null, 2));

    if (response?.error) {
      console.error("RESEND API ERROR:", response.error);
      console.error("RESEND ERROR MESSAGE:", response.error.message);
      console.error("RESEND ERROR DETAILS:", JSON.stringify(response.error, null, 2));
      throw new Error(
        `Resend API failed: ${response.error.message || 'Unknown error'}`
      );
    }

    if (!response?.id) {
      console.warn("Resend response missing email ID:", response);
      throw new Error("Resend did not return an email ID");
    }

    console.log("EMAIL SENT SUCCESSFULLY", { emailId: response?.id, status: response?.status });
    console.log("========== EMAIL DEBUG END ==========");

    return response;
  } catch (error) {
    console.error("FINAL EMAIL SEND ERROR:", error.message);
    console.error("FULL ERROR STACK:", error.stack);
    console.log("========== EMAIL DEBUG END (WITH ERROR) ==========");

    throw error;
  }
};

module.exports = {
  sendEmail,
};
