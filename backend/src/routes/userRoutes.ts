import express from 'express';
import { getAll, create, update, remove, resetPassword } from '../controllers/user.controller';
import { verifyToken, requireRole } from '../middleware/auth';

const router = express.Router();

// Semua rute manajemen user hanya dapat diakses oleh Admin
router.use(verifyToken, requireRole('admin'));

router.get('/', getAll);
router.post('/', create);
router.put('/:id', update);
router.delete('/:id', remove);
router.put('/:id/password', resetPassword);

export default router;
