import { useState, useEffect, useCallback } from 'react';
import {
  HiSearch,
  HiPlus,
  HiTrash,
  HiOutlinePrinter,
  HiSave,
} from 'react-icons/hi';
import api from '../api';
import styles from './Page.module.css';

const EMPTY_FORM = {
  name: '',
  discount_type: 'fixed',
  value: '',
  min_purchase: '',
  min_quantity: '',
  start_date: '',
  end_date: '',
  limit_usage: false,
  usage_limit: '',
  product_id: '',
};

export default function DiscountsPage() {
  const [discounts, setDiscounts] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState([]);

  // Form view state
  const [view, setView] = useState('list'); // 'list' | 'form'
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const [discRes, prodRes] = await Promise.all([
        api.get('/discounts/'),
        api.get('/products/'),
      ]);
      setDiscounts(discRes.data);
      setProducts(prodRes.data);
    } catch {
      setDiscounts([]);
      setProducts([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtered = discounts.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase())
  );

  // --- Selection ---
  const toggleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selected.length === filtered.length) setSelected([]);
    else setSelected(filtered.map((d) => d.id));
  };

  // --- Navigation ---
  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setError('');
    setView('form');
  };

  const openEdit = (discount) => {
    setEditing(discount);
    const hasLimit = discount.limit_usage > 0;
    setForm({
      name: discount.name || '',
      discount_type: discount.discount_type || 'fixed',
      value: discount.value ?? '',
      min_purchase: discount.min_purchase ?? '',
      min_quantity: discount.min_quantity ?? '',
      start_date: discount.start_date || '',
      end_date: discount.end_date || '',
      limit_usage: hasLimit,
      usage_limit: hasLimit ? discount.limit_usage : '',
      product_id: discount.product_id ?? '',
    });
    setError('');
    setView('form');
  };

  const goBack = () => {
    setView('list');
    setEditing(null);
    setError('');
  };

  // --- Form handlers ---
  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');

    const payload = {
      name: form.name,
      discount_type: form.discount_type,
      value: parseFloat(form.value) || 0,
      min_purchase: parseFloat(form.min_purchase) || 0,
      min_quantity: parseInt(form.min_quantity, 10) || 0,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      limit_usage: form.limit_usage ? parseInt(form.usage_limit, 10) || 0 : 0,
      product_id: form.product_id ? Number(form.product_id) : null,
      is_active: true,
    };

    try {
      if (editing) {
        await api.put(`/discounts/${editing.id}`, payload);
      } else {
        await api.post('/discounts/', payload);
      }
      await fetchData();
      goBack();
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        'Failed to save discount.';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    }
    setSaving(false);
  };

  // --- Delete ---
  const handleDelete = async (discount) => {
    if (!window.confirm(`Delete discount "${discount.name}"?`)) return;
    try {
      await api.delete(`/discounts/${discount.id}`);
      if (view === 'form') goBack();
      fetchData();
    } catch {
      // silently fail
    }
  };

  const handleBulkDelete = async () => {
    if (selected.length === 0) return;
    if (!window.confirm(`Delete ${selected.length} discount(s)?`)) return;
    try {
      await Promise.all(selected.map((id) => api.delete(`/discounts/${id}`)));
      setSelected([]);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete');
    }
  };

  // --- Loading ---
  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>
          <div className={styles.spinner} />
        </div>
      </div>
    );
  }

  // ==================== FORM VIEW ====================
  if (view === 'form') {
    return (
      <div className={styles.page}>
        {/* Toolbar */}
        <div className={styles.toolbar}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button className={styles.btnPrimary} onClick={openCreate}>
              <HiPlus /> New
            </button>
            {editing && (
              <button
                className={styles.btnSecondary}
                onClick={() => handleDelete(editing)}
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
        </div>

        {/* Discount Name heading */}
        <div className={styles.card} style={{ padding: 24, marginBottom: 20 }}>
          <input
            type="text"
            value={form.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="Discount Name"
            required
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: '#1F2937',
              border: 'none',
              borderBottom: '2px solid #E5E7EB',
              background: 'transparent',
              width: '100%',
              paddingBottom: 8,
              marginBottom: 24,
              outline: 'none',
            }}
          />

          {/* Two-column form layout */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            {/* Left column */}
            <div>
              <div className={styles.formGroup}>
                <label>Discount Type</label>
                <select
                  className={styles.formControl}
                  value={form.discount_type}
                  onChange={(e) => handleChange('discount_type', e.target.value)}
                >
                  <option value="fixed">Fixed Price</option>
                  <option value="percentage">Percentage</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>
                  {form.discount_type === 'percentage' ? 'Percentage (%)' : 'Discount Amount'}
                </label>
                <input
                  type="number"
                  className={styles.formControl}
                  value={form.value}
                  onChange={(e) => handleChange('value', e.target.value)}
                  step="0.01"
                  min="0"
                  placeholder={form.discount_type === 'percentage' ? 'e.g. 10' : 'e.g. 5.00'}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Minimum Purchase</label>
                <input
                  type="number"
                  className={styles.formControl}
                  value={form.min_purchase}
                  onChange={(e) => handleChange('min_purchase', e.target.value)}
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                />
              </div>

              <div className={styles.formGroup}>
                <label>Minimum Quantity</label>
                <input
                  type="number"
                  className={styles.formControl}
                  value={form.min_quantity}
                  onChange={(e) => handleChange('min_quantity', e.target.value)}
                  min="0"
                  placeholder="0"
                />
              </div>

              <div className={styles.formGroup}>
                <label>Product</label>
                <select
                  className={styles.formControl}
                  value={form.product_id}
                  onChange={(e) => handleChange('product_id', e.target.value)}
                >
                  <option value="">All Products (no restriction)</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <span style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4, display: 'block' }}>
                  If no product is selected, the discount applies to all products.
                </span>
              </div>
            </div>

            {/* Right column */}
            <div>
              <div className={styles.formGroup}>
                <label>Start Date</label>
                <input
                  type="date"
                  className={styles.formControl}
                  value={form.start_date}
                  onChange={(e) => handleChange('start_date', e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label>End Date</label>
                <input
                  type="date"
                  className={styles.formControl}
                  value={form.end_date}
                  onChange={(e) => handleChange('end_date', e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.checkbox}>
                  <input
                    type="checkbox"
                    checked={form.limit_usage}
                    onChange={(e) => handleChange('limit_usage', e.target.checked)}
                  />
                  Limit Usage
                </label>
              </div>

              {form.limit_usage && (
                <div className={styles.formGroup}>
                  <label>Usage Count</label>
                  <input
                    type="number"
                    className={styles.formControl}
                    value={form.usage_limit}
                    onChange={(e) => handleChange('usage_limit', e.target.value)}
                    min="1"
                    placeholder="Maximum number of uses"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Error + Save/Discard */}
        {error && (
          <div className={styles.formError} style={{ marginBottom: 16 }}>
            {error}
          </div>
        )}
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            className={styles.btnPrimary}
            onClick={handleSave}
            disabled={saving}
          >
            <HiSave /> {saving ? 'Saving...' : editing ? 'Save Changes' : 'Create Discount'}
          </button>
          <button className={styles.btnSecondary} onClick={goBack}>
            Discard
          </button>
        </div>
      </div>
    );
  }

  // ==================== LIST VIEW ====================
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
            placeholder="Search discounts..."
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
              <p>No discounts found.</p>
            </div>
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
                  <th>Discount Name</th>
                  <th>Type</th>
                  <th>Value</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((discount) => {
                  const isPercentage = (discount.discount_type || '').toLowerCase() === 'percentage';
                  return (
                    <tr
                      key={discount.id}
                      onClick={() => openEdit(discount)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selected.includes(discount.id)}
                          onChange={() => toggleSelect(discount.id)}
                          style={{ accentColor: '#714B67' }}
                        />
                      </td>
                      <td style={{ fontWeight: 600, color: '#714B67' }}>
                        {discount.name}
                      </td>
                      <td>
                        <span
                          className={`${styles.badge} ${
                            isPercentage ? styles.badgeQuotation : styles.badgeDraft
                          }`}
                        >
                          {isPercentage ? 'Percentage' : 'Fixed'}
                        </span>
                      </td>
                      <td>
                        {isPercentage
                          ? `${discount.value}%`
                          : `₹${Number(discount.value || 0).toLocaleString()}`}
                      </td>
                      <td>{discount.start_date || '\u2014'}</td>
                      <td>{discount.end_date || '\u2014'}</td>
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
