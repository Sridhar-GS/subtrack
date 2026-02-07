import { useState, useEffect } from 'react';
import {
  HiSearch,
  HiPlus,
  HiPencil,
  HiTrash,
  HiCheck,
  HiX,
} from 'react-icons/hi';
import api from '../api';
import styles from './Page.module.css';
import { useAuth } from '../context/AuthContext';

const EMPTY_CREATE_FORM = {
  full_name: '',
  email: '',
  password: '',
  phone: '',
  company: '',
  role: 'internal',
};

const EMPTY_EDIT_FORM = {
  full_name: '',
  phone: '',
  company: '',
  is_active: true,
};

const ROLE_STYLES = {
  admin: { background: '#714B67', color: '#FFFFFF' },
  internal: { background: '#DBEAFE', color: '#2563EB' },
  portal: { background: '#D1FAE5', color: '#059669' },
};

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState(EMPTY_CREATE_FORM);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users/');
      setUsers(res.data);
    } catch {
      setUsers([]);
    }
    setLoading(false);
  };

  const filtered = users.filter((u) => {
    const term = search.toLowerCase();
    return (
      (u.full_name || '').toLowerCase().includes(term) ||
      (u.email || '').toLowerCase().includes(term)
    );
  });

  const openCreate = () => {
    setEditingUser(null);
    setForm(EMPTY_CREATE_FORM);
    setError('');
    setShowModal(true);
  };

  const openEdit = (user) => {
    setEditingUser(user);
    setForm({
      full_name: user.full_name || '',
      phone: user.phone || '',
      company: user.company || '',
      is_active: user.is_active !== false,
    });
    setError('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingUser(null);
    setError('');
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (editingUser) {
        const payload = {
          full_name: form.full_name,
          phone: form.phone || null,
          company: form.company || null,
          is_active: form.is_active,
        };
        await api.put(`/users/${editingUser.id}`, payload);
      } else {
        const payload = {
          full_name: form.full_name,
          email: form.email,
          password: form.password,
          phone: form.phone || null,
          company: form.company || null,
          role: form.role,
        };
        await api.post('/users/', payload);
      }
      closeModal();
      fetchUsers();
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        'An error occurred';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    }
  };

  const handleDelete = async (user) => {
    if (!window.confirm('Deactivate this user?')) return;
    try {
      await api.delete(`/users/${user.id}`);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to deactivate user');
    }
  };

  const isAdmin = currentUser?.role === 'admin';

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>
          <div className={styles.spinner} />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <HiSearch />
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {isAdmin && (
          <button className={styles.btnPrimary} onClick={openCreate}>
            <HiPlus /> Add User
          </button>
        )}
      </div>

      {/* Table */}
      <div className={styles.card}>
        <div className={styles.tableWrapper}>
          {filtered.length === 0 ? (
            <div className={styles.empty}>
              <p>No users found.</p>
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Full Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Active</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((user) => {
                  const roleStyle = ROLE_STYLES[user.role] || ROLE_STYLES.internal;
                  return (
                    <tr key={user.id}>
                      <td>{user.full_name}</td>
                      <td>{user.email}</td>
                      <td>
                        <span
                          className={styles.badge}
                          style={roleStyle}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td>
                        {user.is_active !== false ? (
                          <HiCheck style={{ color: '#059669', fontSize: 18 }} />
                        ) : (
                          <HiX style={{ color: '#DC2626', fontSize: 18 }} />
                        )}
                      </td>
                      <td>
                        <div className={styles.actions}>
                          <button title="Edit" onClick={() => openEdit(user)}>
                            <HiPencil />
                          </button>
                          <button
                            title="Deactivate"
                            className={styles.actionsDanger}
                            onClick={() => handleDelete(user)}
                          >
                            <HiTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className={styles.overlay} onClick={closeModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>{editingUser ? 'Edit User' : 'Add User'}</h2>
              <button className={styles.modalClose} onClick={closeModal}>
                <HiX />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className={styles.modalBody}>
                {editingUser ? (
                  <>
                    {/* Edit form */}
                    <div className={styles.formGroup}>
                      <label>Full Name</label>
                      <input
                        className={styles.formControl}
                        type="text"
                        name="full_name"
                        value={form.full_name}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label>Phone</label>
                      <input
                        className={styles.formControl}
                        type="text"
                        name="phone"
                        value={form.phone}
                        onChange={handleChange}
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label>Company</label>
                      <input
                        className={styles.formControl}
                        type="text"
                        name="company"
                        value={form.company}
                        onChange={handleChange}
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.checkbox}>
                        <input
                          type="checkbox"
                          name="is_active"
                          checked={form.is_active}
                          onChange={handleChange}
                        />
                        Active
                      </label>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Create form */}
                    <div className={styles.formGroup}>
                      <label>Full Name</label>
                      <input
                        className={styles.formControl}
                        type="text"
                        name="full_name"
                        value={form.full_name}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label>Email</label>
                      <input
                        className={styles.formControl}
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label>Password</label>
                      <input
                        className={styles.formControl}
                        type="password"
                        name="password"
                        value={form.password}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <div className={styles.formRow}>
                      <div className={styles.formGroup}>
                        <label>Phone</label>
                        <input
                          className={styles.formControl}
                          type="text"
                          name="phone"
                          value={form.phone}
                          onChange={handleChange}
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label>Company</label>
                        <input
                          className={styles.formControl}
                          type="text"
                          name="company"
                          value={form.company}
                          onChange={handleChange}
                        />
                      </div>
                    </div>

                    <div className={styles.formGroup}>
                      <label>Role</label>
                      <select
                        className={styles.formControl}
                        name="role"
                        value={form.role}
                        onChange={handleChange}
                      >
                        <option value="internal">Internal</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                  </>
                )}

                {error && <div className={styles.formError}>{error}</div>}
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={closeModal}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.btnPrimary}>
                  {editingUser ? 'Save Changes' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
