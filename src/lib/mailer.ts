import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "cybercraftlimited@gmail.com",
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export async function sendEmail(options: {
  to: string | string[];
  subject: string;
  html: string;
  attachments?: { filename: string; content: string; encoding: string }[];
}) {
  return transporter.sendMail({
    from: '"CyberCraft360" <cybercraftlimited@gmail.com>',
    to: Array.isArray(options.to) ? options.to.join(", ") : options.to,
    subject: options.subject,
    html: options.html,
    attachments: options.attachments,
  });
}
