import { useState, useEffect, useCallback, useRef } from 'react';
import {
  HiOutlineSearch,
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlinePrinter,
  HiOutlineX,
  HiOutlinePhotograph,
} from 'react-icons/hi';
import api from '../api';
import styles from './Page.module.css';

const EMPTY_FORM = {
  name: '',
  product_type: 'service',
  sales_price: '',
  cost_price: '',
  tax_id: '',
  description: '',
};

const EMPTY_VARIANT = { attribute: '', value: '', extra_price: '' };

export default function ProductsPage() {
  // --- View toggle: 'list' or 'form' ---
  const [view, setView] = useState('list');

  // --- List view state ---
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState([]);

  // --- Form view state ---
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('recurring');

  // --- Lookups ---
  const [taxes, setTaxes] = useState([]);
  const [recurringPlans, setRecurringPlans] = useState([]);

  // --- Variants state (form view) ---
  const [variants, setVariants] = useState([]);
  const [variantForm, setVariantForm] = useState({ ...EMPTY_VARIANT });

  // --- Image upload state ---
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef(null);

  const API_BASE = api.defaults.baseURL?.replace(/\/api\/?$/, '') || 'http://localhost:8000';

  // ==================== Data fetching ====================

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/products/');
      setProducts(res.data);
    } catch {
      setProducts([]);
    }
    setLoading(false);
  }, []);

  const fetchLookups = useCallback(async () => {
    try {
      const [t, rp] = await Promise.all([
        api.get('/taxes/'),
        api.get('/recurring-plans/'),
      ]);
      setTaxes(t.data);
      setRecurringPlans(rp.data);
    } catch {
      /* ignore */
    }
  }, []);

  const fetchVariants = useCallback(async (productId) => {
    try {
      const res = await api.get(`/products/${productId}/variants`);
      setVariants(res.data);
    } catch {
      setVariants([]);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchLookups();
  }, [fetchProducts, fetchLookups]);

  // ==================== Filtering ====================

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  // ==================== List view actions ====================

  const toggleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selected.length === filtered.length) {
      setSelected([]);
    } else {
      setSelected(filtered.map((p) => p.id));
    }
  };

  const handleDeleteSelected = async () => {
    if (selected.length === 0) return;
    if (!window.confirm(`Delete ${selected.length} product(s)?`)) return;
    try {
      await Promise.all(selected.map((id) => api.delete(`/products/${id}`)));
      setSelected([]);
      fetchProducts();
    } catch {
      /* ignore */
    }
  };

  // ==================== Navigate to form ====================

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM });
    setVariants([]);
    setFormError('');
    setActiveTab('recurring');
    setImageFile(null);
    setImagePreview(null);
    setView('form');
  };

  const openEdit = async (product) => {
    setEditing(product);
    setForm({
      name: product.name || '',
      product_type: product.product_type || 'service',
      sales_price: product.sales_price ?? '',
      cost_price: product.cost_price ?? '',
      tax_id: product.tax_id ?? '',
      description: product.description || '',
    });
    setFormError('');
    setActiveTab('recurring');
    setImageFile(null);
    setImagePreview(product.image_url ? `${API_BASE}/${product.image_url}` : null);
    setView('form');
    await fetchVariants(product.id);
  };

  const backToList = () => {
    setView('list');
    setEditing(null);
    setFormError('');
    setVariants([]);
    setVariantForm({ ...EMPTY_VARIANT });
    setImageFile(null);
    setImagePreview(null);
  };

  // ==================== Form actions ====================

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setFormError('');

    const payload = {
      name: form.name,
      product_type: form.product_type,
      sales_price: parseFloat(form.sales_price) || 0,
      cost_price: parseFloat(form.cost_price) || 0,
      description: form.description || null,
    };

    try {
      let productId = editing?.id;
      if (editing) {
        await api.put(`/products/${editing.id}`, payload);
      } else {
        const res = await api.post('/products/', payload);
        productId = res.data.id;
        setEditing(res.data);
      }

      // Upload image if a new file was selected
      if (imageFile && productId) {
        setUploadingImage(true);
        const formData = new FormData();
        formData.append('file', imageFile);
        await api.post(`/products/${productId}/image`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setImageFile(null);
        setUploadingImage(false);
      }

      await fetchProducts();
      backToList();
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        'Failed to save product.';
      setFormError(typeof msg === 'string' ? msg : JSON.stringify(msg));
      setUploadingImage(false);
    }
    setSaving(false);
  };

  const handleDeleteCurrent = async () => {
    if (!editing) return;
    if (!window.confirm(`Delete product "${editing.name}"?`)) return;
    try {
      await api.delete(`/products/${editing.id}`);
      await fetchProducts();
      backToList();
    } catch {
      /* ignore */
    }
  };

  // ==================== Image actions ====================

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleRemoveImage = async () => {
    if (editing?.image_url) {
      try {
        await api.delete(`/products/${editing.id}/image`);
        setEditing({ ...editing, image_url: null });
        await fetchProducts();
      } catch {
        /* ignore */
      }
    }
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ==================== Variant actions ====================

  const handleVariantChange = (e) => {
    setVariantForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const addVariant = async (e) => {
    e.preventDefault();
    if (!editing || !variantForm.attribute || !variantForm.value) return;
    try {
      await api.post(`/products/${editing.id}/variants`, {
        attribute: variantForm.attribute,
        value: variantForm.value,
        extra_price: parseFloat(variantForm.extra_price) || 0,
      });
      setVariantForm({ ...EMPTY_VARIANT });
      await fetchVariants(editing.id);
    } catch {
      /* ignore */
    }
  };

  const deleteVariant = async (variantId) => {
    if (!editing) return;
    try {
      await api.delete(`/products/${editing.id}/variants/${variantId}`);
      await fetchVariants(editing.id);
    } catch {
      /* ignore */
    }
  };

  // ==================== Loading ====================

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>
          <div className={styles.spinner} />
        </div>
      </div>
    );
  }

  // ==================== LIST VIEW ====================

  if (view === 'list') {
    return (
      <div className={styles.page}>
        {/* Toolbar */}
        <div className={styles.toolbar}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button className={styles.btnPrimary} onClick={openCreate}>
              <HiOutlinePlus /> New
            </button>
            <button
              className={styles.btnSecondary}
              onClick={handleDeleteSelected}
              disabled={selected.length === 0}
              title="Delete selected"
            >
              <HiOutlineTrash /> Delete
            </button>
            <button
              className={styles.btnSecondary}
              onClick={() => window.print()}
              title="Print"
            >
              <HiOutlinePrinter /> Print
            </button>
          </div>
          <div className={styles.searchBox}>
            <HiOutlineSearch />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        <div className={styles.card}>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th style={{ width: 40 }}>
                    <input
                      type="checkbox"
                      checked={filtered.length > 0 && selected.length === filtered.length}
                      onChange={toggleSelectAll}
                      style={{ accentColor: '#714B67' }}
                    />
                  </th>
                  <th>Product Name</th>
                  <th>Sales Price</th>
                  <th>Cost</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', color: '#9CA3AF' }}>
                      No products found
                    </td>
                  </tr>
                ) : (
                  filtered.map((product) => (
                    <tr
                      key={product.id}
                      style={{ cursor: 'pointer' }}
                      onClick={() => openEdit(product)}
                    >
                      <td onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selected.includes(product.id)}
                          onChange={() => toggleSelect(product.id)}
                          style={{ accentColor: '#714B67' }}
                        />
                      </td>
                      <td style={{ fontWeight: 500 }}>{product.name}</td>
                      <td>₹{Number(product.sales_price || 0).toFixed(2)}</td>
                      <td>₹{Number(product.cost_price || 0).toFixed(2)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // ==================== FORM VIEW ====================

  return (
    <div className={styles.page}>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className={styles.btnPrimary} onClick={openCreate}>
            <HiOutlinePlus /> New
          </button>
          {editing && (
            <button
              className={styles.btnSecondary}
              onClick={handleDeleteCurrent}
              title="Delete"
            >
              <HiOutlineTrash /> Delete
            </button>
          )}
          <button
            className={styles.btnSecondary}
            onClick={() => window.print()}
            title="Print"
          >
            <HiOutlinePrinter /> Print
          </button>
        </div>
      </div>

      {/* Product name as big heading */}
      <div style={{ marginBottom: 20 }}>
        <input
          type="text"
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Product Name"
          required
          style={{
            fontSize: 24,
            fontWeight: 700,
            color: '#1F2937',
            border: 'none',
            borderBottom: '2px solid #E5E7EB',
            background: 'transparent',
            width: '100%',
            padding: '8px 0',
            outline: 'none',
          }}
          onFocus={(e) => (e.target.style.borderBottomColor = '#714B67')}
          onBlur={(e) => (e.target.style.borderBottomColor = '#E5E7EB')}
        />
      </div>

      {/* Product Image */}
      <div className={styles.card} style={{ padding: 24, marginBottom: 20 }}>
        <label style={{ fontWeight: 600, marginBottom: 12, display: 'block', fontSize: 14, color: '#374151' }}>
          Product Image
        </label>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
          {imagePreview ? (
            <div style={{ position: 'relative' }}>
              <img
                src={imagePreview}
                alt="Product"
                style={{
                  width: 160,
                  height: 160,
                  objectFit: 'cover',
                  borderRadius: 8,
                  border: '1px solid #E5E7EB',
                }}
              />
              <button
                onClick={handleRemoveImage}
                title="Remove image"
                style={{
                  position: 'absolute',
                  top: -8,
                  right: -8,
                  background: '#EF4444',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '50%',
                  width: 24,
                  height: 24,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 14,
                }}
              >
                <HiOutlineX />
              </button>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                width: 160,
                height: 160,
                borderRadius: 8,
                border: '2px dashed #D1D5DB',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#9CA3AF',
                transition: 'border-color 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#714B67')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#D1D5DB')}
            >
              <HiOutlinePhotograph style={{ fontSize: 32, marginBottom: 8 }} />
              <span style={{ fontSize: 12 }}>Click to upload</span>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleImageSelect}
            style={{ display: 'none' }}
          />
          <div style={{ fontSize: 12, color: '#6B7280', paddingTop: 4 }}>
            <p style={{ margin: '0 0 4px' }}>Supported: JPG, PNG, WebP, GIF</p>
            <p style={{ margin: 0 }}>Max size: 5MB</p>
            {imagePreview && !imageFile && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className={styles.btnSecondary}
                style={{ marginTop: 8, fontSize: 12, padding: '4px 12px' }}
              >
                Change Image
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Form fields card */}
      <div className={styles.card} style={{ padding: 24, marginBottom: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <div>
            <div className={styles.formGroup}>
              <label>Product Type</label>
              <select
                name="product_type"
                className={styles.formControl}
                value={form.product_type}
                onChange={handleChange}
              >
                <option value="service">Service</option>
                <option value="goods">Goods</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>Tax</label>
              <select
                name="tax_id"
                className={styles.formControl}
                value={form.tax_id}
                onChange={handleChange}
              >
                <option value="">None</option>
                {taxes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({Number(t.rate)}%)
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
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
                placeholder="0.00"
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
                placeholder="0.00"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs: Recurring Prices | Variants */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 0 }}>
        <button
          onClick={() => setActiveTab('recurring')}
          style={{
            padding: '10px 24px',
            fontSize: 14,
            fontWeight: activeTab === 'recurring' ? 600 : 400,
            background: activeTab === 'recurring' ? '#fff' : '#F3F4F6',
            border: '1px solid #E5E7EB',
            borderBottom: activeTab === 'recurring' ? '2px solid #714B67' : '1px solid #E5E7EB',
            borderRadius: '8px 8px 0 0',
            cursor: 'pointer',
            color: activeTab === 'recurring' ? '#714B67' : '#6B7280',
          }}
        >
          Recurring Prices
        </button>
        <button
          onClick={() => setActiveTab('variants')}
          style={{
            padding: '10px 24px',
            fontSize: 14,
            fontWeight: activeTab === 'variants' ? 600 : 400,
            background: activeTab === 'variants' ? '#fff' : '#F3F4F6',
            border: '1px solid #E5E7EB',
            borderBottom: activeTab === 'variants' ? '2px solid #714B67' : '1px solid #E5E7EB',
            borderRadius: '8px 8px 0 0',
            cursor: 'pointer',
            color: activeTab === 'variants' ? '#714B67' : '#6B7280',
          }}
        >
          Variants
        </button>
      </div>

      <div className={styles.card} style={{ padding: 24, borderTopLeftRadius: 0, marginBottom: 20 }}>
        {/* ====== Recurring Prices Tab ====== */}
        {activeTab === 'recurring' && (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Recurring Plan</th>
                  <th>Price</th>
                  <th>Min Qty</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                </tr>
              </thead>
              <tbody>
                {recurringPlans.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', color: '#9CA3AF' }}>
                      No recurring plans found
                    </td>
                  </tr>
                ) : (
                  recurringPlans.map((plan) => (
                    <tr key={plan.id}>
                      <td style={{ fontWeight: 500 }}>{plan.name}</td>
                      <td>₹{Number(plan.price).toFixed(2)}</td>
                      <td>{plan.min_quantity}</td>
                      <td>{plan.start_date || '-'}</td>
                      <td>{plan.end_date || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ====== Variants Tab ====== */}
        {activeTab === 'variants' && (
          <>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Attribute</th>
                    <th>Values</th>
                    <th>Extra Price</th>
                    {editing && <th style={{ width: 60 }}></th>}
                  </tr>
                </thead>
                <tbody>
                  {variants.length === 0 ? (
                    <tr>
                      <td
                        colSpan={editing ? 4 : 3}
                        style={{ textAlign: 'center', color: '#9CA3AF' }}
                      >
                        No variants yet
                      </td>
                    </tr>
                  ) : (
                    variants.map((v) => (
                      <tr key={v.id}>
                        <td style={{ fontWeight: 500 }}>{v.attribute}</td>
                        <td>{v.value}</td>
                        <td>₹{Number(v.extra_price || 0).toFixed(2)}</td>
                        {editing && (
                          <td>
                            <div className={styles.actions}>
                              <button
                                title="Delete variant"
                                className={styles.actionsDanger}
                                onClick={() => deleteVariant(v.id)}
                              >
                                <HiOutlineX />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Add variant inline form (only when editing existing product) */}
            {editing && (
              <form
                onSubmit={addVariant}
                style={{
                  marginTop: 16,
                  display: 'flex',
                  gap: 10,
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
                  <label>Values</label>
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
                <button
                  type="submit"
                  className={styles.btnPrimary}
                  style={{ height: 40 }}
                >
                  <HiOutlinePlus /> Add
                </button>
              </form>
            )}
          </>
        )}
      </div>

      {/* Error */}
      {formError && (
        <div className={styles.formError} style={{ marginBottom: 16 }}>
          {formError}
        </div>
      )}

      {/* Save / Discard */}
      <div style={{ display: 'flex', gap: 12 }}>
        <button
          className={styles.btnPrimary}
          onClick={handleSave}
          disabled={saving || uploadingImage || !form.name}
        >
          {uploadingImage ? 'Uploading Image...' : saving ? 'Saving...' : editing ? 'Save' : 'Create Product'}
        </button>
        <button className={styles.btnSecondary} onClick={backToList}>
          Discard
        </button>
      </div>
    </div>
  );
}
