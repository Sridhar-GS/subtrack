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

  if (loading) return <div className={styles.empty}><p>Loading...</p></div>;
  if (!invoice) return <div className={styles.empty}><h3>Invoice not found</h3></div>;

  const getBadgeClass = (status) => {
    if (status === 'paid') return styles.badgePaid;
    if (status === 'confirmed') return styles.badgeConfirmed;
    if (status === 'cancelled') return styles.badgeClosed;
    return styles.badgeDraft;
  };

  return (
    <div>
      <div className={styles.invoiceCard}>
        <div className={styles.invoiceHeader}>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 700 }}>{invoice.invoice_number}</h2>
            <span className={`${styles.badge} ${getBadgeClass(invoice.status)}`}>{invoice.status}</span>
          </div>
          <button className={styles.actionBtn} onClick={() => window.print()}>Print / Download</button>
        </div>

        <div className={styles.invoiceMeta}>
          <div><label style={{ fontSize: 12, color: '#9CA3AF' }}>Issue Date</label><div>{invoice.issue_date || '-'}</div></div>
          <div><label style={{ fontSize: 12, color: '#9CA3AF' }}>Due Date</label><div>{invoice.due_date || '-'}</div></div>
          <div><label style={{ fontSize: 12, color: '#9CA3AF' }}>Customer</label><div>{invoice.customer_id}</div></div>
          <div><label style={{ fontSize: 12, color: '#9CA3AF' }}>Subscription</label><div><Link to={`/my-orders/${invoice.subscription_id}`}>View Order</Link></div></div>
        </div>

        {invoice.lines && invoice.lines.length > 0 && (
          <div className={styles.ordersTable} style={{ marginBottom: 24 }}>
            <table>
              <thead><tr><th>Product</th><th>Qty</th><th>Unit Price</th><th>Tax</th><th>Total</th></tr></thead>
              <tbody>
                {invoice.lines.map((line) => (
                  <tr key={line.id}>
                    <td>{line.description || line.product_id}</td>
                    <td>{line.quantity}</td>
                    <td>${Number(line.unit_price).toFixed(2)}</td>
                    <td>${Number(line.tax_amount || 0).toFixed(2)}</td>
                    <td>${Number(line.line_total).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className={styles.invoiceTotals}>
          <div className={styles.summaryRow}><span>Subtotal</span><span>${Number(invoice.subtotal).toFixed(2)}</span></div>
          <div className={styles.summaryRow}><span>Tax</span><span>${Number(invoice.tax_total).toFixed(2)}</span></div>
          {Number(invoice.discount_total) > 0 && <div className={styles.summaryRow}><span>Discount</span><span>-${Number(invoice.discount_total).toFixed(2)}</span></div>}
          <div className={styles.summaryTotal}><span>Total</span><span>${Number(invoice.total).toFixed(2)}</span></div>
        </div>
      </div>
    </div>
  );
}
