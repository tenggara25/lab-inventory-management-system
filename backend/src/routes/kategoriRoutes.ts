import express from 'express';
import { getAll, getById, create, update, remove } from '../controllers/kategori.controller';
import { verifyToken, requireRole } from '../middleware/auth';

const router = express.Router();

// Tampil kategori dapat diakses semua role terotentikasi
router.get('/', verifyToken, getAll);
router.get('/:id', verifyToken, getById);

// Tambah & Edit kategori dapat dilakukan oleh admin & operator
router.post('/', verifyToken, requireRole('admin', 'operator'), create);
router.put('/:id', verifyToken, requireRole('admin', 'operator'), update);

// Hapus kategori hanya dapat dilakukan oleh admin
router.delete('/:id', verifyToken, requireRole('admin'), remove);

export default router;
