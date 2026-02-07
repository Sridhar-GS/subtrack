import { useState, useEffect } from 'react';
import {
  HiOutlineClipboardList,
  HiOutlineCurrencyDollar,
  HiOutlineCreditCard,
  HiOutlineExclamationCircle,
} from 'react-icons/hi';
import api from '../api';
import styles from './Page.module.css';

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [totalActive, setTotalActive] = useState(0);
  const [subscriptions, setSubscriptions] = useState([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [paymentCount, setPaymentCount] = useState(0);
  const [totalOverdue, setTotalOverdue] = useState(0);
  const [overdueInvoices, setOverdueInvoices] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);

    // Fetch active subscriptions
    try {
      const res = await api.get('/reports/active-subscriptions');
      setTotalActive(res.data.total_active || 0);
      setSubscriptions(res.data.subscriptions || []);
    } catch {
      setTotalActive(0);
      setSubscriptions([]);
    }

    // Fetch revenue
    try {
      const res = await api.get('/reports/revenue');
      setTotalRevenue(res.data.total_revenue || 0);
    } catch {
      setTotalRevenue(0);
    }

    // Fetch payments summary
    try {
      const res = await api.get('/reports/payments-summary');
      setPaymentCount(res.data.payment_count || 0);
    } catch {
      setPaymentCount(0);
    }

    // Fetch overdue invoices
    try {
      const res = await api.get('/reports/overdue-invoices');
      setTotalOverdue(res.data.total_overdue || 0);
      setOverdueInvoices(res.data.total_amount ? [] : (res.data.invoices || []));
      // Store invoices list; also keep raw data
      if (res.data.invoices) {
        setOverdueInvoices(res.data.invoices);
      }
    } catch {
      setTotalOverdue(0);
      setOverdueInvoices([]);
    }

    setLoading(false);
  };

  const statCards = [
    {
      label: 'Active Subscriptions',
      value: totalActive.toLocaleString(),
      icon: HiOutlineClipboardList,
      bg: '#017E84',
    },
    {
      label: 'Revenue',
      value: `$${Number(totalRevenue).toLocaleString()}`,
      icon: HiOutlineCurrencyDollar,
      bg: '#059669',
    },
    {
      label: 'Payments',
      value: paymentCount.toLocaleString(),
      icon: HiOutlineCreditCard,
      bg: '#2563EB',
    },
    {
      label: 'Overdue Invoices',
      value: totalOverdue.toLocaleString(),
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
      <div className={styles.loading}>
        <div className={styles.spinner} />
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

      {/* Recent Tables */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Recent Subscriptions */}
        <div className={styles.card}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #E5E7EB' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#374151' }}>
              Recent Subscriptions
            </h3>
          </div>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Number</th>
                  <th>Status</th>
                  <th>Start Date</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.length === 0 ? (
                  <tr>
                    <td colSpan={3} style={{ textAlign: 'center', color: '#9CA3AF' }}>
                      No subscriptions found
                    </td>
                  </tr>
                ) : (
                  subscriptions.slice(0, 5).map((sub) => (
                    <tr key={sub.id || sub.subscription_number}>
                      <td>{sub.subscription_number || sub.id}</td>
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

        {/* Overdue Invoices */}
        <div className={styles.card}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #E5E7EB' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#374151' }}>
              Overdue Invoices
            </h3>
          </div>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Amount</th>
                  <th>Due Date</th>
                </tr>
              </thead>
              <tbody>
                {overdueInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={3} style={{ textAlign: 'center', color: '#9CA3AF' }}>
                      No overdue invoices
                    </td>
                  </tr>
                ) : (
                  overdueInvoices.slice(0, 5).map((inv) => (
                    <tr key={inv.id || inv.invoice_number}>
                      <td>{inv.invoice_number || inv.id}</td>
                      <td>${Number(inv.amount || inv.total_amount || 0).toLocaleString()}</td>
                      <td>{inv.due_date || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
