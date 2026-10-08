import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Helper to generate JWT Token
const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'postly_super_secret_jwt_key_2026',
    { expiresIn: '7d' }
  );
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res) => {
  try {
    const { name, username, email, password, profileImage } = req.body;

    if (!name || !username || !email || !password) {
      return res.status(400).json({ message: 'Please add all required fields' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanUsername = username.toLowerCase().trim().replace('@', '');

    // Check if user already exists
    const userExists = await User.findOne({
      $or: [{ email: cleanEmail }, { username: cleanUsername }],
    });

    if (userExists) {
      return res.status(400).json({
        message: userExists.email === cleanEmail
          ? 'Email already in use'
          : 'Username already taken',
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      name: name.trim(),
      username: cleanUsername,
      email: cleanEmail,
      password: hashedPassword,
      profileImage:
        profileImage ||
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
    });

    if (user) {
      res.status(201).json({
        message: 'Account created successfully 🎉',
        token: generateToken(user._id),
        user: {
          _id: user._id,
          id: user._id,
          name: user.name,
          username: user.username,
          email: user.email,
          profileImage: user.profileImage,
          bio: user.bio,
          followersCount: user.followersCount,
          followingCount: user.followingCount,
        },
      });
    } else {
      res.status(400).json({ message: 'Invalid user data received' });
    }
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail });

    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({
        message: 'Login successful ✨',
        token: generateToken(user._id),
        user: {
          _id: user._id,
          id: user._id,
          name: user.name,
          username: user.username,
          email: user.email,
          profileImage: user.profileImage,
          bio: user.bio,
          followersCount: user.followersCount,
          followingCount: user.followingCount,
        },
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User profile not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve user profile' });
  }
};
