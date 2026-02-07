import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { HiCheck } from 'react-icons/hi';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import styles from './Portal.module.css';

export default function CheckoutPage() {
  const { cartItems, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const discount = location.state?.discount || null;

  const [step, setStep] = useState(1);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState('');
  const [address, setAddress] = useState({
    street: user?.street || '',
    city: user?.city || '',
    state: user?.state || '',
    zip_code: user?.zip_code || '',
    country: user?.country || '',
  });
  const [paymentMethod, setPaymentMethod] = useState('credit_card');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [plans, setPlans] = useState([]);

  useState(() => {
    api.get('/recurring-plans/').then((res) => setPlans(res.data || [])).catch(() => {});
  }, []);

  const subtotal = cartItems.reduce((sum, item) => sum + Number(item.unit_price) * item.quantity, 0);
  const discountAmount = discount
    ? discount.discount_type === 'percentage'
      ? subtotal * discount.value / 100
      : Math.min(discount.value, subtotal)
    : 0;
  const total = subtotal - discountAmount;

  const handlePlaceOrder = async () => {
    if (!selectedPlanId) {
      setError('Please select a subscription plan');
      return;
    }
    setPlacing(true);
    setError('');
    try {
      const res = await api.post('/checkout/', {
        plan_id: Number(selectedPlanId),
        payment_method: paymentMethod,
        discount_code: discount?.name || null,
        ...address,
      });
      await clearCart();
      navigate(`/order-confirmation/${res.data.subscription_id}`, {
        state: {
          subscription_number: res.data.subscription_number,
          invoice_number: res.data.invoice_number,
          total: res.data.total,
        },
      });
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to place order');
    }
    setPlacing(false);
  };

  if (cartItems.length === 0) {
    return (
      <div className={styles.empty}>
        <h3>Your cart is empty</h3>
        <p>Add items to your cart before checking out.</p>
      </div>
    );
  }

  return (
    <div>
      <div className={styles.steps}>
        <div className={`${styles.step} ${step >= 1 ? styles.stepActive : ''} ${step > 1 ? styles.stepDone : ''}`}>
          <span className={styles.stepNumber}>1</span> Order
        </div>
        <div className={styles.stepDivider} />
        <div className={`${styles.step} ${step >= 2 ? styles.stepActive : ''} ${step > 2 ? styles.stepDone : ''}`}>
          <span className={styles.stepNumber}>2</span> Address
        </div>
        <div className={styles.stepDivider} />
        <div className={`${styles.step} ${step >= 3 ? styles.stepActive : ''}`}>
          <span className={styles.stepNumber}>3</span> Payment
        </div>
      </div>

      <div className={styles.checkoutForm}>
        {step === 1 && (
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20 }}>Order Review</h3>
            {cartItems.map((item) => (
              <div key={item.id} className={styles.cartItem}>
                <div className={styles.cartItemInfo}>
                  <h4>{item.product_name || `Product #${item.product_id}`}</h4>
                  <p>Qty: {item.quantity}</p>
                </div>
                <span className={styles.cartItemPrice}>${(Number(item.unit_price) * item.quantity).toFixed(2)}</span>
              </div>
            ))}
            <div className={styles.summaryRow}><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
            {discountAmount > 0 && <div className={styles.summaryRow}><span>Discount</span><span style={{color:'#059669'}}>-${discountAmount.toFixed(2)}</span></div>}
            <div className={styles.summaryTotal}><span>Total</span><span>${total.toFixed(2)}</span></div>
            <div className={styles.btnRow}>
              <button className={styles.nextBtn} onClick={() => setStep(2)}>Continue</button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20 }}>Billing Address</h3>
            <div className={styles.formGroup}>
              <label>Street</label>
              <input value={address.street} onChange={(e) => setAddress({ ...address, street: e.target.value })} />
            </div>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>City</label>
                <input value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} />
              </div>
              <div className={styles.formGroup}>
                <label>State</label>
                <input value={address.state} onChange={(e) => setAddress({ ...address, state: e.target.value })} />
              </div>
            </div>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>ZIP Code</label>
                <input value={address.zip_code} onChange={(e) => setAddress({ ...address, zip_code: e.target.value })} />
              </div>
              <div className={styles.formGroup}>
                <label>Country</label>
                <input value={address.country} onChange={(e) => setAddress({ ...address, country: e.target.value })} />
              </div>
            </div>
            <div className={styles.btnRow}>
              <button className={styles.backBtn} onClick={() => setStep(1)}>Back</button>
              <button className={styles.nextBtn} onClick={() => setStep(3)}>Continue</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20 }}>Payment</h3>
            <div className={styles.formGroup}>
              <label>Subscription Plan</label>
              <select value={selectedPlanId} onChange={(e) => setSelectedPlanId(e.target.value)}>
                <option value="">Select a plan...</option>
                {plans.map((plan) => (
                  <option key={plan.id} value={plan.id}>{plan.name} - ${Number(plan.price).toFixed(2)}/{plan.billing_period}</option>
                ))}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>Payment Method</label>
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                <option value="credit_card">Credit Card</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cash">Cash</option>
              </select>
            </div>
            <div className={styles.summaryTotal}><span>Total</span><span>${total.toFixed(2)}</span></div>
            {error && <div className={styles.alertError}>{error}</div>}
            <div className={styles.btnRow}>
              <button className={styles.backBtn} onClick={() => setStep(2)}>Back</button>
              <button className={styles.nextBtn} onClick={handlePlaceOrder} disabled={placing}>
                {placing ? 'Placing Order...' : 'Place Order'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
