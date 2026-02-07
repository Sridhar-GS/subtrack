import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';
import styles from './Portal.module.css';

export default function OrderDetailPage() {
  const { subId } = useParams();
  const [order, setOrder] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [subRes, invRes] = await Promise.all([
          api.get(`/subscriptions/${subId}`),
          api.get(`/invoices/?customer_id=0`).catch(() => ({ data: [] })),
        ]);
        setOrder(subRes.data);
        const filteredInvoices = (invRes.data || []).filter((inv) => inv.subscription_id === Number(subId));
        setInvoices(filteredInvoices);
      } catch {
        setOrder(null);
      }
      setLoading(false);
    };
    fetchData();
  }, [subId]);

  const handleClose = async () => {
    if (!window.confirm('Close this subscription?')) return;
    try {
      const res = await api.post(`/subscriptions/${subId}/portal-close`);
      setOrder(res.data);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to close');
    }
  };

  const handleRenew = async () => {
    try {
      const res = await api.post(`/subscriptions/${subId}/portal-renew`);
      setOrder(res.data);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to renew');
    }
  };

  if (loading) return <div className={styles.empty}><p>Loading...</p></div>;
  if (!order) return <div className={styles.empty}><h3>Order not found</h3></div>;

  const getBadgeClass = (status) => {
    if (status === 'active') return styles.badgeActive;
    if (status === 'closed') return styles.badgeClosed;
    if (status === 'paid') return styles.badgePaid;
    if (status === 'confirmed') return styles.badgeConfirmed;
    return styles.badgeDraft;
  };

  return (
    <div>
      <div className={styles.orderHeader}>
        <div className={styles.orderHeaderTop}>
          <div>
            <div className={styles.orderNumber}>{order.subscription_number}</div>
            <span className={`${styles.badge} ${getBadgeClass(order.status)}`}>{order.status}</span>
          </div>
          <div className={styles.actionBtns}>
            {order.status === 'active' && (
              <button className={`${styles.actionBtn} ${styles.actionBtnDanger}`} onClick={handleClose}>Close</button>
            )}
            {order.status === 'closed' && (
              <button className={`${styles.actionBtn} ${styles.actionBtnPrimary}`} onClick={handleRenew}>Renew</button>
            )}
            <button className={styles.actionBtn} onClick={() => window.print()}>Print</button>
          </div>
        </div>
        <div className={styles.orderMeta}>
          <div className={styles.orderMetaItem}><label>Start Date</label><span>{order.start_date || '-'}</span></div>
          <div className={styles.orderMetaItem}><label>Expiration</label><span>{order.expiration_date || '-'}</span></div>
          <div className={styles.orderMetaItem}><label>Plan ID</label><span>{order.plan_id}</span></div>
          <div className={styles.orderMetaItem}><label>Payment Terms</label><span>{order.payment_terms || '-'}</span></div>
        </div>
      </div>

      {order.lines && order.lines.length > 0 && (
        <div className={styles.ordersTable} style={{ marginBottom: 24 }}>
          <table>
            <thead><tr><th>Product</th><th>Qty</th><th>Unit Price</th><th>Amount</th></tr></thead>
            <tbody>
              {order.lines.map((line) => (
                <tr key={line.id}>
                  <td>{line.product_id}</td>
                  <td>{line.quantity}</td>
                  <td>${Number(line.unit_price).toFixed(2)}</td>
                  <td>${Number(line.amount).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {invoices.length > 0 && (
        <div>
          <h3 className={styles.sectionTitle} style={{ fontSize: 18 }}>Invoices</h3>
          <div className={styles.ordersTable}>
            <table>
              <thead><tr><th>Invoice #</th><th>Status</th><th>Total</th><th>Date</th></tr></thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id} onClick={() => {}}>
                    <td><Link to={`/my-invoices/${inv.id}`}>{inv.invoice_number}</Link></td>
                    <td><span className={`${styles.badge} ${getBadgeClass(inv.status)}`}>{inv.status}</span></td>
                    <td>${Number(inv.total).toFixed(2)}</td>
                    <td>{inv.issue_date || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
