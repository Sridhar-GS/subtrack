import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  HiArrowLeft,
  HiArrowRight,
  HiCheckCircle,
  HiPlay,
  HiPause,
  HiBan,
  HiPlus,
  HiTrash,
  HiDocumentText,
  HiSave,
  HiPrinter,
} from 'react-icons/hi';
import api from '../api';
import styles from './Page.module.css';

const STATUS_BADGE = {
  draft: 'badgeDraft',
  quotation: 'badgeQuotation',
  confirmed: 'badgeConfirmed',
  active: 'badgeActive',
  paused: 'badgePaused',
  closed: 'badgeClosed',
  cancelled: 'badgeCancelled',
};

const EMPTY_LINE = { product_id: '', quantity: 1, unit_price: '', tax_id: '', discount: 0 };

export default function SubscriptionFormPage() {
  const { subId } = useParams();
  const navigate = useNavigate();
  const isNew = !subId || subId === 'new';

  const [form, setForm] = useState({
    customer_id: '',
    plan_id: '',
    template_id: '',
    start_date: new Date().toISOString().split('T')[0],
    expiration_date: '',
    payment_terms: '',
    quotation_date: new Date().toISOString().split('T')[0],
    notes: '',
  });
  const [status, setStatus] = useState('draft');
  const [subNumber, setSubNumber] = useState('New');
  const [lines, setLines] = useState([{ ...EMPTY_LINE }]);
  const [existingLines, setExistingLines] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [users, setUsers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [products, setProducts] = useState([]);
  const [taxes, setTaxes] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLookups = useCallback(async () => {
    try {
      const [u, p, pr, t, tp] = await Promise.all([
        api.get('/users/'),
        api.get('/recurring-plans/'),
        api.get('/products/'),
        api.get('/taxes/'),
        api.get('/quotation-templates/'),
      ]);
      setUsers(u.data);
      setPlans(p.data);
      setProducts(pr.data);
      setTaxes(t.data);
      setTemplates(tp.data);
    } catch { /* ignore */ }
  }, []);

  const fetchSub = useCallback(async () => {
    if (isNew) return;
    try {
      const res = await api.get(`/subscriptions/${subId}`);
      const s = res.data;
      setForm({
        customer_id: s.customer_id || '',
        plan_id: s.plan_id || '',
        template_id: s.template_id || '',
        start_date: s.start_date || '',
        expiration_date: s.expiration_date || '',
        payment_terms: s.payment_terms || '',
        quotation_date: s.quotation_date || '',
        notes: s.notes || '',
      });
      setStatus(s.status);
      setSubNumber(s.subscription_number);
      setExistingLines(s.lines || []);
      setLines([]);
    } catch {
      navigate('/subscriptions');
    }
  }, [subId, isNew, navigate]);

  useEffect(() => {
    const load = async () => {
      await fetchLookups();
      await fetchSub();
      setLoading(false);
    };
    load();
  }, [fetchLookups, fetchSub]);

  const handleFormChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (field === 'template_id' && value) {
      const tpl = templates.find((t) => t.id === Number(value));
      if (tpl?.recurring_plan_id) {
        setForm((prev) => ({ ...prev, template_id: value, plan_id: String(tpl.recurring_plan_id) }));
      }
    }
  };

  const handleLineChange = (idx, field, value) => {
    setLines((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: value };
      return updated;
    });
  };

  const addLine = () => setLines((prev) => [...prev, { ...EMPTY_LINE }]);

  const removeLine = (idx) => setLines((prev) => prev.filter((_, i) => i !== idx));

  const deleteExistingLine = async (lineId) => {
    try {
      await api.delete(`/subscriptions/${subId}/lines/${lineId}`);
      setExistingLines((prev) => prev.filter((l) => l.id !== lineId));
    } catch { /* ignore */ }
  };

  const calcLineAmount = (line) => {
    const qty = Number(line.quantity) || 0;
    const price = Number(line.unit_price) || 0;
    const disc = Number(line.discount) || 0;
    return qty * price * (1 - disc / 100);
  };

  const allLines = [...existingLines, ...lines.filter((l) => l.product_id)];
  const untaxed = allLines.reduce((sum, l) => {
    if (l.amount !== undefined) return sum + Number(l.amount);
    return sum + calcLineAmount(l);
  }, 0);

  const taxTotal = allLines.reduce((sum, l) => {
    const amt = l.amount !== undefined ? Number(l.amount) : calcLineAmount(l);
    const taxId = l.tax_id;
    if (!taxId) return sum;
    const tax = taxes.find((t) => t.id === Number(taxId));
    return sum + (tax ? amt * tax.rate / 100 : 0);
  }, 0);

  const total = untaxed + taxTotal;

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const payload = {
        customer_id: Number(form.customer_id),
        plan_id: Number(form.plan_id),
        start_date: form.start_date,
        expiration_date: form.expiration_date || null,
        payment_terms: form.payment_terms || null,
        notes: form.notes || null,
      };

      let id = subId;
      if (isNew) {
        const res = await api.post('/subscriptions/', payload);
        id = res.data.id;
      } else {
        await api.put(`/subscriptions/${subId}`, payload);
      }

      // Add new lines
      for (const line of lines) {
        if (!line.product_id) continue;
        await api.post(`/subscriptions/${id}/lines`, {
          product_id: Number(line.product_id),
          quantity: Number(line.quantity) || 1,
          unit_price: Number(line.unit_price) || 0,
          tax_id: line.tax_id ? Number(line.tax_id) : null,
        });
      }

      navigate(`/subscriptions/${id}`);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save');
    }
    setSaving(false);
  };

  const handleTransition = async (action) => {
    try {
      await api.post(`/subscriptions/${subId}/transition`, { action });
      await fetchSub();
    } catch (err) {
      alert(err.response?.data?.detail || 'Transition failed');
    }
  };

  const handleCreateInvoice = async () => {
    try {
      await api.post(`/invoices/generate/${subId}`);
      alert('Invoice created successfully');
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to create invoice');
    }
  };

  const productName = (id) => {
    const p = products.find((p) => p.id === id);
    return p ? p.name : `#${id}`;
  };

  const taxLabel = (id) => {
    if (!id) return '-';
    const t = taxes.find((t) => t.id === id);
    return t ? `${t.name} (${t.rate}%)` : '-';
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}><div className={styles.spinner} /></div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* Top bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className={styles.btnSecondary} onClick={() => navigate('/subscriptions')}>
            <HiArrowLeft /> Back
          </button>
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{subNumber}</h2>
          {!isNew && (
            <span className={`${styles.badge} ${styles[STATUS_BADGE[status]] || ''}`}>
              {status}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {!isNew && status === 'draft' && (
            <button className={styles.btnSecondary} onClick={() => handleTransition('to_quotation')}>
              <HiArrowRight /> Send
            </button>
          )}
          {!isNew && status === 'quotation' && (
            <button className={styles.btnSecondary} onClick={() => handleTransition('confirm')}>
              <HiCheckCircle /> Confirm
            </button>
          )}
          {!isNew && status === 'confirmed' && (
            <button className={styles.btnSuccess} onClick={() => handleTransition('activate')}>
              <HiPlay /> Activate
            </button>
          )}
          {!isNew && status === 'active' && (
            <>
              <button className={styles.btnPrimary} onClick={handleCreateInvoice}>
                <HiDocumentText /> Create Invoice
              </button>
              <button className={styles.btnSecondary} onClick={() => handleTransition('pause')}>
                <HiPause /> Pause
              </button>
              <button className={styles.btnDanger} onClick={() => handleTransition('close')}>
                <HiBan /> Close
              </button>
            </>
          )}
          {!isNew && status === 'paused' && (
            <button className={styles.btnSuccess} onClick={() => handleTransition('activate')}>
              <HiPlay /> Resume
            </button>
          )}
          {!isNew && ['draft', 'quotation', 'confirmed'].includes(status) && (
            <button className={styles.btnDanger} onClick={() => handleTransition('cancel')}>
              <HiBan /> Cancel
            </button>
          )}
          {!isNew && (
            <button className={styles.btnSecondary} onClick={() => window.print()}>
              <HiPrinter /> Print
            </button>
          )}
        </div>
      </div>

      {/* Form */}
      <div className={styles.card} style={{ padding: 24, marginBottom: 20 }}>
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label>Customer</label>
            <select className={styles.formControl} value={form.customer_id} onChange={(e) => handleFormChange('customer_id', e.target.value)} required>
              <option value="">Select customer...</option>
              {users.map((u) => <option key={u.id} value={u.id}>{u.full_name}</option>)}
            </select>
          </div>
          <div className={styles.formGroup}>
            <label>Quotation Template</label>
            <select className={styles.formControl} value={form.template_id} onChange={(e) => handleFormChange('template_id', e.target.value)}>
              <option value="">None</option>
              {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
        </div>
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label>Recurring Plan</label>
            <select className={styles.formControl} value={form.plan_id} onChange={(e) => handleFormChange('plan_id', e.target.value)} required>
              <option value="">Select plan...</option>
              {plans.map((p) => <option key={p.id} value={p.id}>{p.name} - ${Number(p.price).toFixed(2)}/{p.billing_period}</option>)}
            </select>
          </div>
          <div className={styles.formGroup}>
            <label>Payment Terms</label>
            <input className={styles.formControl} value={form.payment_terms} onChange={(e) => handleFormChange('payment_terms', e.target.value)} placeholder="e.g. Net 30" />
          </div>
        </div>
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label>Start Date</label>
            <input type="date" className={styles.formControl} value={form.start_date} onChange={(e) => handleFormChange('start_date', e.target.value)} required />
          </div>
          <div className={styles.formGroup}>
            <label>Expiration Date</label>
            <input type="date" className={styles.formControl} value={form.expiration_date} onChange={(e) => handleFormChange('expiration_date', e.target.value)} />
          </div>
        </div>
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label>Quotation Date</label>
            <input type="date" className={styles.formControl} value={form.quotation_date} onChange={(e) => handleFormChange('quotation_date', e.target.value)} />
          </div>
          <div className={styles.formGroup}>
            <label>Notes</label>
            <input className={styles.formControl} value={form.notes} onChange={(e) => handleFormChange('notes', e.target.value)} placeholder="Optional notes" />
          </div>
        </div>
      </div>

      {/* Order Lines */}
      <div className={styles.card} style={{ padding: 24, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Order Lines</h3>
          <button className={styles.btnSecondary} onClick={addLine}><HiPlus /> Add Line</button>
        </div>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Product</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th>Tax</th>
                <th>Disc %</th>
                <th>Amount</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {existingLines.map((line) => (
                <tr key={`e-${line.id}`}>
                  <td>{productName(line.product_id)}</td>
                  <td>{line.quantity}</td>
                  <td>${Number(line.unit_price).toFixed(2)}</td>
                  <td>{taxLabel(line.tax_id)}</td>
                  <td>{line.discount || 0}%</td>
                  <td>${Number(line.amount).toFixed(2)}</td>
                  <td>
                    <div className={styles.actions}>
                      <button className={styles.actionsDanger} title="Delete" onClick={() => deleteExistingLine(line.id)}>
                        <HiTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {lines.map((line, idx) => (
                <tr key={`n-${idx}`}>
                  <td>
                    <select className={styles.formControl} style={{ minWidth: 150 }} value={line.product_id} onChange={(e) => {
                      handleLineChange(idx, 'product_id', e.target.value);
                      const prod = products.find((p) => p.id === Number(e.target.value));
                      if (prod) handleLineChange(idx, 'unit_price', prod.price);
                    }}>
                      <option value="">Select...</option>
                      {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </td>
                  <td><input type="number" className={styles.formControl} style={{ width: 70 }} min="1" value={line.quantity} onChange={(e) => handleLineChange(idx, 'quantity', e.target.value)} /></td>
                  <td><input type="number" className={styles.formControl} style={{ width: 100 }} step="0.01" value={line.unit_price} onChange={(e) => handleLineChange(idx, 'unit_price', e.target.value)} /></td>
                  <td>
                    <select className={styles.formControl} style={{ minWidth: 120 }} value={line.tax_id} onChange={(e) => handleLineChange(idx, 'tax_id', e.target.value)}>
                      <option value="">None</option>
                      {taxes.map((t) => <option key={t.id} value={t.id}>{t.name} ({t.rate}%)</option>)}
                    </select>
                  </td>
                  <td><input type="number" className={styles.formControl} style={{ width: 70 }} min="0" max="100" value={line.discount} onChange={(e) => handleLineChange(idx, 'discount', e.target.value)} /></td>
                  <td>${calcLineAmount(line).toFixed(2)}</td>
                  <td>
                    <div className={styles.actions}>
                      <button className={styles.actionsDanger} title="Remove" onClick={() => removeLine(idx)}>
                        <HiTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {existingLines.length === 0 && lines.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: 'center', color: '#9CA3AF' }}>No lines. Click "Add Line" to add products.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
          <div style={{ width: 260 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 14, color: '#6B7280' }}>
              <span>Untaxed Amount</span><span>${untaxed.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 14, color: '#6B7280' }}>
              <span>Tax</span><span>${taxTotal.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: 16, fontWeight: 700, borderTop: '2px solid #E5E7EB', marginTop: 4 }}>
              <span>Total</span><span>${total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Save */}
      {error && <div className={styles.formError} style={{ marginBottom: 16 }}>{error}</div>}
      <div style={{ display: 'flex', gap: 12 }}>
        <button className={styles.btnPrimary} onClick={handleSave} disabled={saving}>
          <HiSave /> {saving ? 'Saving...' : isNew ? 'Create Subscription' : 'Save Changes'}
        </button>
        <button className={styles.btnSecondary} onClick={() => navigate('/subscriptions')}>
          Cancel
        </button>
      </div>
    </div>
  );
}
