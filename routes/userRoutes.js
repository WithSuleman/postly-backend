import express from 'express';
import {
  getUserById,
  updateUserProfile,
  searchUsers,
} from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/search', searchUsers);
router.get('/:id', getUserById);
router.put('/:id', protect, updateUserProfile);

export default router;
