import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import multer from 'multer';

import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import postRoutes from './routes/postRoutes.js';
import commentRoutes from './routes/commentRoutes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Setup CORS
app.use(
  cors({
    origin: process.env.CLIENT_URL || '*',
    credentials: true,
  })
);

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || '.png';
    cb(null, `postly-${uniqueSuffix}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB limit
});

// Image Upload Endpoint
app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No image file uploaded' });
  }
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({
    message: 'Image uploaded successfully',
    url: fileUrl,
  });
});

// Trending / Discover Endpoint
app.get('/api/trending', (_req, res) => {
  res.json({
    topics: [
      { tag: '#WebDevelopment', count: '14.2k posts' },
      { tag: '#MERN', count: '9.8k posts' },
      { tag: '#React', count: '28.4k posts' },
      { tag: '#JavaScript', count: '41.1k posts' },
      { tag: '#DesignSystem', count: '7.3k posts' },
    ],
    suggestions: [
      {
        _id: 'sample_1',
        name: 'Maya Lin',
        username: 'mayacreates',
        profileImage:
          'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80',
        bio: 'Art director & digital creator',
      },
      {
        _id: 'sample_2',
        name: 'Alex Rivera',
        username: 'alexr_design',
        profileImage:
          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
        bio: 'Motion designer & minimalist',
      },
      {
        _id: 'sample_3',
        name: 'Sophia Chen',
        username: 'sophiacodes',
        profileImage:
          'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80',
        bio: 'Full stack tinkerer & open-source enthusiast',
      },
    ],
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'Postly API', timestamp: new Date() });
});

// MongoDB Connection
const MONGO_URI =
  process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/postly';

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB database successfully');
  })
  .catch((err) => {
    console.warn(
      '⚠️ MongoDB connection failed. Please ensure MONGO_URI is set:',
      err.message
    );
  });

// Start Express Server
app.listen(PORT, () => {
  console.log(`🚀 Postly backend listening on http://localhost:${PORT}`);
});
