import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { HiOutlineCube } from 'react-icons/hi';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import styles from './Portal.module.css';

const IMG_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:8000');

const PLACEHOLDER_IMAGES = [
  'linear-gradient(135deg, #F3F0F2 0%, #E8E0E6 100%)',
  'linear-gradient(135deg, #E0E7FF 0%, #C7D2FE 100%)',
  'linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)',
];

function getBillingMonths(period) {
  switch (period) {
    case 'daily': return 1 / 30;
    case 'weekly': return 7 / 30;
    case 'monthly': return 1;
    case 'quarterly': return 3;
    case 'semi_annual': return 6;
    case 'yearly': return 12;
    default: return 1;
  }
}

export default function ProductDetailPage() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [showVariants, setShowVariants] = useState(false);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [selectedImg, setSelectedImg] = useState(0);

  useEffect(() => {
    Promise.all([
      api.get(`/products/public/${productId}`),
      api.get('/recurring-plans/').catch(() => ({ data: [] })),
    ])
      .then(([prodRes, plansRes]) => {
        setProduct(prodRes.data);
        setPlans(plansRes.data || []);
      })
      .catch(() => navigate('/shop'))
      .finally(() => setLoading(false));
  }, [productId, navigate]);

  const getPrice = () => {
    const base = Number(product?.sales_price || product?.price || 0);
    const extra = selectedVariant ? Number(selectedVariant.extra_price || 0) : 0;
    return base + extra;
  };

  const handleAddToCart = async () => {
    if (!user) { navigate('/login'); return; }
    setAdding(true);
    try {
      await addToCart(product.id, quantity, getPrice(), selectedVariant?.id || null, null);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch { /* silent */ }
    setAdding(false);
  };

  if (loading) return <div className={styles.empty}><p>Loading...</p></div>;
  if (!product) return <div className={styles.empty}><h3>Product not found</h3></div>;

  const variants = product.variants || [];
  const basePrice = Number(product.sales_price || product.price || 0);

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 20 }}>
        <Link to="/shop" style={{ color: '#714B67', textDecoration: 'none' }}>All Products</Link>
        {product.product_type && <> / <span>{product.product_type}</span></>}
        {' / '}<span style={{ color: '#374151' }}>{product.name}</span>
      </div>

      <div className={styles.detailLayout}>
        {/* Left: Image gallery */}
        <div style={{ display: 'flex', gap: 16 }}>
          {product.image_url ? (
            <>
              {/* Single image display */}
              <div style={{
                flex: 1, height: 400, borderRadius: 12,
                overflow: 'hidden',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: '#F9FAFB',
              }}>
                <img
                  src={`${IMG_BASE}/${product.image_url}`}
                  alt={product.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
            </>
          ) : (
            <>
              {/* Thumbnails */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {PLACEHOLDER_IMAGES.map((bg, i) => (
                  <div
                    key={i}
                    onClick={() => setSelectedImg(i)}
                    style={{
                      width: 80, height: 80, borderRadius: 8, background: bg,
                      border: selectedImg === i ? '2px solid #714B67' : '2px solid #E5E7EB',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 24, color: '#714B67', transition: 'border-color 0.15s',
                    }}
                  >
                    <HiOutlineCube />
                  </div>
                ))}
              </div>
              {/* Main image */}
              <div style={{
                flex: 1, height: 400, borderRadius: 12,
                background: PLACEHOLDER_IMAGES[selectedImg],
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 80, color: '#714B67',
              }}>
                <HiOutlineCube />
              </div>
            </>
          )}
        </div>

        {/* Right: Product info */}
        <div>
          <h1 className={styles.detailName}>{product.name}</h1>

          {/* Pricing table showing all plans */}
          {plans.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <tbody>
                  {plans.map((plan) => {
                    const planPrice = Number(plan.price);
                    const months = getBillingMonths(plan.billing_period);
                    const perMonth = months > 0 ? planPrice / months : planPrice;
                    const monthlyBase = basePrice;
                    const discount = monthlyBase > 0 && perMonth < monthlyBase
                      ? Math.round((1 - perMonth / monthlyBase) * 100) : 0;
                    return (
                      <tr key={plan.id} style={{ borderBottom: '1px solid #E5E7EB' }}>
                        <td style={{ padding: '12px 16px', fontWeight: 500, color: '#374151' }}>
                          {plan.name}
                        </td>
                        <td style={{ padding: '12px 16px', fontWeight: 600, color: '#1F2937' }}>
                          ₹{planPrice.toLocaleString()}
                        </td>
                        <td style={{ padding: '12px 16px', color: '#6B7280' }}>
                          ₹{perMonth.toFixed(0)}/month
                        </td>
                        <td style={{ padding: '12px 8px' }}>
                          {discount > 0 && (
                            <span style={{
                              background: '#D1FAE5', color: '#059669', padding: '2px 8px',
                              borderRadius: 4, fontSize: 12, fontWeight: 600,
                            }}>
                              {discount}%
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Product category */}
          {product.category && (
            <div style={{ marginBottom: 16 }}>
              <span style={{ fontSize: 13, color: '#6B7280' }}>Category: </span>
              <span style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>{product.category}</span>
            </div>
          )}

          <hr style={{ border: 'none', borderTop: '1px solid #E5E7EB', margin: '16px 0' }} />

          {/* Variants */}
          {variants.length > 0 && (
            <div style={{ marginBottom: 20, position: 'relative' }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
                Variants Available
              </div>
              {selectedVariant ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                  <span style={{ fontSize: 14, color: '#374151' }}>
                    {selectedVariant.attribute}: {selectedVariant.value}
                    {Number(selectedVariant.extra_price) > 0 && ` (+₹${Number(selectedVariant.extra_price).toLocaleString()})`}
                  </span>
                  <button
                    onClick={() => setSelectedVariant(null)}
                    style={{ fontSize: 12, color: '#DC2626', background: 'none', border: 'none', cursor: 'pointer' }}
                  >Remove</button>
                </div>
              ) : null}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {variants.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVariant(selectedVariant?.id === v.id ? null : v)}
                    style={{
                      padding: '8px 16px', borderRadius: 8, fontSize: 13, cursor: 'pointer',
                      border: selectedVariant?.id === v.id ? '2px solid #714B67' : '2px solid #E5E7EB',
                      background: selectedVariant?.id === v.id ? '#F3F0F2' : 'white',
                      color: selectedVariant?.id === v.id ? '#714B67' : '#374151',
                      fontWeight: selectedVariant?.id === v.id ? 600 : 400,
                      transition: 'all 0.15s',
                    }}
                  >
                    {v.attribute}: {v.value}
                    {Number(v.extra_price) > 0 && ` (+₹${Number(v.extra_price).toLocaleString()})`}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity + Add to Cart */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
            <div className={styles.quantityControl} style={{ marginBottom: 0 }}>
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
              <span>{quantity}</span>
              <button onClick={() => setQuantity(quantity + 1)}>+</button>
            </div>
            <button
              className={styles.addToCartBtn}
              onClick={handleAddToCart}
              disabled={adding}
              style={{ flex: 1 }}
            >
              {added ? 'Added to Cart!' : adding ? 'Adding...' : 'Add to Cart'}
            </button>
          </div>

          {/* Flat info sections */}
          {product.terms_and_conditions && (
            <div style={{ fontSize: 14, color: '#6B7280', marginBottom: 8 }}>
              <strong style={{ color: '#374151' }}>Terms and Conditions:</strong> {product.terms_and_conditions}
            </div>
          )}
          {product.guarantee_period && (
            <div style={{ fontSize: 14, color: '#6B7280', marginBottom: 8 }}>
              <strong style={{ color: '#374151' }}>Guarantee:</strong> {product.guarantee_period}
            </div>
          )}
          {product.shipping_info && (
            <div style={{ fontSize: 14, color: '#6B7280', marginBottom: 8 }}>
              <strong style={{ color: '#374151' }}>Shipping:</strong> {product.shipping_info}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
