import { useParams, useLocation, Link } from 'react-router-dom';
import styles from './Portal.module.css';

export default function OrderConfirmationPage() {
  const { orderId } = useParams();
  const location = useLocation();
  const { subscription_number, total, items, discountAmount, taxAmount } = location.state || {};

  const subtotal = (items || []).reduce((sum, item) => sum + Number(item.unit_price) * item.quantity, 0);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 32 }}>
      {/* Left: Confirmation message */}
      <div className={styles.confirmation} style={{ textAlign: 'left', padding: 40 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#1F2937', marginBottom: 12 }}>
          Thanks you for your order
        </h1>
        <h2 style={{ fontSize: 20, fontWeight: 600, color: '#714B67', marginBottom: 16 }}>
          Order {subscription_number || `#${orderId}`}
        </h2>
        <div style={{ background: '#D1FAE5', color: '#065F46', padding: '12px 16px', borderRadius: 8, fontSize: 14, marginBottom: 24 }}>
          Your payment has been processed
        </div>
        <div className={styles.confirmActions} style={{ justifyContent: 'flex-start' }}>
          <Link to={`/my-orders/${orderId}`} className={styles.confirmBtn} style={{ background: '#714B67', color: 'white' }}>
            View Order
          </Link>
          <button className={styles.confirmBtn} style={{ border: '1px solid #E5E7EB', color: '#374151' }} onClick={() => window.print()}>
            Print
          </button>
          <Link to="/shop" className={styles.confirmBtn} style={{ border: '1px solid #E5E7EB', color: '#374151' }}>
            Continue Shopping
          </Link>
        </div>
      </div>

      {/* Right: Order summary */}
      <div className={styles.cartSummary}>
        {items && items.length > 0 && items.map((item, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #F3F4F6' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, background: '#F3F0F2', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#714B67' }}>img</div>
              <span style={{ fontSize: 14, fontWeight: 500 }}>{item.product_name || 'Product'}</span>
            </div>
            <span style={{ fontWeight: 600, fontSize: 14 }}>₹{(Number(item.unit_price) * item.quantity).toFixed(0)}</span>
          </div>
        ))}
        {discountAmount > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #F3F4F6', color: '#059669' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, background: '#D1FAE5', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: '#059669' }}>%</div>
              <span style={{ fontSize: 14 }}>Discount</span>
            </div>
            <span style={{ fontWeight: 600, fontSize: 14 }}>-₹{discountAmount.toFixed(0)}</span>
          </div>
        )}
        <div style={{ marginTop: 16 }}>
          <div className={styles.summaryRow}><span>Subtotal</span><span>₹{subtotal.toFixed(0)}</span></div>
          <div className={styles.summaryRow}><span>Taxes</span><span>₹{(taxAmount || 0).toFixed(0)}</span></div>
          <div className={styles.summaryTotal}><span>Total</span><span>₹{Number(total || 0).toFixed(0)}</span></div>
        </div>
      </div>
    </div>
  );
}
