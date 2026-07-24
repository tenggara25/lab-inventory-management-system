import express from 'express';
import { getAllBarang, getById, createBarang, updateBarang, deleteBarang } from '../controllers/barang.controller';
import { verifyToken, requireRole } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = express.Router();

// Tampil barang dapat diakses oleh semua role terotentikasi (admin, operator, viewer)
router.get('/', verifyToken, getAllBarang);
router.get('/:id', verifyToken, getById);

// Tambah & Edit barang dapat dilakukan oleh admin & operator
router.post('/', verifyToken, requireRole('admin', 'operator'), upload.single('gambar'), createBarang);
router.put('/:id', verifyToken, requireRole('admin', 'operator'), upload.single('gambar'), updateBarang);

// Hapus barang hanya dapat dilakukan oleh admin
router.delete('/:id', verifyToken, requireRole('admin'), deleteBarang);

export default router;
