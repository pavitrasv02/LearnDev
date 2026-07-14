const nodemailer = require("nodemailer");
const logger = require("../config/logger");

/**
 * Creates a Nodemailer transport.
 * In development/test it uses Ethereal (fake SMTP).
 * In production set SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS env vars.
 */
const createTransport = async () => {
  if (process.env.NODE_ENV === "production" && process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  // Development fallback — Ethereal catches the email; URL logged to console
  const testAccount = await nodemailer.createTestAccount();
  const transport = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    auth: { user: testAccount.user, pass: testAccount.pass },
  });
  logger.info("Ethereal test account created", { user: testAccount.user });
  return transport;
};

/**
 * Send an email.
 * @param {Object} opts - { to, subject, html }
 */
const sendEmail = async ({ to, subject, html }) => {
  try {
    const transporter = await createTransport();
    const from = process.env.EMAIL_FROM || "LearnDev <noreply@learndev.io>";
    const info = await transporter.sendMail({ from, to, subject, html });

    if (nodemailer.getTestMessageUrl(info)) {
      logger.info("Preview email URL", { url: nodemailer.getTestMessageUrl(info) });
    }
  } catch (err) {
    // Email failure should NOT crash the API — log and continue
    logger.error("Email send failed", { to, subject, error: err.message });
  }
};

module.exports = { sendEmail };
