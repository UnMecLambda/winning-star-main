import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';

export interface AuthRequest extends Request {
  user?: any; // mongoose doc
}

export async function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Access token required' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) return res.status(401).json({ error: 'Invalid token' });

    req.user = user; // contient _id
    next();
  } catch {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

// alias pour compatibilité avec les routes manager
export const authenticate = authenticateToken;
