import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HiOutlineTrash } from 'react-icons/hi';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import styles from './Portal.module.css';

export default function CartPage() {
  const { cartItems, removeItem, updateQuantity } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [discountCode, setDiscountCode] = useState('');
  const [discount, setDiscount] = useState(null);
  const [discountError, setDiscountError] = useState('');

  const subtotal = cartItems.reduce((sum, item) => sum + Number(item.unit_price) * item.quantity, 0);
  const discountAmount = discount
    ? discount.discount_type === 'percentage'
      ? subtotal * discount.value / 100
      : Math.min(discount.value, subtotal)
    : 0;
  const total = subtotal - discountAmount;

  const handleApplyDiscount = async () => {
    if (!discountCode.trim()) return;
    setDiscountError('');
    try {
      const res = await api.post('/discounts/validate-code', { name: discountCode.trim() });
      if (res.data.valid) {
        setDiscount(res.data);
      } else {
        setDiscountError(res.data.reason || 'Invalid discount code');
        setDiscount(null);
      }
    } catch {
      setDiscountError('Invalid discount code');
      setDiscount(null);
    }
  };

  const handleCheckout = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    navigate('/checkout', { state: { discount } });
  };

  if (cartItems.length === 0) {
    return (
      <div className={styles.empty}>
        <h3>Your cart is empty</h3>
        <p>Browse our shop to find products you love.</p>
        <Link to="/shop" className={styles.checkoutBtn} style={{ display: 'inline-block', maxWidth: 200 }}>
          Browse Shop
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h2 className={styles.sectionTitle}>Shopping Cart</h2>
      <div className={styles.cartLayout}>
        <div className={styles.cartItems}>
          {cartItems.map((item) => (
            <div key={item.id} className={styles.cartItem}>
              <div className={styles.cartItemInfo}>
                <h4>{item.product_name || `Product #${item.product_id}`}</h4>
                <p>
                  {item.variant_name && `${item.variant_name} | `}
                  ${Number(item.unit_price).toFixed(2)} each
                </p>
              </div>
              <div className={styles.cartItemActions}>
                <div className={styles.quantityControl}>
                  <button onClick={() => item.quantity > 1 && updateQuantity(item.id, item.quantity - 1)}>-</button>
                  <span>{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
                </div>
                <span className={styles.cartItemPrice}>${(Number(item.unit_price) * item.quantity).toFixed(2)}</span>
                <button className={styles.cartRemove} onClick={() => removeItem(item.id)} title="Remove">
                  <HiOutlineTrash />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.cartSummary}>
          <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Order Summary</h3>
          <div className={styles.discountInput}>
            <input
              placeholder="Discount code"
              value={discountCode}
              onChange={(e) => setDiscountCode(e.target.value)}
            />
            <button onClick={handleApplyDiscount}>Apply</button>
          </div>
          {discountError && <div className={styles.alertError} style={{ marginBottom: 12, padding: '8px 12px', fontSize: 13 }}>{discountError}</div>}
          {discount && <div className={styles.alertSuccess} style={{ marginBottom: 12, padding: '8px 12px', fontSize: 13 }}>Discount applied: {discount.discount_type === 'percentage' ? `${discount.value}%` : `$${discount.value}`} off</div>}

          <div className={styles.summaryRow}><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
          {discountAmount > 0 && <div className={styles.summaryRow}><span>Discount</span><span style={{ color: '#059669' }}>-${discountAmount.toFixed(2)}</span></div>}
          <div className={styles.summaryTotal}><span>Total</span><span>${total.toFixed(2)}</span></div>

          <button className={styles.checkoutBtn} onClick={handleCheckout}>
            Proceed to Checkout
          </button>
        </div>
      </div>
    </div>
  );
}
