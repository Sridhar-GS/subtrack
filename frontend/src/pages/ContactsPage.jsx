import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HiSearch, HiPlus, HiTrash, HiOutlinePrinter, HiSave,
  HiOutlineClipboardList,
} from 'react-icons/hi';
import api from '../api';
import styles from './Page.module.css';

const EMPTY_FORM = {
  user_id: '', name: '', email: '', phone: '', company: '',
  street: '', city: '', state: '', zip_code: '', country: '', notes: '',
};

export default function ContactsPage() {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState([]);

  // Form view state
  const [view, setView] = useState('list');
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [subscriptionCount, setSubscriptionCount] = useState(0);

  const fetchContacts = useCallback(async () => {
    try {
      const [contactsRes, usersRes] = await Promise.all([
        api.get('/contacts/'),
        api.get('/users/'),
      ]);
      setContacts(contactsRes.data);
      setUsers(usersRes.data);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchContacts(); }, [fetchContacts]);

  const fetchSubscriptionCount = useCallback(async (userId) => {
    if (!userId) { setSubscriptionCount(0); return; }
    try {
      const res = await api.get('/subscriptions/');
      const count = res.data.filter(
        (s) => s.customer_id === Number(userId) && ['active', 'confirmed'].includes(s.status)
      ).length;
      setSubscriptionCount(count);
    } catch {
      setSubscriptionCount(0);
    }
  }, []);

  const filtered = contacts.filter((c) => {
    const q = search.toLowerCase();
    return (
      (c.name || '').toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      (c.company || '').toLowerCase().includes(q)
    );
  });

  /* ---- List actions ---- */

  const toggleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selected.length === filtered.length) setSelected([]);
    else setSelected(filtered.map((c) => c.id));
  };

  const handleBulkDelete = async () => {
    if (selected.length === 0) return;
    if (!window.confirm(`Delete ${selected.length} contact(s)?`)) return;
    try {
      await Promise.all(selected.map((id) => api.delete(`/contacts/${id}`)));
      setSelected([]);
      fetchContacts();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete');
    }
  };

  /* ---- Form actions ---- */

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setEditId(null);
    setFormError('');
    setSubscriptionCount(0);
    setView('form');
  };

  const openEdit = (contact) => {
    setForm({
      user_id: contact.user_id || '',
      name: contact.name || '',
      email: contact.email || '',
      phone: contact.phone || '',
      company: contact.company || '',
      street: contact.street || '',
      city: contact.city || '',
      state: contact.state || '',
      zip_code: contact.zip_code || '',
      country: contact.country || '',
      notes: contact.notes || '',
    });
    setEditId(contact.id);
    setFormError('');
    setView('form');
    fetchSubscriptionCount(contact.user_id);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setFormError('');
    const payload = { ...form, user_id: Number(form.user_id) || undefined };
    try {
      if (editId) {
        await api.put(`/contacts/${editId}`, payload);
      } else {
        await api.post('/contacts/', payload);
      }
      setSaving(false);
      setView('list');
      fetchContacts();
    } catch (err) {
      setFormError(err.response?.data?.detail || 'Failed to save contact');
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    setView('list');
    setEditId(null);
    setFormError('');
  };

  const handleDeleteCurrent = async () => {
    if (!editId) return;
    if (!window.confirm('Delete this contact?')) return;
    try {
      await api.delete(`/contacts/${editId}`);
      setView('list');
      setEditId(null);
      fetchContacts();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete');
    }
  };

  /* ---- Loading ---- */

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}><div className={styles.spinner} /></div>
      </div>
    );
  }

  /* ================================================================
   *  FORM VIEW
   * ================================================================ */
  if (view === 'form') {
    return (
      <div className={styles.page}>
        {/* Toolbar */}
        <div className={styles.toolbar}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button className={styles.btnPrimary} onClick={openCreate}>
              <HiPlus /> New
            </button>
            {editId && (
              <button
                className={styles.btnSecondary}
                onClick={handleDeleteCurrent}
                title="Delete"
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
          {editId && form.user_id && (
            <button
              className={styles.btnSecondary}
              onClick={() => navigate(`/subscriptions?customer_id=${form.user_id}`)}
              title="View subscriptions for this contact"
            >
              <HiOutlineClipboardList /> Subscriptions ({subscriptionCount})
            </button>
          )}
        </div>

        {/* Form card */}
        <div className={styles.card} style={{ padding: 24, marginBottom: 20 }}>
          {/* Name as big editable heading */}
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Contact Name"
            required
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: '#1F2937',
              border: 'none',
              borderBottom: '2px solid transparent',
              outline: 'none',
              width: '100%',
              padding: '4px 0',
              marginBottom: 24,
              background: 'transparent',
            }}
            onFocus={(e) => { e.target.style.borderBottomColor = '#714B67'; }}
            onBlur={(e) => { e.target.style.borderBottomColor = 'transparent'; }}
          />

          {/* Two-column layout */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            {/* Left column */}
            <div>
              <div className={styles.formGroup}>
                <label>Email</label>
                <input
                  className={styles.formControl}
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="e.g. john@example.com"
                />
              </div>
              <div className={styles.formGroup}>
                <label>Phone</label>
                <input
                  className={styles.formControl}
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="e.g. +1 555-0100"
                />
              </div>
              <div className={styles.formGroup}>
                <label>Company</label>
                <input
                  className={styles.formControl}
                  name="company"
                  value={form.company}
                  onChange={handleChange}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Linked User</label>
                <select
                  className={styles.formControl}
                  name="user_id"
                  value={form.user_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select user...</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.full_name || u.email}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Right column -- Address */}
            <div>
              <div className={styles.formGroup}>
                <label>Street</label>
                <input
                  className={styles.formControl}
                  name="street"
                  value={form.street}
                  onChange={handleChange}
                />
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>City</label>
                  <input
                    className={styles.formControl}
                    name="city"
                    value={form.city}
                    onChange={handleChange}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>State</label>
                  <input
                    className={styles.formControl}
                    name="state"
                    value={form.state}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Zip Code</label>
                  <input
                    className={styles.formControl}
                    name="zip_code"
                    value={form.zip_code}
                    onChange={handleChange}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Country</label>
                  <input
                    className={styles.formControl}
                    name="country"
                    value={form.country}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className={styles.formGroup}>
                <label>Notes</label>
                <textarea
                  className={styles.formControl}
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  rows={3}
                  style={{ height: 'auto', padding: '8px 12px' }}
                />
              </div>
            </div>
          </div>

          {formError && <div className={styles.formError}>{formError}</div>}
        </div>

        {/* Save / Discard */}
        <div style={{ display: 'flex', gap: 12 }}>
          <button className={styles.btnPrimary} onClick={handleSave} disabled={saving}>
            <HiSave /> {saving ? 'Saving...' : editId ? 'Save Changes' : 'Create Contact'}
          </button>
          <button className={styles.btnSecondary} onClick={handleDiscard}>
            Discard
          </button>
        </div>
      </div>
    );
  }

  /* ================================================================
   *  LIST VIEW
   * ================================================================ */
  return (
    <div className={styles.page}>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className={styles.btnPrimary} onClick={openCreate}>
            <HiPlus /> New
          </button>
          <button
            className={styles.btnSecondary}
            onClick={handleBulkDelete}
            disabled={selected.length === 0}
            title="Delete selected"
          >
            <HiTrash />
          </button>
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
            placeholder="Search contacts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className={styles.card}>
        <div className={styles.tableWrapper}>
          {filtered.length === 0 ? (
            <div className={styles.empty}><p>No contacts found.</p></div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th style={{ width: 40 }}>
                    <input
                      type="checkbox"
                      checked={selected.length === filtered.length && filtered.length > 0}
                      onChange={toggleAll}
                      style={{ accentColor: '#714B67' }}
                    />
                  </th>
                  <th>Name</th>
                  <th>Email</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((contact) => (
                  <tr
                    key={contact.id}
                    onClick={() => openEdit(contact)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selected.includes(contact.id)}
                        onChange={() => toggleSelect(contact.id)}
                        style={{ accentColor: '#714B67' }}
                      />
                    </td>
                    <td style={{ fontWeight: 500 }}>{contact.name}</td>
                    <td style={{ color: '#6B7280' }}>{contact.email || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
