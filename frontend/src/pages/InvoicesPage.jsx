import { useState, useEffect } from 'react';
import {
  HiOutlineSearch,
  HiOutlinePlus,
  HiOutlineEye,
  HiOutlineX,
  HiOutlineDocumentText,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlinePaperAirplane,
  HiOutlineRefresh,
  HiOutlinePrinter,
} from 'react-icons/hi';
import api from '../api';
import styles from './Page.module.css';

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [error, setError] = useState('');

  // Generate modal
  const [showGenerate, setShowGenerate] = useState(false);
  const [activeSubs, setActiveSubs] = useState([]);
  const [selectedSubId, setSelectedSubId] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState('');

  // Detail modal
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await api.get('/invoices/');
      setInvoices(res.data);
    } catch {
      setError('Failed to load invoices');
    }
    setLoading(false);
  };

  const openGenerateModal = async () => {
    setShowGenerate(true);
    setSelectedSubId('');
    setGenerateError('');
    try {
      const res = await api.get('/subscriptions/', { params: { status: 'active' } });
      setActiveSubs(res.data);
    } catch {
      setGenerateError('Failed to load subscriptions');
    }
  };

  const handleGenerate = async () => {
    if (!selectedSubId) return;
    setGenerating(true);
    setGenerateError('');
    try {
      await api.post(`/invoices/generate/${selectedSubId}`);
      setShowGenerate(false);
      fetchInvoices();
    } catch (err) {
      setGenerateError(err.response?.data?.detail || 'Failed to generate invoice');
    }
    setGenerating(false);
  };

  const openDetail = (invoice) => {
    setSelectedInvoice(invoice);
    setActionError('');
  };

  const handleAction = async (action) => {
    if (!selectedInvoice) return;
    setActionLoading(true);
    setActionError('');
    try {
      await api.post(`/invoices/${selectedInvoice.id}/${action}`);
      setSelectedInvoice(null);
      fetchInvoices();
    } catch (err) {
      setActionError(err.response?.data?.detail || `Failed to ${action} invoice`);
    }
    setActionLoading(false);
  };

  const getBadgeClass = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'draft') return styles.badgeDraft;
    if (s === 'confirmed') return styles.badgeConfirmed;
    if (s === 'paid') return styles.badgePaid;
    if (s === 'cancelled') return styles.badgeCancelled;
    return styles.badgeDraft;
  };

  const filtered = invoices.filter((inv) => {
    const matchesSearch = !search || (inv.invoice_number || '').toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
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
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className={styles.searchBox}>
            <HiOutlineSearch />
            <input
              type="text"
              placeholder="Search by invoice number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className={styles.formControl}
            style={{ width: '160px', height: '40px' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="confirmed">Confirmed</option>
            <option value="paid">Paid</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <button className={styles.btnPrimary} onClick={openGenerateModal}>
          <HiOutlinePlus /> Generate Invoice
        </button>
      </div>

      {error && <div className={styles.formError}>{error}</div>}

      {/* Table */}
      <div className={styles.card}>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Customer ID</th>
                <th>Issue Date</th>
                <th>Due Date</th>
                <th>Subtotal</th>
                <th>Tax</th>
                <th>Total ($)</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', color: '#9CA3AF' }}>
                    No invoices found
                  </td>
                </tr>
              ) : (
                filtered.map((inv) => (
                  <tr key={inv.id} onClick={() => openDetail(inv)} style={{ cursor: 'pointer' }}>
                    <td>{inv.invoice_number}</td>
                    <td>{inv.customer_id}</td>
                    <td>{inv.issue_date}</td>
                    <td>{inv.due_date || '-'}</td>
                    <td>${Number(inv.subtotal).toFixed(2)}</td>
                    <td>${Number(inv.tax_total).toFixed(2)}</td>
                    <td>${Number(inv.total).toFixed(2)}</td>
                    <td>
                      <span className={`${styles.badge} ${getBadgeClass(inv.status)}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actions} onClick={(e) => e.stopPropagation()}>
                        <button title="View" onClick={() => openDetail(inv)}>
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

      {/* Generate Invoice Modal */}
      {showGenerate && (
        <div className={styles.overlay} onClick={() => setShowGenerate(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Generate Invoice</h2>
              <button className={styles.modalClose} onClick={() => setShowGenerate(false)}>
                <HiOutlineX />
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label>Active Subscription</label>
                <select
                  className={styles.formControl}
                  value={selectedSubId}
                  onChange={(e) => setSelectedSubId(e.target.value)}
                >
                  <option value="">Select a subscription...</option>
                  {activeSubs.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.subscription_number}
                    </option>
                  ))}
                </select>
              </div>
              {generateError && <div className={styles.formError}>{generateError}</div>}
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.btnSecondary} onClick={() => setShowGenerate(false)}>
                Cancel
              </button>
              <button
                className={styles.btnPrimary}
                onClick={handleGenerate}
                disabled={!selectedSubId || generating}
              >
                {generating ? 'Generating...' : 'Generate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Detail Modal */}
      {selectedInvoice && (
        <div className={styles.overlay} onClick={() => setSelectedInvoice(null)}>
          <div
            className={styles.modal}
            style={{ maxWidth: '700px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h2>Invoice {selectedInvoice.invoice_number}</h2>
              <button className={styles.modalClose} onClick={() => setSelectedInvoice(null)}>
                <HiOutlineX />
              </button>
            </div>
            <div className={styles.modalBody}>
              {/* Header info */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                <div>
                  <span style={{ fontSize: '12px', color: '#6B7280', fontWeight: 600 }}>Invoice Number</span>
                  <div style={{ fontSize: '14px', color: '#374151' }}>{selectedInvoice.invoice_number}</div>
                </div>
                <div>
                  <span style={{ fontSize: '12px', color: '#6B7280', fontWeight: 600 }}>Status</span>
                  <div>
                    <span className={`${styles.badge} ${getBadgeClass(selectedInvoice.status)}`}>
                      {selectedInvoice.status}
                    </span>
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '12px', color: '#6B7280', fontWeight: 600 }}>Issue Date</span>
                  <div style={{ fontSize: '14px', color: '#374151' }}>{selectedInvoice.issue_date}</div>
                </div>
                <div>
                  <span style={{ fontSize: '12px', color: '#6B7280', fontWeight: 600 }}>Due Date</span>
                  <div style={{ fontSize: '14px', color: '#374151' }}>{selectedInvoice.due_date || '-'}</div>
                </div>
              </div>

              {/* Invoice Lines */}
              <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: '#374151' }}>
                Invoice Lines
              </h3>
              <div style={{ overflowX: 'auto', marginBottom: '16px' }}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Product ID</th>
                      <th>Description</th>
                      <th>Qty</th>
                      <th>Unit Price</th>
                      <th>Tax Amount</th>
                      <th>Line Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedInvoice.lines || []).length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', color: '#9CA3AF' }}>
                          No lines
                        </td>
                      </tr>
                    ) : (
                      selectedInvoice.lines.map((line) => (
                        <tr key={line.id}>
                          <td>{line.product_id}</td>
                          <td>{line.description || '-'}</td>
                          <td>{line.quantity}</td>
                          <td>${Number(line.unit_price).toFixed(2)}</td>
                          <td>${Number(line.tax_amount).toFixed(2)}</td>
                          <td>${Number(line.line_total).toFixed(2)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div
                style={{
                  background: '#F9FAFB',
                  borderRadius: '8px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#374151' }}>
                  <span>Subtotal</span>
                  <span>${Number(selectedInvoice.subtotal).toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#374151' }}>
                  <span>Tax Total</span>
                  <span>${Number(selectedInvoice.tax_total).toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#374151' }}>
                  <span>Discount Total</span>
                  <span>${Number(selectedInvoice.discount_total).toFixed(2)}</span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '15px',
                    fontWeight: 700,
                    color: '#111827',
                    borderTop: '1px solid #E5E7EB',
                    paddingTop: '8px',
                    marginTop: '4px',
                  }}
                >
                  <span>Total</span>
                  <span>${Number(selectedInvoice.total).toFixed(2)}</span>
                </div>
              </div>

              {actionError && <div className={styles.formError} style={{ marginTop: '12px' }}>{actionError}</div>}
            </div>
            <div className={styles.modalFooter}>
              {selectedInvoice.status === 'draft' && (
                <button
                  className={styles.btnSuccess}
                  onClick={() => handleAction('confirm')}
                  disabled={actionLoading}
                >
                  <HiOutlineCheckCircle /> Confirm
                </button>
              )}
              {(selectedInvoice.status === 'draft' || selectedInvoice.status === 'confirmed') && (
                <button
                  className={styles.btnDanger}
                  onClick={() => handleAction('cancel')}
                  disabled={actionLoading}
                >
                  <HiOutlineXCircle /> Cancel
                </button>
              )}
              {selectedInvoice.status === 'confirmed' && (
                <button
                  className={styles.btnPrimary}
                  onClick={() => handleAction('send')}
                  disabled={actionLoading}
                  style={{ height: '32px', fontSize: '13px', padding: '0 12px' }}
                >
                  <HiOutlinePaperAirplane /> Send
                </button>
              )}
              {selectedInvoice.status === 'cancelled' && (
                <button
                  className={styles.btnSecondary}
                  onClick={() => handleAction('back-to-draft')}
                  disabled={actionLoading}
                >
                  <HiOutlineRefresh /> Back to Draft
                </button>
              )}
              <button
                className={styles.btnSecondary}
                onClick={() => window.print()}
              >
                <HiOutlinePrinter /> Print
              </button>
              <button className={styles.btnSecondary} onClick={() => setSelectedInvoice(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
