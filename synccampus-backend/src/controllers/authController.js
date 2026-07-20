const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UserModel = require('../models/userModel');

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, role: user.role, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
};

exports.register = async (req, res, next) => {
  try {
    const { fullName, email, password, role, title, department, studentIdNo, phoneNumber } = req.body;

    // Enforce university email domain — a simple but effective error-prevention rule
    if (!email.endsWith('@usiu.ac.ke')) {
      return res.status(400).json({ success: false, message: 'Please use your official USIU email address.' });
    }

    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }

    if (role === 'faculty_leadership' && !title) {
      return res.status(400).json({ success: false, message: 'Title is required for Faculty/Leadership accounts.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await UserModel.create({
      fullName, email, passwordHash, role, title, department, studentIdNo, phoneNumber,
    });

    const token = generateToken(newUser);

    res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      data: { user: newUser, token },
    });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await UserModel.findByEmail(email);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    if (!user.is_active) {
      return res.status(403).json({ success: false, message: 'This account has been deactivated. Contact admin.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const token = generateToken(user);
    const { password_hash, ...safeUser } = user; // strip hash before sending

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: { user: safeUser, token },
    });
  } catch (err) {
    next(err);
  }
};

exports.getMe = async (req, res, next) => {
  try {
    const user = await UserModel.findById(req.user.id);
    res.status(200).json({ success: true, data: { user } });
  } catch (err) {
    next(err);
  }
};