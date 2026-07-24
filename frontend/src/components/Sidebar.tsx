'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const navItems = [
    { name: 'Dashboard Overview', path: '/dashboard', icon: '📊' },
    { name: 'Daftar Barang', path: '/dashboard/barang', icon: '📦' },
    { name: 'Kategori Barang', path: '/dashboard/kategori', icon: '🏷️' },
  ];

  if (user?.role === 'admin') {
    navItems.push({ name: 'Manajemen Users', path: '/dashboard/users', icon: '👥' });
  }

  return (
    <aside className="app-sidebar">
      <div>
        <div className="sidebar-brand">
          <div className="brand-icon">🧪</div>
          <div className="brand-text">LabInventory</div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`nav-item ${isActive ? 'active' : ''}`}
              >
                <span>{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="sidebar-footer">
        <div className="user-profile-badge">
          <div className="user-info">
            <div className="user-name">{user?.username || 'Pengguna'}</div>
            <div className="user-role-tag">{user?.role || 'user'}</div>
          </div>
        </div>
        <button onClick={logout} className="btn-logout">
          <span>🚪</span>
          <span>Keluar</span>
        </button>
      </div>
    </aside>
  );
}
