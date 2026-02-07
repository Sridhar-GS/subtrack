import { useState, useEffect } from 'react';
import {
  HiSearch,
  HiPlus,
  HiPencil,
  HiTrash,
  HiX,
} from 'react-icons/hi';
import api from '../api';
import styles from './Page.module.css';

const EMPTY_FORM = {
  name: '',
  validity_days: 30,
  recurring_plan_id: '',
};

export default function TemplatesPage() {
  const [templates, setTemplates] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [templatesRes, plansRes] = await Promise.all([
        api.get('/quotation-templates/'),
        api.get('/recurring-plans/'),
      ]);
      setTemplates(templatesRes.data);
      setPlans(plansRes.data);
    } catch {
      setTemplates([]);
      setPlans([]);
    }
    setLoading(false);
  };

  const filtered = templates.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  const getPlanName = (planId) => {
    if (!planId) return '-';
    const plan = plans.find((p) => p.id === planId);
    return plan ? plan.name : '-';
  };

  const openCreate = () => {
    setEditingTemplate(null);
    setForm(EMPTY_FORM);
    setError('');
    setShowModal(true);
  };

  const openEdit = (template) => {
    setEditingTemplate(template);
    setForm({
      name: template.name || '',
      validity_days: template.validity_days ?? 30,
      recurring_plan_id: template.recurring_plan_id || '',
    });
    setError('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingTemplate(null);
    setError('');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const payload = {
      name: form.name,
      validity_days: parseInt(form.validity_days, 10),
      recurring_plan_id: form.recurring_plan_id ? parseInt(form.recurring_plan_id, 10) : null,
    };

    try {
      if (editingTemplate) {
        await api.put(`/quotation-templates/${editingTemplate.id}`, payload);
      } else {
        await api.post('/quotation-templates/', payload);
      }
      closeModal();
      fetchData();
    } catch (err) {
      setError(err.response?.data?.detail || 'An error occurred');
    }
  };

  const handleDelete = async (template) => {
    if (!window.confirm(`Delete template "${template.name}"?`)) return;
    try {
      await api.delete(`/quotation-templates/${template.id}`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete template');
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

  return (
    <div className={styles.page}>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <HiSearch />
          <input
            type="text"
            placeholder="Search templates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button className={styles.btnPrimary} onClick={openCreate}>
          <HiPlus /> Add Template
        </button>
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
                  <th>Name</th>
                  <th>Validity (days)</th>
                  <th>Recurring Plan</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((template) => (
                  <tr key={template.id}>
                    <td>{template.name}</td>
                    <td>{template.validity_days}</td>
                    <td>{getPlanName(template.recurring_plan_id)}</td>
                    <td>
                      <div className={styles.actions}>
                        <button title="Edit" onClick={() => openEdit(template)}>
                          <HiPencil />
                        </button>
                        <button
                          title="Delete"
                          className={styles.actionsDanger}
                          onClick={() => handleDelete(template)}
                        >
                          <HiTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className={styles.overlay} onClick={closeModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>{editingTemplate ? 'Edit Template' : 'Add Template'}</h2>
              <button className={styles.modalClose} onClick={closeModal}>
                <HiX />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label>Name</label>
                  <input
                    className={styles.formControl}
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Validity (days)</label>
                  <input
                    className={styles.formControl}
                    type="number"
                    name="validity_days"
                    value={form.validity_days}
                    onChange={handleChange}
                    min="1"
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Recurring Plan</label>
                  <select
                    className={styles.formControl}
                    name="recurring_plan_id"
                    value={form.recurring_plan_id}
                    onChange={handleChange}
                  >
                    <option value="">None</option>
                    {plans.map((plan) => (
                      <option key={plan.id} value={plan.id}>
                        {plan.name}
                      </option>
                    ))}
                  </select>
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
                  {editingTemplate ? 'Save Changes' : 'Create Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
