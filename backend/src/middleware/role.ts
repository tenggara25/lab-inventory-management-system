import {Response, NextFunction} from 'express';
import {AuthRequest} from './auth';

export const authorizeRole = (...roles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ 
                success: false, 
                message: 'Anda tidak memilik akses untuk fitur ini',
            });
        }

        next();
    };
};