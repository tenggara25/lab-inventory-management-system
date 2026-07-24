import type { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../config/db';
import { validationResult } from 'express-validator';
import type { AuthRequest } from '../middleware/auth';

// POST /api/auth/register
export const register = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password, role } = req.body;
    const userRole = ['admin', 'operator', 'viewer'].includes(role) ? role : 'viewer';

    const [existingUser]: any = await pool.query(
      'SELECT * FROM users WHERE username = ? OR email = ?',
      [username, email]
    );

    if (existingUser.length > 0) {
      return res.status(400).json({ message: 'Username atau email sudah digunakan' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query(
      'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
      [username, email, hashedPassword, userRole]
    );

    res.status(201).json({ message: 'User berhasil didaftarkan' });
  } catch (error: any) {
    res.status(500).json({ message: 'Terjadi kesalahan pada server', error: error.message });
  }
};

// POST /api/auth/login
export const login = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(401).json({ success: false, errors: errors.array() });
    }

    const { email, password } = req.body;

    const [row]: any = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (row.length === 0) {
      return res.status(401).json({ success: false, message: 'Email atau password salah' });
    }

    const user = row[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Email atau password salah' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET ?? '',
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'Login berhasil',
      data: {
        token,
        user: { id: user.id, username: user.username, role: user.role }
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server', error: error.message });
  }
};

// GET /api/auth/profile
export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    const [row]: any = await pool.query(
      'SELECT id, username, email, role, created_at, updated_at FROM users WHERE id = ?',
      [req.user?.id]
    );

    if (!row || row.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, data: row[0] });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server', error: error.message });
  }
};

        



