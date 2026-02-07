import { useState, useEffect } from 'react';
import {
  HiSearch,
  HiPlus,
  HiPencil,
  HiTrash,
  HiCheck,
  HiX,
  HiOutlineX,
} from 'react-icons/hi';
import api from '../api';
import styles from './Page.module.css';

export default function DiscountsPage() {
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState(null);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    discount_type: 'fixed',
    value: '',
    min_purchase: '',
    min_quantity: '',
    start_date: '',
    end_date: '',
    limit_usage: '',
    is_active: true,
  });

  useEffect(() => {
    fetchDiscounts();
  }, []);

  const fetchDiscounts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/discounts/');
      setDiscounts(res.data);
    } catch {
      setDiscounts([]);
    }
    setLoading(false);
  };

  const filtered = discounts.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => {
    setEditingDiscount(null);
    setForm({
      name: '',
      discount_type: 'fixed',
      value: '',
      min_purchase: '',
      min_quantity: '',
      start_date: '',
      end_date: '',
      limit_usage: '',
      is_active: true,
    });
    setError('');
    setShowModal(true);
  };

  const openEdit = (discount) => {
    setEditingDiscount(discount);
    setForm({
      name: discount.name || '',
      discount_type: discount.discount_type || 'fixed',
      value: discount.value ?? '',
      min_purchase: discount.min_purchase ?? '',
      min_quantity: discount.min_quantity ?? '',
      start_date: discount.start_date || '',
      end_date: discount.end_date || '',
      limit_usage: discount.limit_usage ?? '',
      is_active: discount.is_active ?? true,
    });
    setError('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingDiscount(null);
    setError('');
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');

    const payload = {
      name: form.name,
      discount_type: form.discount_type,
      value: parseFloat(form.value) || 0,
      min_purchase: parseFloat(form.min_purchase) || 0,
      min_quantity: parseInt(form.min_quantity, 10) || 0,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      limit_usage: parseInt(form.limit_usage, 10) || 0,
      is_active: form.is_active,
    };

    try {
      if (editingDiscount) {
        await api.put(`/discounts/${editingDiscount.id}`, payload);
      } else {
        await api.post('/discounts/', payload);
      }
      closeModal();
      fetchDiscounts();
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        'Failed to save discount.';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    }
  };

  const handleDelete = async (discount) => {
    if (!window.confirm(`Delete discount "${discount.name}"?`)) return;
    try {
      await api.delete(`/discounts/${discount.id}`);
      fetchDiscounts();
    } catch {
      // silently fail
    }
  };

  const getTypeBadge = (type) => {
    const t = (type || '').toLowerCase();
    if (t === 'percentage') return { className: styles.badgeQuotation, label: 'Percentage' };
    return { className: styles.badgeDraft, label: 'Fixed' };
  };

  const formatValue = (discount) => {
    const t = (discount.discount_type || '').toLowerCase();
    if (t === 'percentage') return `${discount.value}%`;
    return `$${Number(discount.value || 0).toLocaleString()}`;
  };

  const formatUsage = (discount) => {
    if (!discount.limit_usage || discount.limit_usage === 0) return 'Unlimited';
    return `${discount.usage_count ?? 0} / ${discount.limit_usage}`;
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
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
            placeholder="Search discounts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button className={styles.btnPrimary} onClick={openCreate}>
          <HiPlus /> Add Discount
        </button>
      </div>

      {/* Table */}
      <div className={styles.card}>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Value</th>
                <th>Min Purchase</th>
                <th>Min Qty</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Usage</th>
                <th>Active</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', color: '#9CA3AF' }}>
                    No discounts found
                  </td>
                </tr>
              ) : (
                filtered.map((discount) => {
                  const badge = getTypeBadge(discount.discount_type);
                  return (
                    <tr key={discount.id}>
                      <td>{discount.name}</td>
                      <td>
                        <span className={`${styles.badge} ${badge.className}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td>{formatValue(discount)}</td>
                      <td>${Number(discount.min_purchase || 0).toLocaleString()}</td>
                      <td>{discount.min_quantity ?? 0}</td>
                      <td>{discount.start_date || '-'}</td>
                      <td>{discount.end_date || '-'}</td>
                      <td>{formatUsage(discount)}</td>
                      <td>
                        {discount.is_active ? (
                          <HiCheck style={{ color: '#059669', fontSize: '20px' }} />
                        ) : (
                          <HiX style={{ color: '#DC2626', fontSize: '20px' }} />
                        )}
                      </td>
                      <td>
                        <div className={styles.actions}>
                          <button title="Edit" onClick={() => openEdit(discount)}>
                            <HiPencil />
                          </button>
                          <button
                            title="Delete"
                            className={styles.actionsDanger}
                            onClick={() => handleDelete(discount)}
                          >
                            <HiTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className={styles.overlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>{editingDiscount ? 'Edit Discount' : 'Add Discount'}</h2>
              <button className={styles.modalClose} onClick={closeModal}>
                <HiOutlineX />
              </button>
            </div>
            <form onSubmit={handleSave}>
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label>Name</label>
                  <input
                    type="text"
                    name="name"
                    className={styles.formControl}
                    value={form.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Discount Type</label>
                  <select
                    name="discount_type"
                    className={styles.formControl}
                    value={form.discount_type}
                    onChange={handleChange}
                  >
                    <option value="fixed">Fixed</option>
                    <option value="percentage">Percentage</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>Value</label>
                  <input
                    type="number"
                    name="value"
                    className={styles.formControl}
                    value={form.value}
                    onChange={handleChange}
                    step="0.01"
                    required
                  />
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Min Purchase</label>
                    <input
                      type="number"
                      name="min_purchase"
                      className={styles.formControl}
                      value={form.min_purchase}
                      onChange={handleChange}
                      step="0.01"
                      min="0"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Min Quantity</label>
                    <input
                      type="number"
                      name="min_quantity"
                      className={styles.formControl}
                      value={form.min_quantity}
                      onChange={handleChange}
                      min="0"
                    />
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Start Date</label>
                    <input
                      type="date"
                      name="start_date"
                      className={styles.formControl}
                      value={form.start_date}
                      onChange={handleChange}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>End Date</label>
                    <input
                      type="date"
                      name="end_date"
                      className={styles.formControl}
                      value={form.end_date}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Usage Limit</label>
                  <input
                    type="number"
                    name="limit_usage"
                    className={styles.formControl}
                    value={form.limit_usage}
                    onChange={handleChange}
                    placeholder="0 for unlimited"
                    min="0"
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
                  {editingDiscount ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
