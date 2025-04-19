const express = require("express");
const { sendOTP, verifyOTP, resetPassword, loginUser } = require("../controllers/authController");
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const User = require("../models/User"); // Make sure to import your User model
const { googleLogin } = require("../controllers/authController");

const router = express.Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

router.post("/google-login", googleLogin); // Google login route

// Send OTP Route
router.post("/forgot-password", sendOTP);

// Verify OTP Route
router.post("/verify-otp", verifyOTP);

// Reset Password Route
router.post("/reset-password", resetPassword);

// Login Route
router.post("/login", loginUser);

// Google OAuth route
router.post('/google', async (req, res) => {
  const { token } = req.body;

  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub, email, name, picture } = payload;

    let user = await User.findOne({ email });

    if (!user) {
      user = new User({
        name,
        email,
        googleId: sub,
        avatar: picture,
      });
      await user.save();
    }

    const accessToken = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.status(200).json({ accessToken, user });
  } catch (err) {
    console.error('Google login error:', err.message);
    res.status(400).json({ message: 'Google login failed' });
  }
});

module.exports = router;