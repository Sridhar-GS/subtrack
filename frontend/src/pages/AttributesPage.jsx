import { useState, useEffect } from 'react';
import { HiSearch, HiPlus, HiPencil, HiTrash, HiX } from 'react-icons/hi';
import api from '../api';
import styles from './Page.module.css';

export default function AttributesPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [variantForm, setVariantForm] = useState({ attribute_name: '', attribute_value: '', extra_price: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/products/');
      setProducts(res.data || []);
    } catch {
      setProducts([]);
    }
    setLoading(false);
  };

  const allVariants = products.flatMap((p) =>
    (p.variants || []).map((v) => ({ ...v, productName: p.name, productId: p.id }))
  );

  const attributeGroups = {};
  allVariants.forEach((v) => {
    const key = v.attribute_name || 'Unknown';
    if (!attributeGroups[key]) attributeGroups[key] = [];
    attributeGroups[key].push(v);
  });

  const filtered = Object.entries(attributeGroups).filter(([name]) =>
    name.toLowerCase().includes(search.toLowerCase())
  );

  const openAddVariant = (product) => {
    setEditingProduct(product);
    setVariantForm({ attribute_name: '', attribute_value: '', extra_price: '' });
    setError('');
    setShowModal(true);
  };

  const handleSaveVariant = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post(`/products/${editingProduct.id}/variants`, {
        attribute_name: variantForm.attribute_name,
        attribute_value: variantForm.attribute_value,
        extra_price: parseFloat(variantForm.extra_price) || 0,
      });
      setShowModal(false);
      fetchProducts();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to add variant');
    }
  };

  const handleDeleteVariant = async (productId, variantId) => {
    if (!window.confirm('Delete this variant?')) return;
    try {
      await api.delete(`/products/${productId}/variants/${variantId}`);
      fetchProducts();
    } catch { /* ignore */ }
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}><div className={styles.spinner} /></div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <HiSearch />
          <input
            type="text"
            placeholder="Search attributes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className={styles.card}>
          <div className={styles.empty}>
            <p>No product attributes found. Add variants to products to see them here.</p>
          </div>
        </div>
      ) : (
        filtered.map(([attrName, variants]) => (
          <div key={attrName} className={styles.card} style={{ marginBottom: 16 }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>{attrName}</h3>
              <span style={{ fontSize: 13, color: '#9CA3AF' }}>{variants.length} value{variants.length !== 1 ? 's' : ''}</span>
            </div>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Value</th>
                    <th>Extra Price</th>
                    <th>Product</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {variants.map((v) => (
                    <tr key={v.id}>
                      <td style={{ fontWeight: 500 }}>{v.attribute_value}</td>
                      <td>${Number(v.extra_price || 0).toFixed(2)}</td>
                      <td>{v.productName}</td>
                      <td>
                        <div className={styles.actions}>
                          <button className={styles.actionsDanger} title="Delete" onClick={() => handleDeleteVariant(v.productId, v.id)}>
                            <HiTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}

      <div style={{ marginTop: 20 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Add Variant to Product</h3>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {products.map((p) => (
            <button key={p.id} className={styles.btnSecondary} onClick={() => openAddVariant(p)}>
              <HiPlus /> {p.name}
            </button>
          ))}
        </div>
      </div>

      {showModal && (
        <div className={styles.overlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Add Variant to {editingProduct?.name}</h2>
              <button className={styles.modalClose} onClick={() => setShowModal(false)}><HiX /></button>
            </div>
            <form onSubmit={handleSaveVariant}>
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label>Attribute Name</label>
                  <input className={styles.formControl} value={variantForm.attribute_name} onChange={(e) => setVariantForm({ ...variantForm, attribute_name: e.target.value })} required placeholder="e.g. Color, Size" />
                </div>
                <div className={styles.formGroup}>
                  <label>Attribute Value</label>
                  <input className={styles.formControl} value={variantForm.attribute_value} onChange={(e) => setVariantForm({ ...variantForm, attribute_value: e.target.value })} required placeholder="e.g. Red, Large" />
                </div>
                <div className={styles.formGroup}>
                  <label>Extra Price</label>
                  <input type="number" step="0.01" className={styles.formControl} value={variantForm.extra_price} onChange={(e) => setVariantForm({ ...variantForm, extra_price: e.target.value })} placeholder="0.00" />
                </div>
                {error && <div className={styles.formError}>{error}</div>}
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className={styles.btnSecondary} onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className={styles.btnPrimary}>Add Variant</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
