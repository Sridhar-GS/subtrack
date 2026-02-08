import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  HiOutlineSearch,
  HiOutlinePlus,
  HiOutlineX,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlinePaperAirplane,
  HiOutlinePrinter,
  HiOutlineCash,
  HiOutlineEye,
  HiTrash,
  HiOutlineLink,
} from 'react-icons/hi';
import api from '../api';
import styles from './Page.module.css';

const STATUS_BADGE = {
  draft: 'badgeDraft',
  confirmed: 'badgeConfirmed',
  paid: 'badgePaid',
  cancelled: 'badgeCancelled',
};

const STATUS_STEPS = ['draft', 'confirmed'];

/* ==========================================================================
   LIST VIEW
   ========================================================================== */

function InvoiceListView() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState([]);
  const [error, setError] = useState('');

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/invoices/');
      setInvoices(res.data);
    } catch {
      setError('Failed to load invoices');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const filtered = invoices.filter((inv) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (inv.invoice_number || '').toLowerCase().includes(q) ||
      String(inv.customer_id).includes(q)
    );
  });

  const toggleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selected.length === filtered.length) setSelected([]);
    else setSelected(filtered.map((inv) => inv.id));
  };

  const handleBulkDelete = async () => {
    if (selected.length === 0) return;
    if (!window.confirm(`Delete ${selected.length} invoice(s)?`)) return;
    try {
      await Promise.all(selected.map((id) => api.delete(`/invoices/${id}`)));
      setSelected([]);
      fetchInvoices();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete');
    }
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
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className={styles.btnPrimary} onClick={() => navigate('/invoices/new')}>
            <HiOutlinePlus /> New
          </button>
          <button
            className={styles.btnSecondary}
            onClick={handleBulkDelete}
            disabled={selected.length === 0}
            title="Delete selected"
          >
            <HiTrash />
          </button>
          <button className={styles.btnSecondary} onClick={() => window.print()} title="Print">
            <HiOutlinePrinter />
          </button>
        </div>
        <div className={styles.searchBox}>
          <HiOutlineSearch />
          <input
            type="text"
            placeholder="Search invoices..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {error && <div className={styles.formError}>{error}</div>}

      {/* Table */}
      <div className={styles.card}>
        <div className={styles.tableWrapper}>
          {filtered.length === 0 ? (
            <div className={styles.empty}>
              <p>No invoices found.</p>
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
                  <th>Number</th>
                  <th>Customer</th>
                  <th>Invoice Date</th>
                  <th>Due Date</th>
                  <th>Tax</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((inv) => (
                  <tr
                    key={inv.id}
                    onClick={() => navigate(`/invoices/${inv.id}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selected.includes(inv.id)}
                        onChange={() => toggleSelect(inv.id)}
                        style={{ accentColor: '#714B67' }}
                      />
                    </td>
                    <td style={{ fontWeight: 600, color: '#714B67' }}>{inv.invoice_number}</td>
                    <td>{inv.customer_id}</td>
                    <td>{inv.issue_date}</td>
                    <td>{inv.due_date || '-'}</td>
                    <td>₹{Number(inv.tax_total).toFixed(2)}</td>
                    <td style={{ fontWeight: 600 }}>₹{Number(inv.total).toFixed(2)}</td>
                    <td>
                      <span
                        className={`${styles.badge} ${styles[STATUS_BADGE[inv.status]] || styles.badgeDraft}`}
                      >
                        {inv.status}
                      </span>
                    </td>
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

/* ==========================================================================
   FORM VIEW
   ========================================================================== */

function InvoiceFormView() {
  const { invoiceId } = useParams();
  const navigate = useNavigate();
  const isNew = !invoiceId || invoiceId === 'new';

  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Form fields (editable in draft)
  const [customerId, setCustomerId] = useState('');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [paidChecked, setPaidChecked] = useState(false);
  const [notes, setNotes] = useState('');

  // Tabs
  const [activeTab, setActiveTab] = useState('order_lines');

  // Lookups
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [taxes, setTaxes] = useState([]);

  // Payment modal
  const [showPayModal, setShowPayModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);

  const fetchLookups = useCallback(async () => {
    try {
      const [u, pr, t] = await Promise.all([
        api.get('/users/'),
        api.get('/products/'),
        api.get('/taxes/'),
      ]);
      setUsers(u.data);
      setProducts(pr.data);
      setTaxes(t.data);
    } catch {
      /* ignore */
    }
  }, []);

  const fetchInvoice = useCallback(async () => {
    if (isNew) {
      setLoading(false);
      return;
    }
    try {
      const res = await api.get(`/invoices/${invoiceId}`);
      const inv = res.data;
      setInvoice(inv);
      setCustomerId(inv.customer_id || '');
      setIssueDate(inv.issue_date || '');
      setDueDate(inv.due_date || '');
      setPaidChecked(inv.status === 'paid');
      setNotes(inv.notes || '');
      setPaymentAmount(String(Number(inv.total).toFixed(2)));
    } catch {
      navigate('/invoices');
    }
    setLoading(false);
  }, [invoiceId, isNew, navigate]);

  useEffect(() => {
    const load = async () => {
      await fetchLookups();
      await fetchInvoice();
    };
    load();
  }, [fetchLookups, fetchInvoice]);

  const handleAction = async (action) => {
    if (!invoice) return;
    setActionLoading(true);
    setError('');
    try {
      const res = await api.post(`/invoices/${invoice.id}/${action}`);
      if (res.data && res.data.id) {
        setInvoice(res.data);
        setPaidChecked(res.data.status === 'paid');
      } else {
        await fetchInvoice();
      }
    } catch (err) {
      setError(err.response?.data?.detail || `Failed to ${action} invoice`);
    }
    setActionLoading(false);
  };

  const handlePaySubmit = async () => {
    if (!invoice) return;
    setActionLoading(true);
    setError('');
    try {
      const res = await api.post(`/invoices/${invoice.id}/pay`, {
        payment_method: paymentMethod || 'credit_card',
        amount: parseFloat(paymentAmount) || null,
        payment_date: paymentDate || null,
      });
      if (res.data && res.data.id) {
        setInvoice(res.data);
        setPaidChecked(true);
      } else {
        await fetchInvoice();
      }
      setShowPayModal(false);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to register payment');
    }
    setActionLoading(false);
  };

  const productName = (id) => {
    const p = products.find((p) => p.id === id);
    return p ? p.name : `Product #${id}`;
  };

  const taxLabel = (id) => {
    if (!id) return '-';
    const t = taxes.find((t) => t.id === id);
    return t ? `${t.name} (${t.rate}%)` : '-';
  };

  const userName = (id) => {
    const u = users.find((u) => u.id === id);
    return u ? u.full_name || u.email : `Customer #${id}`;
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

  // If new invoice with no data yet, show a simple placeholder
  if (isNew) {
    return (
      <div className={styles.page}>
        <div className={styles.toolbar}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button className={styles.btnSecondary} onClick={() => navigate('/invoices')}>
              Back to Invoices
            </button>
          </div>
        </div>
        <div className={styles.card} style={{ padding: 24 }}>
          <p style={{ color: '#6B7280' }}>
            Invoices are generated from subscriptions. Go to a subscription and click "Create Invoice".
          </p>
        </div>
      </div>
    );
  }

  if (!invoice) return null;

  const status = invoice.status || 'draft';
  const currentStepIdx = STATUS_STEPS.indexOf(status);
  const invoiceLines = invoice.lines || [];
  const untaxed = Number(invoice.subtotal) || 0;
  const taxTotal = Number(invoice.tax_total) || 0;
  const total = Number(invoice.total) || 0;

  return (
    <div className={styles.page}>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {status === 'draft' && (
            <>
              <button
                className={styles.btnPrimary}
                onClick={() => handleAction('confirm')}
                disabled={actionLoading}
              >
                <HiOutlineCheckCircle /> Confirm
              </button>
              <button
                className={styles.btnDanger}
                onClick={() => handleAction('cancel')}
                disabled={actionLoading}
              >
                <HiOutlineXCircle /> Cancel
              </button>
            </>
          )}
          {status === 'confirmed' && (
            <>
              {invoice.subscription_id && (
                <button
                  className={styles.btnSecondary}
                  onClick={() => navigate(`/subscriptions/${invoice.subscription_id}`)}
                >
                  <HiOutlineLink /> Subscription
                </button>
              )}
              <button
                className={styles.btnSecondary}
                onClick={() => {
                  const token = localStorage.getItem('access_token');
                  window.open(`/api/invoices/${invoice.id}/pdf?token=${token}`, '_blank');
                }}
              >
                <HiOutlineEye /> Preview
              </button>
              <button
                className={styles.btnSecondary}
                onClick={() => handleAction('send')}
                disabled={actionLoading}
              >
                <HiOutlinePaperAirplane /> Send
              </button>
              <button
                className={styles.btnPrimary}
                onClick={() => {
                  setPaymentAmount(String(total.toFixed(2)));
                  setPaymentDate(new Date().toISOString().split('T')[0]);
                  setPaymentMethod('');
                  setShowPayModal(true);
                }}
                disabled={actionLoading}
              >
                <HiOutlineCash /> Pay
              </button>
              <button className={styles.btnSecondary} onClick={() => window.print()}>
                <HiOutlinePrinter /> Print
              </button>
            </>
          )}
          {status === 'paid' && (
            <>
              {invoice.subscription_id && (
                <button
                  className={styles.btnSecondary}
                  onClick={() => navigate(`/subscriptions/${invoice.subscription_id}`)}
                >
                  <HiOutlineLink /> Subscription
                </button>
              )}
              <button className={styles.btnSecondary} onClick={() => window.print()}>
                <HiOutlinePrinter /> Print
              </button>
            </>
          )}
          {status === 'cancelled' && (
            <>
              <button
                className={styles.btnSecondary}
                onClick={() => handleAction('back-to-draft')}
                disabled={actionLoading}
              >
                Back to Draft
              </button>
            </>
          )}
          <button className={styles.btnSecondary} title="Delete" onClick={async () => {
            if (!invoice) return;
            if (!window.confirm('Delete this invoice?')) return;
            try {
              await api.delete(`/invoices/${invoice.id}`);
              navigate('/invoices');
            } catch (err) {
              setError(err.response?.data?.detail || 'Failed to delete invoice');
            }
          }}>
            <HiTrash />
          </button>
          {!['confirmed', 'paid'].some((s) => s === status) && (
            <button className={styles.btnSecondary} onClick={() => window.print()} title="Print">
              <HiOutlinePrinter />
            </button>
          )}
        </div>
      </div>

      {/* State stepper */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 20 }}>
        {STATUS_STEPS.map((step, i) => {
          const isActive = step === status;
          const isPast = currentStepIdx >= 0 && i < currentStepIdx;
          const isAfterConfirmed =
            !STATUS_STEPS.includes(status) && ['paid', 'cancelled'].includes(status);
          const allDone = isAfterConfirmed || isPast || isActive;
          return (
            <div key={step} style={{ display: 'flex', alignItems: 'center' }}>
              <div
                style={{
                  padding: '6px 16px',
                  fontSize: 13,
                  fontWeight: isActive ? 700 : 500,
                  background: isActive ? '#714B67' : allDone ? '#D1FAE5' : '#F3F4F6',
                  color: isActive ? '#fff' : allDone ? '#059669' : '#9CA3AF',
                  borderRadius: 4,
                  border: isActive
                    ? 'none'
                    : '1px dashed ' + (allDone ? '#A7F3D0' : '#D1D5DB'),
                  textTransform: 'capitalize',
                }}
              >
                {step}
              </div>
              {i < STATUS_STEPS.length - 1 && (
                <div
                  style={{
                    width: 32,
                    height: 2,
                    background: isPast || isAfterConfirmed ? '#A7F3D0' : '#D1D5DB',
                  }}
                />
              )}
            </div>
          );
        })}
        {!STATUS_STEPS.includes(status) && (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ width: 32, height: 2, background: '#A7F3D0' }} />
            <span
              className={`${styles.badge} ${styles[STATUS_BADGE[status]] || ''}`}
              style={{ textTransform: 'capitalize' }}
            >
              {status}
            </span>
          </div>
        )}
      </div>

      {/* Invoice number + Form card */}
      <div className={styles.card} style={{ padding: 24, marginBottom: 20 }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#1F2937', marginBottom: 16 }}>
          {invoice.invoice_number}
        </div>

        {/* Two-column form */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {/* Left column */}
          <div>
            <div className={styles.formGroup}>
              <label>Customer</label>
              <select
                className={styles.formControl}
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                disabled={status !== 'draft'}
              >
                <option value="">Select customer...</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.full_name || u.email}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {/* Right column */}
          <div>
            {status === 'confirmed' && (
              <div className={styles.formGroup}>
                <label className={styles.checkbox}>
                  <input
                    type="checkbox"
                    checked={paidChecked}
                    onChange={() => {}}
                    disabled
                  />
                  Paid
                </label>
              </div>
            )}
            {status === 'paid' && (
              <div className={styles.formGroup}>
                <label className={styles.checkbox}>
                  <input type="checkbox" checked readOnly disabled />
                  Paid
                </label>
              </div>
            )}
            <div className={styles.formGroup}>
              <label>Invoice Date</label>
              <input
                type="date"
                className={styles.formControl}
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                disabled={status !== 'draft'}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Due Date</label>
              <input
                type="date"
                className={styles.formControl}
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                disabled={status !== 'draft'}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs: Order Lines | Other Info */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 0 }}>
        <button
          onClick={() => setActiveTab('order_lines')}
          style={{
            padding: '10px 24px',
            fontSize: 14,
            fontWeight: activeTab === 'order_lines' ? 600 : 400,
            background: activeTab === 'order_lines' ? '#fff' : '#F3F4F6',
            border: '1px solid #E5E7EB',
            borderBottom:
              activeTab === 'order_lines' ? '2px solid #714B67' : '1px solid #E5E7EB',
            borderRadius: '8px 8px 0 0',
            cursor: 'pointer',
            color: activeTab === 'order_lines' ? '#714B67' : '#6B7280',
          }}
        >
          Order Lines
        </button>
        <button
          onClick={() => setActiveTab('other_info')}
          style={{
            padding: '10px 24px',
            fontSize: 14,
            fontWeight: activeTab === 'other_info' ? 600 : 400,
            background: activeTab === 'other_info' ? '#fff' : '#F3F4F6',
            border: '1px solid #E5E7EB',
            borderBottom:
              activeTab === 'other_info' ? '2px solid #714B67' : '1px solid #E5E7EB',
            borderRadius: '8px 8px 0 0',
            cursor: 'pointer',
            color: activeTab === 'other_info' ? '#714B67' : '#6B7280',
          }}
        >
          Other Info
        </button>
      </div>

      <div
        className={styles.card}
        style={{ padding: 24, borderTopLeftRadius: 0, marginBottom: 20 }}
      >
        {activeTab === 'order_lines' && (
          <>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Quantity</th>
                    <th>Unit Price</th>
                    <th>Taxes</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {invoiceLines.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', color: '#9CA3AF' }}>
                        No lines yet.
                      </td>
                    </tr>
                  ) : (
                    invoiceLines.map((line) => (
                      <tr key={line.id}>
                        <td style={{ fontWeight: 500 }}>{productName(line.product_id)}</td>
                        <td>{line.quantity}</td>
                        <td>₹{Number(line.unit_price).toFixed(2)}</td>
                        <td>{taxLabel(line.tax_id)}</td>
                        <td style={{ fontWeight: 600 }}>
                          ₹{Number(line.line_total).toFixed(2)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
              <div style={{ width: 260 }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '6px 0',
                    fontSize: 14,
                    color: '#6B7280',
                  }}
                >
                  <span>Untaxed Amount</span>
                  <span>₹{untaxed.toFixed(2)}</span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '6px 0',
                    fontSize: 14,
                    color: '#6B7280',
                  }}
                >
                  <span>Tax</span>
                  <span>₹{taxTotal.toFixed(2)}</span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '8px 0',
                    fontSize: 16,
                    fontWeight: 700,
                    borderTop: '2px solid #E5E7EB',
                    marginTop: 4,
                  }}
                >
                  <span>Total</span>
                  <span>₹{total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'other_info' && (
          <div style={{ maxWidth: 600 }}>
            <div className={styles.formGroup}>
              <label>Notes</label>
              <textarea
                className={styles.formControl}
                style={{ height: 80, padding: '8px 12px' }}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes"
                disabled={status !== 'draft'}
              />
            </div>
            {invoice.subscription_id && (
              <div className={styles.formGroup}>
                <label>Source Subscription</label>
                <div style={{ fontSize: 14, color: '#714B67', cursor: 'pointer', fontWeight: 600 }}
                  onClick={() => navigate(`/subscriptions/${invoice.subscription_id}`)}
                >
                  Subscription #{invoice.subscription_id}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {error && <div className={styles.formError} style={{ marginBottom: 16 }}>{error}</div>}

      {/* Back link */}
      <div style={{ display: 'flex', gap: 12 }}>
        <button className={styles.btnSecondary} onClick={() => navigate('/invoices')}>
          Back to Invoices
        </button>
      </div>

      {/* Payment Modal */}
      {showPayModal && (
        <div className={styles.overlay} onClick={() => setShowPayModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Register Payment</h2>
              <button className={styles.modalClose} onClick={() => setShowPayModal(false)}>
                <HiOutlineX />
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label>Payment Method</label>
                <select
                  className={styles.formControl}
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <option value="">Select...</option>
                  <option value="credit_card">Credit Card</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cash">Cash</option>
                  <option value="check">Check</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Amount</label>
                <input
                  type="number"
                  className={styles.formControl}
                  step="0.01"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Payment Date</label>
                <input
                  type="date"
                  className={styles.formControl}
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                />
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button
                className={styles.btnSecondary}
                onClick={() => setShowPayModal(false)}
              >
                Discard
              </button>
              <button
                className={styles.btnPrimary}
                onClick={handlePaySubmit}
                disabled={actionLoading}
              >
                <HiOutlineCash /> {actionLoading ? 'Processing...' : 'Pay'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ==========================================================================
   MAIN COMPONENT - route switch
   ========================================================================== */

export default function InvoicesPage() {
  const { invoiceId } = useParams();

  if (invoiceId) {
    return <InvoiceFormView />;
  }
  return <InvoiceListView />;
}
