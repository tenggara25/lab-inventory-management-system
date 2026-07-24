# MASTER PANDUAN BELAJAR & DEMO UJIAN (UAS)
> **Proyek: Lab Inventory Management System**  
> **Teknologi**: Express.js (TypeScript), Next.js 14 App Router (TypeScript), MySQL (`mysql2` Prepared Statements), JWT, Bcrypt, Multer, Vanilla CSS Slate Dark.

---

## DAFTAR ISI

1. [Struktur Folder & File Proyek](#1-struktur-folder--file-proyek)
2. [Skema Database MySQL & Data Seeder](#2-skema-database-mysql--data-seeder)
3. [Bedah Kode Backend REST API (Express.js TypeScript)](#3-bedah-kode-backend-rest-api-expressjs-typescript)
4. [Bedah Kode Frontend (Next.js 14 TypeScript)](#4-bedah-kode-frontend-nextjs-14-typescript)
5. [Matriks Otorisasi Peran (Admin, Operator, Viewer)](#5-matriks-otorisasi-peran-admin-operator-viewer)
6. [10 Pertanyaan Kritis Dosen & Jawaban Teknis Sempurna](#6-10-pertanyaan-kritis-dosen--jawaban-teknis-sempurna)
7. [Naskah Skenario Presentasi & Demo Ujian Step-by-Step](#7-naskah-skenario-presentasi--demo-ujian-step-by-step)
8. [Panduan Menjalankan Aplikasi dari Awal](#8-panduan-menjalankan-aplikasi-dari-awal)

---

## 1. STRUKTUR FOLDER & FILE PROYEK

```text
lab-inventory-management-system/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.ts                # Koneksi Pool mysql2/promise
│   │   ├── controllers/
│   │   │   ├── auth.controller.ts   # Logic Register & Login JWT
│   │   │   ├── barang.controller.ts # CRUD Barang, Filter, Search, Pagination
│   │   │   ├── kategori.controller.ts# CRUD Kategori Barang
│   │   │   └── user.controller.ts   # CRUD User & Reset Password
│   │   ├── middleware/
│   │   │   ├── auth.ts              # Middleware verifyToken & requireRole
│   │   │   └── upload.ts            # Middleware Multer DiskStorage
│   │   ├── routes/
│   │   │   ├── authRoutes.ts        # Route /api/auth
│   │   │   ├── barangRoutes.ts      # Route /api/barang
│   │   │   ├── kategoriRoutes.ts    # Route /api/kategori
│   │   │   └── userRoutes.ts        # Route /api/users
│   │   ├── index.ts                 # Express Server Entrypoint & Auto Migration
│   │   └── seed.ts                  # Password Seeder Script
│   ├── uploads/                     # Storage Penyimpanan File Gambar Fisik
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── dashboard/
│   │   │   │   ├── barang/page.tsx  # Halaman Inventaris Barang & CRUD Modal
│   │   │   │   ├── kategori/page.tsx# Halaman Kategori & CRUD Modal
│   │   │   │   ├── users/page.tsx   # Halaman Manajemen User & Reset Pass
│   │   │   │   └── page.tsx         # Dashboard Overview & Quick Stats
│   │   │   ├── login/page.tsx       # Form Login User
│   │   │   ├── register/page.tsx    # Form Registrasi User
│   │   │   ├── global.css           # Design Token Slate Dark Glassmorphism
│   │   │   └── layout.tsx           # Root Layout & Google Font Setup
│   │   ├── components/
│   │   │   ├── ProtectedRoute.tsx   # Guard Otorisasi Route Client
│   │   │   └── Sidebar.tsx          # Navigasi Sidebar Terpadu
│   │   └── lib/
│   │       ├── api.ts               # Custom Fetch Helper (Auto-Header JWT)
│   │       └── AuthContext.tsx      # Auth State Context & Token Management
│   ├── package.json
│   └── tsconfig.json
├── database/
│   └── inventaris_lab.sql           # File SQL Skema & Data Awal
├── PANDUAN_KODE_DAN_DEMO_UAS.md     # Master Panduan Ujian
└── README.md                        # Dokumentasi Instruksi Pengecekan
```

---

## 2. SKEMA DATABASE MYSQL & DATA SEEDER

File SQL lokasi: `database/inventaris_lab.sql`

```sql
DROP DATABASE IF EXISTS db_inventarislab;
CREATE DATABASE db_inventarislab;
USE db_inventarislab;

-- 1. Tabel Users
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'operator', 'viewer') NOT NULL DEFAULT 'viewer',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. Tabel Kategori
CREATE TABLE kategori (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nama_kategori VARCHAR(100) NOT NULL UNIQUE,
    deskripsi VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabel Barang (Tabel Utama Berelasi)
CREATE TABLE barang (
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

-- Indexing Performa Pencarian
CREATE INDEX idx_barang_nama ON barang(nama_barang);
CREATE INDEX idx_barang_kode ON barang(kode_barang);
CREATE INDEX idx_barang_kategori ON barang(kategori_id);
CREATE INDEX idx_barang_kondisi ON barang(kondisi);
```

---

## 3. BEDAH KODE BACKEND REST API (EXPRESS.JS TYPESCRIPT)

### A. Database Connection Pool (`backend/src/config/db.ts`)
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

### B. Middleware Autentikasi & Otorisasi (`backend/src/middleware/auth.ts`)
```typescript
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: { id: number; username: string; role: string };
}

// Verifikasi Token JWT
export const verifyToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Token tidak ditemukan' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretkey123') as any;
    req.user = { id: decoded.id, username: decoded.username, role: decoded.role };
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Token tidak valid atau expired' });
  }
};

// Otorisasi Hak Akses Berdasarkan Role
export const requireRole = (...allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Akses ditolak. Fitur ini membutuhkan hak akses ${allowedRoles.join(' atau ')}.`
      });
    }
    next();
  };
};
```

### C. Middleware File Upload Multer (`backend/src/middleware/upload.ts`)
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
    return cb(new Error('Hanya file gambar yang diperbolehkan (jpeg, png, jpg, webp)'));
  }
  cb(null, true);
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // Batas Maksimal 5MB
});
```

### D. Controller Barang (`backend/src/controllers/barang.controller.ts`)
Menangani Search, Filter, Pagination, Create, Update, & Delete Gambar:

```typescript
import type { Response } from 'express';
import pool from '../config/db';
import { AuthRequest } from '../middleware/auth';
import fs from 'fs';
import path from 'path';

// 1. Tampil Daftar Barang + Search + Filter + Pagination
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
    res.status(500).json({ success: false, message: error.message || 'Server Error' });
  }
};

// 2. Tambah Barang Baru
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

    res.status(201).json({ success: true, message: 'Barang berhasil ditambahkan' });
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: 'Kode barang sudah digunakan' });
    }
    res.status(500).json({ success: false, message: error.message || 'Server Error' });
  }
};

// 3. Hapus Barang + Unlink Gambar Fisik
export const deleteBarang = async (req: AuthRequest, res: Response) => {
  try {
    const [existingBarang]: any = await pool.query('SELECT * FROM Barang WHERE id = ?', [req.params.id]);
    if (existingBarang.length === 0) {
      return res.status(404).json({ success: false, message: 'Barang tidak ditemukan' });
    }

    if (existingBarang[0].gambar) {
      const imagePath = path.join(__dirname, '../../uploads', existingBarang[0].gambar);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath); // Menghapus file fisik di disk
      }
    }

    await pool.query('DELETE FROM Barang WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Barang berhasil dihapus' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server Error' });
  }
};
```

---

## 4. BEDAH KODE FRONTEND (NEXT.JS 14 TYPESCRIPT)

### Custom Fetch API Helper (`frontend/src/lib/api.ts`)
Otomatis menyisipkan JWT token ke dalam Header `Authorization: Bearer`:

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
    throw new Error(data.message || 'Terjadi kesalahan sistem');
  }

  return data;
}
```

---

## 5. MATRIKS OTORISASI PERAN (ADMIN, OPERATOR, VIEWER)

| Fitur / Modul Sistem | Viewer | Operator | Admin |
| :--- | :---: | :---: | :---: |
| Login & Logout System | Ya | Ya | Ya |
| Lihat Dashboard Overview & Statistik | Ya | Ya | Ya |
| Lihat Daftar Barang & Kategori | Ya | Ya | Ya |
| Pencarian (Search), Filter, & Pagination | Ya | Ya | Ya |
| Lihat Pop-Up Detail Barang & Gambar | Ya | Ya | Ya |
| Tambah & Edit Data Barang | Tidak | Ya | Ya |
| Upload Foto Barang (Multipart) | Tidak | Ya | Ya |
| Tambah & Edit Data Kategori | Tidak | Ya | Ya |
| Hapus Barang atau Kategori | Tidak | Tidak | Ya |
| Akses Menu Manajemen Users | Tidak | Tidak | Ya |
| Tambah / Edit User Baru | Tidak | Tidak | Ya |
| Reset Password User | Tidak | Tidak | Ya |

---

## 6. 10 PERTANYAAN KRITIS DOSEN & JAWABAN TEKNIS SEMPURNA

### 💬 Q1: Mengapa aplikasi dibangun terpisah antara Frontend (Port 3001) dan Backend (Port 3000)?
> **Jawaban:** 
> *Aplikasi menerapkan arsitektur Decoupled RESTful API. Backend (Express.js TS) hanya mengolah logika bisnis, enkripsi, dan komunikasi database yang menghasilkan data JSON. Frontend (Next.js 14 TS) fokus menyajikan antarmuka UI/UX. Keuntungannya adalah aplikasi lebih terstruktur, terisolasi secara keamanan, dan backend API dapat langsung diintegrasikan dengan aplikasi Android/iOS di masa depan.*

### 💬 Q2: Mengapa proyek ini tidak menggunakan ORM seperti Prisma atau Sequelize?
> **Jawaban:** 
> *Penggunaan driver `mysql2/promise` murni bertujuan untuk menguasai kueri SQL (Raw SQL) dan Prepared Statements secara eksplisit. Hal ini memberikan kontrol penuh terhadap optimasi kueri (seperti `JOIN`, `INDEX`, dan `LIMIT/OFFSET`) tanpa adanya overhead dari library ORM.*

### 💬 Q3: Bagaimana alur pengamanan dari serangan SQL Injection?
> **Jawaban:** 
> *Seluruh kueri database menggunakan Prepared Statements dengan parameter placeholder `?`. Nilai yang diinput oleh pengguna tidak pernah digabungkan secara string concatenation ke dalam perintah SQL, melainkan dikirim sebagai parameter terpisah yang disanitasi otomatis oleh MySQL engine.*

### 💬 Q4: Bagaimana alur hashing password pada sistem ini?
> **Jawaban:** 
> *Password di-hash menggunakan algoritma `bcrypt` dengan salt factor 10 saat registrasi dan reset password. Saat login, `bcrypt.compare()` membandingkan hash password yang diinput dengan hash di database tanpa perlu me-dekripsi password asli.*

### 💬 Q5: Bagaimana mekanisme token JWT bekerja?
> **Jawaban:** 
> *Setelah login valid, backend membuat JSON Web Token yang berisi payload `{ id, username, role }` bertanda tangan kunci rahasia. Token disimpan di `localStorage` frontend dan disisipkan pada setiap HTTP Request melalui header `Authorization: Bearer <token>`.*

### 💬 Q6: Bagaimana backend memverifikasi hak akses (Role Authorization)?
> **Jawaban:** 
> *Backend memiliki middleware `verifyToken` untuk membongkar payload JWT dan memasang objek `req.user`. Selanjutnya middleware `requireRole('admin', 'operator')` memeriksa apakah `req.user.role` memiliki hak akses. Jika tidak sesuai, backend merespons HTTP status `403 Forbidden`.*

### 💬 Q7: Bagaimana alur upload file gambar barang dari form ke server?
> **Jawaban:** 
> *Frontend mengemas teks data dan file fisik ke dalam objek `FormData` (`multipart/form-data`). Middleware `upload.single('gambar')` dari Multer mencegat file, memvalidasi MIME type, dan menyimpannya di folder `backend/uploads/` dengan nama unik berbasis timestamp. Nama file tersebut kemudian disimpan ke kolom `gambar` di database.*

### 💬 Q8: Bagaimana sistem menangani gambar lama ketika data barang di-update atau di-hapus?
> **Jawaban:** 
> *Controller melakukan kueri awal ke database untuk mengecek keberadaan gambar lama. Jika gambar ada, sistem memanggil modul `fs.unlinkSync(imagePath)` Node.js untuk menghapus file gambar lama secara fisik dari disk server sehingga tidak memenuhi memori storage.*

### 💬 Q9: Bagaimana logika kalkulasi Pagination bekerja di Backend?
> **Jawaban:** 
> *Kalkulasi dimulai dengan menghitung `offset = (page - 1) * limit`. Backend melakukan dua kali query: pertama `SELECT COUNT(*) FROM barang` untuk mendapatkan total baris data dan total halaman (`Math.ceil(total / limit)`), kedua `SELECT * FROM barang LIMIT ? OFFSET ?` untuk mengambil potongan baris data.*

### 💬 Q10: Bagaimana alur fitur Reset Password yang dilakukan oleh Admin?
> **Jawaban:** 
> *Admin memilih user di halaman `/dashboard/users` dan memasukkan password baru. Request dikirim ke endpoint `PUT /api/users/:id/password` yang dilindungi `requireRole('admin')`. Password baru di-hash menggunakan `bcrypt.hash()` lalu di-update ke tabel `users`.*

---

## 7. NASKAH SKENARIO PRESENTASI & DEMO UJIAN STEP-BY-STEP

Ikuti urutan naskah demo ini saat presentasi di depan dosen:

### 📍 Tahap 1: Skenario Akun Viewer (Akses Baca & Proteksi UI)
1. Buka browser di `http://localhost:3001/login`.
2. Login menggunakan akun Viewer: Username **`viewer1`** | Password **`admin123`**.
3. Tunjukkan Halaman Dashboard Overview & Daftar Barang.
4. **Soroti Keunggulan Otorisasi:** Jelaskan ke dosen bahwa tombol **`+ Tambah Barang`**, tombol **`Edit`**, tombol **`Hapus`**, serta menu **`Manajemen Users`** **TIDAK TERSEDIA** untuk Viewer.
5. Demonstrasikan fitur pencarian (ketik kata kunci), filter kondisi, dan klik tombol **Detail** barang.

### 📍 Tahap 2: Skenario Akun Operator (Kelola Data Inventaris)
1. Logout lalu Login sebagai Operator: Username **`operator1`** | Password **`admin123`**.
2. Masuk ke halaman **Daftar Barang**, tunjukkan tombol **`+ Tambah Barang Baru`** kini aktif.
3. Klik Tambah Barang ➔ Isi Form Data & pilih file foto gambar dari komputer ➔ Klik **Simpan Barang**.
4. Tunjukkan barang baru berhasil tampil di tabel beserta foto gambar thumbnail.
5. **Soroti Keunggulan Otorisasi:** Tunjukkan bahwa Operator memiliki akses Tambah & Edit, tetapi tombol **`Hapus`** dan menu **`Manajemen Users`** tetap terlindungi dari Operator.

### 📍 Tahap 3: Skenario Akun Admin (Full Control & Superuser)
1. Logout lalu Login sebagai Admin: Username **`admin`** | Password **`admin123`**.
2. Masuk ke menu **Manajemen Users** di Sidebar (hanya bisa diakses oleh Admin).
3. Demonstrasikan fitur **Reset Password** pada salah satu user.
4. Kembali ke menu Barang: Demonstrasikan fitur **Hapus Barang** (bukti hak hapus hanya milik Admin).

---

## 8. PANDUAN MENJALANKAN APLIKASI DARI AWAL

### Step 1: Persiapan Database MySQL
1. Pastikan MySQL Service (XAMPP / MySQL Server) aktif.
2. Buka Terminal / CMD:
   ```bash
   mysql -u root -p < database/inventaris_lab.sql
   ```

### Step 2: Menjalankan Backend API (Port 3000)
1. Masuk ke direktori backend:
   ```bash
   cd backend
   npm install
   npm run seed
   npm run dev
   ```
   *Backend akan aktif pada `http://localhost:3000`.*

### Step 3: Menjalankan Frontend Web App (Port 3001)
1. Buka jendela terminal baru:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   *Frontend akan aktif pada `http://localhost:3001`.*

---
*Dokumen ini dirancang sebagai Master Panduan Belajar & Demo Ujian Akhir Semester (UAS).*
