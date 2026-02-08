import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import styles from './Portal.module.css';

export default function CartPage() {
  const { cartItems, removeItem, updateQuantity, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('order');
  const [discountCode, setDiscountCode] = useState('');
  const [discount, setDiscount] = useState(null);
  const [discountError, setDiscountError] = useState('');
  const [discountSuccess, setDiscountSuccess] = useState('');
  const [address, setAddress] = useState({ street: '', city: '', state: '', zip_code: '', country: '' });
  const [paymentMethod, setPaymentMethod] = useState('credit_card');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [plans, setPlans] = useState([]);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/recurring-plans/').then((res) => setPlans(res.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (user) {
      setAddress({ street: user.street || '', city: user.city || '', state: user.state || '', zip_code: user.zip_code || '', country: user.country || '' });
    }
  }, [user]);

  const subtotal = cartItems.reduce((sum, item) => sum + Number(item.unit_price) * item.quantity, 0);
  const discountAmount = discount
    ? discount.discount_type === 'percentage' ? subtotal * discount.value / 100 : Math.min(discount.value, subtotal)
    : 0;
  const taxAmount = (subtotal - discountAmount) * 0.15;
  const total = subtotal - discountAmount + taxAmount;

  const handleApplyDiscount = async () => {
    if (!discountCode.trim()) return;
    setDiscountError(''); setDiscountSuccess('');
    try {
      const res = await api.post('/discounts/validate-code', { name: discountCode.trim() });
      if (res.data.valid) { setDiscount(res.data); setDiscountSuccess('You have successfully applied'); }
      else { setDiscountError(res.data.reason || 'Invalid discount code'); setDiscount(null); }
    } catch { setDiscountError('Invalid discount code'); setDiscount(null); }
  };

  const handlePlaceOrder = async () => {
    if (!user) { navigate('/login'); return; }
    if (!selectedPlanId) { setError('Please select a subscription plan'); return; }
    setPlacing(true); setError('');
    try {
      const res = await api.post('/checkout/', {
        plan_id: Number(selectedPlanId), payment_method: paymentMethod,
        discount_code: discount?.name || null, ...address,
      });
      await clearCart();
      navigate(`/order-confirmation/${res.data.subscription_id}`, {
        state: { subscription_number: res.data.subscription_number, total: res.data.total, items: cartItems, discountAmount, taxAmount },
      });
    } catch (err) { setError(err.response?.data?.detail || 'Failed to place order'); }
    setPlacing(false);
  };

  if (cartItems.length === 0) {
    return (
      <div className={styles.empty}>
        <h3>Your cart is empty</h3>
        <p>Browse our shop to find products you love.</p>
        <Link to="/shop" className={styles.checkoutBtn} style={{ display: 'inline-block', maxWidth: 200 }}>Browse Shop</Link>
      </div>
    );
  }

  return (
    <div>
      {/* Tabs: Order | Address | Payment */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid #E5E7EB', marginBottom: 24 }}>
        {[['order', 'Order'], ['address', 'Address'], ['payment', 'Payment']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} style={{
            padding: '12px 24px', fontSize: 15, fontWeight: tab === key ? 600 : 400,
            color: tab === key ? '#714B67' : '#9CA3AF', background: 'none', border: 'none',
            borderBottom: tab === key ? '2px solid #714B67' : '2px solid transparent',
            cursor: 'pointer', marginBottom: -2,
          }}>{label}</button>
        ))}
      </div>

      <div className={styles.cartLayout}>
        {/* Left content */}
        <div className={styles.cartItems}>
          {tab === 'order' && (
            <>
              {cartItems.map((item) => (
                <div key={item.id} className={styles.cartItem}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1 }}>
                    <div style={{ width: 50, height: 50, background: '#F3F0F2', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#714B67' }}>img</div>
                    <div>
                      <h4 style={{ fontSize: 15, fontWeight: 600, color: '#1F2937', marginBottom: 4 }}>{item.product_name || `Product #${item.product_id}`}</h4>
                      <button onClick={() => removeItem(item.id)} style={{ fontSize: 12, color: '#DC2626', background: 'none', border: '1px solid #FCA5A5', borderRadius: 4, padding: '2px 8px', cursor: 'pointer' }}>Remove</button>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                    <span style={{ fontSize: 14, color: '#6B7280' }}>₹{Number(item.unit_price).toFixed(0)}</span>
                    <div className={styles.quantityControl} style={{ marginBottom: 0 }}>
                      <button onClick={() => item.quantity > 1 && updateQuantity(item.id, item.quantity - 1)}>-</button>
                      <span>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
                    </div>
                  </div>
                </div>
              ))}
              {discount && (
                <div className={styles.cartItem} style={{ color: '#059669' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1 }}>
                    <div style={{ width: 50, height: 50, background: '#D1FAE5', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: '#059669', fontWeight: 700 }}>%</div>
                    <div>
                      <span style={{ fontWeight: 500 }}>{discount.discount_type === 'percentage' ? `${discount.value}% on your order` : discount.name}</span>
                      <br />
                      <button onClick={() => { setDiscount(null); setDiscountCode(''); setDiscountSuccess(''); }} style={{ fontSize: 12, color: '#DC2626', background: 'none', border: '1px solid #FCA5A5', borderRadius: 4, padding: '2px 8px', cursor: 'pointer', marginTop: 4 }}>Remove</button>
                    </div>
                  </div>
                  <span style={{ fontWeight: 600 }}>-₹{discountAmount.toFixed(0)}</span>
                </div>
              )}
            </>
          )}

          {tab === 'address' && (
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Billing Address</h3>
              <p style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 16 }}>Your default address is loaded below. Modify if needed.</p>
              <div className={styles.formGroup}><label>Street</label><input value={address.street} onChange={(e) => setAddress({ ...address, street: e.target.value })} /></div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}><label>City</label><input value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} /></div>
                <div className={styles.formGroup}><label>State</label><input value={address.state} onChange={(e) => setAddress({ ...address, state: e.target.value })} /></div>
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}><label>ZIP Code</label><input value={address.zip_code} onChange={(e) => setAddress({ ...address, zip_code: e.target.value })} /></div>
                <div className={styles.formGroup}><label>Country</label><input value={address.country} onChange={(e) => setAddress({ ...address, country: e.target.value })} /></div>
              </div>
            </div>
          )}

          {tab === 'payment' && (
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Payment</h3>
              <div className={styles.formGroup}><label>Subscription Plan</label>
                <select value={selectedPlanId} onChange={(e) => setSelectedPlanId(e.target.value)}>
                  <option value="">Select a plan...</option>
                  {plans.map((p) => <option key={p.id} value={p.id}>{p.name} - ₹{Number(p.price).toFixed(0)}/{p.billing_period}</option>)}
                </select>
              </div>
              <div className={styles.formGroup}><label>Payment Method</label>
                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                  <option value="credit_card">Credit Card</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cash">Cash</option>
                </select>
              </div>
              {error && <div className={styles.alertError} style={{ padding: '8px 12px', fontSize: 13 }}>{error}</div>}
            </div>
          )}
        </div>

        {/* Right: Persistent summary */}
        <div className={styles.cartSummary}>
          <div className={styles.summaryRow}><span>Subtotal</span><span>₹{subtotal.toFixed(0)}</span></div>
          {discountAmount > 0 && <div className={styles.summaryRow}><span>Discount</span><span style={{ color: '#059669' }}>-₹{discountAmount.toFixed(0)}</span></div>}
          <div className={styles.summaryRow}><span>Taxes</span><span>₹{taxAmount.toFixed(0)}</span></div>
          <div className={styles.summaryTotal}><span>Total</span><span>₹{total.toFixed(0)}</span></div>

          {!discount && (
            <>
              <div className={styles.discountInput}>
                <input placeholder="Discount code" value={discountCode} onChange={(e) => setDiscountCode(e.target.value)} />
                <button onClick={handleApplyDiscount}>Apply</button>
              </div>
              {discountError && <div className={styles.alertError} style={{ marginBottom: 8, padding: '6px 10px', fontSize: 12 }}>{discountError}</div>}
            </>
          )}
          {discountSuccess && <div className={styles.alertSuccess} style={{ marginBottom: 8, padding: '6px 10px', fontSize: 12 }}>{discountSuccess}</div>}

          <button className={styles.checkoutBtn} onClick={() => {
            if (tab === 'payment') { handlePlaceOrder(); }
            else if (!user) { navigate('/login'); }
            else { setTab(tab === 'order' ? 'address' : 'payment'); }
          }} disabled={placing}>
            {tab === 'payment' ? (placing ? 'Placing Order...' : 'Checkout') : tab === 'order' ? 'Continue' : 'Continue to Payment'}
          </button>
        </div>
      </div>
    </div>
  );
}
