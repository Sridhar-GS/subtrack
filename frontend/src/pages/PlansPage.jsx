import { useState, useEffect, useCallback } from 'react';
import {
  HiPlus,
  HiTrash,
  HiOutlinePrinter,
  HiSearch,
  HiArrowLeft,
  HiOutlineClipboardList,
} from 'react-icons/hi';
import styles from './Page.module.css';
import api from '../api';

const EMPTY_FORM = {
  name: '',
  price: '',
  billing_period_number: 1,
  billing_period_unit: 'monthly',
  min_quantity: 1,
  start_date: '',
  end_date: '',
  auto_close_days: '',
  closable: true,
  pausable: false,
  renewable: true,
};

const PERIOD_BADGE = {
  daily: { background: '#F3F4F6', color: '#6B7280' },
  weekly: { background: '#DBEAFE', color: '#2563EB' },
  monthly: { background: '#D1FAE5', color: '#059669' },
  yearly: { background: '#F3E8FF', color: '#7C3AED' },
};

const PERIOD_LABELS = {
  daily: 'Daily',
  weekly: 'Weeks',
  monthly: 'Month',
  yearly: 'Year',
};

export default function PlansPage() {
  const [plans, setPlans] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState([]);
  const [view, setView] = useState('list');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [planProducts, setPlanProducts] = useState([]);

  const fetchData = useCallback(async () => {
    try {
      const [plansRes, subsRes, productsRes] = await Promise.all([
        api.get('/recurring-plans/'),
        api.get('/subscriptions/'),
        api.get('/products/'),
      ]);
      setPlans(plansRes.data);
      setSubscriptions(subsRes.data);
      setProducts(productsRes.data);
    } catch {
      /* ignore */
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ---------- List helpers ---------- */

  const filtered = plans.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()),
  );

  const activeSubCount = (planId) =>
    subscriptions.filter(
      (s) => s.plan_id === planId && s.status === 'active',
    ).length;

  const toggleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const toggleAll = () => {
    if (selected.length === filtered.length) setSelected([]);
    else setSelected(filtered.map((p) => p.id));
  };

  const handleBulkDelete = async () => {
    if (selected.length === 0) return;
    if (!window.confirm(`Delete ${selected.length} plan(s)?`)) return;
    try {
      await Promise.all(
        selected.map((id) => api.delete(`/recurring-plans/${id}`)),
      );
      setSelected([]);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete');
    }
  };

  /* ---------- Form helpers ---------- */

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setPlanProducts([]);
    setError('');
    setView('form');
  };

  const openEdit = (plan) => {
    setEditing(plan);
    setForm({
      name: plan.name,
      price: plan.price,
      billing_period_number: 1,
      billing_period_unit: plan.billing_period || 'monthly',
      min_quantity: plan.min_quantity,
      start_date: plan.start_date || '',
      end_date: plan.end_date || '',
      auto_close_days: plan.auto_close_days ?? '',
      closable: plan.closable,
      pausable: plan.pausable,
      renewable: plan.renewable,
    });
    setPlanProducts([]);
    setError('');
    setView('form');
  };

  const goBack = () => {
    setView('list');
    setEditing(null);
    setError('');
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSave = async () => {
    setError('');
    if (!form.name.trim()) {
      setError('Name is required');
      return;
    }

    const payload = {
      name: form.name,
      price: parseFloat(form.price) || 0,
      billing_period: form.billing_period_unit,
      min_quantity: parseInt(form.min_quantity, 10) || 1,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      auto_close_days: form.auto_close_days
        ? parseInt(form.auto_close_days, 10)
        : null,
      closable: form.closable,
      pausable: form.pausable,
      renewable: form.renewable,
    };

    try {
      if (editing) {
        await api.put(`/recurring-plans/${editing.id}`, payload);
      } else {
        await api.post('/recurring-plans/', payload);
      }
      goBack();
      fetchData();
    } catch (err) {
      setError(err.response?.data?.detail || 'An error occurred');
    }
  };

  const handleDeleteSingle = async () => {
    if (!editing) return;
    if (!window.confirm(`Delete plan "${editing.name}"?`)) return;
    try {
      await api.delete(`/recurring-plans/${editing.id}`);
      goBack();
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete plan');
    }
  };

  /* ---------- Loading ---------- */

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>
          <div className={styles.spinner} />
        </div>
      </div>
    );
  }

  /* ===================== LIST VIEW ===================== */

  if (view === 'list') {
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
              placeholder="Search plans..."
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
                <p>No recurring plans found.</p>
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
                    <th>Plan Name</th>
                    <th>Billing Period</th>
                    <th>Price</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((plan) => {
                    const badgeStyle =
                      PERIOD_BADGE[plan.billing_period] || PERIOD_BADGE.monthly;
                    return (
                      <tr
                        key={plan.id}
                        onClick={() => openEdit(plan)}
                        style={{ cursor: 'pointer' }}
                      >
                        <td onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selected.includes(plan.id)}
                            onChange={() => toggleSelect(plan.id)}
                            style={{ accentColor: '#714B67' }}
                          />
                        </td>
                        <td style={{ fontWeight: 600 }}>{plan.name}</td>
                        <td>
                          <span className={styles.badge} style={badgeStyle}>
                            {plan.billing_period}
                          </span>
                        </td>
                        <td>₹{parseFloat(plan.price).toFixed(2)}</td>
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

  /* ===================== FORM VIEW ===================== */

  const subCount = editing ? activeSubCount(editing.id) : 0;

  return (
    <div className={styles.page}>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            className={styles.btnSecondary}
            onClick={goBack}
            title="Back to list"
          >
            <HiArrowLeft />
          </button>
          <button className={styles.btnPrimary} onClick={openCreate}>
            <HiPlus /> New
          </button>
          {editing && (
            <>
              <button
                className={styles.btnDanger}
                onClick={handleDeleteSingle}
                title="Delete"
              >
                <HiTrash /> Delete
              </button>
              <button
                className={styles.btnSecondary}
                onClick={() => window.print()}
                title="Print"
              >
                <HiOutlinePrinter /> Print
              </button>
            </>
          )}
        </div>
        {editing && (
          <button
            className={styles.btnSecondary}
            title="Active subscriptions using this plan"
            style={{ pointerEvents: 'none' }}
          >
            <HiOutlineClipboardList /> Subscriptions: {subCount}
          </button>
        )}
      </div>

      {/* Form card */}
      <div className={styles.card}>
        <div style={{ padding: 24 }}>
          {/* Recurring Name as big editable heading */}
          <div className={styles.formGroup}>
            <input
              className={styles.formControl}
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Recurring Plan Name"
              required
              style={{
                fontSize: 24,
                fontWeight: 700,
                height: 'auto',
                padding: '12px 16px',
                border: '1px solid #E5E7EB',
                borderRadius: 8,
              }}
            />
          </div>

          {/* Billing Period + Price row */}
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Billing Period</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  className={styles.formControl}
                  type="number"
                  name="billing_period_number"
                  value={form.billing_period_number}
                  onChange={handleChange}
                  min="1"
                  style={{ width: 80, flex: 'none' }}
                />
                <select
                  className={styles.formControl}
                  name="billing_period_unit"
                  value={form.billing_period_unit}
                  onChange={handleChange}
                >
                  <option value="weekly">Weeks</option>
                  <option value="monthly">Month</option>
                  <option value="yearly">Year</option>
                </select>
              </div>
            </div>
            <div className={styles.formGroup}>
              <label>Price</label>
              <input
                className={styles.formControl}
                type="number"
                step="0.01"
                name="price"
                value={form.price}
                onChange={handleChange}
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Automatic close + checkboxes row */}
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Automatic Close</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  className={styles.formControl}
                  type="number"
                  name="auto_close_days"
                  value={form.auto_close_days}
                  onChange={handleChange}
                  min="0"
                  placeholder="--"
                  style={{ width: 100, flex: 'none' }}
                />
                <span style={{ color: '#6B7280', fontSize: 14 }}>Days</span>
              </div>
            </div>
            <div className={styles.formGroup}>
              <label>&nbsp;</label>
              <div style={{ display: 'flex', gap: 20, paddingTop: 8 }}>
                <label className={styles.checkbox}>
                  <input
                    type="checkbox"
                    name="closable"
                    checked={form.closable}
                    onChange={handleChange}
                  />
                  Closable
                </label>
                <label className={styles.checkbox}>
                  <input
                    type="checkbox"
                    name="pausable"
                    checked={form.pausable}
                    onChange={handleChange}
                  />
                  Pausable
                </label>
                <label className={styles.checkbox}>
                  <input
                    type="checkbox"
                    name="renewable"
                    checked={form.renewable}
                    onChange={handleChange}
                  />
                  Renew
                </label>
              </div>
            </div>
          </div>

          {error && <div className={styles.formError}>{error}</div>}

          {/* Save / Discard buttons */}
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button className={styles.btnPrimary} onClick={handleSave}>
              {editing ? 'Save' : 'Create'}
            </button>
            <button className={styles.btnSecondary} onClick={goBack}>
              Discard
            </button>
          </div>
        </div>
      </div>

      {/* Products table */}
      <div className={styles.card} style={{ marginTop: 16 }}>
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid #E5E7EB',
          }}
        >
          <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>
            Products
          </h3>
        </div>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Product</th>
                <th>Variant</th>
                <th>Price</th>
                <th>Min Qty</th>
              </tr>
            </thead>
            <tbody>
              {planProducts.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    style={{
                      textAlign: 'center',
                      color: '#9CA3AF',
                      padding: 24,
                    }}
                  >
                    No products added to this plan yet.
                  </td>
                </tr>
              ) : (
                planProducts.map((pp, idx) => (
                  <tr key={idx}>
                    <td>{pp.product}</td>
                    <td>{pp.variant || '\u2014'}</td>
                    <td>₹{parseFloat(pp.price).toFixed(2)}</td>
                    <td>{pp.min_qty}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
