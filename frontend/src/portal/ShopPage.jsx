import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { HiOutlineCube, HiSearch } from 'react-icons/hi';
import api from '../api';
import styles from './Portal.module.css';

const IMG_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:8000');

export default function ShopPage() {
  const [products, setProducts] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/products/public'),
      api.get('/recurring-plans/').catch(() => ({ data: [] })),
    ])
      .then(([prodRes, plansRes]) => {
        setProducts(prodRes.data || []);
        setPlans(plansRes.data || []);
      })
      .catch(() => { setProducts([]); setPlans([]); })
      .finally(() => setLoading(false));
  }, []);

  const productTypes = [...new Set(products.map((p) => p.product_type).filter(Boolean))];
  const categories = useMemo(
    () => [...new Set(products.map((p) => p.category).filter(Boolean))].sort(),
    [products]
  );

  const toggleType = (type) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const toggleCategory = (cat) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const filtered = products
    .filter((p) => {
      if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (selectedTypes.length > 0 && !selectedTypes.includes(p.product_type)) return false;
      if (selectedCategories.length > 0 && !selectedCategories.includes(p.category)) return false;
      const price = Number(p.sales_price || p.price || 0);
      if (priceMin !== '' && price < Number(priceMin)) return false;
      if (priceMax !== '' && price > Number(priceMax)) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'price_asc') return Number(a.sales_price || a.price || 0) - Number(b.sales_price || b.price || 0);
      if (sortBy === 'price_desc') return Number(b.sales_price || b.price || 0) - Number(a.sales_price || a.price || 0);
      return (a.name || '').localeCompare(b.name || '');
    });

  const cheapestPlan = plans.length > 0
    ? plans.reduce((min, p) => Number(p.price) < Number(min.price) ? p : min, plans[0])
    : null;

  if (loading) {
    return <div className={styles.empty}><p>Loading products...</p></div>;
  }

  return (
    <div>
      <h2 className={styles.sectionTitle}>All Products</h2>
      <div style={{ fontSize: 13, color: '#9CA3AF', marginTop: -16, marginBottom: 20 }}>
        {productTypes.length > 0 ? productTypes.join(', ') : 'Browse our catalog'}
      </div>
      <div className={styles.shopLayout}>
        <aside className={styles.shopSidebar}>
          {categories.length > 0 && (
            <div className={styles.filterGroup}>
              <div className={styles.filterTitle}>Category</div>
              {categories.map((cat) => (
                <label key={cat} className={styles.filterLabel}>
                  <input type="checkbox" checked={selectedCategories.includes(cat)} onChange={() => toggleCategory(cat)} />
                  {cat}
                </label>
              ))}
            </div>
          )}

          <div className={styles.filterGroup}>
            <div className={styles.filterTitle}>Price Range</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input type="number" placeholder="Min" value={priceMin} onChange={(e) => setPriceMin(e.target.value)} min="0" step="0.01" style={{ width: '100%', padding: '8px', border: '1px solid #E5E7EB', borderRadius: 6, fontSize: 13 }} />
              <span style={{ color: '#9CA3AF', fontSize: 13 }}>-</span>
              <input type="number" placeholder="Max" value={priceMax} onChange={(e) => setPriceMax(e.target.value)} min="0" step="0.01" style={{ width: '100%', padding: '8px', border: '1px solid #E5E7EB', borderRadius: 6, fontSize: 13 }} />
            </div>
            {(priceMin !== '' || priceMax !== '') && (
              <button onClick={() => { setPriceMin(''); setPriceMax(''); }} style={{ marginTop: 6, fontSize: 12, color: '#714B67', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                Clear price filter
              </button>
            )}
          </div>

          {productTypes.length > 0 && (
            <div className={styles.filterGroup}>
              <div className={styles.filterTitle}>Product Type</div>
              {productTypes.map((type) => (
                <label key={type} className={styles.filterLabel}>
                  <input type="checkbox" checked={selectedTypes.includes(type)} onChange={() => toggleType(type)} />
                  {type}
                </label>
              ))}
            </div>
          )}
        </aside>

        <div>
          <div className={styles.shopToolbar}>
            <div style={{ position: 'relative', flex: 1, maxWidth: 320 }}>
              <input type="text" placeholder="Search" value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: '100%', padding: '8px 8px 8px 32px', border: '1px solid #E5E7EB', borderRadius: 6, fontSize: 14 }} />
              <HiSearch style={{ position: 'absolute', left: 8, top: 10, color: '#9CA3AF' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span className={styles.shopCount}>{filtered.length} products</span>
              <div className={styles.shopSort}>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                  <option value="name">Sort by: Name</option>
                  <option value="price_asc">Sort by: Price Low</option>
                  <option value="price_desc">Sort by: Price High</option>
                </select>
              </div>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className={styles.empty}><h3>No products found</h3><p>Try different search terms or filters.</p></div>
          ) : (
            <div className={styles.productGrid}>
              {filtered.map((product) => {
                const price = Number(product.sales_price || product.price || 0);
                return (
                  <Link to={`/shop/${product.id}`} key={product.id} className={styles.productCard}>
                    <div className={styles.productImage}>
                      {product.image_url ? (
                        <img src={`${IMG_BASE}/${product.image_url}`} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }} />
                      ) : (
                        <HiOutlineCube />
                      )}
                    </div>
                    <div className={styles.productInfo}>
                      <div className={styles.productName}>{product.name}</div>
                      <div className={styles.productDesc}>{product.description || product.product_type || 'Product'}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 8 }}>
                        <div className={styles.productPrice}>₹{price.toLocaleString()}</div>
                        {cheapestPlan && (
                          <div style={{ fontSize: 12, color: '#6B7280' }}>{cheapestPlan.billing_period}</div>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
