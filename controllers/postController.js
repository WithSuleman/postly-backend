import Post from '../models/Post.js';
import Comment from '../models/Comment.js';

// @desc    Get all posts
// @route   GET /api/posts
// @access  Public
export const getPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate('user', 'name username profileImage')
      .populate({
        path: 'comments',
        populate: {
          path: 'user',
          select: 'name username profileImage',
        },
      })
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching posts' });
  }
};

// @desc    Get single post by ID
// @route   GET /api/posts/:id
// @access  Public
export const getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('user', 'name username profileImage')
      .populate({
        path: 'comments',
        populate: {
          path: 'user',
          select: 'name username profileImage',
        },
      });

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    res.json(post);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving post' });
  }
};

// @desc    Create new post
// @route   POST /api/posts
// @access  Private
export const createPost = async (req, res) => {
  try {
    const { text, image } = req.body;

    if (!text && !image) {
      return res.status(400).json({ message: 'Please provide text or an image' });
    }

    const post = await Post.create({
      user: req.userId,
      text: (text || '').trim(),
      image: image || '',
      likes: [],
      comments: [],
    });

    const populatedPost = await Post.findById(post._id).populate(
      'user',
      'name username profileImage'
    );

    res.status(201).json({
      message: 'Post created successfully 🎉',
      post: populatedPost,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error publishing post' });
  }
};

// @desc    Update post
// @route   PUT /api/posts/:id
// @access  Private
export const updatePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.user.toString() !== req.userId.toString()) {
      return res.status(403).json({ message: 'Unauthorized to edit this post' });
    }

    const { text, image } = req.body;
    if (text !== undefined) post.text = text.trim();
    if (image !== undefined) post.image = image;

    const updatedPost = await post.save();
    res.json({ message: 'Post updated', post: updatedPost });
  } catch (error) {
    res.status(500).json({ message: 'Error updating post' });
  }
};

// @desc    Delete post
// @route   DELETE /api/posts/:id
// @access  Private
export const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.user.toString() !== req.userId.toString()) {
      return res.status(403).json({ message: 'Unauthorized to delete this post' });
    }

    // Remove associated comments as well
    await Comment.deleteMany({ post: post._id });
    await Post.findByIdAndDelete(req.params.id);

    res.json({ message: 'Post and comments deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting post' });
  }
};

// @desc    Toggle like on post
// @route   POST /api/posts/:id/like
// @access  Private
export const likePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const userId = req.userId.toString();
    const alreadyLiked = post.likes.some((id) => id.toString() === userId);

    if (alreadyLiked) {
      post.likes = post.likes.filter((id) => id.toString() !== userId);
    } else {
      post.likes.push(req.userId);
    }

    await post.save();

    res.json({
      message: alreadyLiked ? 'Unliked post' : 'Liked post',
      likesCount: post.likes.length,
      likes: post.likes,
      isLiked: !alreadyLiked,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error liking post' });
  }
};
