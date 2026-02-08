import { useState, useEffect } from 'react';
import {
  HiSearch,
  HiPlus,
  HiTrash,
  HiOutlinePrinter,
  HiKey,
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
  street: '',
  city: '',
  state: '',
  zip_code: '',
  country: '',
};

const EMPTY_EDIT_FORM = {
  full_name: '',
  phone: '',
  company: '',
  is_active: true,
  street: '',
  city: '',
  state: '',
  zip_code: '',
  country: '',
};

const ROLE_STYLES = {
  admin: { background: '#714B67', color: '#FFFFFF' },
  internal: { background: '#DBEAFE', color: '#2563EB' },
  portal: { background: '#D1FAE5', color: '#059669' },
};

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState([]);

  // Form view state
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState(EMPTY_CREATE_FORM);
  const [error, setError] = useState('');
  const [relatedContactId, setRelatedContactId] = useState('');

  // Change password modal state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ old_password: '', new_password: '' });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  const isAdmin = currentUser?.role === 'admin';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, contactsRes] = await Promise.all([
        api.get('/users/'),
        api.get('/contacts/'),
      ]);
      setUsers(usersRes.data);
      setContacts(contactsRes.data);
    } catch {
      setUsers([]);
      setContacts([]);
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

  /* ---- Selection ---- */
  const toggleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selected.length === filtered.length) setSelected([]);
    else setSelected(filtered.map((u) => u.id));
  };

  /* ---- Navigation ---- */
  const openCreate = () => {
    setEditingUser(null);
    setForm(EMPTY_CREATE_FORM);
    setRelatedContactId('');
    setError('');
    setShowForm(true);
  };

  const openEdit = (user) => {
    setEditingUser(user);
    setForm({
      full_name: user.full_name || '',
      phone: user.phone || '',
      company: user.company || '',
      is_active: user.is_active !== false,
      street: user.street || '',
      city: user.city || '',
      state: user.state || '',
      zip_code: user.zip_code || '',
      country: user.country || '',
    });
    const userContact = contacts.find((c) => c.user_id === user.id);
    setRelatedContactId(userContact ? String(userContact.id) : '');
    setError('');
    setShowForm(true);
  };

  const goBack = () => {
    setShowForm(false);
    setEditingUser(null);
    setError('');
  };

  /* ---- Form handling ---- */
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
      setShowForm(false);
      setEditingUser(null);
      fetchData();
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        'An error occurred';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    }
  };

  /* ---- Delete ---- */
  const handleDelete = async (user) => {
    if (!window.confirm('Deactivate this user?')) return;
    try {
      await api.delete(`/users/${user.id}`);
      if (showForm && editingUser?.id === user.id) {
        setShowForm(false);
        setEditingUser(null);
      }
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to deactivate user');
    }
  };

  const handleBulkDelete = async () => {
    if (selected.length === 0) return;
    if (!window.confirm(`Deactivate ${selected.length} user(s)?`)) return;
    try {
      await Promise.all(selected.map((id) => api.delete(`/users/${id}`)));
      setSelected([]);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to deactivate');
    }
  };

  /* ---- Change password ---- */
  const openChangePassword = () => {
    setPasswordForm({ old_password: '', new_password: '' });
    setPasswordError('');
    setPasswordSuccess('');
    setShowPasswordModal(true);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');
    try {
      await api.post('/users/me/change-password', passwordForm);
      setPasswordSuccess('Password changed successfully');
      setTimeout(() => setShowPasswordModal(false), 1500);
    } catch (err) {
      setPasswordError(
        err.response?.data?.detail || 'Failed to change password'
      );
    }
  };

  /* ---- Loading ---- */
  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>
          <div className={styles.spinner} />
        </div>
      </div>
    );
  }

  /* ========== FORM VIEW ========== */
  if (showForm) {
    const userContacts = editingUser
      ? contacts.filter((c) => c.user_id === editingUser.id)
      : [];

    return (
      <div className={styles.page}>
        {/* Toolbar */}
        <div className={styles.toolbar}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button className={styles.btnPrimary} onClick={openCreate}>
              <HiPlus /> New
            </button>
            {editingUser && isAdmin && (
              <button
                className={styles.btnSecondary}
                onClick={() => handleDelete(editingUser)}
                title="Deactivate"
              >
                <HiTrash />
              </button>
            )}
            <button
              className={styles.btnSecondary}
              onClick={() => window.print()}
              title="Print"
            >
              <HiOutlinePrinter />
            </button>
            {editingUser && editingUser.id === currentUser?.id && (
              <button
                className={styles.btnSecondary}
                onClick={openChangePassword}
              >
                <HiKey /> Change Password
              </button>
            )}
          </div>
        </div>

        {/* Form card */}
        <form onSubmit={handleSubmit}>
          <div className={styles.card} style={{ padding: 24, marginBottom: 20 }}>
            {/* Name as big editable heading */}
            <input
              type="text"
              name="full_name"
              value={form.full_name}
              onChange={handleChange}
              placeholder="User Name"
              required
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: '#1F2937',
                border: 'none',
                borderBottom: '2px solid transparent',
                background: 'transparent',
                width: '100%',
                marginBottom: 20,
                padding: '4px 0',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => {
                e.target.style.borderBottomColor = '#714B67';
              }}
              onBlur={(e) => {
                e.target.style.borderBottomColor = 'transparent';
              }}
            />

            {/* Two-column layout */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 24,
              }}
            >
              {/* Left column: Email, Phone, Address */}
              <div>
                <div className={styles.formGroup}>
                  <label>Email</label>
                  {editingUser ? (
                    <input
                      className={styles.formControl}
                      type="email"
                      value={editingUser.email}
                      disabled
                      style={{ background: '#F9FAFB', color: '#6B7280' }}
                    />
                  ) : (
                    <input
                      className={styles.formControl}
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      required
                      placeholder="user@example.com"
                    />
                  )}
                </div>

                {!editingUser && (
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
                )}

                <div className={styles.formGroup}>
                  <label>Phone Number</label>
                  <input
                    className={styles.formControl}
                    type="text"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="e.g. +1 (555) 123-4567"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Address</label>
                  <input
                    className={styles.formControl}
                    type="text"
                    name="street"
                    value={form.street}
                    onChange={handleChange}
                    placeholder="Street"
                    style={{ marginBottom: 8 }}
                  />
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: 8,
                    }}
                  >
                    <input
                      className={styles.formControl}
                      type="text"
                      name="city"
                      value={form.city}
                      onChange={handleChange}
                      placeholder="City"
                    />
                    <input
                      className={styles.formControl}
                      type="text"
                      name="state"
                      value={form.state}
                      onChange={handleChange}
                      placeholder="State"
                    />
                  </div>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: 8,
                      marginTop: 8,
                    }}
                  >
                    <input
                      className={styles.formControl}
                      type="text"
                      name="zip_code"
                      value={form.zip_code}
                      onChange={handleChange}
                      placeholder="Zip Code"
                    />
                    <input
                      className={styles.formControl}
                      type="text"
                      name="country"
                      value={form.country}
                      onChange={handleChange}
                      placeholder="Country"
                    />
                  </div>
                </div>
              </div>

              {/* Right column: Role, Related Contact, Company, Active */}
              <div>
                {!editingUser ? (
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
                ) : (
                  <div className={styles.formGroup}>
                    <label>Role</label>
                    <input
                      className={styles.formControl}
                      value={editingUser.role}
                      disabled
                      style={{
                        background: '#F9FAFB',
                        color: '#6B7280',
                        textTransform: 'capitalize',
                      }}
                    />
                  </div>
                )}

                <div className={styles.formGroup}>
                  <label>Related Contact</label>
                  <select
                    className={styles.formControl}
                    value={relatedContactId}
                    onChange={(e) => setRelatedContactId(e.target.value)}
                    disabled={!editingUser}
                  >
                    <option value="">No linked contact</option>
                    {(editingUser ? userContacts : []).map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <p
                    style={{
                      fontSize: 12,
                      color: '#9CA3AF',
                      marginTop: 6,
                      lineHeight: 1.5,
                    }}
                  >
                    By default one contact record should be created for user and
                    linked here. Because one user can create multiple contacts,
                    the contact model is different.
                  </p>
                </div>

                <div className={styles.formGroup}>
                  <label>Company</label>
                  <input
                    className={styles.formControl}
                    type="text"
                    name="company"
                    value={form.company}
                    onChange={handleChange}
                    placeholder="Company name"
                  />
                </div>

                {editingUser && (
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
                )}
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className={styles.formError} style={{ marginBottom: 16 }}>
              {error}
            </div>
          )}

          {/* Save / Discard */}
          <div style={{ display: 'flex', gap: 12 }}>
            <button type="submit" className={styles.btnPrimary}>
              {editingUser ? 'Save Changes' : 'Create User'}
            </button>
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={goBack}
            >
              Discard
            </button>
          </div>
        </form>

        {/* Change Password Modal */}
        {showPasswordModal && (
          <div
            className={styles.overlay}
            onClick={() => setShowPasswordModal(false)}
          >
            <div
              className={styles.modal}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.modalHeader}>
                <h2>Change Password</h2>
                <button
                  className={styles.modalClose}
                  onClick={() => setShowPasswordModal(false)}
                >
                  <HiX />
                </button>
              </div>
              <form onSubmit={handleChangePassword}>
                <div className={styles.modalBody}>
                  <div className={styles.formGroup}>
                    <label>Current Password</label>
                    <input
                      className={styles.formControl}
                      type="password"
                      value={passwordForm.old_password}
                      onChange={(e) =>
                        setPasswordForm((p) => ({
                          ...p,
                          old_password: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>New Password</label>
                    <input
                      className={styles.formControl}
                      type="password"
                      value={passwordForm.new_password}
                      onChange={(e) =>
                        setPasswordForm((p) => ({
                          ...p,
                          new_password: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>
                  {passwordError && (
                    <div className={styles.formError}>{passwordError}</div>
                  )}
                  {passwordSuccess && (
                    <div
                      style={{
                        color: '#059669',
                        fontSize: 13,
                        marginTop: 8,
                        padding: '8px 12px',
                        background: '#ECFDF5',
                        borderRadius: 6,
                      }}
                    >
                      {passwordSuccess}
                    </div>
                  )}
                </div>
                <div className={styles.modalFooter}>
                  <button
                    type="button"
                    className={styles.btnSecondary}
                    onClick={() => setShowPasswordModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className={styles.btnPrimary}>
                    Update Password
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ========== LIST VIEW ========== */
  return (
    <div className={styles.page}>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {isAdmin && (
            <button className={styles.btnPrimary} onClick={openCreate}>
              <HiPlus /> New
            </button>
          )}
          {isAdmin && (
            <button
              className={styles.btnSecondary}
              onClick={handleBulkDelete}
              disabled={selected.length === 0}
              title="Delete selected"
            >
              <HiTrash />
            </button>
          )}
          <button
            className={styles.btnSecondary}
            onClick={() => window.print()}
            title="Print"
          >
            <HiOutlinePrinter />
          </button>
        </div>
        <div className={styles.searchBox}>
          <HiSearch />
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
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
                  <th style={{ width: 40 }}>
                    <input
                      type="checkbox"
                      checked={
                        selected.length === filtered.length &&
                        filtered.length > 0
                      }
                      onChange={toggleAll}
                      style={{ accentColor: '#714B67' }}
                    />
                  </th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((user) => {
                  const roleStyle =
                    ROLE_STYLES[user.role] || ROLE_STYLES.internal;
                  return (
                    <tr
                      key={user.id}
                      onClick={() => openEdit(user)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selected.includes(user.id)}
                          onChange={() => toggleSelect(user.id)}
                          style={{ accentColor: '#714B67' }}
                        />
                      </td>
                      <td style={{ fontWeight: 500 }}>{user.full_name}</td>
                      <td>{user.email}</td>
                      <td>
                        <span className={styles.badge} style={roleStyle}>
                          {user.role}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
