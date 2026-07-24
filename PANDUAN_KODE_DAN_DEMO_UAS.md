# MASTER PANDUAN ULTIMATE UJIAN AKHIR SEMESTER (UAS)
# SISTEM MANAJEMEN INVENTARIS LABORATORIUM

> **Mata Kuliah**: Pemrograman Web / Pengembangan Aplikasi Full-Stack  
> **Teknologi**: Express.js (TypeScript), Next.js 14 (TypeScript), MySQL (`mysql2` Prepared Statements), JWT, Bcrypt, Multer.

---

## DAFTAR ISI

1. [Konsep Dasar & Arsitektur Decoupled RESTful API](#1-konsep-dasar--arsitektur-decoupled-restful-api)
2. [Skema Database MySQL, Relasi, & Data Seeder](#2-skema-database-mysql-relasi--data-seeder)
3. [Bedah Kode Backend API (Express.js TypeScript)](#3-bedah-kode-backend-api-expressjs-typescript)
   - [A. Entrypoint Server & Auto Migration (`index.ts`)](#a-entrypoint-server--auto-migration-indexts)
   - [B. Database Connection Pool (`db.ts`)](#b-database-connection-pool-dbts)
   - [C. Middleware Auth & Role Authorization (`auth.ts`)](#c-middleware-auth--role-authorization-authts)
   - [D. Middleware File Upload Multer (`upload.ts`)](#d-middleware-file-upload-multer-uploadts)
   - [E. Controller & Route Autentikasi (`auth.controller.ts`)](#e-controller--route-autentikasi-authcontrollerts)
   - [F. Controller & Route Inventaris Barang (`barang.controller.ts`)](#f-controller--route-inventaris-barang-barangcontrollerts)
   - [G. Controller & Route Kategori (`kategori.controller.ts`)](#g-controller--route-kategori-kategoricontrollerts)
   - [H. Controller & Route User Management (`user.controller.ts`)](#h-controller--route-user-management-usercontrollerts)
4. [Bedah Kode Frontend Web App (Next.js 14 TypeScript)](#4-bedah-kode-frontend-web-app-nextjs-14-typescript)
   - [A. API Helper Terpusat (`api.ts`)](#a-api-helper-terpusat-apits)
   - [B. Context Autentikasi Global (`AuthContext.tsx`)](#b-context-autentikasi-global-authcontexttsx)
   - [C. Guard Halaman Client (`ProtectedRoute.tsx`)](#c-guard-halaman-client-protectedroutetsx)
   - [D. Modul Inventaris Barang (`barang/page.tsx`)](#d-modul-inventaris-barang-barangpagetsx)
   - [E. Modul User Management & Reset Password (`users/page.tsx`)](#e-modul-user-management--reset-password-userspagetsx)
5. [Matriks Keamanan & Hak Akses Peran (RBAC)](#5-matriks-keamanan--hak-akses-peran-rbac)
6. [Bank 15 Pertanyaan Kritis Ujian & Jawaban Akademis](#6-bank-15-pertanyaan-kritis-ujian--jawaban-akademis)
7. [Naskah Skenario Presentasi & Demo Ujian (5 Menit)](#7-naskah-skenario-presentasi--demo-ujian-5-menit)
8. [Petunjuk Menjalankan Aplikasi dari Nol](#8-petunjuk-menjalankan-aplikasi-dari-nol)

---

## 1. KONSEP DASAR & ARSITEKTUR DECOUPLED RESTFUL API

Aplikasi ini menggunakan pola arsitektur **Client-Server Terpisah (Decoupled Full-Stack Architecture)** di mana Frontend dan Backend berjalan pada process/port yang berbeda.

```text
                               ┌────────────────────────────────────────┐
                               │             BROWSER CLIENT             │
                               └───────────────────┬────────────────────┘
                                                   │
                                                   ▼ HTTP (Port 3001)
                               ┌────────────────────────────────────────┐
                               │   FRONTEND: Next.js 14 (TypeScript)    │
                               │  - Client-Side Rendering (CSR)         │
                               │  - Auth Context & Protected Route      │
                               │  - Custom Fetch API (@/lib/api)        │
                               └───────────────────┬────────────────────┘
                                                   │
                                                   ▼ HTTP REST API (Port 3000)
                                                   │ (Header: Authorization Bearer <JWT>)
                               ┌────────────────────────────────────────┐
                               │   BACKEND: Express.js (TypeScript)     │
                               │  - Middleware: verifyToken & requireRole│
                               │  - File Upload Engine (Multer)         │
                               │  - Controllers (Auth, Barang, User)    │
                               └───────────────────┬────────────────────┘
                                                   │
                                                   ▼ Driver mysql2/promise (?)
                               ┌────────────────────────────────────────┐
                               │    DATABASE: MySQL (db_inventarislab)  │
                               │  - Tabel: users, kategori, barang      │
                               └────────────────────────────────────────┘
```

### Mengapa Arsitektur Ini Dipilih?
1. **Separation of Concerns (SoC)**: Backend hanya berfokus pada enkripsi, logika bisnis, dan keamanan data. Frontend hanya berfokus pada antarmuka pengguna (UI/UX).
2. **Scalability**: Backend REST API yang dibangun dapat melayani berbagai client sekaligus di masa depan (misal: Aplikasi Android, iOS, atau IoT Scanner).
3. **Reusability**: Menggunakan format pertukaran data standar `JSON`.

---

## 2. SKEMA DATABASE MYSQL, RELASI, & DATA SEEDER

Script SQL DDL berikut mendefinisikan 3 tabel utama beserta relasi Foreign Key (`database/inventaris_lab.sql`):

```sql
CREATE DATABASE IF NOT EXISTS db_inventarislab;
USE db_inventarislab;

-- 1. TABEL USERS (Menyimpan akun pengguna dan peran hak akses)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'operator', 'viewer') NOT NULL DEFAULT 'viewer',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. TABEL KATEGORI (Menyimpan pengelompokan jenis barang)
CREATE TABLE IF NOT EXISTS kategori (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nama_kategori VARCHAR(100) NOT NULL UNIQUE,
    deskripsi VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. TABEL BARANG (Tabel utama inventaris laboratorium)
CREATE TABLE IF NOT EXISTS barang (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nama_barang VARCHAR(150) NOT NULL,
    kode_barang VARCHAR(50) NOT NULL UNIQUE,
    kategori_id INT NOT NULL,
    jumlah INT NOT NULL DEFAULT 0,
    kondisi ENUM('baik', 'rusak_ringan', 'rusak_berat') NOT NULL DEFAULT 'baik',
    lokasi VARCHAR(100),
    harga BIGINT DEFAULT 0,
    gambar VARCHAR(255),
    keterangan TEXT,
    created_by INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (kategori_id) REFERENCES kategori(id) ON DELETE RESTRICT,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
);

-- OPTIMASI INDEX B-TREE UNTUK KECEPATAN SEARCH & FILTER
CREATE INDEX idx_barang_nama ON barang(nama_barang);
CREATE INDEX idx_barang_kode ON barang(kode_barang);
CREATE INDEX idx_barang_kategori ON barang(kategori_id);
CREATE INDEX idx_barang_kondisi ON barang(kondisi);

-- DATA INSIAL KATEGORI
INSERT INTO kategori (nama_kategori, deskripsi) VALUES
('Komputer & Komponen', 'Perangkat PC, Monitor, Keyboard, dan Aksesoris'),
('Jaringan & Konektivitas', 'Router, Switch, Kabel UTP, dan Access Point'),
('Alat Ukur & Pengujian', 'Multimeter, Oscilloscope, dan Sensor Lab')
ON DUPLICATE KEY UPDATE nama_kategori=VALUES(nama_kategori);
```

---

## 3. BEDAH KODE BACKEND API (EXPRESS.JS TYPESCRIPT)

### A. Entrypoint Server & Auto Migration (`backend/src/index.ts`)
File utama server yang menginisialisasi Express, CORS, Static Uploads, dan Auto Migration skema database saat startup:

```typescript
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import pool from './config/db';

import authRoutes from './routes/authRoutes';
import barangRoutes from './routes/barangRoutes';
import kategoriRoutes from './routes/kategoriRoutes';
import userRoutes from './routes/userRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Auto-Migration Database: Memastikan kolom 'harga' ada secara otomatis
const initDbSchema = async () => {
  try {
    const [cols]: any = await pool.query("SHOW COLUMNS FROM barang LIKE 'harga'");
    if (cols.length === 0) {
      await pool.query("ALTER TABLE barang ADD COLUMN harga BIGINT DEFAULT 0 AFTER lokasi");
      console.log("[DB Migration] Berhasil menambahkan kolom 'harga' ke tabel 'barang'.");
    }
  } catch (err: any) {
    console.warn("[DB Migration Warning]", err?.message);
  }
};

initDbSchema();

// Middleware Global
app.use(cors({ origin: 'http://localhost:3001', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Pendaftaran Endpoint Routes
app.use('/api/auth', authRoutes);
app.use('/api/barang', barangRoutes);
app.use('/api/kategori', kategoriRoutes);
app.use('/api/users', userRoutes);
app.use('/api/user', userRoutes);

// Root Health Check
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'OK', message: 'Koneksi database terhubung dengan baik' });
  } catch (error: any) {
    res.status(500).json({ status: 'ERROR', message: error.message });
  }
});

// Global Error Handler Middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Terjadi kesalahan pada internal server',
  });
});

app.listen(PORT, () => {
  console.log(`Server Express berjalan pada port ${PORT}`);
});
```

---

### B. Database Connection Pool (`backend/src/config/db.ts`)
Menggunakan `mysql2/promise` Connection Pool untuk efisiensi koneksi simultan:

```typescript
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'db_inventarislab',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export default pool;
```

---

### C. Middleware Auth & Role Authorization (`backend/src/middleware/auth.ts`)
Bertanggung jawab memverifikasi dekripsi JWT token dan memeriksa matriks peran (RBAC):

```typescript
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: { id: number; username: string; role: string };
}

// 1. Verifikasi JWT Token
export const verifyToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Token otentikasi tidak ditemukan' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretkey123') as any;
    req.user = { id: decoded.id, username: decoded.username, role: decoded.role };
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Token tidak valid atau telah kadaluarsa' });
  }
};

// 2. Otorisasi Hak Akses Berdasarkan Role
export const requireRole = (...allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Akses ditolak. Fitur ini hanya dapat diakses oleh role: ${allowedRoles.join(', ')}.`
      });
    }
    next();
  };
};
```

---

### D. Middleware File Upload Multer (`backend/src/middleware/upload.ts`)
Mengelola penyimpanan file gambar inventaris ke direktori fisik `backend/uploads/`:

```typescript
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import type { Request } from 'express';

const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, 'barang-' + uniqueSuffix + ext);
  }
});

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new Error('Format file tidak didukung. Gunakan gambar JPEG, PNG, atau WEBP.'));
  }
  cb(null, true);
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // Batas Maksimal File 5 MB
});
```

---

### E. Controller & Route Autentikasi (`backend/src/controllers/auth.controller.ts`)
Mengatur pendaftaran user, otentikasi login, hashing password dengan `bcrypt`, dan pembuatan token `JWT`:

```typescript
import type { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../config/db';

// POST /api/auth/register
export const register = async (req: Request, res: Response) => {
  try {
    const { username, email, password, role } = req.body;
    const userRole = ['admin', 'operator', 'viewer'].includes(role) ? role : 'viewer';

    const [existingUser]: any = await pool.query(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email]
    );

    if (existingUser.length > 0) {
      return res.status(400).json({ success: false, message: 'Username atau email sudah terdaftar' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query(
      'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
      [username, email, hashedPassword, userRole]
    );

    res.status(201).json({ success: true, message: 'Registrasi pengguna berhasil' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/auth/login
export const login = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    const [users]: any = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
    if (users.length === 0) {
      return res.status(400).json({ success: false, message: 'Username atau password tidak valid' });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Username atau password tidak valid' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET || 'supersecretkey123',
      { expiresIn: '1d' }
    );

    res.json({
      success: true,
      token,
      user: { id: user.id, username: user.username, email: user.email, role: user.role }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
```

---

### F. Controller & Route Inventaris Barang (`backend/src/controllers/barang.controller.ts`)
Mengelola seluruh fungsi CRUD data barang, kueri pencarian `LIKE ?`, pencocokan filter kondisi/kategori, pagination `COUNT/LIMIT/OFFSET`, dan penghapusan file fisik gambar:

```typescript
import type { Response } from 'express';
import pool from '../config/db';
import { AuthRequest } from '../middleware/auth';
import fs from 'fs';
import path from 'path';

// GET /api/barang
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
      whereClause += ' AND b.kondisi = ?';
      params.push(kondisi.toLowerCase().replace(/\s+/g, '_'));
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

    const formattedRows = rows.map((r: any) => ({
      ...r,
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
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/barang (Membutuhkan Hak Akses: Admin / Operator)
export const createBarang = async (req: AuthRequest, res: Response) => {
  try {
    const { nama_barang, kode_barang, kategori_id, jumlah, kondisi, lokasi, harga, keterangan } = req.body;
    const gambar = req.file ? req.file.filename : null;

    const catId = parseInt(kategori_id) || 1;
    const qty = parseInt(jumlah) || 0;
    const price = parseFloat(harga) || 0;
    let kond = (kondisi || 'baik').toString().toLowerCase().replace(/\s+/g, '_');
    if (!['baik', 'rusak_ringan', 'rusak_berat'].includes(kond)) kond = 'baik';

    const userId = req.user?.id || 1;

    await pool.query(
      'INSERT INTO Barang (nama_barang, kode_barang, kategori_id, jumlah, kondisi, lokasi, harga, gambar, keterangan, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [nama_barang, kode_barang, catId, qty, kond, lokasi || null, price, gambar, keterangan || null, userId]
    );

    res.status(201).json({ success: true, message: 'Barang berhasil ditambahkan ke inventaris' });
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: 'Kode barang sudah terdaftar' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/barang/:id (Membutuhkan Hak Akses Khusus: Admin)
export const deleteBarang = async (req: AuthRequest, res: Response) => {
  try {
    const [existingBarang]: any = await pool.query('SELECT * FROM Barang WHERE id = ?', [req.params.id]);
    if (existingBarang.length === 0) {
      return res.status(404).json({ success: false, message: 'Barang tidak ditemukan' });
    }

    // Unlink / Hapus file gambar fisik dari disk
    if (existingBarang[0].gambar) {
      const imagePath = path.join(__dirname, '../../uploads', existingBarang[0].gambar);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await pool.query('DELETE FROM Barang WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Barang berhasil dihapus dari inventaris' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
```

#### Rute Barang (`backend/src/routes/barangRoutes.ts`):
```typescript
import { Router } from 'express';
import { getAllBarang, getBarangById, createBarang, updateBarang, deleteBarang } from '../controllers/barang.controller';
import { verifyToken, requireRole } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();

router.get('/', verifyToken, getAllBarang);
router.get('/:id', verifyToken, getBarangById);
router.post('/', verifyToken, requireRole('admin', 'operator'), upload.single('gambar'), createBarang);
router.put('/:id', verifyToken, requireRole('admin', 'operator'), upload.single('gambar'), updateBarang);
router.delete('/:id', verifyToken, requireRole('admin'), deleteBarang);

export default router;
```

---

### G. Controller & Route Kategori (`backend/src/controllers/kategori.controller.ts`)
Mengelola data kategori barang dengan proteksi `ON DELETE RESTRICT` jika kategori masih dipakai oleh data barang:

```typescript
import type { Request, Response } from 'express';
import pool from '../config/db';

export const getAllKategori = async (req: Request, res: Response) => {
  try {
    const [rows]: any = await pool.query('SELECT * FROM Kategori ORDER BY nama_kategori ASC');
    res.json({ success: true, data: rows });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createKategori = async (req: Request, res: Response) => {
  try {
    const { nama_kategori, deskripsi } = req.body;
    await pool.query('INSERT INTO Kategori (nama_kategori, deskripsi) VALUES (?, ?)', [nama_kategori, deskripsi]);
    res.status(201).json({ success: true, message: 'Kategori berhasil ditambahkan' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteKategori = async (req: Request, res: Response) => {
  try {
    await pool.query('DELETE FROM Kategori WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Kategori berhasil dihapus' });
  } catch (error: any) {
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(400).json({
        success: false,
        message: 'Gagal menghapus: Kategori ini sedang digunakan oleh data barang.'
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};
```

---

### H. Controller & Route User Management (`backend/src/controllers/user.controller.ts`)
Fitur administrasi pengguna dan reset password oleh Admin (`backend/src/routes/userRoutes.ts` dilindungi `requireRole('admin')`):

```typescript
import type { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import pool from '../config/db';

// GET /api/users (Khusus Admin)
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const [rows]: any = await pool.query('SELECT id, username, email, role, created_at FROM users ORDER BY id DESC');
    res.json({ success: true, data: rows });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/users/:id/password (Reset Password Khusus Admin)
export const resetUserPassword = async (req: Request, res: Response) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password minimal 6 karakter' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, req.params.id]);

    res.json({ success: true, message: 'Password user berhasil diperbarui' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
```

---

## 4. BEDAH KODE FRONTEND WEB APP (NEXT.JS 14 TYPESCRIPT)

### A. API Helper Terpusat (`frontend/src/lib/api.ts`)
Wrapper fungsi `fetch` yang menyisipkan JWT Token secara otomatis pada header HTTP:

```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export async function api(endpoint: string, options: any = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const headers: Record<string, string> = {
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (!options.isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Terjadi kesalahan pada server');
  }

  return data;
}
```

---

### B. Context Autentikasi Global (`frontend/src/lib/AuthContext.tsx`)
Mengelola state login user dan persitensi token JWT:

```typescript
'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'operator' | 'viewer';
}

interface AuthContextType {
  user: User | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (savedUser && token) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (err) {
        localStorage.clear();
      }
    }
    setIsLoading(false);
  }, []);

  const login = (token: string, userData: User) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    router.push('/dashboard');
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

---

### C. Guard Halaman Client (`frontend/src/components/ProtectedRoute.tsx`)
Komponen pelindung halaman frontend dari akses user tanpa autentikasi / tanpa role:

```typescript
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';

export default function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login');
      } else if (allowedRoles && !allowedRoles.includes(user.role)) {
        router.push('/dashboard');
      }
    }
  }, [user, isLoading, router, allowedRoles]);

  if (isLoading || !user) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Memuat halaman...</div>;
  }

  return <>{children}</>;
}
```

---

## 5. MATRIKS KEAMANAN & HAK AKSES PERAN (RBAC)

Sistem menerapkan otorisasi bertingkat (*Role-Based Access Control*) pada level API dan tampilan UI:

| Fitur & Akses Modul | Viewer | Operator | Admin |
| :--- | :---: | :---: | :---: |
| **Login & Logout System** | ✅ Ya | ✅ Ya | ✅ Ya |
| **Lihat Ringkasan Dashboard** | ✅ Ya | ✅ Ya | ✅ Ya |
| **Lihat Daftar Inventaris Barang** | ✅ Ya | ✅ Ya | ✅ Ya |
| **Pencarian, Filter, & Pagination** | ✅ Ya | ✅ Ya | ✅ Ya |
| **Lihat Pop-Up Detail Barang & Gambar** | ✅ Ya | ✅ Ya | ✅ Ya |
| **Tambah Barang Baru** | ❌ Tidak | ✅ Ya | ✅ Ya |
| **Edit Data Barang** | ❌ Tidak | ✅ Ya | ✅ Ya |
| **Upload Foto Barang (Multipart)** | ❌ Tidak | ✅ Ya | ✅ Ya |
| **Tambah & Edit Kategori** | ❌ Tidak | ✅ Ya | ✅ Ya |
| **Hapus Barang / Kategori** | ❌ Tidak | ❌ Tidak | ✅ Ya |
| **Lihat Daftar Pengguna (Users)** | ❌ Tidak | ❌ Tidak | ✅ Ya |
| **Tambah User Baru** | ❌ Tidak | ❌ Tidak | ✅ Ya |
| **Edit Role Pengguna** | ❌ Tidak | ❌ Tidak | ✅ Ya |
| **Reset Password User** | ❌ Tidak | ❌ Tidak | ✅ Ya |

---

## 6. BANK 15 PERTANYAAN KRITIS UJIAN & JAWABAN AKADEMIS

### 🗣️ **Q1: Mengapa aplikasi dibangun terpisah (Port 3000 & 3001)?**
> **Jawaban Akademis:**  
> Aplikasi menggunakan arsitektur *Decoupled RESTful API*. Backend (Express TS) bertugas mengolah logika bisnis, enkripsi, dan komunikasi database yang menghasilkan data JSON. Frontend (Next.js 14 TS) fokus menyajikan antarmuka UI/UX. Keuntungannya adalah aplikasi lebih terstruktur, terisolasi secara keamanan, dan backend API dapat langsung diintegrasikan dengan aplikasi Android/iOS di masa depan.

### 🗣️ **Q2: Mengapa proyek ini tidak menggunakan ORM (Prisma/Sequelize)?**
> **Jawaban Akademis:**  
> Penggunaan driver `mysql2/promise` murni bertujuan untuk menguasai kueri SQL (Raw SQL) dan Prepared Statements secara eksplisit. Hal ini memberikan kontrol penuh terhadap optimasi kueri (seperti `JOIN`, `INDEX`, dan `LIMIT/OFFSET`) tanpa adanya overhead abstraksi dari library ORM.

### 🗣️ **Q3: Bagaimana alur pengamanan dari serangan SQL Injection?**
> **Jawaban Akademis:**  
> Seluruh kueri database menggunakan Prepared Statements dengan parameter placeholder `?`. Nilai yang diinput oleh pengguna tidak pernah digabungkan secara string concatenation ke dalam perintah SQL, melainkan dikirim sebagai parameter terpisah yang disanitasi otomatis oleh MySQL engine.

### 🗣️ **Q4: Bagaimana alur hashing password pada sistem ini?**
> **Jawaban Akademis:**  
> Password di-hash menggunakan algoritma `bcrypt` dengan salt factor 10 saat registrasi dan reset password. Saat login, `bcrypt.compare()` membandingkan hash password yang diinput dengan hash di database tanpa perlu me-dekripsi password asli.

### 🗣️ **Q5: Bagaimana mekanisme token JWT bekerja?**
> **Jawaban Akademis:**  
> Setelah login valid, backend membuat JSON Web Token yang berisi payload `{ id, username, role }` bertanda tangan kunci rahasia. Token disimpan di `localStorage` frontend dan disisipkan pada setiap HTTP Request melalui header `Authorization: Bearer <token>`.

### 🗣️ **Q6: Bagaimana backend memverifikasi hak akses (Role Authorization)?**
> **Jawaban Akademis:**  
> Backend memiliki middleware `verifyToken` untuk membongkar payload JWT dan memasang objek `req.user`. Selanjutnya middleware `requireRole('admin', 'operator')` memeriksa apakah `req.user.role` memiliki hak akses. Jika tidak sesuai, backend merespons HTTP status `403 Forbidden`.

### 🗣️ **Q7: Bagaimana alur upload file gambar barang dari form ke server?**
> **Jawaban Akademis:**  
> Frontend mengemas teks data dan file fisik ke dalam objek `FormData` (`multipart/form-data`). Middleware `upload.single('gambar')` dari Multer mencegat file, memvalidasi MIME type, dan menyimpannya di folder `backend/uploads/` dengan nama unik berbasis timestamp. Nama file tersebut kemudian disimpan ke kolom `gambar` di database.

### 🗣️ **Q8: Bagaimana sistem menangani gambar lama ketika data barang di-update atau di-hapus?**
> **Jawaban Akademis:**  
> Controller melakukan kueri awal ke database untuk mengecek keberadaan gambar lama. Jika gambar ada, sistem memanggil modul `fs.unlinkSync(imagePath)` Node.js untuk menghapus file gambar lama secara fisik dari disk server sehingga tidak memenuhi memori storage.

### 🗣️ **Q9: Bagaimana logika kalkulasi Pagination bekerja di Backend?**
> **Jawaban Akademis:**  
> Kalkulasi dimulai dengan menghitung `offset = (page - 1) * limit`. Backend melakukan dua kali query: pertama `SELECT COUNT(*) FROM barang` untuk mendapatkan total baris data dan total halaman (`Math.ceil(total / limit)`), kedua `SELECT * FROM barang LIMIT ? OFFSET ?` untuk mengambil potongan baris data.

### 🗣️ **Q10: Bagaimana alur fitur Reset Password yang dilakukan oleh Admin?**
> **Jawaban Akademis:**  
> Admin memilih user di halaman `/dashboard/users` dan memasukkan password baru. Request dikirim ke endpoint `PUT /api/users/:id/password` yang dilindungi `requireRole('admin')`. Password baru di-hash menggunakan `bcrypt.hash()` lalu di-update ke tabel `users`.

### 🗣️ **Q11: Apa peran dari fitur Auto-Migration di file `index.ts`?**
> **Jawaban Akademis:**  
> Auto-migration bertugas melakukan *inspection* skema database saat server startup melalui perintah `SHOW COLUMNS FROM barang LIKE 'harga'`. Jika kolom belum ada pada MySQL lokal, server secara otomatis mengeksekusi `ALTER TABLE` tanpa perlu membuat ulang database secara manual.

### 🗣️ **Q12: Mengapa memilih Next.js 14 App Router ketimbang Pages Router?**
> **Jawaban Akademis:**  
> App Router memberikan struktur folder berbasis direktori yang lebih intuitif, dukungan React Server Components, penanganan layout bertingkat yang efisien, dan optimasi *client-side navigation* yang lebih cepat.

### 🗣️ **Q13: Bagaimana penanganan error pencatatan `ON DELETE RESTRICT` pada kategori?**
> **Jawaban Akademis:**  
> Ketika Admin mencoba menghapus kategori yang masih dirujuk oleh tabel `barang`, MySQL melempar error code `ER_ROW_IS_REFERENCED_2`. Controller menangkap error tersebut dan mengembalikan pesan ramah pengguna: *"Kategori masih digunakan oleh data barang"*.

### 🗣️ **Q14: Bagaimana cara mencegah user non-Admin mengakses halaman `/dashboard/users` dari URL browser?**
> **Jawaban Akademis:**  
> Di frontend dilindungi oleh pembungkus `<ProtectedRoute allowedRoles={['admin']}>`. Di backend, rute `/api/users` dilindungi oleh middleware `verifyToken` dan `requireRole('admin')`.

### 🗣️ **Q15: Apa keuntungan menggunakan `mysql2/promise` ketimbang callback biasa?**
> **Jawaban Akademis:**  
> `mysql2/promise` mendukung sintaks `async/await` modern. Kode penanganan query menjadi jauh lebih rapi, terhindar dari *callback hell*, dan mempermudah struktur blok `try-catch` error handling.

---

## 7. NASKAH SKENARIO PRESENTASI & DEMO UJIAN (5 MENIT)

```text
[1. DEMO VIEWER] ──► [2. DEMO OPERATOR] ──► [3. DEMO ADMIN]
(Hanya Akses Baca)   (Tambah/Edit Barang)  (Full Control & Reset Pass)
```

### 📌 Tahap 1: Demonstrasi Akun Viewer (Akses Baca)
1. Buka browser pada `http://localhost:3001/login`.
2. Login sebagai **`viewer1`** (Password: `admin123`).
3. Tunjukkan Halaman **Dashboard Overview** & **Daftar Barang**.
4. **Soroti Keunggulan Sistem:** Jelaskan bahwa tombol `+ Tambah Barang`, `Edit`, `Hapus`, serta menu `Manajemen Users` **TIDAK TERSEDIA** untuk Viewer.
5. Demo fitur **Pencarian**, **Filter Kondisi**, dan **Detail Gambar**.

### 📌 Tahap 2: Demonstrasi Akun Operator (Kelola Inventaris)
1. Logout lalu Login sebagai **`operator1`** (Password: `admin123`).
2. Masuk ke halaman **Daftar Barang**, tunjukkan tombol **`+ Tambah Barang Baru`** kini aktif.
3. Tambah Barang Baru ➔ Isi form data & pilih foto dari komputer ➔ Klik **Simpan**.
4. Tunjukkan barang baru berhasil tampil di tabel beserta foto gambar thumbnail.
5. **Soroti Keunggulan Sistem:** Tunjukkan Operator bisa Tambah & Edit, tapi tombol **`Hapus`** dan menu **`Manajemen Users`** tetap terlindungi dari Operator.

### 📌 Tahap 3: Demonstrasi Akun Admin (Superuser)
1. Logout lalu Login sebagai **`admin`** (Password: `admin123`).
2. Buka menu **Manajemen Users** di Sidebar (khusus Admin).
3. Demonstrasikan fitur **Reset Password** pada salah satu user.
4. Kembali ke menu Barang: Demonstrasikan fitur **Hapus Barang** (bukti hak hapus hanya milik Admin).

---

## 8. PETUNJUK MENJALANKAN APLIKASI DARI NOL

### 1. Persiapan Database MySQL
1. Pastikan MySQL Service (XAMPP / MySQL Server) aktif.
2. Import file database:
   ```bash
   mysql -u root -p < database/inventaris_lab.sql
   ```

### 2. Menjalankan Backend Server (Port 3000)
```bash
cd backend
npm install
npm run seed
npm run dev
```

### 3. Menjalankan Frontend Client (Port 3001)
```bash
cd frontend
npm install
npm run dev
```

---
*Master Panduan Ultimate Ujian Akhir Semester (UAS) - Lab Inventory Management System.*
