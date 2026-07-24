import bcrypt from 'bcrypt';
import pool from './config/db';

async function seed() {
    const password = await bcrypt.hash('admin123', 10);
    await pool.query('UPDATE users SET password = ? WHERE username = ?', [password, 'admin']);
    await pool.query('UPDATE users SET password = ? WHERE username = ?', [password, 'operator1']);
    await pool.query('UPDATE users SET password = ? WHERE username = ?', [password, 'viewer1']);
    console.log('Seed data inserted successfully');
    process.exit(0);
}

seed();