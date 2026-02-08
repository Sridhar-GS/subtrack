import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api';
import styles from './Portal.module.css';

export default function OrderDetailPage() {
  const { subId } = useParams();
  const navigate = useNavigate();
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
        setInvoices((invRes.data || []).filter((inv) => inv.subscription_id === Number(subId)));
      } catch { setOrder(null); }
      setLoading(false);
    };
    fetchData();
  }, [subId]);

  const handleClose = async () => {
    if (!window.confirm('Close this subscription?')) return;
    try { const res = await api.post(`/subscriptions/${subId}/portal-close`); setOrder(res.data); }
    catch (err) { alert(err.response?.data?.detail || 'Failed to close'); }
  };

  const handleRenew = async () => {
    try {
      const res = await api.post(`/subscriptions/${subId}/portal-renew`);
      navigate(`/my-orders/${res.data.id}`);
    } catch (err) { alert(err.response?.data?.detail || 'Failed to renew'); }
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

  const lines = order.lines || [];
  const untaxedAmount = lines.reduce((sum, l) => sum + Number(l.amount || 0), 0);
  const taxRate = 0.15;
  const taxAmount = untaxedAmount * taxRate;
  const totalAmount = untaxedAmount + taxAmount;

  return (
    <div>
      {/* Header */}
      <div className={styles.orderHeader}>
        <div className={styles.orderHeaderTop}>
          <div>
            <div className={styles.orderNumber}>Order/{order.subscription_number}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
              <span style={{ fontSize: 14, color: '#6B7280' }}>{order.subscription_number}</span>
              <span className={`${styles.badge} ${getBadgeClass(order.status)}`}>{order.status}</span>
            </div>
          </div>
          <div className={styles.actionBtns}>
            <button className={styles.actionBtn} onClick={() => window.print()}>Download</button>
            {order.status === 'active' && (
              <>
                <button className={`${styles.actionBtn} ${styles.actionBtnPrimary}`} onClick={handleRenew}>Renew</button>
                <button className={`${styles.actionBtn} ${styles.actionBtnDanger}`} onClick={handleClose}>Close</button>
              </>
            )}
            {order.status === 'closed' && (
              <button className={`${styles.actionBtn} ${styles.actionBtnPrimary}`} onClick={handleRenew}>Renew</button>
            )}
          </div>
        </div>

        {/* Two-column: Subscription & Address */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginTop: 20 }}>
          <div>
            <h4 style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 12 }}>Your Subscription</h4>
            <div style={{ fontSize: 14, color: '#6B7280', lineHeight: 2 }}>
              <div><span style={{ fontWeight: 500, color: '#374151' }}>Plan:</span> {order.plan_id}</div>
              <div><span style={{ fontWeight: 500, color: '#374151' }}>Start Date:</span> {order.start_date || '-'}</div>
              <div><span style={{ fontWeight: 500, color: '#374151' }}>End Date:</span> {order.expiration_date || '-'}</div>
            </div>
          </div>
          <div>
            <h4 style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 12 }}>Invoicing and Shipping Address</h4>
            <div style={{ fontSize: 14, color: '#6B7280', lineHeight: 2 }}>
              <div>{order.street || '-'}</div>
              <div>{[order.city, order.state, order.zip_code].filter(Boolean).join(', ') || '-'}</div>
              <div><span style={{ fontWeight: 500, color: '#374151' }}>Email:</span> {order.customer_email || '-'}</div>
              <div><span style={{ fontWeight: 500, color: '#374151' }}>Phone Number:</span> {order.customer_phone || '-'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Last Invoices */}
      {invoices.length > 0 && (
        <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E5E7EB', padding: '16px 20px', marginBottom: 24 }}>
          <h4 style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 12 }}>Last Invoices</h4>
          {invoices.map((inv) => (
            <div key={inv.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #F3F4F6' }}>
              <Link to={`/my-invoices/${inv.id}`} style={{ color: '#714B67', textDecoration: 'none', fontWeight: 500, fontSize: 14 }}>
                {inv.invoice_number}
              </Link>
              <span className={`${styles.badge} ${getBadgeClass(inv.status)}`}>{inv.status}</span>
            </div>
          ))}
        </div>
      )}

      {/* Products table */}
      {lines.length > 0 && (
        <div className={styles.ordersTable}>
          <h4 style={{ padding: '16px 16px 0', fontSize: 16, fontWeight: 600, color: '#374151' }}>Products</h4>
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
                  <td style={{ fontWeight: 500 }}>{line.product_name || line.description || `Product #${line.product_id}`}</td>
                  <td>{line.quantity} Unit</td>
                  <td>₹{Number(line.unit_price).toFixed(0)}</td>
                  <td>15%</td>
                  <td style={{ fontWeight: 600 }}>₹{Number(line.amount).toFixed(0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {/* Totals */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '16px 24px' }}>
            <div style={{ minWidth: 240 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 14, color: '#6B7280' }}>
                <span>Untaxed Amount</span><span>₹{untaxedAmount.toFixed(0)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 14, color: '#6B7280' }}>
                <span>Tax 15%</span><span>₹{taxAmount.toFixed(0)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: 16, fontWeight: 700, color: '#1F2937', borderTop: '2px solid #E5E7EB', marginTop: 4 }}>
                <span>Total</span><span>₹{totalAmount.toFixed(0)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
