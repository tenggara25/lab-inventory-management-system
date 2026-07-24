'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import Sidebar from '@/components/Sidebar';

interface BarangItem {
  id: number;
  nama_barang: string;
  kode_barang: string;
  kategori_id: number;
  nama_kategori?: string;
  jumlah: number;
  kondisi: string;
  lokasi: string;
  harga: number;
  gambar?: string;
  keterangan?: string;
  created_by_name?: string;
}

interface KategoriItem {
  id: number;
  nama_kategori: string;
}

export default function BarangPage() {
  const { user } = useAuth();
  const [barangList, setBarangList] = useState<BarangItem[]>([]);
  const [kategoriList, setKategoriList] = useState<KategoriItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [kondisiFilter, setKondisiFilter] = useState('');
  const [kategoriFilter, setKategoriFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Modal States
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedBarang, setSelectedBarang] = useState<BarangItem | null>(null);
  const [editItem, setEditItem] = useState<BarangItem | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Form Fields
  const [formData, setFormData] = useState({
    nama_barang: '',
    kode_barang: '',
    kategori_id: '',
    jumlah: 1,
    kondisi: 'Baik',
    lokasi: '',
    harga: 0,
    keterangan: '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Load Categories
  useEffect(() => {
    api('/kategori')
      .then((res) => setKategoriList(res.data || []))
      .catch(() => null);
  }, []);

  // Fetch Barang Data
  const fetchBarang = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '8');
      if (search) params.append('search', search);
      if (kondisiFilter) params.append('kondisi', kondisiFilter);
      if (kategoriFilter) params.append('kategoriId', kategoriFilter);

      const res = await api(`/barang?${params.toString()}`);
      setBarangList(res.data || []);
      if (res.pagination) {
        setTotalPages(res.pagination.totalPages || 1);
        setTotalItems(res.pagination.total || 0);
      }
    } catch (error) {
      console.error('Failed to load barang:', error);
      setBarangList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBarang();
  }, [page, search, kondisiFilter, kategoriFilter]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditItem(null);
    setFormData({
      nama_barang: '',
      kode_barang: `BRG-${Date.now().toString().slice(-5)}`,
      kategori_id: kategoriList[0]?.id?.toString() || '',
      jumlah: 1,
      kondisi: 'Baik',
      lokasi: 'Laboratorium Utama',
      harga: 0,
      keterangan: '',
    });
    setSelectedFile(null);
    setFormError('');
    setShowModal(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (item: BarangItem) => {
    setEditItem(item);
    setFormData({
      nama_barang: item.nama_barang,
      kode_barang: item.kode_barang || '',
      kategori_id: item.kategori_id?.toString() || '',
      jumlah: item.jumlah,
      kondisi: item.kondisi || 'Baik',
      lokasi: item.lokasi || '',
      harga: item.harga || 0,
      keterangan: item.keterangan || '',
    });
    setSelectedFile(null);
    setFormError('');
    setShowModal(true);
  };

  // Submit Handler: Create / Edit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSubmitting(true);

    try {
      const dataToSend = new FormData();
      dataToSend.append('nama_barang', formData.nama_barang);
      dataToSend.append('kode_barang', formData.kode_barang);
      dataToSend.append('kategori_id', formData.kategori_id);
      dataToSend.append('jumlah', formData.jumlah.toString());
      dataToSend.append('kondisi', formData.kondisi);
      dataToSend.append('lokasi', formData.lokasi);
      dataToSend.append('harga', formData.harga.toString());
      dataToSend.append('keterangan', formData.keterangan);

      if (selectedFile) {
        dataToSend.append('gambar', selectedFile);
      }

      if (editItem) {
        await api(`/barang/${editItem.id}`, {
          method: 'PUT',
          body: dataToSend,
          isFormData: true,
        });
      } else {
        await api('/barang', {
          method: 'POST',
          body: dataToSend,
          isFormData: true,
        });
      }

      setShowModal(false);
      fetchBarang();
    } catch (err: any) {
      setFormError(err?.message || 'Gagal menyimpan data barang.');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Delete Handler
  const handleDelete = async (id: number) => {
    if (confirm('Apakah Anda yakin ingin menghapus barang ini dari inventaris?')) {
      try {
        await api(`/barang/${id}`, { method: 'DELETE' });
        fetchBarang();
      } catch (err: any) {
        alert(err?.message || 'Gagal menghapus barang');
      }
    }
  };

  return (
    <ProtectedRoute>
      <div className="dashboard-layout">
        <Sidebar />

        <main className="main-wrapper">
          <header className="page-header">
            <div>
              <h1 className="page-title">Manajemen Inventaris Barang</h1>
              <p className="page-subtitle">Kelola daftar alat, bahan, dan perlengkapan laboratorium.</p>
            </div>
            {(user?.role === 'admin' || user?.role === 'operator') && (
              <button onClick={handleOpenCreate} className="btn-primary">
                + Tambah Barang Baru
              </button>
            )}
          </header>

          {/* Search & Filter Toolbar */}
          <div className="content-card toolbar-container">
            <div className="search-box">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                className="input-control"
                placeholder="Cari nama barang atau kode..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <select
                className="input-control"
                style={{ width: 'auto' }}
                value={kategoriFilter}
                onChange={(e) => {
                  setKategoriFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">Semua Kategori</option>
                {kategoriList.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.nama_kategori}
                  </option>
                ))}
              </select>

              <select
                className="input-control"
                style={{ width: 'auto' }}
                value={kondisiFilter}
                onChange={(e) => {
                  setKondisiFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">Semua Kondisi</option>
                <option value="Baik">Baik</option>
                <option value="Rusak Ringan">Rusak Ringan</option>
                <option value="Rusak Berat">Rusak Berat</option>
              </select>
            </div>
          </div>

          {/* Data Table */}
          <div className="content-card">
            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Gambar</th>
                    <th>Kode</th>
                    <th>Nama Barang</th>
                    <th>Kategori</th>
                    <th>Jumlah</th>
                    <th>Kondisi</th>
                    <th>Lokasi</th>
                    <th style={{ textAlign: 'right' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                        Memuat data inventaris barang...
                      </td>
                    </tr>
                  ) : barangList.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                        Tidak ada barang yang sesuai dengan pencarian atau filter.
                      </td>
                    </tr>
                  ) : (
                    barangList.map((item) => (
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
                          <span className="badge badge-purple">{item.kode_barang}</span>
                        </td>
                        <td style={{ fontWeight: 600 }}>{item.nama_barang}</td>
                        <td>{item.nama_kategori || '-'}</td>
                        <td>
                          <span style={{ fontWeight: 700 }}>{item.jumlah}</span> unit
                        </td>
                        <td>
                          <span className={`badge ${
                            item.kondisi === 'Baik' ? 'badge-success' :
                            item.kondisi === 'Rusak Ringan' ? 'badge-warning' : 'badge-danger'
                          }`}>
                            {item.kondisi}
                          </span>
                        </td>
                        <td>{item.lokasi || '-'}</td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                            <button
                              onClick={() => {
                                setSelectedBarang(item);
                                setShowDetailModal(true);
                              }}
                              className="btn-secondary"
                              style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                            >
                              Detail
                            </button>
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

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="pagination-wrapper">
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Menampilkan halaman {page} dari {totalPages} ({totalItems} total barang)
                </span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="pagination-btn"
                  >
                    ← Sebelumnya
                  </button>
                  <button
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="pagination-btn"
                  >
                    Selanjutnya →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Modal Form Create / Edit */}
          {showModal && (
            <div className="modal-overlay">
              <div className="modal-card">
                <div className="modal-header">
                  <h2>{editItem ? 'Edit Data Barang' : 'Tambah Barang Baru'}</h2>
                  <button onClick={() => setShowModal(false)} className="btn-close">
                    ✕
                  </button>
                </div>

                {formError && <div className="alert-error">{formError}</div>}

                <form onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label>Nama Barang *</label>
                    <input
                      type="text"
                      className="input-control"
                      required
                      placeholder="Contoh: Mikroskop Binokuler Digital"
                      value={formData.nama_barang}
                      onChange={(e) => setFormData({ ...formData, nama_barang: e.target.value })}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label>Kode Barang *</label>
                      <input
                        type="text"
                        className="input-control"
                        required
                        value={formData.kode_barang}
                        onChange={(e) => setFormData({ ...formData, kode_barang: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Kategori *</label>
                      <select
                        className="input-control"
                        required
                        value={formData.kategori_id}
                        onChange={(e) => setFormData({ ...formData, kategori_id: e.target.value })}
                      >
                        <option value="">Pilih Kategori</option>
                        {kategoriList.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.nama_kategori}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label>Jumlah Unit *</label>
                      <input
                        type="number"
                        min="0"
                        className="input-control"
                        required
                        placeholder="0"
                        value={formData.jumlah === 0 ? '' : formData.jumlah}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormData({ ...formData, jumlah: val === '' ? 0 : parseInt(val, 10) || 0 });
                        }}
                      />
                    </div>
                    <div className="form-group">
                      <label>Kondisi *</label>
                      <select
                        className="input-control"
                        value={formData.kondisi}
                        onChange={(e) => setFormData({ ...formData, kondisi: e.target.value })}
                      >
                        <option value="Baik">Baik</option>
                        <option value="Rusak Ringan">Rusak Ringan</option>
                        <option value="Rusak Berat">Rusak Berat</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label>Lokasi Penyimpanan</label>
                      <input
                        type="text"
                        className="input-control"
                        placeholder="Contoh: Rak B-02"
                        value={formData.lokasi}
                        onChange={(e) => setFormData({ ...formData, lokasi: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Harga Satuan (Rp)</label>
                      <input
                        type="number"
                        min="0"
                        className="input-control"
                        placeholder="0"
                        value={formData.harga === 0 ? '' : formData.harga}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormData({ ...formData, harga: val === '' ? 0 : parseFloat(val) || 0 });
                        }}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Keterangan / Spesifikasi</label>
                    <textarea
                      rows={3}
                      className="input-control"
                      placeholder="Catatan tambahan spesifikasi alat..."
                      value={formData.keterangan}
                      onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Foto / Gambar Barang</label>
                    <input
                      type="file"
                      accept="image/*"
                      className="input-control"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                    <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                      Batal
                    </button>
                    <button type="submit" className="btn-primary" disabled={formSubmitting} style={{ width: 'auto' }}>
                      {formSubmitting ? 'Simpan...' : 'Simpan Barang'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Modal Detail Barang */}
          {showDetailModal && selectedBarang && (
            <div className="modal-overlay">
              <div className="modal-card">
                <div className="modal-header">
                  <h2>Detail Inventaris Barang</h2>
                  <button onClick={() => setShowDetailModal(false)} className="btn-close">
                    ✕
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {selectedBarang.gambar && (
                    <div style={{ textAlign: 'center' }}>
                      <img
                        src={`http://localhost:3000/uploads/${selectedBarang.gambar}`}
                        alt={selectedBarang.nama_barang}
                        style={{ maxHeight: '200px', borderRadius: '12px', border: '1px solid var(--border-color)' }}
                      />
                    </div>
                  )}

                  <div style={{ background: 'var(--bg-input)', padding: '1rem', borderRadius: '12px' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                      {selectedBarang.nama_barang}
                    </h3>
                    <span className="badge badge-purple">{selectedBarang.kode_barang}</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.9rem' }}>
                    <div>
                      <strong style={{ color: 'var(--text-muted)' }}>Kategori:</strong>
                      <div>{selectedBarang.nama_kategori || '-'}</div>
                    </div>
                    <div>
                      <strong style={{ color: 'var(--text-muted)' }}>Jumlah:</strong>
                      <div>{selectedBarang.jumlah} unit</div>
                    </div>
                    <div>
                      <strong style={{ color: 'var(--text-muted)' }}>Kondisi:</strong>
                      <div>
                        <span className={`badge ${
                          selectedBarang.kondisi === 'Baik' ? 'badge-success' :
                          selectedBarang.kondisi === 'Rusak Ringan' ? 'badge-warning' : 'badge-danger'
                        }`}>
                          {selectedBarang.kondisi}
                        </span>
                      </div>
                    </div>
                    <div>
                      <strong style={{ color: 'var(--text-muted)' }}>Lokasi:</strong>
                      <div>{selectedBarang.lokasi || '-'}</div>
                    </div>
                    <div>
                      <strong style={{ color: 'var(--text-muted)' }}>Harga:</strong>
                      <div>Rp {Number(selectedBarang.harga || 0).toLocaleString('id-ID')}</div>
                    </div>
                    <div>
                      <strong style={{ color: 'var(--text-muted)' }}>Didaftarkan oleh:</strong>
                      <div>{selectedBarang.created_by_name || 'System'}</div>
                    </div>
                  </div>

                  {selectedBarang.keterangan && (
                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', fontSize: '0.9rem' }}>
                      <strong style={{ color: 'var(--text-muted)' }}>Keterangan:</strong>
                      <p style={{ marginTop: '0.25rem', color: 'var(--text-main)' }}>{selectedBarang.keterangan}</p>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                  <button onClick={() => setShowDetailModal(false)} className="btn-secondary">
                    Tutup
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
