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

// Auto-migration: Ensure missing columns exist
const initDbSchema = async () => {
  try {
    const [cols]: any = await pool.query("SHOW COLUMNS FROM barang LIKE 'harga'");
    if (cols.length === 0) {
      await pool.query("ALTER TABLE barang ADD COLUMN harga BIGINT DEFAULT 0 AFTER lokasi");
      console.log("[DB Migration] Added missing 'harga' column to 'barang' table.");
    }
  } catch (err: any) {
    console.warn("[DB Migration Warning]", err?.message);
  }
};

initDbSchema();

// Middleware 
app.use(cors({ origin: 'http://localhost:3001', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/barang', barangRoutes);
app.use('/api/kategori', kategoriRoutes);
app.use('/api/users', userRoutes);
app.use('/api/user', userRoutes);

// Health check route
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'OK', message: 'connected' });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ status: 'ERROR', message: 'disconnected', error: message });
  }
});

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});