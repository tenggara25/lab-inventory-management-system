'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import Sidebar from '@/components/Sidebar';

interface KategoriItem {
  id: number;
  nama_kategori: string;
  deskripsi?: string;
  created_at?: string;
}

export default function KategoriPage() {
  const { user } = useAuth();
  const [kategoriList, setKategoriList] = useState<KategoriItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<KategoriItem | null>(null);
  const [formData, setFormData] = useState({ nama_kategori: '', deskripsi: '' });
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchKategori = async () => {
    setLoading(true);
    try {
      const res = await api('/kategori');
      setKategoriList(res.data || []);
    } catch (err) {
      console.error('Failed to fetch kategori:', err);
      setKategoriList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKategori();
  }, []);

  const handleOpenCreate = () => {
    setEditItem(null);
    setFormData({ nama_kategori: '', deskripsi: '' });
    setErrorMsg('');
    setShowModal(true);
  };

  const handleOpenEdit = (item: KategoriItem) => {
    setEditItem(item);
    setFormData({
      nama_kategori: item.nama_kategori,
      deskripsi: item.deskripsi || '',
    });
    setErrorMsg('');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);

    try {
      if (editItem) {
        await api(`/kategori/${editItem.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData),
        });
      } else {
        await api('/kategori', {
          method: 'POST',
          body: JSON.stringify(formData),
        });
      }

      setShowModal(false);
      fetchKategori();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Gagal menyimpan kategori.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Apakah Anda yakin ingin menghapus kategori ini?')) {
      try {
        await api(`/kategori/${id}`, { method: 'DELETE' });
        fetchKategori();
      } catch (err: any) {
        alert(err?.message || 'Gagal menghapus kategori. Kategori mungkin masih digunakan oleh data barang.');
      }
    }
  };

  const filteredKategori = kategoriList.filter(
    (cat) =>
      cat.nama_kategori.toLowerCase().includes(search.toLowerCase()) ||
      (cat.deskripsi && cat.deskripsi.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <ProtectedRoute>
      <div className="dashboard-layout">
        <Sidebar />

        <main className="main-wrapper">
          <header className="page-header">
            <div>
              <h1 className="page-title">Manajemen Kategori Barang</h1>
              <p className="page-subtitle">Kelola pengelompokan jenis dan kategori perlengkapan laboratorium.</p>
            </div>
            {(user?.role === 'admin' || user?.role === 'operator') && (
              <button onClick={handleOpenCreate} className="btn-primary">
                + Tambah Kategori
              </button>
            )}
          </header>

          {/* Search Bar */}
          <div className="content-card toolbar-container">
            <div className="search-box">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                className="input-control"
                placeholder="Cari nama kategori atau deskripsi..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Table */}
          <div className="content-card">
            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nama Kategori</th>
                    <th>Deskripsi</th>
                    <th style={{ textAlign: 'right' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                        Memuat data kategori...
                      </td>
                    </tr>
                  ) : filteredKategori.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                        Tidak ada kategori yang ditemukan.
                      </td>
                    </tr>
                  ) : (
                    filteredKategori.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <span className="badge badge-blue">#{item.id}</span>
                        </td>
                        <td style={{ fontWeight: 600 }}>{item.nama_kategori}</td>
                        <td style={{ color: 'var(--text-muted)' }}>{item.deskripsi || '-'}</td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                            {(user?.role === 'admin' || user?.role === 'operator') && (
                              <button
                                onClick={() => handleOpenEdit(item)}
                                className="btn-warning"
                                style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                              >
                                Edit
                              </button>
                            )}
                            {user?.role === 'admin' && (
                              <button
                                onClick={() => handleDelete(item.id)}
                                className="btn-danger"
                                style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                              >
                                Hapus
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Modal Form */}
          {showModal && (
            <div className="modal-overlay">
              <div className="modal-card">
                <div className="modal-header">
                  <h2>{editItem ? 'Edit Kategori' : 'Tambah Kategori Baru'}</h2>
                  <button onClick={() => setShowModal(false)} className="btn-close">
                    ✕
                  </button>
                </div>

                {errorMsg && <div className="alert-error">{errorMsg}</div>}

                <form onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label>Nama Kategori *</label>
                    <input
                      type="text"
                      className="input-control"
                      required
                      placeholder="Contoh: Alat Gelas, Kimia Organik"
                      value={formData.nama_kategori}
                      onChange={(e) => setFormData({ ...formData, nama_kategori: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Deskripsi</label>
                    <textarea
                      rows={3}
                      className="input-control"
                      placeholder="Deskripsi singkat mengenai jenis barang dalam kategori ini..."
                      value={formData.deskripsi}
                      onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                    <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                      Batal
                    </button>
                    <button type="submit" className="btn-primary" disabled={submitting} style={{ width: 'auto' }}>
                      {submitting ? 'Simpan...' : 'Simpan Kategori'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
