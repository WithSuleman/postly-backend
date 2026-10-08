import Comment from '../models/Comment.js';
import Post from '../models/Post.js';

// @desc    Get comments for a post
// @route   GET /api/comments/:postId
// @access  Public
export const getCommentsByPost = async (req, res) => {
  try {
    const comments = await Comment.find({ post: req.params.postId })
      .populate('user', 'name username profileImage')
      .sort({ createdAt: 1 });

    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving comments' });
  }
};

// @desc    Add comment to a post
// @route   POST /api/comments/:postId
// @access  Private
export const addComment = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Comment text is required' });
    }

    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const comment = await Comment.create({
      post: req.params.postId,
      user: req.userId,
      text: text.trim(),
    });

    // Push comment reference to post
    post.comments.push(comment._id);
    await post.save();

    const populatedComment = await Comment.findById(comment._id).populate(
      'user',
      'name username profileImage'
    );

    res.status(201).json({
      message: 'Comment added',
      comment: populatedComment,
      commentsCount: post.comments.length,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error adding comment' });
  }
};

// @desc    Delete a comment
// @route   DELETE /api/comments/:id
// @access  Private
export const deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Only comment author or post author can delete
    const post = await Post.findById(comment.post);
    const isCommentAuthor = comment.user.toString() === req.userId.toString();
    const isPostAuthor = post && post.user.toString() === req.userId.toString();

    if (!isCommentAuthor && !isPostAuthor) {
      return res.status(403).json({ message: 'Unauthorized to delete this comment' });
    }

    // Remove reference from post
    if (post) {
      post.comments = post.comments.filter(
        (cId) => cId.toString() !== comment._id.toString()
      );
      await post.save();
    }

    await Comment.findByIdAndDelete(req.params.id);

    res.json({ message: 'Comment removed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting comment' });
  }
};
