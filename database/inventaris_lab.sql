DROP DATABASE IF EXISTS db_inventarislab;
CREATE DATABASE db_inventarislab;
USE db_inventarislab;

-- Tabel Users
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'operator', 'viewer') NOT NULL DEFAULT 'viewer',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabel Kategori
CREATE TABLE kategori (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nama_kategori VARCHAR(100) NOT NULL UNIQUE,
    deskripsi VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Barang (tabel utama)
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

-- Index untuk performa pencarian
CREATE INDEX idx_barang_nama ON barang(nama_barang);
CREATE INDEX idx_barang_kode ON barang(kode_barang);
CREATE INDEX idx_barang_kategori ON barang(kategori_id);
CREATE INDEX idx_barang_kondisi ON barang(kondisi);

-- =============================================
-- Data Contoh
-- =============================================

-- Password: "admin123" (bcrypt hash)
INSERT INTO users (username, email, password, role) VALUES
('admin', 'admin@lab.com', '$2b$10$examplehashforadmin123456789012345678', 'admin'),
('operator1', 'operator@lab.com', '$2b$10$examplehashforoperator12345678901234', 'operator'),
('viewer1', 'viewer@lab.com', '$2b$10$examplehashforviewer123456789012345678', 'viewer');

INSERT INTO kategori (nama_kategori, deskripsi) VALUES
('Komputer', 'PC Desktop dan Laptop'),
('Peripheral', 'Mouse, Keyboard, Monitor, dll'),
('Jaringan', 'Switch, Router, Kabel LAN, dll'),
('Software', 'Lisensi software dan tools'),
('Furniture', 'Meja, Kursi, Rak, dll');

INSERT INTO barang (nama_barang, kode_barang, kategori_id, jumlah, kondisi, lokasi, keterangan, created_by) VALUES
('PC Desktop Dell OptiPlex', 'PC-001', 1, 20, 'baik', 'Lab A', 'Core i5 Gen 12, RAM 16GB', 1),
('Laptop ASUS VivoBook', 'LPT-001', 1, 5, 'baik', 'Lab B', 'Core i7, RAM 8GB', 1),
('Mouse Logitech B100', 'MSE-001', 2, 40, 'baik', 'Lab A', 'USB Wired', 2),
('Keyboard Logitech K120', 'KBD-001', 2, 40, 'rusak_ringan', 'Lab A', '5 unit rusak', 2),
('Switch Cisco 24 Port', 'SW-001', 3, 3, 'baik', 'Server Room', 'Managed Switch', 1),
('Monitor LG 24 inch', 'MON-001', 2, 20, 'baik', 'Lab A', 'IPS Full HD', 1);