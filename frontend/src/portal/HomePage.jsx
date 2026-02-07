import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { HiOutlineCube } from 'react-icons/hi';
import api from '../api';
import styles from './Portal.module.css';

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/products/public')
      .then((res) => setProducts((res.data || []).slice(0, 6)))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className={styles.hero}>
        <h1 className={styles.heroTitle}>SubTrack</h1>
        <p className={styles.heroSubtitle}>
          Your all-in-one subscription management platform. Browse our catalog and subscribe to the products you love.
        </p>
        <Link to="/shop" className={styles.heroBtn}>Browse Shop</Link>
      </div>

      <h2 className={styles.sectionTitle}>Featured Products</h2>

      {loading ? (
        <div className={styles.empty}><p>Loading products...</p></div>
      ) : products.length === 0 ? (
        <div className={styles.empty}>
          <h3>No products available</h3>
          <p>Check back soon for new products.</p>
        </div>
      ) : (
        <div className={styles.productGrid}>
          {products.map((product) => (
            <Link to={`/shop/${product.id}`} key={product.id} className={styles.productCard}>
              <div className={styles.productImage}>
                <HiOutlineCube />
              </div>
              <div className={styles.productInfo}>
                <div className={styles.productName}>{product.name}</div>
                <div className={styles.productType}>{product.product_type || 'Product'}</div>
                <div className={styles.productPrice}>${Number(product.price || 0).toLocaleString()}</div>
                {product.description && (
                  <div className={styles.productDesc}>{product.description}</div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
