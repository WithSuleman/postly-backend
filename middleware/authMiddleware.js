import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'postly_super_secret_jwt_key_2026'
      );

      // Try fetching from Mongo if connected, or set decoded id
      try {
        const found = await User.findById(decoded.id).select('-password');
        req.user = found || { _id: decoded.id, id: decoded.id };
      } catch {
        req.user = { _id: decoded.id, id: decoded.id };
      }

      req.userId = decoded.id;
      return next();
    } catch (error) {
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }
};
