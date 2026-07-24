'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import Sidebar from '@/components/Sidebar';
import { useAuth } from '@/lib/AuthContext';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Link from 'next/link';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const [stats, setStats] = useState({ totalBarang: 0, totalKategori: 0, totalUsers: 0 });
  const [recentBarang, setRecentBarang] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setDataLoading(true);
      try {
        const barangRes = await api('/barang?limit=5');
        const kategoriRes = await api('/kategori');
        let usersCount = 0;

        if (user?.role === 'admin') {
          try {
            const usersRes = await api('/users');
            usersCount = usersRes.data?.length ?? 0;
          } catch (e) {
            console.error(e);
          }
        }

        setStats({
          totalBarang: barangRes.pagination?.total ?? barangRes.data?.length ?? 0,
          totalKategori: kategoriRes.data?.length ?? 0,
          totalUsers: usersCount,
        });

        setRecentBarang(barangRes.data || []);
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
      } finally {
        setDataLoading(false);
      }
    };

    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="auth-wrapper">
        <div style={{ color: 'var(--text-muted)' }}>Memuat dashboard...</div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="dashboard-layout">
        <Sidebar />

        <main className="main-wrapper">
          <header className="page-header">
            <div>
              <h1 className="page-title">Selamat Datang, {user?.username} 👋</h1>
              <p className="page-subtitle">Ringkasan status inventaris peralatan & perlengkapan laboratorium.</p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <Link href="/dashboard/barang" className="btn-primary">
                + Kelola Barang
              </Link>
            </div>
          </header>

          {/* Stats Cards */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon-wrapper stat-icon-indigo">📦</div>
              <div>
                <div className="stat-number">{stats.totalBarang}</div>
                <div className="stat-label">Total Barang Inventaris</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon-wrapper stat-icon-cyan">🏷️</div>
              <div>
                <div className="stat-number">{stats.totalKategori}</div>
                <div className="stat-label">Kategori Inventaris</div>
              </div>
            </div>

            {user?.role === 'admin' && (
              <div className="stat-card">
                <div className="stat-icon-wrapper stat-icon-purple">👥</div>
                <div>
                  <div className="stat-number">{stats.totalUsers}</div>
                  <div className="stat-label">Pengguna Terdaftar</div>
                </div>
              </div>
            )}
          </div>

          {/* Recent Inventory Table */}
          <div className="content-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Barang Terbaru Didaftarkan</h2>
              <Link href="/dashboard/barang" style={{ color: 'var(--accent-cyan)', fontSize: '0.9rem', textDecoration: 'none', fontWeight: 600 }}>
                Lihat Semua Barang →
              </Link>
            </div>

            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Gambar</th>
                    <th>Kode Barang</th>
                    <th>Nama Barang</th>
                    <th>Kategori</th>
                    <th>Jumlah</th>
                    <th>Kondisi</th>
                  </tr>
                </thead>
                <tbody>
                  {dataLoading ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                        Memuat data inventaris...
                      </td>
                    </tr>
                  ) : recentBarang.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                        Belum ada barang terdaftar.
                      </td>
                    </tr>
                  ) : (
                    recentBarang.map((item) => (
                      <tr key={item.id}>
                        <td>
                          {item.gambar ? (
                            <img
                              src={`http://localhost:3000/uploads/${item.gambar}`}
                              alt={item.nama_barang}
                              className="item-thumbnail"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="item-thumbnail" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                              🧪
                            </div>
                          )}
                        </td>
                        <td>
                          <span className="badge badge-purple">{item.kode_barang || `BRG-${item.id}`}</span>
                        </td>
                        <td style={{ fontWeight: 600 }}>{item.nama_barang}</td>
                        <td>{item.nama_kategori || item.kategori || '-'}</td>
                        <td>
                          <span style={{ fontWeight: 700 }}>{item.jumlah ?? 0}</span> unit
                        </td>
                        <td>
                          <span className={`badge ${
                            item.kondisi === 'Baik' ? 'badge-success' :
                            item.kondisi === 'Rusak Ringan' ? 'badge-warning' : 'badge-danger'
                          }`}>
                            {item.kondisi || 'Baik'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
