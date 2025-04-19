const { OAuth2Client } = require("google-auth-library");
const User = require("../models/User");
const nodemailer = require("nodemailer");
const otpGenerator = require("otp-generator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { jwtDecode } = require("jwt-decode");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const otpStore = {};

// Enhanced Google Login Controller with both verification methods
const googleLogin = async (req, res) => {
  const { credential } = req.body;

  try {
    // Verify token using Google's library
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    
    // Also decode to ensure we have all needed fields
    const decoded = jwtDecode(credential);

    const email = payload.email || decoded.email;
    if (!email) {
      return res.status(400).json({ message: "Email is missing from Google response" });
    }

    // Handle full name - try multiple possible fields
    let fullName = payload.name || 
                  decoded.name || 
                  `${decoded.given_name || ""} ${decoded.family_name || ""}`.trim();
    
    // If we still don't have a name, use a default
    if (!fullName) {
      fullName = "Google User";
    }

    const profilePic = payload.picture || decoded.picture || "";
    const googleId = payload.sub || decoded.sub;

    // Check if user exists
    let user = await User.findOne({ 
      $or: [
        { email },
        { googleId }
      ]
    });

    if (!user) {
      // Create new Google user
      user = await User.create({
        fullName,
        email,
        googleId,
        password: "google_dummy_password", // Will be ignored due to isGoogleUser
        profilePic,
        isGoogleUser: true
      });
    } else if (!user.isGoogleUser) {
      // Existing non-Google user trying to login with Google
      return res.status(400).json({ 
        message: "This email is registered with password authentication. Please login with your password." 
      });
    }

    // Update profile picture if it's changed
    if (profilePic && user.profilePic !== profilePic) {
      user.profilePic = profilePic;
      await user.save();
    }

    // Create JWT
    const token = jwt.sign({ 
      id: user._id,
      email: user.email,
      isAdmin: user.isAdmin 
    }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.json({
      token,
      message: "Google login successful!",
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        profilePic: user.profilePic,
        isAdmin: user.isAdmin,
        isGoogleUser: user.isGoogleUser
      },
    });
  } catch (error) {
    console.error("Google login error:", error.message);
    res.status(401).json({ message: "Google login failed. Please try again." });
  }
};

const sendOTP = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found!" });
    }

    // Prevent OTP sending for Google users
    if (user.isGoogleUser) {
      return res.status(400).json({ 
        message: "Google-authenticated users cannot reset password via OTP" 
      });
    }

    const otp = otpGenerator.generate(6, { 
      upperCase: false, 
      specialChars: false,
      alphabets: false 
    });
    
    // Store OTP with expiration (5 minutes)
    otpStore[email] = {
      code: otp,
      expiresAt: Date.now() + 300000 // 5 minutes in milliseconds
    };

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Password Reset OTP",
      text: `Your OTP for password reset is: ${otp}. This OTP will expire in 5 minutes.`,
      html: `<p>Your OTP for password reset is: <strong>${otp}</strong>. This OTP will expire in 5 minutes.</p>`,
    };

    await transporter.sendMail(mailOptions);
    res.json({ message: "OTP sent successfully!" });
  } catch (error) {
    console.error("Error sending OTP:", error);
    res.status(500).json({ 
      message: "Error sending OTP",
      error: error.message 
    });
  }
};

const verifyOTP = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const storedOtp = otpStore[email];
    
    if (!storedOtp || storedOtp.code !== otp) {
      return res.status(400).json({ message: "Invalid OTP!" });
    }
    
    if (storedOtp.expiresAt < Date.now()) {
      delete otpStore[email];
      return res.status(400).json({ message: "OTP has expired!" });
    }

    // Mark OTP as verified (can be used for password reset)
    otpStore[email].verified = true;
    res.json({ message: "OTP verified successfully!" });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    res.status(500).json({ 
      message: "Error verifying OTP",
      error: error.message 
    });
  }
};

const resetPassword = async (req, res) => {
  const { email, newPassword } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found!" });
    }

    // Check if user is a Google user
    if (user.isGoogleUser) {
      return res.status(400).json({ 
        message: "Google-authenticated users cannot reset password" 
      });
    }

    // Verify OTP was validated
    const storedOtp = otpStore[email];
    if (!storedOtp || !storedOtp.verified) {
      return res.status(400).json({ message: "OTP not verified!" });
    }

    // Hash the new password before saving
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();
    
    // Clear the OTP after successful password reset
    delete otpStore[email];

    res.json({ message: "Password reset successfully!" });
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).json({ 
      message: "Error resetting password",
      error: error.message 
    });
  }
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(404).json({ message: "User not found!" });
    }

    // Check if user is a Google user trying to login with password
    if (user.isGoogleUser) {
      return res.status(400).json({ 
        message: "Please login using Google authentication" 
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect password!" });
    }

    // Update last login time
    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign({ 
      id: user._id,
      email: user.email,
      isAdmin: user.isAdmin 
    }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.json({ 
      token, 
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        isAdmin: user.isAdmin,
        lastLogin: user.lastLogin,
        profilePic: user.profilePic,
        isGoogleUser: user.isGoogleUser
      },
      message: "Login successful!" 
    });
  } catch (error) {
    console.error("Error logging in:", error);
    res.status(500).json({ 
      message: "Error logging in",
      error: error.message 
    });
  }
};

module.exports = { 
  sendOTP, 
  verifyOTP, 
  resetPassword, 
  loginUser,
  googleLogin 
};