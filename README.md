# Lab Inventory Management System 🧪

Aplikasi Sistem Manajemen Inventaris Laboratorium modern dengan arsitektur terpisah (*decoupled client-server*), otorisasi berbasis peran (**Admin, Operator, Viewer**), fitur search, filter, pagination, upload gambar, serta manajemen user dan reset password.

---

## 🛠️ Teknologi yang Digunakan

### **Backend**
- **Runtime & Framework**: Node.js, Express.js dengan TypeScript.
- **Database Driver**: `mysql2` (Promise-based) dengan SQL Manual & Prepared Statements (Tanpa ORM).
- **Autentikasi & Keamanan**: JSON Web Token (JWT), `bcrypt` untuk hashing password.
- **File Upload**: `multer` untuk penanganan gambar inventaris.

### **Frontend**
- **Framework**: Next.js 14 (App Router) dengan TypeScript.
- **Styling**: Vanilla CSS (Slate Dark Theme & Glassmorphism).
- **HTTP Client**: Custom Fetch Helper (`@/lib/api`) dengan pengiriman JWT Token otomatis.

---

## 📁 Struktur Direktori

```text
lab-inventory-management-system/
├── backend/                  # REST API Server (Port 3000)
│   ├── src/
│   │   ├── config/           # Konfigurasi Koneksi Database (mysql2)
│   │   ├── controllers/      # Logic Controller (Auth, Barang, Kategori, User)
│   │   ├── middleware/       # Auth JWT, Role Checker, Multer Upload
│   │   ├── routes/           # Express Route definitions
│   │   ├── index.ts          # Server entry point
│   │   └── seed.ts           # Script Hash Password Seeder
│   └── uploads/              # Storage Penyimpanan File Gambar Barang
├── frontend/                 # Client Web App (Port 3001)
│   ├── src/
│   │   ├── app/              # Next.js App Router Pages
│   │   │   ├── login/        # Halaman Login
│   │   │   ├── register/     # Halaman Register
│   │   │   └── dashboard/    # Dashboard (Overview, Barang, Kategori, Users)
│   │   ├── components/       # UI Components (Sidebar, ProtectedRoute)
│   │   └── lib/              # AuthContext & API Client Helper
└── database/
    └── inventaris_lab.sql    # Skema Database & Data Awal (MySQL)
```

---

## 🗄️ Persiapan Database MySQL

1. Pastikan layanan MySQL (XAMPP / MySQL Server) sudah berjalan.
2. Buat database dan import file SQL yang tersedia di folder `database/`:
   ```bash
   mysql -u root -p < database/inventaris_lab.sql
   ```
   *File SQL akan membuat database `db_inventarislab` berserta tabel `users`, `kategori`, dan `barang`.*

---

## 🔑 Akun Demo (Default Credentials)

Password untuk semua akun demo bawaan adalah **`admin123`**:

| Role | Username | Password | Hak Akses |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin` | `admin123` | Akses penuh (Lihat, Tambah, Edit, Hapus Barang & Kategori, Manajemen Users, Reset Pass) |
| **Operator** | `operator1` | `admin123` | Lihat, Tambah, & Edit data Barang & Kategori |
| **Viewer** | `viewer1` | `admin123` | Hanya melihat data, mencari, memfilter, dan melihat detail barang |

> **Catatan:** Jalankan seeder di folder backend untuk memastikan hash bcrypt password terbaru aktif:
> ```bash
> cd backend
> npm run seed
> ```

---

## ⚙️ Langkah Menjalankan Aplikasi

### 1. Konfigurasi Backend (Port 3000)
1. Masuk ke direktori backend:
   ```bash
   cd backend
   ```
2. Pastikan file `.env` sudah dikonfigurasi:
   ```env
   PORT=3000
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=
   DB_NAME=db_inventarislab
   JWT_SECRET=supersecretkey123
   ```
3. Install dependensi dan jalankan server pengembang:
   ```bash
   npm install
   npm run dev
   ```
   *Backend akan berjalan pada `http://localhost:3000`.*

### 2. Konfigurasi Frontend (Port 3001)
1. Masuk ke direktori frontend:
   ```bash
   cd frontend
   ```
2. Pastikan file `.env.local` sudah dikonfigurasi:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:3000/api
   ```
3. Install dependensi dan jalankan server pengembang:
   ```bash
   npm install
   npm run dev
   ```
   *Frontend akan berjalan pada `http://localhost:3001`.*

---

## 🔐 Matriks Otorisasi Role (RBAC)

| Fitur / Halaman | Viewer | Operator | Admin |
| :--- | :---: | :---: | :---: |
| Login & Logout | ✅ | ✅ | ✅ |
| Lihat Dashboard Overview | ✅ | ✅ | ✅ |
| Lihat Daftar & Detail Barang | ✅ | ✅ | ✅ |
| Cari, Filter, & Pagination Barang | ✅ | ✅ | ✅ |
| Tambah & Edit Barang | ❌ | ✅ | ✅ |
| Upload Gambar Barang | ❌ | ✅ | ✅ |
| Hapus Barang | ❌ | ❌ | ✅ |
| Lihat Daftar Kategori | ✅ | ✅ | ✅ |
| Tambah & Edit Kategori | ❌ | ✅ | ✅ |
| Hapus Kategori | ❌ | ❌ | ✅ |
| Manajemen User & Reset Password | ❌ | ❌ | ✅ |

---

## 📡 Dokumentasi Endpoint REST API

### Autentikasi (`/api/auth`)
- `POST /api/auth/register` - Pendaftaran akun pengguna baru.
- `POST /api/auth/login` - Otentikasi & pembuatan JWT token.

### Inventaris Barang (`/api/barang`)
- `GET /api/barang?page=1&limit=10&search=&kondisi=&kategoriId=` - Menampilkan daftar barang (Pagination, Search, Filter).
- `GET /api/barang/:id` - Menampilkan detail barang berdasarkan ID.
- `POST /api/barang` - Menambah barang baru (Memerlukan token Admin/Operator + multipart image upload).
- `PUT /api/barang/:id` - Memperbarui data barang (Memerlukan token Admin/Operator + multipart image upload).
- `DELETE /api/barang/:id` - Menghapus data barang (Memerlukan token Admin).

### Kategori (`/api/kategori`)
- `GET /api/kategori` - Menampilkan seluruh kategori barang.
- `POST /api/kategori` - Menambah kategori baru (Admin/Operator).
- `PUT /api/kategori/:id` - Memperbarui kategori (Admin/Operator).
- `DELETE /api/kategori/:id` - Menghapus kategori (Admin).

### Manajemen User (`/api/users`)
- `GET /api/users` - Menampilkan daftar pengguna terdaftar (Khusus Admin).
- `POST /api/users` - Menambah user baru oleh admin (Khusus Admin).
- `PUT /api/users/:id` - Memperbarui profil user (Khusus Admin).
- `DELETE /api/users/:id` - Menghapus user (Khusus Admin).
- `PUT /api/users/:id/password` - Reset password user oleh admin (Khusus Admin).
