import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';
import styles from './Portal.module.css';

export default function PortalInvoicePage() {
  const { invoiceId } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/invoices/${invoiceId}`)
      .then((res) => setInvoice(res.data))
      .catch(() => setInvoice(null))
      .finally(() => setLoading(false));
  }, [invoiceId]);

  const handlePayment = async () => {
    try {
      await api.post(`/invoices/${invoiceId}/pay`);
      const res = await api.get(`/invoices/${invoiceId}`);
      setInvoice(res.data);
    } catch (err) {
      alert(err.response?.data?.detail || 'Payment failed');
    }
  };

  if (loading) return <div className={styles.empty}><p>Loading...</p></div>;
  if (!invoice) return <div className={styles.empty}><h3>Invoice not found</h3></div>;

  const getBadgeClass = (status) => {
    if (status === 'paid') return styles.badgePaid;
    if (status === 'confirmed') return styles.badgeConfirmed;
    if (status === 'cancelled') return styles.badgeClosed;
    return styles.badgeDraft;
  };

  const lines = invoice.lines || [];
  const untaxedAmount = Number(invoice.subtotal || 0);
  const taxAmount = Number(invoice.tax_total || 0);
  const discountTotal = Number(invoice.discount_total || 0);
  const totalAmount = Number(invoice.total || 0);
  const isPaid = invoice.status === 'paid';
  const paidAmount = isPaid ? totalAmount : 0;
  const amountDue = totalAmount - paidAmount;

  return (
    <div>
      <div className={styles.invoiceCard}>
        {/* Header: Invoice title + actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: '#1F2937', marginBottom: 4 }}>
              Order/{invoice.subscription_id && <Link to={`/my-orders/${invoice.subscription_id}`} style={{ color: '#714B67', textDecoration: 'none' }}>S{String(invoice.subscription_id).padStart(4, '0')}</Link>}/{invoice.invoice_number}
            </h2>
          </div>
          <div className={styles.actionBtns}>
            {!isPaid && invoice.status !== 'cancelled' && (
              <button className={`${styles.actionBtn} ${styles.actionBtnPrimary}`} onClick={handlePayment}>Payment</button>
            )}
            <button className={styles.actionBtn} onClick={() => window.print()}>Download</button>
          </div>
        </div>

        {/* Two-column: Invoice info + Address */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginBottom: 32 }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Invoice {invoice.invoice_number}</h3>
            <div style={{ fontSize: 14, color: '#6B7280', lineHeight: 2 }}>
              <div><span style={{ fontWeight: 500, color: '#374151' }}>Invoice Date:</span> {invoice.issue_date || '-'}</div>
              <div><span style={{ fontWeight: 500, color: '#374151' }}>Due Date:</span> {invoice.due_date || '-'}</div>
              <div><span style={{ fontWeight: 500, color: '#374151' }}>Source:</span> {invoice.subscription_id ? <Link to={`/my-orders/${invoice.subscription_id}`} style={{ color: '#714B67' }}>Order #{invoice.subscription_id}</Link> : '-'}</div>
            </div>
          </div>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Address</h3>
            <div style={{ fontSize: 14, color: '#6B7280', lineHeight: 2 }}>
              <div><span style={{ fontWeight: 500, color: '#374151' }}>Customer name:</span> {invoice.customer_name || '-'}</div>
              <div>{invoice.address || '-'}</div>
              <div><span style={{ fontWeight: 500, color: '#374151' }}>Email:</span> {invoice.customer_email || '-'}</div>
            </div>
          </div>
        </div>

        {/* Products table */}
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Products</h3>
        {lines.length > 0 && (
          <div className={styles.ordersTable} style={{ marginBottom: 24 }}>
            <table>
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
                {lines.map((line) => (
                  <tr key={line.id}>
                    <td style={{ fontWeight: 500 }}>{line.description || `Product #${line.product_id}`}</td>
                    <td>{line.quantity} Unit</td>
                    <td>₹{Number(line.unit_price).toFixed(0)}</td>
                    <td>{Number(line.tax_amount || 0) > 0 ? '15%' : '-'}</td>
                    <td style={{ fontWeight: 600 }}>₹{Number(line.line_total).toFixed(1)}</td>
                  </tr>
                ))}
                {discountTotal > 0 && (
                  <tr>
                    <td style={{ fontWeight: 500, color: '#059669' }}>Discount</td>
                    <td>1</td>
                    <td style={{ color: '#059669' }}>-₹{discountTotal.toFixed(0)}</td>
                    <td>-</td>
                    <td style={{ fontWeight: 600, color: '#059669' }}>-₹{discountTotal.toFixed(0)}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Payment Term + Totals */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 500, color: '#374151' }}>Payment Term</div>
            <div style={{ fontSize: 14, color: '#6B7280' }}>{invoice.payment_terms || 'Immediate Payment'}</div>
          </div>
          <div style={{ minWidth: 280 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 14, color: '#6B7280' }}>
              <span>Untaxed Amount</span><span>₹{untaxedAmount.toFixed(0)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 14, color: '#6B7280' }}>
              <span>Tax 15%</span><span>₹{taxAmount.toFixed(0)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: 16, fontWeight: 700, color: '#1F2937', borderTop: '2px solid #E5E7EB', marginTop: 4 }}>
              <span>Total</span><span>₹{totalAmount.toFixed(0)}</span>
            </div>
            {isPaid && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 14, color: '#059669', fontWeight: 500 }}>
                  <span>Paid on {invoice.paid_date || invoice.issue_date || '-'}</span><span>₹{paidAmount.toFixed(0)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: 16, fontWeight: 700, color: '#1F2937', borderTop: '1px solid #E5E7EB' }}>
                  <span>Amount Due</span><span>₹{amountDue.toFixed(0)}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
