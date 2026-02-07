import { useState, useEffect } from 'react';
import {
  HiOutlineSearch,
  HiOutlinePlus,
  HiOutlineEye,
  HiOutlineX,
  HiOutlineCreditCard,
} from 'react-icons/hi';
import api from '../api';
import styles from './Page.module.css';

export default function PaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  // Create modal
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    invoice_id: '',
    payment_method: 'credit_card',
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    reference: '',
    notes: '',
  });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  // Detail modal
  const [selectedPayment, setSelectedPayment] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [paymentsRes, invoicesRes] = await Promise.all([
        api.get('/payments/'),
        api.get('/invoices/'),
      ]);
      setPayments(paymentsRes.data);
      setInvoices(invoicesRes.data);
    } catch {
      setError('Failed to load data');
    }
    setLoading(false);
  };

  const getInvoiceNumber = (invoiceId) => {
    const inv = invoices.find((i) => i.id === invoiceId);
    return inv ? inv.invoice_number : invoiceId;
  };

  const confirmedInvoices = invoices.filter((inv) => inv.status === 'confirmed');

  const openCreateModal = () => {
    setShowCreate(true);
    setForm({
      invoice_id: '',
      payment_method: 'credit_card',
      amount: '',
      payment_date: new Date().toISOString().split('T')[0],
      reference: '',
      notes: '',
    });
    setCreateError('');
  };

  const handleFormChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreate = async () => {
    if (!form.invoice_id || !form.amount) return;
    setCreating(true);
    setCreateError('');
    try {
      await api.post('/payments/', {
        invoice_id: Number(form.invoice_id),
        payment_method: form.payment_method,
        amount: Number(form.amount),
        payment_date: form.payment_date,
        reference: form.reference || null,
        notes: form.notes || null,
      });
      setShowCreate(false);
      fetchData();
    } catch (err) {
      setCreateError(err.response?.data?.detail || 'Failed to create payment');
    }
    setCreating(false);
  };

  const filtered = payments.filter((p) => {
    if (!search) return true;
    const invNum = getInvoiceNumber(p.invoice_id);
    const q = search.toLowerCase();
    return (
      String(p.id).includes(q) ||
      String(invNum).toLowerCase().includes(q) ||
      (p.payment_method || '').toLowerCase().includes(q) ||
      (p.reference || '').toLowerCase().includes(q)
    );
  });

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
          <HiOutlineSearch />
          <input
            type="text"
            placeholder="Search payments..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button className={styles.btnPrimary} onClick={openCreateModal}>
          <HiOutlinePlus /> Record Payment
        </button>
      </div>

      {error && <div className={styles.formError}>{error}</div>}

      {/* Table */}
      <div className={styles.card}>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Payment ID</th>
                <th>Invoice #</th>
                <th>Method</th>
                <th>Amount ($)</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: '#9CA3AF' }}>
                    No payments found
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id} onClick={() => setSelectedPayment(p)} style={{ cursor: 'pointer' }}>
                    <td>{p.id}</td>
                    <td>{getInvoiceNumber(p.invoice_id)}</td>
                    <td style={{ textTransform: 'capitalize' }}>{(p.payment_method || '').replace('_', ' ')}</td>
                    <td>${Number(p.amount).toFixed(2)}</td>
                    <td>{p.payment_date}</td>
                    <td>
                      <div className={styles.actions} onClick={(e) => e.stopPropagation()}>
                        <button title="View" onClick={() => setSelectedPayment(p)}>
                          <HiOutlineEye />
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

      {/* Create Payment Modal */}
      {showCreate && (
        <div className={styles.overlay} onClick={() => setShowCreate(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Record Payment</h2>
              <button className={styles.modalClose} onClick={() => setShowCreate(false)}>
                <HiOutlineX />
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label>Invoice</label>
                <select
                  className={styles.formControl}
                  value={form.invoice_id}
                  onChange={(e) => handleFormChange('invoice_id', e.target.value)}
                >
                  <option value="">Select an invoice...</option>
                  {confirmedInvoices.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.invoice_number} - ${Number(inv.total).toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Payment Method</label>
                <select
                  className={styles.formControl}
                  value={form.payment_method}
                  onChange={(e) => handleFormChange('payment_method', e.target.value)}
                >
                  <option value="credit_card">Credit Card</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cash">Cash</option>
                  <option value="check">Check</option>
                </select>
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    className={styles.formControl}
                    value={form.amount}
                    onChange={(e) => handleFormChange('amount', e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Payment Date</label>
                  <input
                    type="date"
                    className={styles.formControl}
                    value={form.payment_date}
                    onChange={(e) => handleFormChange('payment_date', e.target.value)}
                  />
                </div>
              </div>
              <div className={styles.formGroup}>
                <label>Reference</label>
                <input
                  type="text"
                  className={styles.formControl}
                  value={form.reference}
                  onChange={(e) => handleFormChange('reference', e.target.value)}
                  placeholder="Optional reference number"
                />
              </div>
              <div className={styles.formGroup}>
                <label>Notes</label>
                <textarea
                  className={styles.formControl}
                  style={{ height: '80px', paddingTop: '10px', resize: 'vertical' }}
                  value={form.notes}
                  onChange={(e) => handleFormChange('notes', e.target.value)}
                  placeholder="Optional notes"
                />
              </div>
              {createError && <div className={styles.formError}>{createError}</div>}
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.btnSecondary} onClick={() => setShowCreate(false)}>
                Cancel
              </button>
              <button
                className={styles.btnPrimary}
                onClick={handleCreate}
                disabled={!form.invoice_id || !form.amount || creating}
              >
                {creating ? 'Saving...' : 'Record Payment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Detail Modal */}
      {selectedPayment && (
        <div className={styles.overlay} onClick={() => setSelectedPayment(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <HiOutlineCreditCard /> Payment #{selectedPayment.id}
                </span>
              </h2>
              <button className={styles.modalClose} onClick={() => setSelectedPayment(null)}>
                <HiOutlineX />
              </button>
            </div>
            <div className={styles.modalBody}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <span style={{ fontSize: '12px', color: '#6B7280', fontWeight: 600 }}>Payment ID</span>
                  <div style={{ fontSize: '14px', color: '#374151' }}>{selectedPayment.id}</div>
                </div>
                <div>
                  <span style={{ fontSize: '12px', color: '#6B7280', fontWeight: 600 }}>Invoice #</span>
                  <div style={{ fontSize: '14px', color: '#374151' }}>{getInvoiceNumber(selectedPayment.invoice_id)}</div>
                </div>
                <div>
                  <span style={{ fontSize: '12px', color: '#6B7280', fontWeight: 600 }}>Payment Method</span>
                  <div style={{ fontSize: '14px', color: '#374151', textTransform: 'capitalize' }}>
                    {(selectedPayment.payment_method || '').replace('_', ' ')}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '12px', color: '#6B7280', fontWeight: 600 }}>Amount</span>
                  <div style={{ fontSize: '14px', color: '#374151', fontWeight: 600 }}>
                    ${Number(selectedPayment.amount).toFixed(2)}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '12px', color: '#6B7280', fontWeight: 600 }}>Payment Date</span>
                  <div style={{ fontSize: '14px', color: '#374151' }}>{selectedPayment.payment_date}</div>
                </div>
                <div>
                  <span style={{ fontSize: '12px', color: '#6B7280', fontWeight: 600 }}>Reference</span>
                  <div style={{ fontSize: '14px', color: '#374151' }}>{selectedPayment.reference || '-'}</div>
                </div>
              </div>
              {selectedPayment.notes && (
                <div style={{ marginTop: '16px' }}>
                  <span style={{ fontSize: '12px', color: '#6B7280', fontWeight: 600 }}>Notes</span>
                  <div
                    style={{
                      fontSize: '14px',
                      color: '#374151',
                      marginTop: '4px',
                      background: '#F9FAFB',
                      padding: '10px 12px',
                      borderRadius: '6px',
                    }}
                  >
                    {selectedPayment.notes}
                  </div>
                </div>
              )}
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.btnSecondary} onClick={() => setSelectedPayment(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
