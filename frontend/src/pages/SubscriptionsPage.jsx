import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HiSearch,
  HiPlus,
  HiEye,
  HiTrash,
  HiX,
  HiArrowRight,
  HiPause,
  HiPlay,
  HiBan,
  HiCheckCircle,
} from 'react-icons/hi';
import styles from './Page.module.css';
import api from '../api';

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'quotation', label: 'Quotation' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
  { value: 'closed', label: 'Closed' },
];

const STATUS_BADGE_CLASS = {
  draft: 'badgeDraft',
  quotation: 'badgeQuotation',
  confirmed: 'badgeConfirmed',
  active: 'badgeActive',
  paused: 'badgePaused',
  closed: 'badgeClosed',
};

const EMPTY_FORM = {
  customer_id: '',
  plan_id: '',
  start_date: '',
  expiration_date: '',
  payment_terms: '',
  notes: '',
};

const EMPTY_LINE = {
  product_id: '',
  quantity: 1,
  unit_price: '',
  tax_id: '',
};

export default function SubscriptionsPage() {
  const navigate = useNavigate();
  const [subscriptions, setSubscriptions] = useState([]);
  const [plans, setPlans] = useState([]);
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [taxes, setTaxes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Create modal state
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');

  // Detail modal state
  const [detail, setDetail] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [lineForm, setLineForm] = useState(EMPTY_LINE);
  const [showLineForm, setShowLineForm] = useState(false);
  const [lineError, setLineError] = useState('');

  const fetchSubscriptions = useCallback(async () => {
    try {
      const res = await api.get('/subscriptions/');
      setSubscriptions(res.data);
    } catch {
      /* ignore */
    }
  }, []);

  const fetchLookups = useCallback(async () => {
    try {
      const [plansRes, usersRes, productsRes, taxesRes] = await Promise.all([
        api.get('/recurring-plans/'),
        api.get('/users/'),
        api.get('/products/'),
        api.get('/taxes/'),
      ]);
      setPlans(plansRes.data);
      setUsers(usersRes.data);
      setProducts(productsRes.data);
      setTaxes(taxesRes.data);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      await Promise.all([fetchSubscriptions(), fetchLookups()]);
      setLoading(false);
    };
    load();
  }, [fetchSubscriptions, fetchLookups]);

  // Helpers to resolve names
  const userName = (id) => {
    const u = users.find((u) => u.id === id);
    return u ? u.full_name : `#${id}`;
  };

  const planName = (id) => {
    const p = plans.find((p) => p.id === id);
    return p ? p.name : `#${id}`;
  };

  const productName = (id) => {
    const p = products.find((p) => p.id === id);
    return p ? p.name : `#${id}`;
  };

  const taxLabel = (id) => {
    if (!id) return '\u2014';
    const t = taxes.find((t) => t.id === id);
    return t ? `${t.name} (${t.rate}%)` : `#${id}`;
  };

  // Filtering
  const filtered = subscriptions.filter((s) => {
    const matchSearch =
      s.subscription_number.toLowerCase().includes(search.toLowerCase()) ||
      userName(s.customer_id).toLowerCase().includes(search.toLowerCase()) ||
      planName(s.plan_id).toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || s.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // Create modal
  const openCreate = () => {
    setForm(EMPTY_FORM);
    setFormError('');
    setShowCreate(true);
  };

  const closeCreate = () => {
    setShowCreate(false);
    setFormError('');
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    const payload = {
      customer_id: parseInt(form.customer_id, 10),
      plan_id: parseInt(form.plan_id, 10),
      start_date: form.start_date,
      expiration_date: form.expiration_date || null,
      payment_terms: form.payment_terms || null,
      notes: form.notes || null,
    };

    try {
      await api.post('/subscriptions/', payload);
      closeCreate();
      fetchSubscriptions();
    } catch (err) {
      setFormError(err.response?.data?.detail || 'An error occurred');
    }
  };

  // Detail modal
  const openDetail = async (sub) => {
    try {
      const res = await api.get(`/subscriptions/${sub.id}`);
      setDetail(res.data);
      setShowLineForm(false);
      setLineForm(EMPTY_LINE);
      setLineError('');
      setShowDetail(true);
    } catch {
      /* ignore */
    }
  };

  const closeDetail = () => {
    setShowDetail(false);
    setDetail(null);
  };

  const refreshDetail = async () => {
    if (!detail) return;
    try {
      const res = await api.get(`/subscriptions/${detail.id}`);
      setDetail(res.data);
      fetchSubscriptions();
    } catch {
      /* ignore */
    }
  };

  // Status transitions
  const handleTransition = async (action) => {
    try {
      await api.post(`/subscriptions/${detail.id}/transition`, { action });
      await refreshDetail();
    } catch (err) {
      alert(err.response?.data?.detail || 'Transition failed');
    }
  };

  // Order lines
  const handleLineChange = (e) => {
    const { name, value } = e.target;
    setLineForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddLine = async (e) => {
    e.preventDefault();
    setLineError('');

    const payload = {
      product_id: parseInt(lineForm.product_id, 10),
      quantity: parseInt(lineForm.quantity, 10),
      unit_price: parseFloat(lineForm.unit_price),
      tax_id: lineForm.tax_id ? parseInt(lineForm.tax_id, 10) : null,
    };

    try {
      await api.post(`/subscriptions/${detail.id}/lines`, payload);
      setLineForm(EMPTY_LINE);
      setShowLineForm(false);
      await refreshDetail();
    } catch (err) {
      setLineError(err.response?.data?.detail || 'Failed to add line');
    }
  };

  const handleDeleteLine = async (lineId) => {
    try {
      await api.delete(`/subscriptions/${detail.id}/lines/${lineId}`);
      await refreshDetail();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete line');
    }
  };

  // Delete subscription
  const handleDeleteSub = async (sub) => {
    if (sub.status !== 'draft') return;
    if (!window.confirm(`Delete subscription "${sub.subscription_number}"?`)) return;
    try {
      await api.delete(`/subscriptions/${sub.id}`);
      fetchSubscriptions();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete subscription');
    }
  };

  // Render transition buttons
  const renderTransitionButtons = () => {
    if (!detail) return null;
    const s = detail.status;
    return (
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {s === 'draft' && (
          <button
            className={styles.btnSecondary}
            onClick={() => handleTransition('to_quotation')}
          >
            <HiArrowRight /> Send as Quotation
          </button>
        )}
        {s === 'quotation' && (
          <button
            className={styles.btnSecondary}
            onClick={() => handleTransition('confirm')}
          >
            <HiCheckCircle /> Confirm
          </button>
        )}
        {s === 'confirmed' && (
          <button
            className={styles.btnSuccess}
            onClick={() => handleTransition('activate')}
          >
            <HiPlay /> Activate
          </button>
        )}
        {s === 'active' && (
          <>
            <button
              className={styles.btnSecondary}
              onClick={() => handleTransition('pause')}
            >
              <HiPause /> Pause
            </button>
            <button
              className={styles.btnDanger}
              onClick={() => handleTransition('close')}
            >
              <HiBan /> Close
            </button>
          </>
        )}
        {s === 'paused' && (
          <button
            className={styles.btnSuccess}
            onClick={() => handleTransition('activate')}
          >
            <HiPlay /> Resume
          </button>
        )}
      </div>
    );
  };

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
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <div className={styles.searchBox}>
            <HiSearch />
            <input
              type="text"
              placeholder="Search subscriptions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className={styles.formControl}
            style={{ width: 180, height: 40 }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <button className={styles.btnPrimary} onClick={() => navigate('/subscriptions/new')}>
          <HiPlus /> New Subscription
        </button>
      </div>

      {/* Table */}
      <div className={styles.card}>
        <div className={styles.tableWrapper}>
          {filtered.length === 0 ? (
            <div className={styles.empty}>
              <p>No subscriptions found.</p>
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Sub Number</th>
                  <th>Customer</th>
                  <th>Plan</th>
                  <th>Status</th>
                  <th>Start Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((sub) => (
                  <tr key={sub.id} onClick={() => navigate(`/subscriptions/${sub.id}`)} style={{ cursor: 'pointer' }}>
                    <td>{sub.subscription_number}</td>
                    <td>{userName(sub.customer_id)}</td>
                    <td>{planName(sub.plan_id)}</td>
                    <td>
                      <span
                        className={`${styles.badge} ${
                          styles[STATUS_BADGE_CLASS[sub.status]] || ''
                        }`}
                      >
                        {sub.status}
                      </span>
                    </td>
                    <td>{sub.start_date}</td>
                    <td>
                      <div className={styles.actions} onClick={(e) => e.stopPropagation()}>
                        <button title="View" onClick={() => navigate(`/subscriptions/${sub.id}`)}>
                          <HiEye />
                        </button>
                        {sub.status === 'draft' && (
                          <button
                            title="Delete"
                            className={styles.actionsDanger}
                            onClick={() => handleDeleteSub(sub)}
                          >
                            <HiTrash />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className={styles.overlay} onClick={closeCreate}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>New Subscription</h2>
              <button className={styles.modalClose} onClick={closeCreate}>
                <HiX />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit}>
              <div className={styles.modalBody}>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Customer</label>
                    <select
                      className={styles.formControl}
                      name="customer_id"
                      value={form.customer_id}
                      onChange={handleFormChange}
                      required
                    >
                      <option value="">Select customer...</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.full_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label>Plan</label>
                    <select
                      className={styles.formControl}
                      name="plan_id"
                      value={form.plan_id}
                      onChange={handleFormChange}
                      required
                    >
                      <option value="">Select plan...</option>
                      {plans.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Start Date</label>
                    <input
                      className={styles.formControl}
                      type="date"
                      name="start_date"
                      value={form.start_date}
                      onChange={handleFormChange}
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Expiration Date</label>
                    <input
                      className={styles.formControl}
                      type="date"
                      name="expiration_date"
                      value={form.expiration_date}
                      onChange={handleFormChange}
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Payment Terms</label>
                  <input
                    className={styles.formControl}
                    name="payment_terms"
                    value={form.payment_terms}
                    onChange={handleFormChange}
                    placeholder="e.g. Net 30"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Notes</label>
                  <textarea
                    className={styles.formControl}
                    name="notes"
                    value={form.notes}
                    onChange={handleFormChange}
                    rows={3}
                    style={{ height: 'auto', padding: '8px 12px' }}
                  />
                </div>

                {formError && <div className={styles.formError}>{formError}</div>}
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={closeCreate}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.btnPrimary}>
                  Create Subscription
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetail && detail && (
        <div className={styles.overlay} onClick={closeDetail}>
          <div
            className={styles.modal}
            style={{ maxWidth: '700px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h2>Subscription {detail.subscription_number}</h2>
              <button className={styles.modalClose} onClick={closeDetail}>
                <HiX />
              </button>
            </div>

            <div className={styles.modalBody}>
              {/* Transition buttons */}
              <div style={{ marginBottom: 16 }}>{renderTransitionButtons()}</div>

              {/* Info grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '8px 24px',
                  fontSize: 14,
                  marginBottom: 20,
                }}
              >
                <div>
                  <strong>Customer:</strong> {userName(detail.customer_id)}
                </div>
                <div>
                  <strong>Plan:</strong> {planName(detail.plan_id)}
                </div>
                <div>
                  <strong>Status:</strong>{' '}
                  <span
                    className={`${styles.badge} ${
                      styles[STATUS_BADGE_CLASS[detail.status]] || ''
                    }`}
                  >
                    {detail.status}
                  </span>
                </div>
                <div>
                  <strong>Start Date:</strong> {detail.start_date}
                </div>
                {detail.expiration_date && (
                  <div>
                    <strong>Expiration:</strong> {detail.expiration_date}
                  </div>
                )}
                {detail.payment_terms && (
                  <div>
                    <strong>Payment Terms:</strong> {detail.payment_terms}
                  </div>
                )}
                {detail.notes && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <strong>Notes:</strong> {detail.notes}
                  </div>
                )}
              </div>

              {/* Order lines table */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 8,
                }}
              >
                <h3 style={{ fontSize: 15, fontWeight: 600 }}>Order Lines</h3>
                <button
                  className={styles.btnSecondary}
                  onClick={() => {
                    setLineForm(EMPTY_LINE);
                    setLineError('');
                    setShowLineForm(true);
                  }}
                >
                  <HiPlus /> Add Line
                </button>
              </div>

              <div className={styles.card} style={{ marginBottom: 16 }}>
                <div className={styles.tableWrapper}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Qty</th>
                        <th>Unit Price</th>
                        <th>Tax</th>
                        <th>Amount</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detail.lines.length === 0 ? (
                        <tr>
                          <td
                            colSpan={6}
                            style={{ textAlign: 'center', color: '#9CA3AF' }}
                          >
                            No order lines yet.
                          </td>
                        </tr>
                      ) : (
                        detail.lines.map((line) => (
                          <tr key={line.id}>
                            <td>{productName(line.product_id)}</td>
                            <td>{line.quantity}</td>
                            <td>${parseFloat(line.unit_price).toFixed(2)}</td>
                            <td>{taxLabel(line.tax_id)}</td>
                            <td>${parseFloat(line.amount).toFixed(2)}</td>
                            <td>
                              <div className={styles.actions}>
                                <button
                                  title="Delete line"
                                  className={styles.actionsDanger}
                                  onClick={() => handleDeleteLine(line.id)}
                                >
                                  <HiTrash />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Inline add line form */}
              {showLineForm && (
                <form
                  onSubmit={handleAddLine}
                  style={{
                    background: '#F9FAFB',
                    borderRadius: 8,
                    padding: 16,
                    marginBottom: 8,
                  }}
                >
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label>Product</label>
                      <select
                        className={styles.formControl}
                        name="product_id"
                        value={lineForm.product_id}
                        onChange={handleLineChange}
                        required
                      >
                        <option value="">Select product...</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className={styles.formGroup}>
                      <label>Quantity</label>
                      <input
                        className={styles.formControl}
                        type="number"
                        name="quantity"
                        value={lineForm.quantity}
                        onChange={handleLineChange}
                        min="1"
                        required
                      />
                    </div>
                  </div>
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label>Unit Price</label>
                      <input
                        className={styles.formControl}
                        type="number"
                        step="0.01"
                        name="unit_price"
                        value={lineForm.unit_price}
                        onChange={handleLineChange}
                        required
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Tax</label>
                      <select
                        className={styles.formControl}
                        name="tax_id"
                        value={lineForm.tax_id}
                        onChange={handleLineChange}
                      >
                        <option value="">No tax</option>
                        {taxes.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name} ({t.rate}%)
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  {lineError && <div className={styles.formError}>{lineError}</div>}
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
                    <button
                      type="button"
                      className={styles.btnSecondary}
                      onClick={() => setShowLineForm(false)}
                    >
                      Cancel
                    </button>
                    <button type="submit" className={styles.btnPrimary}>
                      Add Line
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
