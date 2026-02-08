import { useState, useEffect } from 'react';
import {
  HiSearch,
  HiPlus,
  HiTrash,
  HiOutlinePrinter,
  HiSave,
  HiArrowLeft,
} from 'react-icons/hi';
import api from '../api';
import styles from './Page.module.css';

const EMPTY_FORM = {
  name: '',
  validity_days: 30,
  recurring_plan_id: '',
  last_forever: true,
  end_after_count: 1,
  end_after_unit: 'Month',
};

const EMPTY_LINE = { product_id: '', description: '', quantity: 1 };

export default function TemplatesPage() {
  const [templates, setTemplates] = useState([]);
  const [plans, setPlans] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // View toggle: 'list' or 'form'
  const [view, setView] = useState('list');
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [lines, setLines] = useState([{ ...EMPTY_LINE }]);
  const [existingLines, setExistingLines] = useState([]);

  // Multi-select for list view delete
  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [templatesRes, plansRes, productsRes] = await Promise.all([
        api.get('/quotation-templates/'),
        api.get('/recurring-plans/'),
        api.get('/products/'),
      ]);
      setTemplates(templatesRes.data);
      setPlans(plansRes.data);
      setProducts(productsRes.data);
    } catch {
      setTemplates([]);
      setPlans([]);
      setProducts([]);
    }
    setLoading(false);
  };

  const filtered = templates.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  // --- List actions ---

  const openCreate = () => {
    setEditingTemplate(null);
    setForm(EMPTY_FORM);
    setLines([{ ...EMPTY_LINE }]);
    setExistingLines([]);
    setError('');
    setView('form');
  };

  const openEdit = (template) => {
    setEditingTemplate(template);
    setForm({
      name: template.name || '',
      validity_days: template.validity_days ?? 30,
      recurring_plan_id: template.recurring_plan_id ? String(template.recurring_plan_id) : '',
      last_forever: true,
      end_after_count: 1,
      end_after_unit: 'Month',
    });
    setExistingLines(
      (template.lines || []).map((l) => ({
        id: l.id,
        product_id: l.product_id,
        description: '',
        quantity: l.quantity,
      }))
    );
    setLines([{ ...EMPTY_LINE }]);
    setError('');
    setView('form');
  };

  const backToList = () => {
    setView('list');
    setEditingTemplate(null);
    setError('');
    setSelectedIds([]);
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    const names = templates
      .filter((t) => selectedIds.includes(t.id))
      .map((t) => t.name)
      .join(', ');
    if (!window.confirm(`Delete template(s): ${names}?`)) return;
    try {
      await Promise.all(
        selectedIds.map((id) => api.delete(`/quotation-templates/${id}`))
      );
      setSelectedIds([]);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete template(s)');
    }
  };

  const handleDeleteCurrent = async () => {
    if (!editingTemplate) return;
    if (!window.confirm(`Delete template "${editingTemplate.name}"?`)) return;
    try {
      await api.delete(`/quotation-templates/${editingTemplate.id}`);
      backToList();
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete template');
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filtered.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map((t) => t.id));
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // --- Form actions ---

  const handleFormChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleLineChange = (idx, field, value) => {
    setLines((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: value };
      return updated;
    });
  };

  const handleExistingLineChange = (idx, field, value) => {
    setExistingLines((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: value };
      return updated;
    });
  };

  const addLine = () => setLines((prev) => [...prev, { ...EMPTY_LINE }]);

  const removeLine = (idx) =>
    setLines((prev) => prev.filter((_, i) => i !== idx));

  const removeExistingLine = (idx) =>
    setExistingLines((prev) => prev.filter((_, i) => i !== idx));

  const productName = (id) => {
    const p = products.find((p) => p.id === Number(id));
    return p ? p.name : '';
  };

  const productPrice = (id) => {
    const p = products.find((p) => p.id === Number(id));
    return p ? Number(p.sales_price || 0) : 0;
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');

    const allLines = [
      ...existingLines.map((l) => ({
        product_id: Number(l.product_id),
        quantity: Number(l.quantity) || 1,
        unit_price: productPrice(l.product_id),
      })),
      ...lines
        .filter((l) => l.product_id)
        .map((l) => ({
          product_id: Number(l.product_id),
          quantity: Number(l.quantity) || 1,
          unit_price: productPrice(l.product_id),
        })),
    ];

    const payload = {
      name: form.name,
      validity_days: parseInt(form.validity_days, 10) || 30,
      recurring_plan_id: form.recurring_plan_id
        ? parseInt(form.recurring_plan_id, 10)
        : null,
      lines: allLines,
    };

    try {
      if (editingTemplate) {
        // Update template with lines via PUT
        await api.put(`/quotation-templates/${editingTemplate.id}`, payload);
      } else {
        await api.post('/quotation-templates/', payload);
      }
      await fetchData();
      backToList();
    } catch (err) {
      setError(err.response?.data?.detail || 'An error occurred');
    }
    setSaving(false);
  };

  // --- Loading ---

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>
          <div className={styles.spinner} />
        </div>
      </div>
    );
  }

  // --- List View ---

  if (view === 'list') {
    return (
      <div className={styles.page}>
        {/* Toolbar */}
        <div className={styles.toolbar}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button className={styles.btnPrimary} onClick={openCreate}>
              <HiPlus /> New
            </button>
            <button
              className={styles.btnSecondary}
              onClick={handleDeleteSelected}
              disabled={selectedIds.length === 0}
              title="Delete selected"
            >
              <HiTrash /> Delete
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
            <HiSearch />
            <input
              type="text"
              placeholder="Search templates..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        <div className={styles.card}>
          <div className={styles.tableWrapper}>
            {filtered.length === 0 ? (
              <div className={styles.empty}>
                <p>No quotation templates found.</p>
              </div>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th style={{ width: 40 }}>
                      <input
                        type="checkbox"
                        checked={
                          filtered.length > 0 &&
                          selectedIds.length === filtered.length
                        }
                        onChange={toggleSelectAll}
                        style={{ accentColor: '#714B67' }}
                      />
                    </th>
                    <th>Quotation Template</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((template) => (
                    <tr
                      key={template.id}
                      style={{ cursor: 'pointer' }}
                      onClick={() => openEdit(template)}
                    >
                      <td
                        onClick={(e) => e.stopPropagation()}
                        style={{ width: 40 }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(template.id)}
                          onChange={() => toggleSelect(template.id)}
                          style={{ accentColor: '#714B67' }}
                        />
                      </td>
                      <td>{template.name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- Form View ---

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
          {editingTemplate && (
            <button
              className={styles.btnDanger}
              onClick={handleDeleteCurrent}
              title="Delete"
            >
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
        <button
          className={styles.btnSecondary}
          onClick={() => {
            if (editingTemplate) {
              window.open(
                `/subscriptions/new?template_id=${editingTemplate.id}`,
                '_self'
              );
            }
          }}
          disabled={!editingTemplate}
          title="Create subscription from this template"
        >
          Subscription
        </button>
      </div>

      {/* Template name as big editable heading */}
      <div className={styles.card} style={{ padding: 24, marginBottom: 20 }}>
        <input
          type="text"
          value={form.name}
          onChange={(e) => handleFormChange('name', e.target.value)}
          placeholder="Quotation Template"
          required
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: '#1F2937',
            border: 'none',
            borderBottom: '2px solid transparent',
            outline: 'none',
            width: '100%',
            padding: '4px 0',
            marginBottom: 24,
            background: 'transparent',
            transition: 'border-color 0.2s',
          }}
          onFocus={(e) => {
            e.target.style.borderBottomColor = '#714B67';
          }}
          onBlur={(e) => {
            e.target.style.borderBottomColor = 'transparent';
          }}
        />

        {/* Form fields in two-column layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {/* Left column */}
          <div>
            <div className={styles.formGroup}>
              <label>Quotation Validity</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  className={styles.formControl}
                  type="number"
                  value={form.validity_days}
                  onChange={(e) =>
                    handleFormChange('validity_days', e.target.value)
                  }
                  min="1"
                  style={{ width: 100 }}
                />
                <span style={{ fontSize: 14, color: '#6B7280' }}>days</span>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>Recurring Plan</label>
              <select
                className={styles.formControl}
                value={form.recurring_plan_id}
                onChange={(e) =>
                  handleFormChange('recurring_plan_id', e.target.value)
                }
              >
                <option value="">None</option>
                {plans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Right column */}
          <div>
            <div className={styles.formGroup}>
              <label className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={form.last_forever}
                  onChange={(e) =>
                    handleFormChange('last_forever', e.target.checked)
                  }
                />
                Last Forever
              </label>
            </div>

            {!form.last_forever && (
              <div className={styles.formGroup}>
                <label>End After</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    className={styles.formControl}
                    type="number"
                    value={form.end_after_count}
                    onChange={(e) =>
                      handleFormChange('end_after_count', e.target.value)
                    }
                    min="1"
                    style={{ width: 80 }}
                  />
                  <select
                    className={styles.formControl}
                    value={form.end_after_unit}
                    onChange={(e) =>
                      handleFormChange('end_after_unit', e.target.value)
                    }
                    style={{ width: 120 }}
                  >
                    <option value="Week">Week</option>
                    <option value="Month">Month</option>
                    <option value="Year">Year</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Products table */}
      <div className={styles.card} style={{ padding: 24, marginBottom: 20 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
          }}
        >
          <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Products</h3>
          <button className={styles.btnSecondary} onClick={addLine}>
            <HiPlus /> Add a line
          </button>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Product</th>
                <th>Description</th>
                <th style={{ width: 100 }}>Quantity</th>
                <th style={{ width: 50 }}></th>
              </tr>
            </thead>
            <tbody>
              {/* Existing lines (from saved template) */}
              {existingLines.map((line, idx) => (
                <tr key={`e-${idx}`}>
                  <td style={{ fontWeight: 500 }}>
                    {productName(line.product_id)}
                  </td>
                  <td>
                    <input
                      className={styles.formControl}
                      type="text"
                      value={line.description}
                      onChange={(e) =>
                        handleExistingLineChange(
                          idx,
                          'description',
                          e.target.value
                        )
                      }
                      placeholder="Description"
                      style={{ height: 32, fontSize: 13 }}
                    />
                  </td>
                  <td>
                    <input
                      className={styles.formControl}
                      type="number"
                      min="1"
                      value={line.quantity}
                      onChange={(e) =>
                        handleExistingLineChange(
                          idx,
                          'quantity',
                          e.target.value
                        )
                      }
                      style={{ width: 80, height: 32, fontSize: 13 }}
                    />
                  </td>
                  <td>
                    <button
                      onClick={() => removeExistingLine(idx)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#DC2626',
                        fontSize: 16,
                      }}
                      title="Remove line"
                    >
                      <HiTrash />
                    </button>
                  </td>
                </tr>
              ))}

              {/* New lines */}
              {lines.map((line, idx) => (
                <tr key={`n-${idx}`}>
                  <td>
                    <select
                      className={styles.formControl}
                      value={line.product_id}
                      onChange={(e) =>
                        handleLineChange(idx, 'product_id', e.target.value)
                      }
                      style={{ minWidth: 150, height: 32, fontSize: 13 }}
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
                    <input
                      className={styles.formControl}
                      type="text"
                      value={line.description}
                      onChange={(e) =>
                        handleLineChange(idx, 'description', e.target.value)
                      }
                      placeholder="Description"
                      style={{ height: 32, fontSize: 13 }}
                    />
                  </td>
                  <td>
                    <input
                      className={styles.formControl}
                      type="number"
                      min="1"
                      value={line.quantity}
                      onChange={(e) =>
                        handleLineChange(idx, 'quantity', e.target.value)
                      }
                      style={{ width: 80, height: 32, fontSize: 13 }}
                    />
                  </td>
                  <td>
                    <button
                      onClick={() => removeLine(idx)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#DC2626',
                        fontSize: 16,
                      }}
                      title="Remove line"
                    >
                      <HiTrash />
                    </button>
                  </td>
                </tr>
              ))}

              {existingLines.length === 0 && lines.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    style={{ textAlign: 'center', color: '#9CA3AF' }}
                  >
                    No product lines yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Error / Save */}
      {error && (
        <div className={styles.formError} style={{ marginBottom: 16 }}>
          {error}
        </div>
      )}
      <div style={{ display: 'flex', gap: 12 }}>
        <button
          className={styles.btnPrimary}
          onClick={handleSave}
          disabled={saving || !form.name}
        >
          <HiSave />{' '}
          {saving
            ? 'Saving...'
            : editingTemplate
            ? 'Save Changes'
            : 'Create Template'}
        </button>
        <button className={styles.btnSecondary} onClick={backToList}>
          Discard
        </button>
      </div>
    </div>
  );
}
