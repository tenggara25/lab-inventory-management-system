'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import Sidebar from '@/components/Sidebar';

interface UserItem {
  id: number;
  username: string;
  email: string;
  role: string;
  created_at?: string;
}

export default function UsersPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal State
  const [showFormModal, setShowFormModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [editData, setEditData] = useState<UserItem | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'viewer',
  });
  const [newPassword, setNewPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api('/users');
      if (res.success) {
        setUsers(res.data);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSubmitUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setSubmitting(true);

    try {
      if (editData) {
        await api(`/users/${editData.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData),
        });
        setSuccessMsg('Data user berhasil diperbarui.');
      } else {
        await api('/users', {
          method: 'POST',
          body: JSON.stringify(formData),
        });
        setSuccessMsg('User baru berhasil ditambahkan.');
      }

      setShowFormModal(false);
      resetForm();
      fetchUsers();
    } catch (error: any) {
      setErrorMsg(error.message || 'Gagal menyimpan data user.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) return;
    setErrorMsg('');
    setSubmitting(true);

    try {
      await api(`/users/${selectedUserId}/password`, {
        method: 'PUT',
        body: JSON.stringify({ newPassword }),
      });
      alert('Password pengguna berhasil direset!');
      setShowResetModal(false);
      setNewPassword('');
      setSelectedUserId(null);
    } catch (error: any) {
      setErrorMsg(error.message || 'Gagal mereset password.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (id === user?.id) {
      alert('Anda tidak dapat menghapus akun Anda sendiri.');
      return;
    }

    if (confirm('Apakah Anda yakin ingin menghapus user ini?')) {
      try {
        await api(`/users/${id}`, { method: 'DELETE' });
        fetchUsers();
      } catch (error: any) {
        alert(error.message || 'Gagal menghapus user');
      }
    }
  };

  const handleOpenCreate = () => {
    setEditData(null);
    resetForm();
    setErrorMsg('');
    setShowFormModal(true);
  };

  const handleOpenEdit = (item: UserItem) => {
    setEditData(item);
    setFormData({
      username: item.username,
      email: item.email,
      password: '',
      role: item.role,
    });
    setErrorMsg('');
    setShowFormModal(true);
  };

  const handleOpenResetPassword = (id: number) => {
    setSelectedUserId(id);
    setNewPassword('');
    setErrorMsg('');
    setShowResetModal(true);
  };

  const resetForm = () => {
    setFormData({ username: '', email: '', password: '', role: 'user' });
  };

  const filteredUsers = users.filter(
    (u) =>
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div className="dashboard-layout">
        <Sidebar />

        <main className="main-wrapper">
          <header className="page-header">
            <div>
              <h1 className="page-title">Manajemen Users</h1>
              <p className="page-subtitle">Kelola akun pengguna, peran akses (admin/user), dan keamanan password.</p>
            </div>
            {user?.role === 'admin' && (
              <button onClick={handleOpenCreate} className="btn-primary">
                + Tambah User Baru
              </button>
            )}
          </header>

          {/* Search Toolbar */}
          <div className="content-card toolbar-container">
            <div className="search-box">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                className="input-control"
                placeholder="Cari username atau email user..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* User List Table */}
          <div className="content-card">
            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Role Aksen</th>
                    <th style={{ textAlign: 'right' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                        Memuat data user...
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                        Data user tidak ditemukan.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((item) => (
                      <tr key={item.id}>
                        <td style={{ fontWeight: 600 }}>{item.username}</td>
                        <td style={{ color: 'var(--text-muted)' }}>{item.email}</td>
                        <td>
                          <span className={`badge ${item.role === 'admin' ? 'badge-purple' : 'badge-blue'}`}>
                            {item.role}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          {user?.role === 'admin' && (
                            <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                              <button
                                onClick={() => handleOpenEdit(item)}
                                className="btn-warning"
                                style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleOpenResetPassword(item.id)}
                                className="btn-secondary"
                                style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                              >
                                Reset Pass
                              </button>
                              {item.id !== user.id && (
                                <button
                                  onClick={() => handleDelete(item.id)}
                                  className="btn-danger"
                                  style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                                >
                                  Hapus
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Modal Form Tambah / Edit */}
          {showFormModal && (
            <div className="modal-overlay">
              <div className="modal-card">
                <div className="modal-header">
                  <h2>{editData ? 'Edit User' : 'Tambah User Baru'}</h2>
                  <button onClick={() => setShowFormModal(false)} className="btn-close">
                    ✕
                  </button>
                </div>

                {errorMsg && <div className="alert-error">{errorMsg}</div>}

                <form onSubmit={handleSubmitUser}>
                  <div className="form-group">
                    <label>Username *</label>
                    <input
                      type="text"
                      className="input-control"
                      required
                      placeholder="Username unik"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Email *</label>
                    <input
                      type="email"
                      className="input-control"
                      required
                      placeholder="user@lab.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>

                  {!editData && (
                    <div className="form-group">
                      <label>Password *</label>
                      <input
                        type="password"
                        className="input-control"
                        required
                        minLength={6}
                        placeholder="Minimal 6 karakter"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      />
                    </div>
                  )}

                  <div className="form-group">
                    <label>Role Akses *</label>
                    <select
                      className="input-control"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    >
                      <option value="viewer">Viewer (Hanya Melihat)</option>
                      <option value="operator">Operator (Kelola Inventaris)</option>
                      <option value="admin">Admin (Akses Penuh)</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                    <button type="button" onClick={() => setShowFormModal(false)} className="btn-secondary">
                      Batal
                    </button>
                    <button type="submit" className="btn-primary" disabled={submitting} style={{ width: 'auto' }}>
                      {submitting ? 'Simpan...' : 'Simpan User'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Modal Form Reset Password */}
          {showResetModal && (
            <div className="modal-overlay">
              <div className="modal-card">
                <div className="modal-header">
                  <h2>Reset Password User</h2>
                  <button onClick={() => setShowResetModal(false)} className="btn-close">
                    ✕
                  </button>
                </div>

                {errorMsg && <div className="alert-error">{errorMsg}</div>}

                <form onSubmit={handleResetPassword}>
                  <div className="form-group">
                    <label>Password Baru *</label>
                    <input
                      type="password"
                      className="input-control"
                      required
                      minLength={6}
                      placeholder="Masukkan password baru..."
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                    <button type="button" onClick={() => setShowResetModal(false)} className="btn-secondary">
                      Batal
                    </button>
                    <button type="submit" className="btn-primary" disabled={submitting} style={{ width: 'auto' }}>
                      {submitting ? 'Resetting...' : 'Reset Password'}
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