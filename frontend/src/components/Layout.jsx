import { useState, useRef, useEffect } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  HiOutlineRefresh,
  HiOutlineLogout,
  HiOutlineChevronDown,
  HiOutlineUser,
} from 'react-icons/hi';
import { useAuth } from '../context/AuthContext';
import styles from './Layout.module.css';

const configItems = [
  { to: '/attributes', text: 'Attributes' },
  { to: '/plans', text: 'Recurring Plan' },
  { to: '/templates', text: 'Quotation Template' },
  { to: '/payments', text: 'Payment Term' },
  { to: '/discounts', text: 'Discount' },
  { to: '/taxes', text: 'Taxes' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [configOpen, setConfigOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const configRef = useRef(null);
  const profileRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (configRef.current && !configRef.current.contains(e.target)) setConfigOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Close dropdowns on route change
  useEffect(() => {
    setConfigOpen(false);
    setProfileOpen(false);
  }, [location.pathname]);

  const isConfigActive = configItems.some((item) => location.pathname.startsWith(item.to));

  return (
    <div className={styles.layout}>
      {/* Top Navigation Bar */}
      <header className={styles.topNav}>
        <div className={styles.topNavInner}>
          {/* Logo */}
          <NavLink to="/subscriptions" className={styles.logo}>
            <HiOutlineRefresh className={styles.logoIcon} />
            <span className={styles.logoText}>SubTrack</span>
          </NavLink>

          {/* Main Nav */}
          <nav className={styles.mainNav}>
            <NavLink to="/subscriptions" className={({ isActive }) => `${styles.navLink} ${isActive || location.pathname.startsWith('/subscriptions') ? styles.navLinkActive : ''}`}>
              Subscriptions
            </NavLink>
            <NavLink to="/products" className={({ isActive }) => `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}>
              Products
            </NavLink>
            <NavLink to="/reports" className={({ isActive }) => `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}>
              Reporting
            </NavLink>
            <NavLink to="/users" className={({ isActive }) => `${styles.navLink} ${isActive || location.pathname === '/contacts' ? styles.navLinkActive : ''}`}>
              Users/Contacts
            </NavLink>

            {/* Configuration Dropdown */}
            <div className={styles.dropdownWrap} ref={configRef}>
              <button
                className={`${styles.navLink} ${isConfigActive ? styles.navLinkActive : ''}`}
                onClick={() => setConfigOpen((v) => !v)}
              >
                Configuration <HiOutlineChevronDown style={{ fontSize: 14, marginLeft: 4 }} />
              </button>
              {configOpen && (
                <div className={styles.dropdown}>
                  {configItems.map((item) => (
                    <NavLink key={item.to} to={item.to} className={styles.dropdownItem}>
                      {item.text}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          </nav>

          {/* Right: Profile */}
          <div className={styles.navRight}>
            <div className={styles.dropdownWrap} ref={profileRef}>
              <button className={styles.profileBtn} onClick={() => setProfileOpen((v) => !v)}>
                <HiOutlineUser />
                <span>My Profile</span>
                <HiOutlineChevronDown style={{ fontSize: 12 }} />
              </button>
              {profileOpen && (
                <div className={`${styles.dropdown} ${styles.dropdownRight}`}>
                  <div className={styles.dropdownHeader}>
                    <div className={styles.dropdownUserName}>{user?.full_name || user?.email || 'User'}</div>
                    <div className={styles.dropdownRole}>{user?.role || 'user'}</div>
                  </div>
                  <button className={styles.dropdownItem} onClick={() => { logout(); navigate('/login'); }}>
                    <HiOutlineLogout style={{ marginRight: 8 }} /> Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={styles.pageContent}>
        <Outlet />
      </main>
    </div>
  );
}
