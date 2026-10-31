const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const OTP = require('../models/OTP');
const { sendOtpEmail } = require('../utils/mailer');

const router = express.Router();

router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = await bcrypt.hash(otp, 10);

    await OTP.create({
      email: email.toLowerCase().trim(),
      otp: hashedOtp
    });

    await sendOtpEmail(email, otp);

    res.json({ message: 'OTP sent' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: 'Email, OTP, and new password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    const otpRecord = await OTP.findOne({
      email: email.toLowerCase().trim()
    }).sort({ createdAt: -1 });

    if (!otpRecord) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    const isOtpValid = await bcrypt.compare(otp, otpRecord.otp);
    if (!isOtpValid) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    await OTP.deleteOne({ _id: otpRecord._id });

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
