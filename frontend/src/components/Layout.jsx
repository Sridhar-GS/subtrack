import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  HiOutlineViewGrid,
  HiOutlineCube,
  HiOutlineRefresh,
  HiOutlineClipboardList,
  HiOutlineDocumentText,
  HiOutlineCreditCard,
  HiOutlineTemplate,
  HiOutlineTag,
  HiOutlineCalculator,
  HiOutlineUsers,
  HiOutlineChartBar,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineLogout,
  HiOutlineUserGroup,
  HiOutlineColorSwatch,
} from 'react-icons/hi';
import { useAuth } from '../context/AuthContext';
import styles from './Layout.module.css';

const navGroups = [
  {
    label: 'MAIN',
    items: [
      { to: '/dashboard', icon: HiOutlineViewGrid, text: 'Dashboard' },
    ],
  },
  {
    label: 'MANAGEMENT',
    items: [
      { to: '/products', icon: HiOutlineCube, text: 'Products' },
      { to: '/plans', icon: HiOutlineRefresh, text: 'Recurring Plans' },
      { to: '/subscriptions', icon: HiOutlineClipboardList, text: 'Subscriptions' },
      { to: '/contacts', icon: HiOutlineUserGroup, text: 'Contacts' },
    ],
  },
  {
    label: 'BILLING',
    items: [
      { to: '/invoices', icon: HiOutlineDocumentText, text: 'Invoices' },
      { to: '/payments', icon: HiOutlineCreditCard, text: 'Payments' },
    ],
  },
  {
    label: 'CONFIGURATION',
    items: [
      { to: '/templates', icon: HiOutlineTemplate, text: 'Quotation Templates' },
      { to: '/discounts', icon: HiOutlineTag, text: 'Discounts' },
      { to: '/taxes', icon: HiOutlineCalculator, text: 'Taxes' },
      { to: '/attributes', icon: HiOutlineColorSwatch, text: 'Attributes' },
    ],
  },
  {
    label: 'ADMINISTRATION',
    items: [
      { to: '/users', icon: HiOutlineUsers, text: 'Users', roles: ['admin', 'internal'] },
      { to: '/reports', icon: HiOutlineChartBar, text: 'Reports', roles: ['admin', 'internal'] },
    ],
  },
];

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/products': 'Products',
  '/plans': 'Recurring Plans',
  '/subscriptions': 'Subscriptions',
  '/contacts': 'Contacts',
  '/invoices': 'Invoices',
  '/payments': 'Payments',
  '/templates': 'Quotation Templates',
  '/discounts': 'Discounts',
  '/taxes': 'Taxes',
  '/attributes': 'Attributes',
  '/users': 'Users',
  '/reports': 'Reports',
};

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();

  const pageTitle = pageTitles[location.pathname] || 'Dashboard';

  const sidebarClass = [
    styles.sidebar,
    collapsed ? styles.sidebarCollapsed : styles.sidebarOpen,
  ].join(' ');

  const mainClass = [
    styles.main,
    collapsed ? styles.mainShifted : '',
  ].join(' ');

  return (
    <div className={styles.layout}>
      {/* Mobile overlay */}
      <div
        className={`${styles.overlay} ${collapsed ? styles.overlayHidden : ''}`}
        onClick={() => setCollapsed(true)}
      />

      {/* Sidebar */}
      <aside className={sidebarClass}>
        <div className={styles.sidebarHeader}>
          <span className={styles.logoIcon}>
            <HiOutlineRefresh />
          </span>
          {!collapsed && <span className={styles.logoText}>SubTrack</span>}
        </div>

        <nav className={styles.nav}>
          {navGroups.map((group) => {
            const visibleItems = group.items.filter((item) => {
              if (!item.roles) return true;
              return user && item.roles.includes(user.role);
            });

            if (visibleItems.length === 0) return null;

            return (
              <div key={group.label}>
                <div
                  className={
                    collapsed
                      ? styles.navGroupLabelHidden
                      : styles.navGroupLabel
                  }
                >
                  {group.label}
                </div>
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={({ isActive }) =>
                        `${styles.navItem} ${isActive ? styles.active : ''}`
                      }
                      title={collapsed ? item.text : undefined}
                    >
                      <span className={styles.navItemIcon}>
                        <Icon />
                      </span>
                      {!collapsed && (
                        <span className={styles.navItemText}>{item.text}</span>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            );
          })}
        </nav>

        <button
          className={styles.toggleBtn}
          onClick={() => setCollapsed((prev) => !prev)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <HiOutlineChevronRight /> : <HiOutlineChevronLeft />}
        </button>
      </aside>

      {/* Main Content */}
      <div className={mainClass}>
        <header className={styles.topBar}>
          <h1 className={styles.pageTitle}>{pageTitle}</h1>
          <div className={styles.userMenu}>
            <span className={styles.userName}>
              {user?.full_name || user?.email || 'User'}
            </span>
            <span className={styles.roleBadge}>{user?.role || 'user'}</span>
            <button className={styles.logoutBtn} onClick={logout}>
              <HiOutlineLogout />
              Logout
            </button>
          </div>
        </header>

        <main className={styles.pageContent}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
