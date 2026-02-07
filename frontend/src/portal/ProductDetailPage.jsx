import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { HiOutlineCube } from 'react-icons/hi';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import styles from './Portal.module.css';

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
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

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
    const base = Number(product?.price || 0);
    const extra = selectedVariant ? Number(selectedVariant.extra_price || 0) : 0;
    return base + extra;
  };

  const handleAddToCart = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setAdding(true);
    try {
      await addToCart(
        product.id,
        quantity,
        getPrice(),
        selectedVariant?.id || null,
        null
      );
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch {
      // silent
    }
    setAdding(false);
  };

  if (loading) return <div className={styles.empty}><p>Loading...</p></div>;
  if (!product) return <div className={styles.empty}><h3>Product not found</h3></div>;

  const variants = product.variants || [];

  return (
    <div>
      <div className={styles.detailLayout}>
        <div className={styles.detailImage}>
          <HiOutlineCube />
        </div>
        <div>
          <h1 className={styles.detailName}>{product.name}</h1>
          <div className={styles.detailType}>{product.product_type || 'Product'}</div>
          <div className={styles.detailPrice}>${getPrice().toLocaleString()}</div>
          {product.description && (
            <p className={styles.detailDesc}>{product.description}</p>
          )}

          {variants.length > 0 && (
            <div className={styles.variantSection}>
              <div className={styles.variantTitle}>Variants</div>
              <div className={styles.variantOptions}>
                {variants.map((v) => (
                  <button
                    key={v.id}
                    className={`${styles.variantBtn} ${selectedVariant?.id === v.id ? styles.variantBtnActive : ''}`}
                    onClick={() => setSelectedVariant(selectedVariant?.id === v.id ? null : v)}
                  >
                    {v.attribute_name}: {v.attribute_value}
                    {v.extra_price > 0 && ` (+$${Number(v.extra_price).toLocaleString()})`}
                  </button>
                ))}
              </div>
            </div>
          )}

          {plans.length > 0 && (
            <div className={styles.planTiers}>
              <div className={styles.variantTitle}>Available Plans</div>
              {plans.map((plan) => (
                <div key={plan.id} className={styles.planTier}>
                  <span className={styles.planTierName}>{plan.name}</span>
                  <span className={styles.planTierPrice}>${Number(plan.price).toLocaleString()}/{plan.billing_period}</span>
                </div>
              ))}
            </div>
          )}

          <div className={styles.quantityControl}>
            <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
            <span>{quantity}</span>
            <button onClick={() => setQuantity(quantity + 1)}>+</button>
          </div>

          <button className={styles.addToCartBtn} onClick={handleAddToCart} disabled={adding}>
            {added ? 'Added to Cart!' : adding ? 'Adding...' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </div>
  );
}
