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

const EMPTY_FORM = {
  name: '',
  tax_type: 'percentage',
  rate: '',
};

export default function TaxesPage() {
  const [taxes, setTaxes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState([]);

  // Form view state
  const [view, setView] = useState('list'); // 'list' | 'form'
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchTaxes();
  }, []);

  const fetchTaxes = async () => {
    setLoading(true);
    try {
      const res = await api.get('/taxes/');
      setTaxes(res.data);
    } catch {
      setTaxes([]);
    }
    setLoading(false);
  };

  const filtered = taxes.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  // --- List actions ---

  const openCreate = () => {
    setEditId(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setView('form');
  };

  const openEdit = (tax) => {
    setEditId(tax.id);
    setForm({
      name: tax.name || '',
      tax_type: tax.tax_type || 'percentage',
      rate: tax.rate ?? '',
    });
    setFormError('');
    setView('form');
  };

  const backToList = () => {
    setView('list');
    setEditId(null);
    setFormError('');
  };

  const handleDeleteSelected = async () => {
    if (selected.length === 0) return;
    if (!window.confirm(`Delete ${selected.length} selected tax(es)?`)) return;
    try {
      await Promise.all(selected.map((id) => api.delete(`/taxes/${id}`)));
      setSelected([]);
      fetchTaxes();
    } catch {
      // silently fail
    }
  };

  const handleDeleteCurrent = async () => {
    if (!editId) return;
    const tax = taxes.find((t) => t.id === editId);
    if (!window.confirm(`Delete tax "${tax?.name || ''}"?`)) return;
    try {
      await api.delete(`/taxes/${editId}`);
      backToList();
      fetchTaxes();
    } catch {
      // silently fail
    }
  };

  const toggleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selected.length === filtered.length) {
      setSelected([]);
    } else {
      setSelected(filtered.map((t) => t.id));
    }
  };

  // --- Form actions ---

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setFormError('');

    const payload = {
      name: form.name,
      tax_type: form.tax_type,
      rate: parseFloat(form.rate) || 0,
      is_active: true,
    };

    try {
      if (editId) {
        await api.put(`/taxes/${editId}`, payload);
      } else {
        const res = await api.post('/taxes/', payload);
        setEditId(res.data.id);
      }
      fetchTaxes();
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        'Failed to save tax.';
      setFormError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    }
    setSaving(false);
  };

  // --- Render ---

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>
          <div className={styles.spinner} />
        </div>
      </div>
    );
  }

  // ====== FORM VIEW ======
  if (view === 'form') {
    return (
      <div className={styles.page}>
        {/* Toolbar */}
        <div className={styles.toolbar}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button className={styles.btnSecondary} onClick={backToList}>
              <HiArrowLeft /> Back
            </button>
            <button className={styles.btnPrimary} onClick={openCreate}>
              <HiPlus /> New
            </button>
            {editId && (
              <button className={styles.btnDanger} onClick={handleDeleteCurrent}>
                <HiTrash /> Delete
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

        {/* Tax Name as big editable heading */}
        <div className={styles.card} style={{ padding: 24, marginBottom: 20 }}>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Tax Name"
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: '#1F2937',
              border: 'none',
              borderBottom: '2px solid #E5E7EB',
              outline: 'none',
              width: '100%',
              padding: '4px 0 8px 0',
              background: 'transparent',
              marginBottom: 24,
            }}
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, maxWidth: 600 }}>
            <div className={styles.formGroup}>
              <label>Tax Computation</label>
              <select
                name="tax_type"
                className={styles.formControl}
                value={form.tax_type}
                onChange={handleChange}
              >
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed Price</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Amount</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="number"
                  name="rate"
                  className={styles.formControl}
                  value={form.rate}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  placeholder={form.tax_type === 'percentage' ? 'e.g. 12' : 'e.g. 5.00'}
                  style={{ paddingRight: form.tax_type === 'percentage' ? 32 : 12 }}
                />
                {form.tax_type === 'percentage' && (
                  <span
                    style={{
                      position: 'absolute',
                      right: 12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#9CA3AF',
                      fontSize: 14,
                      pointerEvents: 'none',
                    }}
                  >
                    %
                  </span>
                )}
              </div>
              <span style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4, display: 'block' }}>
                {form.tax_type === 'percentage'
                  ? 'Enter the tax percentage (e.g. 12 for 12%)'
                  : 'Enter the fixed tax amount'}
              </span>
            </div>
          </div>

          {formError && <div className={styles.formError}>{formError}</div>}
        </div>

        {/* Save / Discard */}
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            className={styles.btnPrimary}
            onClick={handleSave}
            disabled={saving || !form.name}
          >
            {saving ? 'Saving...' : editId ? 'Save Changes' : 'Create Tax'}
          </button>
          <button className={styles.btnSecondary} onClick={backToList}>
            Discard
          </button>
        </div>
      </div>
    );
  }

  // ====== LIST VIEW ======
  return (
    <div className={styles.page}>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className={styles.btnPrimary} onClick={openCreate}>
            <HiPlus /> New
          </button>
          {selected.length > 0 && (
            <button className={styles.btnDanger} onClick={handleDeleteSelected}>
              <HiTrash /> Delete ({selected.length})
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
        <div className={styles.searchBox}>
          <HiSearch />
          <input
            type="text"
            placeholder="Search taxes..."
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
                <th>Tax Name</th>
                <th>Tax Computation</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', color: '#9CA3AF' }}>
                    No taxes found
                  </td>
                </tr>
              ) : (
                filtered.map((tax) => (
                  <tr
                    key={tax.id}
                    style={{ cursor: 'pointer' }}
                    onClick={() => openEdit(tax)}
                  >
                    <td onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selected.includes(tax.id)}
                        onChange={() => toggleSelect(tax.id)}
                        style={{ accentColor: '#714B67' }}
                      />
                    </td>
                    <td style={{ fontWeight: 500 }}>{tax.name}</td>
                    <td style={{ textTransform: 'capitalize' }}>{tax.tax_type}</td>
                    <td>
                      {tax.tax_type === 'percentage'
                        ? `${tax.rate}%`
                        : `₹${Number(tax.rate || 0).toFixed(2)}`}
                    </td>
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
