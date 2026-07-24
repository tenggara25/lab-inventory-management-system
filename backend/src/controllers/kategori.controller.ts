import type { Request, Response } from 'express';
import pool from '../config/db';
import { validationResult } from 'express-validator';

export const getAll = async (req: Request, res: Response) => {
  try {
    const [rows]: any = await pool.query('SELECT * FROM kategori ORDER BY id ASC');
    res.json({ success: true, data: rows });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

export const getById = async (req: Request, res: Response) => {
  try {
    const [rows]: any = await pool.query('SELECT * FROM kategori WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Kategori not found' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

export const create = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { nama_kategori, deskripsi } = req.body;
    await pool.query('INSERT INTO kategori (nama_kategori, deskripsi) VALUES (?, ?)', [nama_kategori, deskripsi]);
    res.status(201).json({ success: true, message: 'Kategori created successfully' });
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: 'Nama kategori already exists' });
    }
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { nama_kategori, deskripsi } = req.body;
    const [result]: any = await pool.query(
      'UPDATE kategori SET nama_kategori = ?, deskripsi = ? WHERE id = ?',
      [nama_kategori, deskripsi, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Kategori not found' });
    }

    res.json({ success: true, message: 'Kategori updated successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

export const remove = async (req: Request, res: Response) => {
  try {
    const [result]: any = await pool.query('DELETE FROM kategori WHERE id = ?', [req.params.id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Kategori not found' });
    }

    res.json({ success: true, message: 'Kategori deleted successfully' });
  } catch (error: any) {
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(400).json({ success: false, message: 'Cannot delete kategori because it is referenced by other records' });
    }
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

