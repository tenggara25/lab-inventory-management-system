import type { Response } from 'express';
import pool from '../config/db';
import { AuthRequest } from '../middleware/auth';
import { validationResult } from 'express-validator';
import fs from 'fs';
import path from 'path';

export const getAllBarang = async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;
    const search = (req.query.search as string) || '';
    const kondisi = (req.query.kondisi as string) || '';
    const kategoriId = (req.query.kategoriId as string) || '';

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (search) {
      whereClause += ' AND (b.nama_barang LIKE ? OR b.kode_barang LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (kondisi) {
      const normalizedKondisi = kondisi.toLowerCase().replace(/\s+/g, '_');
      whereClause += ' AND b.kondisi = ?';
      params.push(normalizedKondisi);
    }

    if (kategoriId) {
      whereClause += ' AND b.kategori_id = ?';
      params.push(kategoriId);
    }

    const [countResult]: any = await pool.query(
      `SELECT COUNT(*) as total FROM Barang b ${whereClause}`,
      params
    );
    const total = countResult[0]?.total || 0;

    const [rows]: any = await pool.query(
      `SELECT b.*, k.nama_kategori, u.username as created_by_name
       FROM Barang b
       LEFT JOIN Kategori k ON b.kategori_id = k.id
       LEFT JOIN Users u ON b.created_by = u.id
       ${whereClause} ORDER BY b.id DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    // Format kondisi for friendly display
    const formattedRows = rows.map((r: any) => ({
      ...r,
      kondisi_raw: r.kondisi,
      kondisi: r.kondisi === 'rusak_ringan' ? 'Rusak Ringan' :
               r.kondisi === 'rusak_berat' ? 'Rusak Berat' : 'Baik'
    }));

    res.json({
      success: true,
      data: formattedRows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server Error', error: error.message });
  }
};

export const getById = async (req: AuthRequest, res: Response) => {
  try {
    const [rows]: any = await pool.query(
      `SELECT b.*, k.nama_kategori, u.username as created_by_name
       FROM Barang b
       LEFT JOIN Kategori k ON b.kategori_id = k.id
       LEFT JOIN Users u ON b.created_by = u.id
       WHERE b.id = ?`,
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Barang tidak ditemukan' });
    }

    const item = rows[0];
    item.kondisi = item.kondisi === 'rusak_ringan' ? 'Rusak Ringan' :
                 item.kondisi === 'rusak_berat' ? 'Rusak Berat' : 'Baik';

    res.json({ success: true, data: item });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server Error', error: error.message });
  }
};

export const createBarang = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { nama_barang, kode_barang, kategori_id, jumlah, kondisi, lokasi, harga, keterangan } = req.body;
    const gambar = req.file ? req.file.filename : null;

    const catId = parseInt(kategori_id) || 1;
    const qty = parseInt(jumlah) || 0;
    const price = parseFloat(harga) || 0;
    let kond = (kondisi || 'baik').toString().toLowerCase().replace(/\s+/g, '_');
    if (!['baik', 'rusak_ringan', 'rusak_berat'].includes(kond)) {
      kond = 'baik';
    }

    const userId = req.user?.id || 1;

    await pool.query(
      'INSERT INTO Barang (nama_barang, kode_barang, kategori_id, jumlah, kondisi, lokasi, harga, gambar, keterangan, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [nama_barang, kode_barang, catId, qty, kond, lokasi || null, price, gambar, keterangan || null, userId]
    );

    res.status(201).json({ success: true, message: 'Barang berhasil ditambahkan' });
  } catch (error: any) {
    console.error('createBarang error:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: 'Kode barang sudah digunakan' });
    }

    res.status(500).json({ success: false, message: error.message || 'Server Error', error: error.message });
  }
};

export const updateBarang = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { id } = req.params;
    const { nama_barang, kode_barang, kategori_id, jumlah, kondisi, lokasi, harga, keterangan } = req.body;

    const [existingBarang]: any = await pool.query('SELECT * FROM Barang WHERE id = ?', [id]);
    if (existingBarang.length === 0) {
      return res.status(404).json({ success: false, message: 'Barang tidak ditemukan' });
    }

    let gambar = existingBarang[0].gambar;
    if (req.file) {
      if (gambar) {
        const oldPath = path.join(__dirname, '../../uploads', gambar);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
      gambar = req.file.filename;
    }

    const catId = parseInt(kategori_id) || existingBarang[0].kategori_id;
    const qty = parseInt(jumlah) ?? existingBarang[0].jumlah;
    const price = parseFloat(harga) ?? existingBarang[0].harga;
    let kond = (kondisi || existingBarang[0].kondisi).toString().toLowerCase().replace(/\s+/g, '_');
    if (!['baik', 'rusak_ringan', 'rusak_berat'].includes(kond)) {
      kond = 'baik';
    }

    await pool.query(
      'UPDATE Barang SET nama_barang = ?, kode_barang = ?, kategori_id = ?, jumlah = ?, kondisi = ?, lokasi = ?, harga = ?, gambar = ?, keterangan = ? WHERE id = ?',
      [nama_barang, kode_barang, catId, qty, kond, lokasi || null, price, gambar, keterangan || null, id]
    );

    res.json({ success: true, message: 'Barang berhasil diperbarui' });
  } catch (error: any) {
    console.error('updateBarang error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server Error', error: error.message });
  }
};

export const deleteBarang = async (req: AuthRequest, res: Response) => {
  try {
    const [existingBarang]: any = await pool.query('SELECT * FROM Barang WHERE id = ?', [req.params.id]);
    if (existingBarang.length === 0) {
      return res.status(404).json({ success: false, message: 'Barang tidak ditemukan' });
    }

    if (existingBarang[0].gambar) {
      const imagePath = path.join(__dirname, '../../uploads', existingBarang[0].gambar);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await pool.query('DELETE FROM Barang WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Barang berhasil dihapus' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server Error', error: error.message });
  }
};
