import { useState, useEffect } from 'react';
import {
  HiSearch,
  HiPlus,
  HiTrash,
  HiOutlinePrinter,
  HiArrowLeft,
} from 'react-icons/hi';
import api from '../api';
import styles from './Page.module.css';

export default function AttributesPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  // View mode: 'list' or 'form'
  const [view, setView] = useState('list');

  // Selected attribute for form view
  const [selectedAttr, setSelectedAttr] = useState(null);
  const [attrName, setAttrName] = useState('');
  const [isNewAttr, setIsNewAttr] = useState(false);

  // Selected rows in list view for bulk delete
  const [selectedRows, setSelectedRows] = useState([]);

  // New value row state
  const [newValueRow, setNewValueRow] = useState({ product_id: '', value: '', extra_price: '' });

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

  // Build a flat list of all variants across all products
  const allVariants = products.flatMap((p) =>
    (p.variants || []).map((v) => ({ ...v, productName: p.name, productId: p.id }))
  );

  // Group variants by attribute name to get distinct attributes
  const attributeMap = {};
  allVariants.forEach((v) => {
    const key = v.attribute || 'Unknown';
    if (!attributeMap[key]) attributeMap[key] = [];
    attributeMap[key].push(v);
  });

  const attributeNames = Object.keys(attributeMap).sort((a, b) =>
    a.toLowerCase().localeCompare(b.toLowerCase())
  );

  // Filtered list for search
  const filtered = attributeNames.filter((name) =>
    name.toLowerCase().includes(search.toLowerCase())
  );

  // Get variants for the currently selected attribute
  const currentVariants = selectedAttr ? (attributeMap[selectedAttr] || []) : [];

  // --- List view handlers ---

  const handleRowClick = (attrNameVal) => {
    setSelectedAttr(attrNameVal);
    setAttrName(attrNameVal);
    setIsNewAttr(false);
    setError('');
    setNewValueRow({ product_id: '', value: '', extra_price: '' });
    setView('form');
  };

  const handleNewAttribute = () => {
    setSelectedAttr(null);
    setAttrName('');
    setIsNewAttr(true);
    setError('');
    setNewValueRow({ product_id: '', value: '', extra_price: '' });
    setView('form');
  };

  const handleToggleRow = (name) => {
    setSelectedRows((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  const handleToggleAll = () => {
    if (selectedRows.length === filtered.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows([...filtered]);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedRows.length === 0) return;
    if (!window.confirm(`Delete all values for ${selectedRows.length} attribute(s)?`)) return;
    try {
      for (const attrNameVal of selectedRows) {
        const variants = attributeMap[attrNameVal] || [];
        for (const v of variants) {
          await api.delete(`/products/${v.productId}/variants/${v.id}`);
        }
      }
      setSelectedRows([]);
      fetchProducts();
    } catch {
      // silently ignore
    }
  };

  // --- Form view handlers ---

  const handleBackToList = () => {
    setView('list');
    setSelectedAttr(null);
    setAttrName('');
    setIsNewAttr(false);
    setError('');
    setSelectedRows([]);
  };

  const handleAddValueRow = async () => {
    setError('');
    if (!newValueRow.product_id) {
      setError('Please select a product.');
      return;
    }
    if (!newValueRow.value.trim()) {
      setError('Please enter a value.');
      return;
    }
    if (!attrName.trim()) {
      setError('Please enter an attribute name.');
      return;
    }
    try {
      await api.post(`/products/${newValueRow.product_id}/variants`, {
        attribute: attrName.trim(),
        value: newValueRow.value.trim(),
        extra_price: parseFloat(newValueRow.extra_price) || 0,
      });
      setNewValueRow({ product_id: '', value: '', extra_price: '' });
      // If this was a new attribute, update the selection
      if (isNewAttr) {
        setSelectedAttr(attrName.trim());
        setIsNewAttr(false);
      }
      await fetchProducts();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to add value');
    }
  };

  const handleDeleteValue = async (variant) => {
    if (!window.confirm(`Delete value "${variant.value}"?`)) return;
    try {
      await api.delete(`/products/${variant.productId}/variants/${variant.id}`);
      await fetchProducts();
      // If no more variants for this attribute, go back to list
      const remaining = allVariants.filter(
        (v) => v.attribute === selectedAttr && v.id !== variant.id
      );
      if (remaining.length === 0) {
        handleBackToList();
      }
    } catch {
      // silently ignore
    }
  };

  const handleDeleteAttribute = async () => {
    if (!selectedAttr) return;
    if (!window.confirm(`Delete attribute "${selectedAttr}" and all its values?`)) return;
    try {
      const variants = attributeMap[selectedAttr] || [];
      for (const v of variants) {
        await api.delete(`/products/${v.productId}/variants/${v.id}`);
      }
      await fetchProducts();
      handleBackToList();
    } catch {
      // silently ignore
    }
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>
          <div className={styles.spinner} />
        </div>
      </div>
    );
  }

  // ---------- FORM VIEW ----------
  if (view === 'form') {
    return (
      <div className={styles.page}>
        {/* Toolbar */}
        <div className={styles.toolbar}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button className={styles.btnSecondary} onClick={handleBackToList}>
              <HiArrowLeft /> Back
            </button>
            <button className={styles.btnPrimary} onClick={handleNewAttribute}>
              <HiPlus /> New
            </button>
            <button
              className={styles.btnDanger}
              onClick={handleDeleteAttribute}
              disabled={isNewAttr}
            >
              <HiTrash /> Delete
            </button>
            <button className={styles.btnSecondary} onClick={() => window.print()}>
              <HiOutlinePrinter /> Print
            </button>
          </div>
        </div>

        {/* Attribute Name heading */}
        <div className={styles.card} style={{ padding: 24, marginBottom: 20 }}>
          <input
            type="text"
            value={attrName}
            onChange={(e) => setAttrName(e.target.value)}
            placeholder="Attribute Name"
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: '#1F2937',
              border: 'none',
              borderBottom: '2px solid #E5E7EB',
              outline: 'none',
              width: '100%',
              padding: '4px 0',
              background: 'transparent',
            }}
          />
        </div>

        {/* Tab: Attribute Values */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 0 }}>
          <button
            style={{
              padding: '10px 24px',
              fontSize: 14,
              fontWeight: 600,
              background: '#fff',
              border: '1px solid #E5E7EB',
              borderBottom: '2px solid #714B67',
              borderRadius: '8px 8px 0 0',
              cursor: 'pointer',
              color: '#714B67',
            }}
          >
            Attribute Values
          </button>
        </div>

        {/* Values table */}
        <div className={styles.card} style={{ borderTopLeftRadius: 0 }}>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Value</th>
                  <th>Default Extra Price</th>
                  <th>Product</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {currentVariants.map((v) => (
                  <tr key={v.id}>
                    <td style={{ fontWeight: 500 }}>{v.value}</td>
                    <td>{Number(v.extra_price || 0).toFixed(2)}</td>
                    <td style={{ color: '#6B7280', fontSize: 13 }}>{v.productName}</td>
                    <td>
                      <div className={styles.actions}>
                        <button
                          className={styles.actionsDanger}
                          title="Delete"
                          onClick={() => handleDeleteValue(v)}
                        >
                          <HiTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {/* Add new value row */}
                <tr>
                  <td>
                    <input
                      type="text"
                      className={styles.formControl}
                      placeholder="e.g. Odoo"
                      value={newValueRow.value}
                      onChange={(e) =>
                        setNewValueRow({ ...newValueRow, value: e.target.value })
                      }
                      style={{ minWidth: 140 }}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      className={styles.formControl}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      value={newValueRow.extra_price}
                      onChange={(e) =>
                        setNewValueRow({ ...newValueRow, extra_price: e.target.value })
                      }
                      style={{ width: 120 }}
                    />
                  </td>
                  <td>
                    <select
                      className={styles.formControl}
                      value={newValueRow.product_id}
                      onChange={(e) =>
                        setNewValueRow({ ...newValueRow, product_id: e.target.value })
                      }
                      style={{ minWidth: 150 }}
                    >
                      <option value="">Select product...</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <button
                      className={styles.btnPrimary}
                      onClick={handleAddValueRow}
                      style={{ height: 36, padding: '0 14px' }}
                    >
                      <HiPlus /> Add
                    </button>
                  </td>
                </tr>

                {currentVariants.length === 0 && !isNewAttr && (
                  <tr>
                    <td
                      colSpan={4}
                      style={{ textAlign: 'center', color: '#9CA3AF', padding: 24 }}
                    >
                      No values yet. Use the row above to add one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {error && (
          <div className={styles.formError} style={{ marginTop: 16 }}>
            {error}
          </div>
        )}
      </div>
    );
  }

  // ---------- LIST VIEW ----------
  return (
    <div className={styles.page}>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className={styles.btnPrimary} onClick={handleNewAttribute}>
            <HiPlus /> New
          </button>
          <button
            className={styles.btnDanger}
            onClick={handleBulkDelete}
            disabled={selectedRows.length === 0}
          >
            <HiTrash /> Delete
          </button>
          <button className={styles.btnSecondary} onClick={() => window.print()}>
            <HiOutlinePrinter /> Print
          </button>
        </div>
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

      {/* Table */}
      <div className={styles.card}>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: 40 }}>
                  <input
                    type="checkbox"
                    checked={filtered.length > 0 && selectedRows.length === filtered.length}
                    onChange={handleToggleAll}
                    style={{ accentColor: '#714B67' }}
                  />
                </th>
                <th>Attribute Name</th>
                <th>Values</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    style={{ textAlign: 'center', color: '#9CA3AF', padding: 32 }}
                  >
                    {attributeNames.length === 0
                      ? 'No attributes found. Add variants to products to see them here.'
                      : 'No matching attributes.'}
                  </td>
                </tr>
              ) : (
                filtered.map((name) => {
                  const variants = attributeMap[name];
                  return (
                    <tr
                      key={name}
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleRowClick(name)}
                    >
                      <td
                        onClick={(e) => e.stopPropagation()}
                        style={{ width: 40 }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedRows.includes(name)}
                          onChange={() => handleToggleRow(name)}
                          style={{ accentColor: '#714B67' }}
                        />
                      </td>
                      <td style={{ fontWeight: 500 }}>{name}</td>
                      <td style={{ color: '#6B7280' }}>
                        {variants.length} value{variants.length !== 1 ? 's' : ''}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
