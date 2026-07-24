# PANDUAN BELAJAR & DEMO UJIAN (UAS)
> **Sistem Manajemen Inventaris Laboratorium Komputer**

---

## DAFTAR ISI

- [1. Arsitektur Proyek](#1-arsitektur-proyek)
- [2. Autentikasi & Keamanan (JWT & Bcrypt)](#2-autentikasi--keamanan-jwt--bcrypt)
- [3. Query Database Anti SQL Injection](#3-query-database-anti-sql-injection)
- [4. Logika Search, Filter, & Pagination](#4-logika-search-filter--pagination)
- [5. Fitur Upload & Hapus File Gambar](#5-fitur-upload--hapus-file-gambar)
- [6. Matriks Hak Akses Peran (RBAC)](#6-matriks-hak-akses-peran-rbac)
- [7. Pertanyaan Kunci Dosen & Jawaban](#7-pertanyaan-kunci-dosen--jawaban)
- [8. Skenario Demo Ujian (Alur 5 Menit)](#8-skenario-demo-ujian-alur-5-menit)
- [9. Daftar Akun Pengujian](#9-daftar-akun-pengujian)

---

## 1. ARSITEKTUR PROYEK

Aplikasi ini menggunakan arsitektur Decoupled RESTful API (Frontend & Backend terpisah):

- **Frontend (Port 3001)**: Next.js 14 App Router + TypeScript
- **Backend (Port 3000)**: Express.js + TypeScript
- **Database**: MySQL (`db_inventarislab`) via driver `mysql2`

```text
[ Browser Client ]
       │
       ▼ (Port 3001)
[ Frontend: Next.js 14 ] ──(Authorization: Bearer <JWT>)──► [ Backend: Express.js ]
                                                                   │
                                                                   ▼
                                                            [ Database: MySQL ]
```

---

## 2. AUTENTIKASI & KEAMANAN (JWT & BCRYPT)

### A. Hashing Password (bcrypt)
Password di-hash menggunakan `bcrypt` dengan salt factor 10 sebelum disimpan ke database:

```typescript
// Saat Register / Reset Password
const hashedPassword = await bcrypt.hash(password, 10);

// Saat Login
const isMatch = await bcrypt.compare(inputPassword, user.password);
```

### B. Tokens JWT
Backend menerbitkan JWT token berdurasi 1 hari setelah login berhasil:

```typescript
const token = jwt.sign(
  { id: user.id, username: user.username, role: user.role },
  process.env.JWT_SECRET || 'supersecretkey123',
  { expiresIn: '1d' }
);
```

### C. Proteksi Middleware Backend
Rute terlindungi memverifikasi token dari header `Authorization: Bearer <token>`:

```typescript
export const verifyToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token tidak ditemukan' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    req.user = { id: decoded.id, username: decoded.username, role: decoded.role };
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token expired atau tidak valid' });
  }
};
```

---

## 3. QUERY DATABASE ANTI SQL INJECTION

Aplikasi menggunakan `mysql2/promise` dengan **Prepared Statements** (simbol `?`):

```typescript
// SANGAT AMAN (Prepared Statements)
await pool.query(
  'SELECT * FROM barang WHERE nama_barang LIKE ? AND kondisi = ?',
  [`%${search}%`, kondisi]
);
```

**Penjelasan Ujian:** Input user disanitasi secara otomatis oleh MySQL driver dan diperlakukan murni sebagai data string, bukan sintaks perintah SQL.

---

## 4. LOGIKA SEARCH, FILTER, & PAGINATION

Pencarian, pemfilteran, dan pembagian halaman diproses langsung pada query MySQL:

```typescript
export const getAllBarang = async (req: AuthRequest, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const offset = (page - 1) * limit;
  const search = req.query.search || '';
  const kondisi = req.query.kondisi || '';

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

  // 1. Hitung total data
  const [countResult]: any = await pool.query(
    `SELECT COUNT(*) as total FROM Barang b ${whereClause}`,
    params
  );
  const total = countResult[0].total;

  // 2. Ambil potongan data
  const [rows]: any = await pool.query(
    `SELECT b.*, k.nama_kategori FROM Barang b 
     LEFT JOIN Kategori k ON b.kategori_id = k.id 
     ${whereClause} ORDER BY b.id DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  res.json({
    success: true,
    data: rows,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  });
};
```

---

## 5. FITUR UPLOAD & HAPUS FILE GAMBAR

1. **Upload File**: Menggunakan Multer middleware (`upload.single('gambar')`). Gambar disimpan di `backend/uploads/` dengan nama unik.
2. **Penghapusan File Fisik**: Saat data di-update/delete, gambar lama dihapus dari disk server:

```typescript
if (existingBarang[0].gambar) {
  const oldImagePath = path.join(__dirname, '../../uploads', existingBarang[0].gambar);
  if (fs.existsSync(oldImagePath)) {
    fs.unlinkSync(oldImagePath);
  }
}
```

---

## 6. MATRIKS HAK AKSES PERAN (RBAC)

| Fitur Aplikasi | Viewer | Operator | Admin |
| :--- | :---: | :---: | :---: |
| Login & Logout | Ya | Ya | Ya |
| Lihat Dashboard & Inventaris | Ya | Ya | Ya |
| Search, Filter, & Pagination | Ya | Ya | Ya |
| Lihat Detail Barang | Ya | Ya | Ya |
| Tambah & Edit Barang / Kategori | Tidak | Ya | Ya |
| Upload Gambar Barang | Tidak | Ya | Ya |
| Hapus Barang / Kategori | Tidak | Tidak | Ya |
| Manajemen User & Reset Password | Tidak | Tidak | Ya |

---

## 7. PERTANYAAN KUNCI DOSEN & JAWABAN

### Q1: Mengapa Frontend dan Backend dipisah?
> **Jawaban:** Menggunakan arsitektur Decoupled RESTful API. Backend (Express TS) mengelola logika bisnis & database. Frontend (Next.js TS) menyajikan UI. Aplikasi menjadi lebih terstruktur, aman, dan scalable.

### Q2: Mengapa menggunakan mysql2 manual tanpa ORM?
> **Jawaban:** Untuk menguasai query SQL murni dan Prepared Statements secara eksplisit tanpa adanya lapisan overhead abstraksi dari ORM.

### Q3: Bagaimana cara aplikasi mencegah SQL Injection?
> **Jawaban:** Seluruh query mengikat input menggunakan Prepared Statements (`?`). Nilai yang diinput user tidak pernah dimasukkan secara string concatenation.

### Q4: Bagaimana alur otorisasi role bekerja?
> **Jawaban:** Backend memverifikasi token JWT via middleware `verifyToken` dan membatasi akses via `requireRole`. Frontend menyembunyikan/menampilkan tombol UI sesuai role pengguna.

### Q5: Bagaimana alur upload file gambar?
> **Jawaban:** Frontend mengirim `FormData`. Multer middleware di backend menyimpan file ke folder `backend/uploads`, lalu nama file disimpan di kolom database `gambar`.

---

## 8. SKENARIO DEMO UJIAN (ALUR 5 MENIT)

1. **Demo Viewer (`viewer1` / `admin123`)**:
   - Login ➔ Tunjukkan daftar barang, pencarian, & filter.
   - Tunjukkan tombol Tambah, Edit, Hapus, dan menu Manajemen User **tidak ada**.
2. **Demo Operator (`operator1` / `admin123`)**:
   - Login ➔ Buka barang ➔ Tambah barang baru + upload foto.
   - Tunjukkan Operator bisa Tambah & Edit, tapi tombol Hapus & Manajemen User tidak ada.
3. **Demo Admin (`admin` / `admin123`)**:
   - Login ➔ Masuk menu **Manajemen Users** ➔ Tunjukkan fitur Tambah User & Reset Password.
   - Tunjukkan hak akses Hapus Barang.

---

## 9. DAFTAR AKUN PENGUJIANKompresi Password Bawaan: `admin123`

- **Admin**: `admin` | `admin123`
- **Operator**: `operator1` | `admin123`
- **Viewer**: `viewer1` | `admin123`
