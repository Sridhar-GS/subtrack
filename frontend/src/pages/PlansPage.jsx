import { useState, useEffect } from 'react';
import {
  HiSearch,
  HiPlus,
  HiPencil,
  HiTrash,
  HiCheck,
  HiX,
} from 'react-icons/hi';
import styles from './Page.module.css';
import api from '../api';

const EMPTY_FORM = {
  name: '',
  price: '',
  billing_period: 'monthly',
  min_quantity: 1,
  start_date: '',
  end_date: '',
  auto_close: false,
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

export default function PlansPage() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');

  const fetchPlans = async () => {
    try {
      const res = await api.get('/recurring-plans/');
      setPlans(res.data);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const filtered = plans.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setError('');
    setShowModal(true);
  };

  const openEdit = (plan) => {
    setEditing(plan);
    setForm({
      name: plan.name,
      price: plan.price,
      billing_period: plan.billing_period,
      min_quantity: plan.min_quantity,
      start_date: plan.start_date || '',
      end_date: plan.end_date || '',
      auto_close: plan.auto_close,
      closable: plan.closable,
      pausable: plan.pausable,
      renewable: plan.renewable,
    });
    setError('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const payload = {
      name: form.name,
      price: parseFloat(form.price),
      billing_period: form.billing_period,
      min_quantity: parseInt(form.min_quantity, 10),
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      auto_close: form.auto_close,
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
      closeModal();
      fetchPlans();
    } catch (err) {
      setError(err.response?.data?.detail || 'An error occurred');
    }
  };

  const handleDelete = async (plan) => {
    if (!window.confirm(`Delete plan "${plan.name}"?`)) return;
    try {
      await api.delete(`/recurring-plans/${plan.id}`);
      fetchPlans();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete plan');
    }
  };

  const renderOptionIcon = (value) =>
    value ? (
      <HiCheck style={{ color: '#059669', fontSize: 18 }} />
    ) : (
      <HiX style={{ color: '#DC2626', fontSize: 18 }} />
    );

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
            placeholder="Search plans..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button className={styles.btnPrimary} onClick={openCreate}>
          <HiPlus /> Add Plan
        </button>
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
                  <th>Name</th>
                  <th>Price ($)</th>
                  <th>Billing Period</th>
                  <th>Min Qty</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Options</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((plan) => {
                  const badgeStyle = PERIOD_BADGE[plan.billing_period] || PERIOD_BADGE.monthly;
                  return (
                    <tr key={plan.id}>
                      <td>{plan.name}</td>
                      <td>${parseFloat(plan.price).toFixed(2)}</td>
                      <td>
                        <span
                          className={styles.badge}
                          style={badgeStyle}
                        >
                          {plan.billing_period}
                        </span>
                      </td>
                      <td>{plan.min_quantity}</td>
                      <td>{plan.start_date || '\u2014'}</td>
                      <td>{plan.end_date || '\u2014'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <span title="Auto Close">{renderOptionIcon(plan.auto_close)}</span>
                          <span title="Closable">{renderOptionIcon(plan.closable)}</span>
                          <span title="Pausable">{renderOptionIcon(plan.pausable)}</span>
                          <span title="Renewable">{renderOptionIcon(plan.renewable)}</span>
                        </div>
                      </td>
                      <td>
                        <div className={styles.actions}>
                          <button title="Edit" onClick={() => openEdit(plan)}>
                            <HiPencil />
                          </button>
                          <button
                            title="Delete"
                            className={styles.actionsDanger}
                            onClick={() => handleDelete(plan)}
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
              <h2>{editing ? 'Edit Plan' : 'Add Plan'}</h2>
              <button className={styles.modalClose} onClick={closeModal}>
                <HiX />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label>Name</label>
                  <input
                    className={styles.formControl}
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Price</label>
                    <input
                      className={styles.formControl}
                      type="number"
                      step="0.01"
                      name="price"
                      value={form.price}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Billing Period</label>
                    <select
                      className={styles.formControl}
                      name="billing_period"
                      value={form.billing_period}
                      onChange={handleChange}
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Min Quantity</label>
                  <input
                    className={styles.formControl}
                    type="number"
                    name="min_quantity"
                    value={form.min_quantity}
                    onChange={handleChange}
                    min="1"
                  />
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Start Date</label>
                    <input
                      className={styles.formControl}
                      type="date"
                      name="start_date"
                      value={form.start_date}
                      onChange={handleChange}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>End Date</label>
                    <input
                      className={styles.formControl}
                      type="date"
                      name="end_date"
                      value={form.end_date}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 20,
                    marginTop: 8,
                  }}
                >
                  <label className={styles.checkbox}>
                    <input
                      type="checkbox"
                      name="auto_close"
                      checked={form.auto_close}
                      onChange={handleChange}
                    />
                    Auto Close
                  </label>
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
                    Renewable
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
                  {editing ? 'Save Changes' : 'Create Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
