import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: "info@cybercraft360.com",
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export async function sendEmail(options: {
  to: string | string[];
  subject: string;
  html: string;
  attachments?: { filename: string; content: string | Buffer; encoding?: string; contentType?: string }[];
}) {
  return transporter.sendMail({
    from: '"CyberCraft360" <info@cybercraft360.com>',
    to: Array.isArray(options.to) ? options.to.join(", ") : options.to,
    subject: options.subject,
    html: options.html,
    attachments: options.attachments,
  });
}
