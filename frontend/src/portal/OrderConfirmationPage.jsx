import { useLocation, Link } from 'react-router-dom';
import { HiCheck } from 'react-icons/hi';
import styles from './Portal.module.css';

export default function OrderConfirmationPage() {
  const location = useLocation();
  const { subscription_number, invoice_number, total } = location.state || {};

  return (
    <div className={styles.confirmation}>
      <div className={styles.confirmIcon}><HiCheck /></div>
      <h1 className={styles.confirmTitle}>Thank you for your order!</h1>
      <p className={styles.confirmSub}>
        {subscription_number
          ? `Order ${subscription_number} has been placed successfully.`
          : 'Your order has been placed successfully.'
        }
        {total && ` Total: $${Number(total).toFixed(2)}`}
      </p>
      <div className={styles.confirmActions}>
        <Link to="/my-orders" className={styles.confirmBtn} style={{ background: '#714B67', color: 'white' }}>View My Orders</Link>
        <Link to="/shop" className={styles.confirmBtn} style={{ border: '1px solid #E5E7EB', color: '#374151' }}>Continue Shopping</Link>
        <button className={styles.confirmBtn} style={{ border: '1px solid #E5E7EB', color: '#374151' }} onClick={() => window.print()}>Print</button>
      </div>
    </div>
  );
}
