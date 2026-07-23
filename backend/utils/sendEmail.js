import nodemailer from 'nodemailer';

const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
    port: process.env.SMTP_PORT || 2525,
    auth: {
      user: process.env.SMTP_EMAIL || '',
      pass: process.env.SMTP_PASSWORD || '',
    },
  });

  const message = {
    from: `${process.env.FROM_NAME || 'Financial Habit Builder'} <${process.env.FROM_EMAIL || 'noreply@financialhabitbuilder.com'}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html,
  };

  const info = await transporter.sendMail(message);
  console.log('Email sent: %s', info.messageId);
};

export default sendEmail;
