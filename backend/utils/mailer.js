const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendOtpEmail(to, otp) {
  const mailOptions = {
    from: `"StudyForge" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Your StudyForge password reset code',
    text: `Your OTP is: ${otp}. It expires in 10 minutes.`,
  };

  await transporter.sendMail(mailOptions);
}

module.exports = { sendOtpEmail };
