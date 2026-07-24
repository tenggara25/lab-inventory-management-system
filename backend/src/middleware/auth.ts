import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: { id: number; username: string; role: string };
}

export const verifyToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Token tidak ditemukan' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ success: false, message: 'Token tidak ditemukan' });
  }

  const jwtSecret: string = process.env.JWT_SECRET ?? 'supersecretkey123';

  try {
    const decoded = jwt.verify(token, jwtSecret) as any;
    req.user = { id: decoded.id, username: decoded.username, role: decoded.role };
    next();
  } catch (error: any) {
    return res.status(401).json({ success: false, message: 'Token tidak valid atau expired' });
  }
};

export const requireRole = (...allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Akses ditolak. Fitur ini memerlukan role ${allowedRoles.join(' atau ')}.`,
      });
    }
    next();
  };
};
