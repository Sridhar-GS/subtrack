import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { HiOutlineShoppingCart, HiOutlineUser, HiOutlineLogout, HiOutlineChevronDown } from 'react-icons/hi';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import styles from './PortalLayout.module.css';

export default function PortalLayout() {
  const { user, logout } = useAuth();
  const { cartItems } = useCart();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const handleLogout = () => {
    logout();
    setShowDropdown(false);
    navigate('/login');
  };

  return (
    <div className={styles.wrapper}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <NavLink to="/" className={styles.logo}>SubTrack</NavLink>
          <nav className={styles.nav}>
            <NavLink to="/" end className={({ isActive }) => isActive ? `${styles.navLink} ${styles.active}` : styles.navLink}>Home</NavLink>
            <NavLink to="/shop" className={({ isActive }) => isActive ? `${styles.navLink} ${styles.active}` : styles.navLink}>Shop</NavLink>
            {user && (
              <NavLink to="/my-orders" className={({ isActive }) => isActive ? `${styles.navLink} ${styles.active}` : styles.navLink}>My Account</NavLink>
            )}
          </nav>
          <div className={styles.actions}>
            <NavLink to="/cart" className={styles.cartBtn}>
              <HiOutlineShoppingCart />
              {cartCount > 0 && <span className={styles.cartBadge}>{cartCount}</span>}
            </NavLink>
            {user ? (
              <div className={styles.userMenu} onMouseLeave={() => setShowDropdown(false)}>
                <button className={styles.userBtn} onClick={() => setShowDropdown(!showDropdown)}>
                  <span>My Profile</span>
                  <HiOutlineChevronDown />
                </button>
                {showDropdown && (
                  <div className={styles.dropdown}>
                    <NavLink to="/my-profile" className={styles.dropdownItem} onClick={() => setShowDropdown(false)}>User Details</NavLink>
                    <NavLink to="/my-orders" className={styles.dropdownItem} onClick={() => setShowDropdown(false)}>My Orders</NavLink>
                    <button className={styles.dropdownItem} onClick={handleLogout}>
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <NavLink to="/login" className={styles.loginBtn}>Sign In</NavLink>
            )}
          </div>
        </div>
      </header>
      <main className={styles.main}><Outlet /></main>
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <p>&copy; 2025 SubTrack. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
