import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiSearch, HiPlus, HiTrash, HiOutlinePrinter, HiOutlineArchive } from 'react-icons/hi';
import styles from './Page.module.css';
import api from '../api';

const STATUS_BADGE_CLASS = {
  draft: 'badgeDraft',
  quotation: 'badgeQuotation',
  quotation_sent: 'badgeQuotation',
  confirmed: 'badgeConfirmed',
  active: 'badgeActive',
  paused: 'badgePaused',
  closed: 'badgeClosed',
  churned: 'badgeClosed',
};

export default function SubscriptionsPage() {
  const navigate = useNavigate();
  const [subscriptions, setSubscriptions] = useState([]);
  const [plans, setPlans] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState([]);

  const fetchData = useCallback(async () => {
    try {
      const [subRes, plansRes, usersRes] = await Promise.all([
        api.get('/subscriptions/'),
        api.get('/recurring-plans/'),
        api.get('/users/'),
      ]);
      setSubscriptions(subRes.data);
      setPlans(plansRes.data);
      setUsers(usersRes.data);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const userName = (id) => {
    const u = users.find((u) => u.id === id);
    return u ? (u.full_name || u.email) : `#${id}`;
  };

  const planName = (id) => {
    const p = plans.find((p) => p.id === id);
    return p ? p.name : '-';
  };

  const planPeriod = (id) => {
    const p = plans.find((p) => p.id === id);
    return p ? p.billing_period : '-';
  };

  const recurringAmount = (sub) => {
    const lines = sub.lines || [];
    const total = lines.reduce((sum, l) => sum + Number(l.amount || 0), 0);
    return total > 0 ? `₹${total.toFixed(0)}` : '-';
  };

  const filtered = subscriptions.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      s.subscription_number.toLowerCase().includes(q) ||
      userName(s.customer_id).toLowerCase().includes(q) ||
      planName(s.plan_id).toLowerCase().includes(q)
    );
  });

  const toggleSelect = (id) => {
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const toggleAll = () => {
    if (selected.length === filtered.length) setSelected([]);
    else setSelected(filtered.map((s) => s.id));
  };

  const handleBulkDelete = async () => {
    if (selected.length === 0) return;
    if (!window.confirm(`Delete ${selected.length} subscription(s)?`)) return;
    try {
      await Promise.all(selected.map((id) => api.delete(`/subscriptions/${id}`)));
      setSelected([]);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete');
    }
  };

  if (loading) {
    return <div className={styles.page}><div className={styles.loading}><div className={styles.spinner} /></div></div>;
  }

  return (
    <div className={styles.page}>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className={styles.btnPrimary} onClick={() => navigate('/subscriptions/new')}>
            <HiPlus /> New
          </button>
          <button className={styles.btnSecondary} onClick={handleBulkDelete} disabled={selected.length === 0} title="Delete selected">
            <HiTrash />
          </button>
          <button className={styles.btnSecondary} title="Archive"><HiOutlineArchive /></button>
          <button className={styles.btnSecondary} onClick={() => window.print()} title="Print"><HiOutlinePrinter /></button>
        </div>
        <div className={styles.searchBox}>
          <HiSearch />
          <input type="text" placeholder="Search subscriptions..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Table */}
      <div className={styles.card}>
        <div className={styles.tableWrapper}>
          {filtered.length === 0 ? (
            <div className={styles.empty}><p>No subscriptions found.</p></div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th style={{ width: 40 }}>
                    <input type="checkbox" checked={selected.length === filtered.length && filtered.length > 0} onChange={toggleAll} style={{ accentColor: '#714B67' }} />
                  </th>
                  <th>Number</th>
                  <th>Customer</th>
                  <th>Next Invoice</th>
                  <th>Recurring</th>
                  <th>Plan</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((sub) => (
                  <tr key={sub.id} onClick={() => navigate(`/subscriptions/${sub.id}`)} style={{ cursor: 'pointer' }}>
                    <td onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" checked={selected.includes(sub.id)} onChange={() => toggleSelect(sub.id)} style={{ accentColor: '#714B67' }} />
                    </td>
                    <td style={{ fontWeight: 600, color: '#714B67' }}>{sub.subscription_number}</td>
                    <td>{userName(sub.customer_id)}</td>
                    <td>{sub.next_invoice_date || '-'}</td>
                    <td style={{ color: '#714B67', fontWeight: 600 }}>{recurringAmount(sub)}</td>
                    <td>{planPeriod(sub.plan_id)}</td>
                    <td>
                      <span className={`${styles.badge} ${styles[STATUS_BADGE_CLASS[sub.status]] || styles.badgeDraft}`}>
                        {sub.status}
                      </span>
                    </td>
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
