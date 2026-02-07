import { useState, useEffect } from 'react';
import {
  HiSearch,
  HiPlus,
  HiPencil,
  HiTrash,
  HiCheck,
  HiX,
  HiOutlineX,
} from 'react-icons/hi';
import api from '../api';
import styles from './Page.module.css';

export default function TaxesPage() {
  const [taxes, setTaxes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingTax, setEditingTax] = useState(null);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    tax_type: 'percentage',
    rate: '',
    is_active: true,
  });

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

  const openCreate = () => {
    setEditingTax(null);
    setForm({
      name: '',
      tax_type: 'percentage',
      rate: '',
      is_active: true,
    });
    setError('');
    setShowModal(true);
  };

  const openEdit = (tax) => {
    setEditingTax(tax);
    setForm({
      name: tax.name || '',
      tax_type: tax.tax_type || 'percentage',
      rate: tax.rate ?? '',
      is_active: tax.is_active ?? true,
    });
    setError('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingTax(null);
    setError('');
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');

    const payload = {
      name: form.name,
      tax_type: form.tax_type,
      rate: parseFloat(form.rate) || 0,
      is_active: form.is_active,
    };

    try {
      if (editingTax) {
        await api.put(`/taxes/${editingTax.id}`, payload);
      } else {
        await api.post('/taxes/', payload);
      }
      closeModal();
      fetchTaxes();
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        'Failed to save tax.';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    }
  };

  const handleDelete = async (tax) => {
    if (!window.confirm(`Delete tax "${tax.name}"?`)) return;
    try {
      await api.delete(`/taxes/${tax.id}`);
      fetchTaxes();
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
          <HiSearch />
          <input
            type="text"
            placeholder="Search taxes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button className={styles.btnPrimary} onClick={openCreate}>
          <HiPlus /> Add Tax
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
                <th>Rate</th>
                <th>Active</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', color: '#9CA3AF' }}>
                    No taxes found
                  </td>
                </tr>
              ) : (
                filtered.map((tax) => (
                  <tr key={tax.id}>
                    <td>{tax.name}</td>
                    <td style={{ textTransform: 'capitalize' }}>{tax.tax_type}</td>
                    <td>{tax.rate}%</td>
                    <td>
                      {tax.is_active ? (
                        <HiCheck style={{ color: '#059669', fontSize: '20px' }} />
                      ) : (
                        <HiX style={{ color: '#DC2626', fontSize: '20px' }} />
                      )}
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <button title="Edit" onClick={() => openEdit(tax)}>
                          <HiPencil />
                        </button>
                        <button
                          title="Delete"
                          className={styles.actionsDanger}
                          onClick={() => handleDelete(tax)}
                        >
                          <HiTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
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
              <h2>{editingTax ? 'Edit Tax' : 'Add Tax'}</h2>
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
                  <label>Tax Type</label>
                  <select
                    name="tax_type"
                    className={styles.formControl}
                    value={form.tax_type}
                    onChange={handleChange}
                  >
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>Rate</label>
                  <input
                    type="number"
                    name="rate"
                    className={styles.formControl}
                    value={form.rate}
                    onChange={handleChange}
                    step="0.01"
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.checkbox}>
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={form.is_active}
                      onChange={handleChange}
                    />
                    Active
                  </label>
                </div>

                {error && <div className={styles.formError}>{error}</div>}
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
                  {editingTax ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
