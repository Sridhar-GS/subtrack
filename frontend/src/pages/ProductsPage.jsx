import { useState, useEffect } from 'react';
import {
  HiOutlineSearch,
  HiOutlinePlus,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineX,
  HiOutlineAdjustments,
} from 'react-icons/hi';
import api from '../api';
import styles from './Page.module.css';

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState({
    name: '',
    product_type: 'consumable',
    sales_price: '',
    cost_price: '',
    description: '',
  });

  // Variant modal state
  const [variantProduct, setVariantProduct] = useState(null);
  const [variants, setVariants] = useState([]);
  const [variantLoading, setVariantLoading] = useState(false);
  const [variantForm, setVariantForm] = useState({
    attribute: '',
    value: '',
    extra_price: '',
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/products/');
      setProducts(res.data);
    } catch {
      setProducts([]);
    }
    setLoading(false);
  };

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => {
    setEditing(null);
    setForm({
      name: '',
      product_type: 'consumable',
      sales_price: '',
      cost_price: '',
      description: '',
    });
    setFormError('');
    setShowModal(true);
  };

  const openEdit = (product) => {
    setEditing(product);
    setForm({
      name: product.name || '',
      product_type: product.product_type || 'consumable',
      sales_price: product.sales_price ?? '',
      cost_price: product.cost_price ?? '',
      description: product.description || '',
    });
    setFormError('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditing(null);
    setFormError('');
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setFormError('');

    const payload = {
      name: form.name,
      product_type: form.product_type,
      sales_price: parseFloat(form.sales_price) || 0,
      cost_price: parseFloat(form.cost_price) || 0,
      description: form.description,
    };

    try {
      if (editing) {
        await api.put(`/products/${editing.id}`, payload);
      } else {
        await api.post('/products/', payload);
      }
      closeModal();
      fetchProducts();
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        'Failed to save product.';
      setFormError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    }
  };

  const handleDelete = async (product) => {
    if (!window.confirm(`Delete product "${product.name}"?`)) return;
    try {
      await api.delete(`/products/${product.id}`);
      fetchProducts();
    } catch {
      // silently fail
    }
  };

  const getTypeBadge = (type) => {
    const t = (type || '').toLowerCase();
    if (t === 'service') return { className: styles.badgeQuotation, label: 'Service' };
    if (t === 'subscription') return { className: styles.badgeActive, label: 'Subscription' };
    return { className: styles.badgeDraft, label: 'Consumable' };
  };

  // --- Variant management ---

  const openVariants = async (product) => {
    setVariantProduct(product);
    setVariantForm({ attribute: '', value: '', extra_price: '' });
    setVariantLoading(true);
    try {
      const res = await api.get(`/products/${product.id}/variants`);
      setVariants(res.data);
    } catch {
      setVariants([]);
    }
    setVariantLoading(false);
  };

  const closeVariants = () => {
    setVariantProduct(null);
    setVariants([]);
  };

  const handleVariantChange = (e) => {
    setVariantForm({ ...variantForm, [e.target.name]: e.target.value });
  };

  const addVariant = async (e) => {
    e.preventDefault();
    if (!variantForm.attribute || !variantForm.value) return;
    try {
      await api.post(`/products/${variantProduct.id}/variants`, {
        attribute: variantForm.attribute,
        value: variantForm.value,
        extra_price: parseFloat(variantForm.extra_price) || 0,
      });
      setVariantForm({ attribute: '', value: '', extra_price: '' });
      const res = await api.get(`/products/${variantProduct.id}/variants`);
      setVariants(res.data);
      fetchProducts();
    } catch {
      // silently fail
    }
  };

  const deleteVariant = async (variantId) => {
    try {
      await api.delete(`/products/${variantProduct.id}/variants/${variantId}`);
      const res = await api.get(`/products/${variantProduct.id}/variants`);
      setVariants(res.data);
      fetchProducts();
    } catch {
      // silently fail
    }
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <HiOutlineSearch />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button className={styles.btnPrimary} onClick={openCreate}>
          <HiOutlinePlus /> Add Product
        </button>
      </div>

      {/* Table */}
      <div className={styles.card}>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Sales Price</th>
                <th>Cost Price</th>
                <th>Variants</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: '#9CA3AF' }}>
                    No products found
                  </td>
                </tr>
              ) : (
                filtered.map((product) => {
                  const badge = getTypeBadge(product.product_type);
                  return (
                    <tr key={product.id}>
                      <td>{product.name}</td>
                      <td>
                        <span className={`${styles.badge} ${badge.className}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td>${Number(product.sales_price || 0).toLocaleString()}</td>
                      <td>${Number(product.cost_price || 0).toLocaleString()}</td>
                      <td>{product.variants_count ?? (product.variants ? product.variants.length : 0)}</td>
                      <td>
                        <div className={styles.actions}>
                          <button
                            title="Variants"
                            onClick={() => openVariants(product)}
                          >
                            <HiOutlineAdjustments />
                          </button>
                          <button
                            title="Edit"
                            onClick={() => openEdit(product)}
                          >
                            <HiOutlinePencil />
                          </button>
                          <button
                            title="Delete"
                            className={styles.actionsDanger}
                            onClick={() => handleDelete(product)}
                          >
                            <HiOutlineTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className={styles.overlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>{editing ? 'Edit Product' : 'Add Product'}</h2>
              <button className={styles.modalClose} onClick={closeModal}>
                <HiOutlineX />
              </button>
            </div>
            <form onSubmit={handleSave}>
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label>Name</label>
                  <input
                    type="text"
                    name="name"
                    className={styles.formControl}
                    value={form.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Product Type</label>
                  <select
                    name="product_type"
                    className={styles.formControl}
                    value={form.product_type}
                    onChange={handleChange}
                  >
                    <option value="consumable">Consumable</option>
                    <option value="service">Service</option>
                    <option value="subscription">Subscription</option>
                  </select>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Sales Price</label>
                    <input
                      type="number"
                      name="sales_price"
                      className={styles.formControl}
                      value={form.sales_price}
                      onChange={handleChange}
                      step="0.01"
                      min="0"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Cost Price</label>
                    <input
                      type="number"
                      name="cost_price"
                      className={styles.formControl}
                      value={form.cost_price}
                      onChange={handleChange}
                      step="0.01"
                      min="0"
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Description</label>
                  <textarea
                    name="description"
                    className={styles.formControl}
                    value={form.description}
                    onChange={handleChange}
                    style={{ height: 'auto', minHeight: '80px', padding: '10px 12px' }}
                  />
                </div>

                {formError && <div className={styles.formError}>{formError}</div>}
              </div>
              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={closeModal}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.btnPrimary}>
                  {editing ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Variants Modal */}
      {variantProduct && (
        <div className={styles.overlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>Variants - {variantProduct.name}</h2>
              <button className={styles.modalClose} onClick={closeVariants}>
                <HiOutlineX />
              </button>
            </div>
            <div className={styles.modalBody}>
              {variantLoading ? (
                <div className={styles.loading}>
                  <div className={styles.spinner} />
                </div>
              ) : (
                <>
                  {/* Variants table */}
                  <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>Attribute</th>
                          <th>Value</th>
                          <th>Extra Price</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {variants.length === 0 ? (
                          <tr>
                            <td
                              colSpan={4}
                              style={{ textAlign: 'center', color: '#9CA3AF' }}
                            >
                              No variants yet
                            </td>
                          </tr>
                        ) : (
                          variants.map((v) => (
                            <tr key={v.id}>
                              <td>{v.attribute}</td>
                              <td>{v.value}</td>
                              <td>${Number(v.extra_price || 0).toLocaleString()}</td>
                              <td>
                                <div className={styles.actions}>
                                  <button
                                    title="Delete"
                                    className={styles.actionsDanger}
                                    onClick={() => deleteVariant(v.id)}
                                  >
                                    <HiOutlineTrash />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Add variant form */}
                  <form
                    onSubmit={addVariant}
                    style={{
                      marginTop: '16px',
                      display: 'flex',
                      gap: '10px',
                      alignItems: 'flex-end',
                      flexWrap: 'wrap',
                    }}
                  >
                    <div className={styles.formGroup} style={{ flex: 1, marginBottom: 0 }}>
                      <label>Attribute</label>
                      <input
                        type="text"
                        name="attribute"
                        className={styles.formControl}
                        value={variantForm.attribute}
                        onChange={handleVariantChange}
                        placeholder="e.g. Size"
                        required
                      />
                    </div>
                    <div className={styles.formGroup} style={{ flex: 1, marginBottom: 0 }}>
                      <label>Value</label>
                      <input
                        type="text"
                        name="value"
                        className={styles.formControl}
                        value={variantForm.value}
                        onChange={handleVariantChange}
                        placeholder="e.g. Large"
                        required
                      />
                    </div>
                    <div className={styles.formGroup} style={{ flex: 1, marginBottom: 0 }}>
                      <label>Extra Price</label>
                      <input
                        type="number"
                        name="extra_price"
                        className={styles.formControl}
                        value={variantForm.extra_price}
                        onChange={handleVariantChange}
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                      />
                    </div>
                    <button type="submit" className={styles.btnPrimary} style={{ height: '40px' }}>
                      <HiOutlinePlus /> Add
                    </button>
                  </form>
                </>
              )}
            </div>
            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={closeVariants}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
