import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  HiArrowRight, HiCheckCircle, HiPlay, HiPause, HiBan, HiPlus,
  HiTrash, HiDocumentText, HiSave, HiOutlinePrinter, HiRefresh,
  HiTrendingUp, HiClock, HiEye,
} from 'react-icons/hi';
import api from '../api';
import styles from './Page.module.css';

const STATUS_BADGE = {
  draft: 'badgeDraft', quotation: 'badgeQuotation', quotation_sent: 'badgeQuotation',
  confirmed: 'badgeConfirmed', active: 'badgeActive', paused: 'badgePaused',
  closed: 'badgeClosed', cancelled: 'badgeCancelled',
};

const STATUS_STEPS = ['draft', 'quotation', 'confirmed'];

const EMPTY_LINE = { product_id: '', quantity: 1, unit_price: '', tax_id: '', discount: 0 };

export default function SubscriptionFormPage() {
  const { subId } = useParams();
  const navigate = useNavigate();
  const isNew = !subId || subId === 'new';

  const [form, setForm] = useState({
    customer_id: '', plan_id: '', template_id: '', salesperson_id: '',
    start_date: new Date().toISOString().split('T')[0], expiration_date: '',
    payment_terms: '', quotation_date: new Date().toISOString().split('T')[0],
    payment_method: '', payment_done: false, notes: '',
  });
  const [status, setStatus] = useState('draft');
  const [subNumber, setSubNumber] = useState('New');
  const [lines, setLines] = useState([{ ...EMPTY_LINE }]);
  const [existingLines, setExistingLines] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [activeTab, setActiveTab] = useState('order_lines');
  const [nextInvoice, setNextInvoice] = useState(null);

  const [users, setUsers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [products, setProducts] = useState([]);
  const [taxes, setTaxes] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  const linesLocked = !isNew && !['draft', 'quotation'].includes(status);

  const fetchLookups = useCallback(async () => {
    try {
      const [u, p, pr, t, tp] = await Promise.all([
        api.get('/users/'), api.get('/recurring-plans/'), api.get('/products/'),
        api.get('/taxes/'), api.get('/quotation-templates/'),
      ]);
      setUsers(u.data); setPlans(p.data); setProducts(pr.data); setTaxes(t.data); setTemplates(tp.data);
    } catch { /* ignore */ }
  }, []);

  const fetchSub = useCallback(async () => {
    if (isNew) return;
    try {
      const res = await api.get(`/subscriptions/${subId}`);
      const s = res.data;
      setForm({
        customer_id: s.customer_id || '', plan_id: s.plan_id || '',
        template_id: s.template_id || '', salesperson_id: s.salesperson_id || '',
        start_date: s.start_date || '', expiration_date: s.expiration_date || '',
        payment_terms: s.payment_terms || '', quotation_date: s.quotation_date || '',
        payment_method: s.payment_method || '', payment_done: s.payment_done || false,
        notes: s.notes || '',
      });
      setStatus(s.status); setSubNumber(s.subscription_number);
      setExistingLines(s.lines || []); setLines([]);
      setNextInvoice(s.next_invoice_date || null);
    } catch { navigate('/subscriptions'); }
  }, [subId, isNew, navigate]);

  useEffect(() => {
    const load = async () => { await fetchLookups(); await fetchSub(); setLoading(false); };
    load();
  }, [fetchLookups, fetchSub]);

  const handleFormChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (field === 'template_id' && value) {
      const tpl = templates.find((t) => t.id === Number(value));
      if (tpl?.recurring_plan_id) setForm((prev) => ({ ...prev, template_id: value, plan_id: String(tpl.recurring_plan_id) }));
    }
  };

  const handleLineChange = (idx, field, value) => {
    setLines((prev) => { const u = [...prev]; u[idx] = { ...u[idx], [field]: value }; return u; });
  };

  const addLine = () => setLines((prev) => [...prev, { ...EMPTY_LINE }]);
  const removeLine = (idx) => setLines((prev) => prev.filter((_, i) => i !== idx));
  const deleteExistingLine = async (lineId) => {
    try { await api.delete(`/subscriptions/${subId}/lines/${lineId}`); setExistingLines((prev) => prev.filter((l) => l.id !== lineId)); } catch { /* ignore */ }
  };

  const calcLineAmount = (line) => {
    const qty = Number(line.quantity) || 0;
    const price = Number(line.unit_price) || 0;
    const disc = Number(line.discount) || 0;
    return qty * price * (1 - disc / 100);
  };

  const allLines = [...existingLines, ...lines.filter((l) => l.product_id)];
  const untaxed = allLines.reduce((sum, l) => l.amount !== undefined ? sum + Number(l.amount) : sum + calcLineAmount(l), 0);
  const taxTotal = allLines.reduce((sum, l) => {
    const amt = l.amount !== undefined ? Number(l.amount) : calcLineAmount(l);
    if (!l.tax_id) return sum;
    const tax = taxes.find((t) => t.id === Number(l.tax_id));
    return sum + (tax ? amt * tax.rate / 100 : 0);
  }, 0);
  const total = untaxed + taxTotal;

  const handleSave = async () => {
    setSaving(true); setError('');
    try {
      const payload = {
        customer_id: Number(form.customer_id), plan_id: Number(form.plan_id),
        salesperson_id: form.salesperson_id ? Number(form.salesperson_id) : null,
        start_date: form.start_date, expiration_date: form.expiration_date || null,
        payment_terms: form.payment_terms || null, notes: form.notes || null,
      };
      let id = subId;
      if (isNew) { const res = await api.post('/subscriptions/', payload); id = res.data.id; }
      else await api.put(`/subscriptions/${subId}`, payload);
      for (const line of lines) {
        if (!line.product_id) continue;
        await api.post(`/subscriptions/${id}/lines`, {
          product_id: Number(line.product_id), quantity: Number(line.quantity) || 1,
          unit_price: Number(line.unit_price) || 0, tax_id: line.tax_id ? Number(line.tax_id) : null,
        });
      }
      navigate(`/subscriptions/${id}`);
    } catch (err) { setError(err.response?.data?.detail || 'Failed to save'); }
    setSaving(false);
  };

  const handleTransition = async (action) => {
    try { await api.post(`/subscriptions/${subId}/transition`, { action }); await fetchSub(); }
    catch (err) { alert(err.response?.data?.detail || 'Transition failed'); }
  };

  const handleCreateInvoice = async () => {
    try { const res = await api.post(`/invoices/generate/${subId}`); navigate(`/invoices/${res.data.id}`); }
    catch (err) { alert(err.response?.data?.detail || 'Failed to create invoice'); }
  };

  const handleRenew = async () => {
    try { const res = await api.post(`/subscriptions/${subId}/renew`); navigate(`/subscriptions/${res.data.id}`); }
    catch (err) { alert(err.response?.data?.detail || 'Failed to renew'); }
  };

  const handleUpsell = async () => {
    try { const res = await api.post(`/subscriptions/${subId}/upsell`); navigate(`/subscriptions/${res.data.id}`); }
    catch (err) { alert(err.response?.data?.detail || 'Failed to create upsell'); }
  };

  const fetchHistory = async () => {
    try { const res = await api.get(`/subscriptions/${subId}/history`); setHistory(res.data); setShowHistory(true); }
    catch { /* ignore */ }
  };

  const productName = (id) => { const p = products.find((p) => p.id === id); return p ? p.name : `#${id}`; };
  const taxLabel = (id) => { if (!id) return '-'; const t = taxes.find((t) => t.id === id); return t ? `${t.name} (${t.rate}%)` : '-'; };
  const internalUsers = users.filter((u) => u.role === 'admin' || u.role === 'internal');

  if (loading) return <div className={styles.page}><div className={styles.loading}><div className={styles.spinner} /></div></div>;

  const currentStepIdx = STATUS_STEPS.indexOf(status);

  return (
    <div className={styles.page}>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className={styles.btnPrimary} onClick={() => navigate('/subscriptions/new')}><HiPlus /> New</button>
          <button className={styles.btnSecondary} title="Delete" onClick={async () => {
            if (!subId || isNew) return;
            if (!window.confirm('Delete this subscription?')) return;
            try { await api.delete(`/subscriptions/${subId}`); navigate('/subscriptions'); }
            catch (err) { alert(err.response?.data?.detail || 'Failed to delete'); }
          }}><HiTrash /></button>
          <button className={styles.btnSecondary} onClick={() => window.print()} title="Print"><HiOutlinePrinter /></button>
          {!isNew && status === 'draft' && (
            <button className={styles.btnSecondary} onClick={() => handleTransition('to_quotation')}><HiArrowRight /> Send</button>
          )}
          {!isNew && status === 'quotation' && (
            <button className={styles.btnPrimary} onClick={() => handleTransition('confirm')}><HiCheckCircle /> Confirm</button>
          )}
          {!isNew && ['confirmed', 'active'].includes(status) && (
            <>
              <button className={styles.btnPrimary} onClick={handleCreateInvoice}><HiDocumentText /> Create Invoice</button>
              <button className={styles.btnDanger} onClick={() => handleTransition('cancel')}><HiBan /> Cancel</button>
              <button className={styles.btnSecondary} onClick={handleRenew}><HiRefresh /> Renew</button>
              <button className={styles.btnSecondary} onClick={handleUpsell}><HiTrendingUp /> Upsell</button>
              <button className={styles.btnDanger} onClick={() => handleTransition('close')}>Close</button>
            </>
          )}
          {!isNew && status === 'active' && (
            <button className={styles.btnSecondary} onClick={() => handleTransition('pause')}><HiPause /> Pause</button>
          )}
          {!isNew && status === 'paused' && (
            <button className={styles.btnSuccess} onClick={() => handleTransition('activate')}><HiPlay /> Resume</button>
          )}
          {!isNew && status === 'closed' && (
            <button className={styles.btnPrimary} onClick={handleRenew}><HiRefresh /> Renew</button>
          )}
          {!isNew && (
            <>
              <button className={styles.btnSecondary} onClick={() => window.open(`/my-orders/${subId}`, '_blank')}><HiEye /> Preview</button>
              <button className={styles.btnSecondary} onClick={fetchHistory}><HiClock /> History ({history.length || '...'})</button>
            </>
          )}
        </div>
      </div>

      {/* State stepper */}
      {!isNew && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 20 }}>
          {STATUS_STEPS.map((step, i) => {
            const isActive = step === status;
            const isPast = currentStepIdx >= 0 && i < currentStepIdx;
            const isAfterConfirmed = !STATUS_STEPS.includes(status) && ['active', 'paused', 'closed', 'cancelled'].includes(status);
            const allDone = isAfterConfirmed || (isPast || isActive);
            return (
              <div key={step} style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{
                  padding: '6px 16px', fontSize: 13, fontWeight: isActive ? 700 : 500,
                  background: isActive ? '#714B67' : allDone ? '#D1FAE5' : '#F3F4F6',
                  color: isActive ? '#fff' : allDone ? '#059669' : '#9CA3AF',
                  borderRadius: 4, border: isActive ? 'none' : '1px dashed ' + (allDone ? '#A7F3D0' : '#D1D5DB'),
                  textTransform: 'capitalize',
                }}>{step === 'quotation' ? 'Quotation Sent' : step}</div>
                {i < STATUS_STEPS.length - 1 && (
                  <div style={{ width: 32, height: 2, background: isPast || isAfterConfirmed ? '#A7F3D0' : '#D1D5DB' }} />
                )}
              </div>
            );
          })}
          {!STATUS_STEPS.includes(status) && (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ width: 32, height: 2, background: '#A7F3D0' }} />
              <span className={`${styles.badge} ${styles[STATUS_BADGE[status]] || ''}`} style={{ textTransform: 'capitalize' }}>{status}</span>
            </div>
          )}
        </div>
      )}

      {/* Subscription number + Status banner */}
      <div className={styles.card} style={{ padding: 24, marginBottom: 20 }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#1F2937', marginBottom: 16 }}>
          {subNumber}
        </div>

        {/* Two-column form: Left form fields, Right dates/plan */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <div>
            <div className={styles.formGroup}>
              <label>Customer</label>
              <select className={styles.formControl} value={form.customer_id} onChange={(e) => handleFormChange('customer_id', e.target.value)} required disabled={linesLocked}>
                <option value="">Select customer...</option>
                {users.map((u) => <option key={u.id} value={u.id}>{u.full_name || u.email}</option>)}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>Quotation Template</label>
              <select className={styles.formControl} value={form.template_id} onChange={(e) => handleFormChange('template_id', e.target.value)} disabled={linesLocked}>
                <option value="">None</option>
                {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <div className={styles.formGroup}>
              <label>Expiration</label>
              <input type="date" className={styles.formControl} value={form.expiration_date} onChange={(e) => handleFormChange('expiration_date', e.target.value)} />
            </div>
            <div className={styles.formGroup}>
              <label>Recurring Plan</label>
              <select className={styles.formControl} value={form.plan_id} onChange={(e) => handleFormChange('plan_id', e.target.value)} required disabled={linesLocked}>
                <option value="">Select plan...</option>
                {plans.map((p) => <option key={p.id} value={p.id}>{p.name} - ₹{Number(p.price).toFixed(0)}/{p.billing_period}</option>)}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>Payment Term</label>
              <input className={styles.formControl} value={form.payment_terms} onChange={(e) => handleFormChange('payment_terms', e.target.value)} placeholder="e.g. Immediate Payment" />
            </div>
            {!isNew && nextInvoice && (
              <div className={styles.formGroup}>
                <label>Next Invoice</label>
                <input className={styles.formControl} value={nextInvoice} disabled />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* History panel */}
      {showHistory && history.length > 0 && (
        <div className={styles.card} style={{ padding: 16, marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>Subscription History</h3>
            <button className={styles.btnSecondary} onClick={() => setShowHistory(false)} style={{ fontSize: 12, padding: '4px 8px' }}>Close</button>
          </div>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead><tr><th>Number</th><th>Status</th><th>Start Date</th><th>Type</th></tr></thead>
              <tbody>
                {history.map((h) => (
                  <tr key={h.id} onClick={() => navigate(`/subscriptions/${h.id}`)} style={{ cursor: 'pointer', background: h.id === Number(subId) ? '#F3F0F2' : undefined }}>
                    <td style={{ fontWeight: h.id === Number(subId) ? 700 : 400 }}>{h.subscription_number}</td>
                    <td><span className={`${styles.badge} ${styles[STATUS_BADGE[h.status]] || ''}`}>{h.status}</span></td>
                    <td>{h.start_date}</td>
                    <td>{h.notes?.startsWith('Renewal') ? 'Renewal' : h.notes?.startsWith('Upsell') ? 'Upsell' : 'Original'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tabs: Order Lines | Other info */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 0 }}>
        <button
          onClick={() => setActiveTab('order_lines')}
          style={{
            padding: '10px 24px', fontSize: 14, fontWeight: activeTab === 'order_lines' ? 600 : 400,
            background: activeTab === 'order_lines' ? '#fff' : '#F3F4F6',
            border: '1px solid #E5E7EB', borderBottom: activeTab === 'order_lines' ? '2px solid #714B67' : '1px solid #E5E7EB',
            borderRadius: '8px 8px 0 0', cursor: 'pointer', color: activeTab === 'order_lines' ? '#714B67' : '#6B7280',
          }}>Order Lines</button>
        <button
          onClick={() => setActiveTab('other_info')}
          style={{
            padding: '10px 24px', fontSize: 14, fontWeight: activeTab === 'other_info' ? 600 : 400,
            background: activeTab === 'other_info' ? '#fff' : '#F3F4F6',
            border: '1px solid #E5E7EB', borderBottom: activeTab === 'other_info' ? '2px solid #714B67' : '1px solid #E5E7EB',
            borderRadius: '8px 8px 0 0', cursor: 'pointer', color: activeTab === 'other_info' ? '#714B67' : '#6B7280',
          }}>Other Info</button>
      </div>

      <div className={styles.card} style={{ padding: 24, borderTopLeftRadius: 0, marginBottom: 20 }}>
        {activeTab === 'order_lines' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Order Lines</h3>
              {!linesLocked && <button className={styles.btnSecondary} onClick={addLine}><HiPlus /> Add Line</button>}
            </div>
            {linesLocked && (
              <div style={{ background: '#FEF3C7', color: '#92400E', padding: '8px 12px', borderRadius: 6, fontSize: 13, marginBottom: 12 }}>
                Order lines are locked after confirmation.
              </div>
            )}
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead><tr><th>Product</th><th>Quantity</th><th>Unit Price</th><th>Discount %</th><th>Taxes</th><th>Amount</th>{!linesLocked && <th></th>}</tr></thead>
                <tbody>
                  {existingLines.map((line) => (
                    <tr key={`e-${line.id}`}>
                      <td style={{ fontWeight: 500 }}>{productName(line.product_id)}</td>
                      <td>{line.quantity}</td>
                      <td>₹{Number(line.unit_price).toFixed(2)}</td>
                      <td>{line.discount || 0}%</td>
                      <td>{taxLabel(line.tax_id)}</td>
                      <td style={{ fontWeight: 600 }}>₹{Number(line.amount).toFixed(2)}</td>
                      {!linesLocked && <td><button className={styles.actionsDanger} onClick={() => deleteExistingLine(line.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626' }}><HiTrash /></button></td>}
                    </tr>
                  ))}
                  {!linesLocked && lines.map((line, idx) => (
                    <tr key={`n-${idx}`}>
                      <td>
                        <select className={styles.formControl} style={{ minWidth: 150 }} value={line.product_id} onChange={(e) => {
                          handleLineChange(idx, 'product_id', e.target.value);
                          const prod = products.find((p) => p.id === Number(e.target.value));
                          if (prod) handleLineChange(idx, 'unit_price', prod.price);
                        }}><option value="">Select...</option>{products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
                      </td>
                      <td><input type="number" className={styles.formControl} style={{ width: 70 }} min="1" value={line.quantity} onChange={(e) => handleLineChange(idx, 'quantity', e.target.value)} /></td>
                      <td><input type="number" className={styles.formControl} style={{ width: 100 }} step="0.01" value={line.unit_price} onChange={(e) => handleLineChange(idx, 'unit_price', e.target.value)} /></td>
                      <td><input type="number" className={styles.formControl} style={{ width: 70 }} min="0" max="100" value={line.discount} onChange={(e) => handleLineChange(idx, 'discount', e.target.value)} /></td>
                      <td>
                        <select className={styles.formControl} style={{ minWidth: 120 }} value={line.tax_id} onChange={(e) => handleLineChange(idx, 'tax_id', e.target.value)}>
                          <option value="">None</option>{taxes.map((t) => <option key={t.id} value={t.id}>{t.name} ({t.rate}%)</option>)}
                        </select>
                      </td>
                      <td style={{ fontWeight: 600 }}>₹{calcLineAmount(line).toFixed(2)}</td>
                      <td><button onClick={() => removeLine(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626' }}><HiTrash /></button></td>
                    </tr>
                  ))}
                  {existingLines.length === 0 && lines.length === 0 && (
                    <tr><td colSpan={linesLocked ? 6 : 7} style={{ textAlign: 'center', color: '#9CA3AF' }}>No lines yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            {/* Totals */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
              <div style={{ width: 260 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 14, color: '#6B7280' }}><span>Untaxed Amount</span><span>₹{untaxed.toFixed(2)}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 14, color: '#6B7280' }}><span>Tax</span><span>₹{taxTotal.toFixed(2)}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: 16, fontWeight: 700, borderTop: '2px solid #E5E7EB', marginTop: 4 }}><span>Total</span><span>₹{total.toFixed(2)}</span></div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'other_info' && (
          <div style={{ maxWidth: 600 }}>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Salesperson</label>
                <select className={styles.formControl} value={form.salesperson_id} onChange={(e) => handleFormChange('salesperson_id', e.target.value)}>
                  <option value="">None (default: logged-in user)</option>
                  {internalUsers.map((u) => <option key={u.id} value={u.id}>{u.full_name || u.email}</option>)}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Start Date</label>
                <input type="date" className={styles.formControl} value={form.start_date} onChange={(e) => handleFormChange('start_date', e.target.value)} required />
              </div>
            </div>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Payment Method</label>
                <select className={styles.formControl} value={form.payment_method} onChange={(e) => handleFormChange('payment_method', e.target.value)}>
                  <option value="">Select...</option>
                  <option value="credit_card">Credit Card</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cash">Cash</option>
                  <option value="check">Check</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Quotation Date</label>
                <input type="date" className={styles.formControl} value={form.quotation_date} onChange={(e) => handleFormChange('quotation_date', e.target.value)} />
              </div>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.checkbox}>
                <input type="checkbox" checked={form.payment_done} onChange={(e) => handleFormChange('payment_done', e.target.checked)} />
                Payment Done
              </label>
            </div>
            <div className={styles.formGroup}>
              <label>Notes</label>
              <textarea className={styles.formControl} style={{ height: 80, padding: '8px 12px' }} value={form.notes} onChange={(e) => handleFormChange('notes', e.target.value)} placeholder="Optional notes" />
            </div>
          </div>
        )}
      </div>

      {/* Save */}
      {error && <div className={styles.formError} style={{ marginBottom: 16 }}>{error}</div>}
      <div style={{ display: 'flex', gap: 12 }}>
        <button className={styles.btnPrimary} onClick={handleSave} disabled={saving}>
          <HiSave /> {saving ? 'Saving...' : isNew ? 'Create Subscription' : 'Save Changes'}
        </button>
        <button className={styles.btnSecondary} onClick={() => navigate('/subscriptions')}>Discard</button>
      </div>
    </div>
  );
}
