const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema({
  fullName: { 
    type: String, 
    required: function () { return !this.googleId; } 
  },
  email: { type: String, required: true, unique: true },
  password: { 
    type: String, 
    required: function () { return !this.googleId; } 
  },
  profilePic: { type: String, default: "" },
  googleId: { type: String }, // For Google-authenticated users
  isAdmin: { type: Boolean, default: false },
  lastLogin: { type: Date, default: null }
}, { timestamps: true });

// Hash password before saving
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

module.exports = mongoose.model("User", UserSchema);
