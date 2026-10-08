import User from '../models/User.js';
import Post from '../models/Post.js';

// @desc    Get user profile by ID
// @route   GET /api/users/:id
// @access  Public
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const posts = await Post.find({ user: user._id })
      .populate('user', 'name username profileImage')
      .sort({ createdAt: -1 });

    res.json({
      user,
      postsCount: posts.length,
      posts,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error retrieving user' });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/:id
// @access  Private
export const updateUserProfile = async (req, res) => {
  try {
    if (req.userId.toString() !== req.params.id) {
      return res.status(403).json({ message: 'Unauthorized to edit this profile' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { name, username, bio, profileImage } = req.body;

    if (name) user.name = name.trim();
    if (username) user.username = username.toLowerCase().trim().replace('@', '');
    if (bio !== undefined) user.bio = bio.trim();
    if (profileImage) user.profileImage = profileImage;

    const updatedUser = await user.save();

    res.json({
      message: 'Profile updated successfully ✨',
      user: {
        _id: updatedUser._id,
        id: updatedUser._id,
        name: updatedUser.name,
        username: updatedUser.username,
        email: updatedUser.email,
        profileImage: updatedUser.profileImage,
        bio: updatedUser.bio,
        followersCount: updatedUser.followersCount,
        followingCount: updatedUser.followingCount,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error updating profile' });
  }
};

// @desc    Search users by name or username
// @route   GET /api/users/search
// @access  Public
export const searchUsers = async (req, res) => {
  try {
    const query = req.query.q || '';
    if (!query.trim()) {
      return res.json([]);
    }

    const regex = new RegExp(query.trim(), 'i');
    const users = await User.find({
      $or: [{ name: regex }, { username: regex }],
    })
      .select('name username profileImage bio followersCount')
      .limit(10);

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error searching users' });
  }
};
