const nodemailer = require("nodemailer");
const { env } = require("../../config/env");

const transporter = nodemailer.createTransport({
  host: env.smtp.host,
  port: env.smtp.port,
  secure: env.smtp.secure,
  auth: env.smtp.user ? { user: env.smtp.user, pass: env.smtp.pass } : undefined,
});

async function sendMail({ to, subject, html, text, from = env.defaultFromEmail }) {
  return transporter.sendMail({
    from,
    to,
    subject,
    text,
    html,
  });
}

module.exports = { transporter, sendMail };
