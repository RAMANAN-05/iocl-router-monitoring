const User = require('../models/User');

// ✅ Signup user
exports.signup = async (req, res) => {
  const { email, password } = req.body;

  if (!email?.includes('@') || !password) {
    return res.status(400).json({ success: false, message: 'Email and password required' });
  }

  try {
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ success: false, message: 'User already exists' });
    }

    const newUser = new User({ email, password });
    await newUser.save();

    res.json({ success: true, message: 'User registered successfully' });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ success: false, message: 'Server error during signup' });
  }
};

// ✅ Send OTP
exports.sendOtp = async (req, res) => {
  const { email } = req.body;
  if (!email?.includes('@')) return res.status(400).json({ success: false, message: 'Invalid email' });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiry = Date.now() + 60000;

  try {
    await User.findOneAndUpdate(
      { email },
      { $set: { otp, otpExpiry: expiry } },
      { upsert: true }
    );

    console.log(`OTP for ${email}: ${otp}`);
    res.json({ success: true, otp });
  } catch (err) {
    console.error('Send OTP error:', err);
    res.status(500).json({ success: false, message: 'Server error during OTP generation' });
  }
};

// ✅ Verify OTP
exports.verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user?.otp || Date.now() > user.otpExpiry)
      return res.status(400).json({ success: false, message: 'OTP expired or not found' });

    if (user.otp !== otp)
      return res.status(400).json({ success: false, message: 'Incorrect OTP' });

    res.json({ success: true, message: 'OTP verified' });
  } catch (err) {
    console.error('Verify OTP error:', err);
    res.status(500).json({ success: false, message: 'Server error during OTP verification' });
  }
};

// ✅ Reset Password
exports.resetPassword = async (req, res) => {
  const { email, newPassword } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.password = newPassword;
    user.otp = null;
    user.otpExpiry = null;
    await user.save();

    res.json({ success: true, message: 'Password reset successful' });
  } catch (err) {
    console.error('Reset Password error:', err);
    res.status(500).json({ success: false, message: 'Server error during password reset' });
  }
};

// ✅ Login
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user || user.password !== password)
      return res.status(401).json({ success: false, message: 'Invalid credentials' });

    res.json({ success: true, message: 'Login successful' });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
};
