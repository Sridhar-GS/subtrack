import { useState, useEffect } from 'react';
import {
  HiOutlineClipboardList,
  HiOutlineCurrencyDollar,
  HiOutlineCreditCard,
  HiOutlineExclamationCircle,
} from 'react-icons/hi';
import api from '../api';
import styles from './Page.module.css';

export default function ReportsPage() {
  const [stats, setStats] = useState({
    activeSubs: { total: 0, list: [] },
    revenue: { total: 0 },
    payments: { total: 0, count: 0, by_method: [] },
    overdue: { total: 0, amount: 0, list: [] },
  });
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    fetchAllReports();
  }, []);

  const fetchAllReports = async () => {
    setLoading(true);

    const newStats = {
      activeSubs: { total: 0, list: [] },
      revenue: { total: 0 },
      payments: { total: 0, count: 0, by_method: [] },
      overdue: { total: 0, amount: 0, list: [] },
    };

    try {
      const res = await api.get('/reports/active-subscriptions');
      newStats.activeSubs = {
        total: res.data.total_active || 0,
        list: res.data.subscriptions || [],
      };
    } catch {
      /* ignore */
    }

    try {
      const res = await api.get('/reports/revenue');
      newStats.revenue = {
        total: res.data.total_revenue || 0,
      };
    } catch {
      /* ignore */
    }

    try {
      const res = await api.get('/reports/payments-summary');
      newStats.payments = {
        total: res.data.total_payments || 0,
        count: res.data.payment_count || 0,
        by_method: res.data.by_method || [],
      };
    } catch {
      /* ignore */
    }

    try {
      const res = await api.get('/reports/overdue-invoices');
      newStats.overdue = {
        total: res.data.total_overdue || 0,
        amount: res.data.total_amount || 0,
        list: res.data.invoices || [],
      };
    } catch {
      /* ignore */
    }

    setStats(newStats);
    setLoading(false);
  };

  const handleFilterRevenue = async () => {
    try {
      const params = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      const res = await api.get('/reports/revenue', { params });
      setStats((prev) => ({
        ...prev,
        revenue: { total: res.data.total_revenue || 0 },
      }));
    } catch {
      /* ignore */
    }
  };

  const statCards = [
    {
      label: 'Active Subscriptions',
      value: stats.activeSubs.total.toLocaleString(),
      icon: HiOutlineClipboardList,
      bg: '#017E84',
    },
    {
      label: 'Revenue',
      value: `₹${Number(stats.revenue.total).toLocaleString()}`,
      icon: HiOutlineCurrencyDollar,
      bg: '#059669',
    },
    {
      label: 'Total Payments',
      value: `₹${Number(stats.payments.total).toLocaleString()}`,
      icon: HiOutlineCreditCard,
      bg: '#2563EB',
    },
    {
      label: 'Overdue',
      value: stats.overdue.total.toLocaleString(),
      icon: HiOutlineExclamationCircle,
      bg: '#DC2626',
    },
  ];

  const getBadgeClass = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'draft') return styles.badgeDraft;
    if (s === 'quotation') return styles.badgeQuotation;
    if (s === 'confirmed') return styles.badgeConfirmed;
    if (s === 'active') return styles.badgeActive;
    if (s === 'paused') return styles.badgePaused;
    if (s === 'closed') return styles.badgeClosed;
    if (s === 'cancelled') return styles.badgeCancelled;
    if (s === 'paid') return styles.badgePaid;
    return styles.badgeDraft;
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
      {/* Stat Cards */}
      <div className={styles.statsGrid}>
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div className={styles.statCard} key={card.label}>
              <div className={styles.statIcon} style={{ background: card.bg }}>
                <Icon />
              </div>
              <div className={styles.statInfo}>
                <h3>{card.value}</h3>
                <p>{card.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Section 1: Active Subscriptions */}
      <div className={styles.card} style={{ padding: 24, marginBottom: 20 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: '#374151', marginBottom: 16 }}>
          Active Subscriptions
        </h3>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Sub Number</th>
                <th>Customer</th>
                <th>Status</th>
                <th>Start Date</th>
              </tr>
            </thead>
            <tbody>
              {stats.activeSubs.list.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', color: '#9CA3AF' }}>
                    No active subscriptions
                  </td>
                </tr>
              ) : (
                stats.activeSubs.list.map((sub) => (
                  <tr key={sub.id || sub.subscription_number}>
                    <td>{sub.subscription_number || sub.id}</td>
                    <td>{sub.customer_id}</td>
                    <td>
                      <span className={`${styles.badge} ${getBadgeClass(sub.status)}`}>
                        {sub.status}
                      </span>
                    </td>
                    <td>{sub.start_date || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 2: Revenue */}
      <div className={styles.card} style={{ padding: 24, marginBottom: 20 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: '#374151', marginBottom: 16 }}>
          Revenue
        </h3>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
          <input
            type="date"
            className={styles.formControl}
            style={{ width: 180 }}
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <input
            type="date"
            className={styles.formControl}
            style={{ width: 180 }}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
          <button className={styles.btnPrimary} onClick={handleFilterRevenue}>
            Filter
          </button>
        </div>
        <div style={{ fontSize: 28, fontWeight: 700, color: '#059669' }}>
          ₹{Number(stats.revenue.total).toLocaleString()}
        </div>
      </div>

      {/* Section 3: Payments by Method */}
      <div className={styles.card} style={{ padding: 24, marginBottom: 20 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: '#374151', marginBottom: 16 }}>
          Payments by Method
        </h3>
        {Array.isArray(stats.payments.by_method) && stats.payments.by_method.length > 0 ? (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Method</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {stats.payments.by_method.map((item, idx) => (
                  <tr key={idx}>
                    <td>{item.method || item.payment_method || '-'}</td>
                    <td>₹{Number(item.total || item.total_amount || 0).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div>
            <p style={{ fontSize: 14, color: '#374151' }}>
              Total Payments: <strong>₹{Number(stats.payments.total).toLocaleString()}</strong>
            </p>
            <p style={{ fontSize: 14, color: '#374151' }}>
              Payment Count: <strong>{stats.payments.count}</strong>
            </p>
          </div>
        )}
      </div>

      {/* Section 4: Overdue Invoices */}
      <div className={styles.card} style={{ padding: 24, marginBottom: 20 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: '#374151', marginBottom: 16 }}>
          Overdue Invoices
        </h3>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Due Date</th>
              </tr>
            </thead>
            <tbody>
              {stats.overdue.list.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', color: '#9CA3AF' }}>
                    No overdue invoices
                  </td>
                </tr>
              ) : (
                stats.overdue.list.map((inv) => (
                  <tr key={inv.id || inv.invoice_number}>
                    <td>{inv.invoice_number || inv.id}</td>
                    <td>{inv.customer_id}</td>
                    <td>₹{Number(inv.total || inv.total_amount || 0).toLocaleString()}</td>
                    <td>{inv.due_date || '-'}</td>
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
