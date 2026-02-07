import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { HiOutlineCube, HiSearch } from 'react-icons/hi';
import api from '../api';
import styles from './Portal.module.css';

export default function ShopPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [selectedTypes, setSelectedTypes] = useState([]);

  useEffect(() => {
    api.get('/products/public')
      .then((res) => setProducts(res.data || []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  const productTypes = [...new Set(products.map((p) => p.product_type).filter(Boolean))];

  const toggleType = (type) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const filtered = products
    .filter((p) => {
      if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (selectedTypes.length > 0 && !selectedTypes.includes(p.product_type)) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'price_asc') return Number(a.price || 0) - Number(b.price || 0);
      if (sortBy === 'price_desc') return Number(b.price || 0) - Number(a.price || 0);
      return (a.name || '').localeCompare(b.name || '');
    });

  if (loading) {
    return <div className={styles.empty}><p>Loading products...</p></div>;
  }

  return (
    <div>
      <h2 className={styles.sectionTitle}>All Products</h2>
      <div className={styles.shopLayout}>
        <aside className={styles.shopSidebar}>
          <div className={styles.filterGroup}>
            <div className={styles.filterTitle}>Search</div>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: '100%', padding: '8px 8px 8px 32px', border: '1px solid #E5E7EB', borderRadius: 6, fontSize: 14 }}
              />
              <HiSearch style={{ position: 'absolute', left: 8, top: 10, color: '#9CA3AF' }} />
            </div>
          </div>

          {productTypes.length > 0 && (
            <div className={styles.filterGroup}>
              <div className={styles.filterTitle}>Product Type</div>
              {productTypes.map((type) => (
                <label key={type} className={styles.filterLabel}>
                  <input
                    type="checkbox"
                    checked={selectedTypes.includes(type)}
                    onChange={() => toggleType(type)}
                  />
                  {type}
                </label>
              ))}
            </div>
          )}
        </aside>

        <div>
          <div className={styles.shopToolbar}>
            <span className={styles.shopCount}>{filtered.length} products</span>
            <div className={styles.shopSort}>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="name">Sort by Name</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className={styles.empty}>
              <h3>No products found</h3>
              <p>Try different search terms or filters.</p>
            </div>
          ) : (
            <div className={styles.productGrid}>
              {filtered.map((product) => (
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
      </div>
    </div>
  );
}
