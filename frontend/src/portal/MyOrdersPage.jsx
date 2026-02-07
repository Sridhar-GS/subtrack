import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import styles from './Portal.module.css';

export default function MyOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/subscriptions/')
      .then((res) => setOrders(res.data))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  const getBadgeClass = (status) => {
    if (status === 'active') return styles.badgeActive;
    if (status === 'closed') return styles.badgeClosed;
    if (status === 'confirmed') return styles.badgeConfirmed;
    return styles.badgeDraft;
  };

  if (loading) return <div className={styles.empty}><p>Loading...</p></div>;

  return (
    <div>
      <h2 className={styles.sectionTitle}>My Orders</h2>
      {orders.length === 0 ? (
        <div className={styles.empty}>
          <h3>No orders yet</h3>
          <p>Your orders will appear here after you make a purchase.</p>
        </div>
      ) : (
        <div className={styles.ordersTable}>
          <table>
            <thead>
              <tr>
                <th>Order #</th>
                <th>Status</th>
                <th>Start Date</th>
                <th>Plan</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} onClick={() => navigate(`/my-orders/${order.id}`)}>
                  <td style={{ fontWeight: 600 }}>{order.subscription_number}</td>
                  <td><span className={`${styles.badge} ${getBadgeClass(order.status)}`}>{order.status}</span></td>
                  <td>{order.start_date || '-'}</td>
                  <td>{order.plan_id}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
