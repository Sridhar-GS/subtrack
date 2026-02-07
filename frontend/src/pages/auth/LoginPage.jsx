import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  HiOutlineMail,
  HiOutlineLockClosed,
  HiOutlineEye,
  HiOutlineEyeOff,
} from 'react-icons/hi';
import { useAuth } from '../../context/AuthContext';
import styles from './Auth.module.css';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, googleLogin } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Pick up success message passed from signup redirect
  const successMessage = location.state?.message || '';

  const handleGoogleSuccess = async () => {
    setError('');
    setLoading(true);
    try {
      const loggedInUser = await googleLogin();
      const dest = loggedInUser.role === 'portal' ? '/' : '/dashboard';
      navigate(dest, { replace: true });
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        err.message ||
        'Google sign-in failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const loggedInUser = await login(email, password);
      const dest = loggedInUser.role === 'portal' ? '/' : '/dashboard';
      navigate(dest, { replace: true });
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        'Invalid email or password. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        {/* Logo */}
        <div className={styles.logoArea}>
          <h1 className={styles.logo}>SubTrack</h1>
          <p className={styles.subtitle}>Sign in to your account</p>
        </div>

        {/* Success alert (e.g. after signup) */}
        {successMessage && (
          <div className={`${styles.alert} ${styles.alertSuccess}`}>
            {successMessage}
          </div>
        )}

        {/* Error alert */}
        {error && (
          <div className={`${styles.alert} ${styles.alertError}`}>{error}</div>
        )}

        {/* Google Sign-In via Firebase */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button
            type="button"
            className={styles.googleButton}
            onClick={handleGoogleSuccess}
            disabled={loading}
          >
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.04 24.04 0 0 0 0 21.56l7.98-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            Continue with Google
          </button>
        </div>

        <div className={styles.divider}>
          <span className={styles.dividerText}>or sign in with email</span>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          {/* Email */}
          <div className={styles.fieldGroup}>
            <div className={styles.inputWrapper}>
              <span className={styles.inputIcon}>
                <HiOutlineMail />
              </span>
              <input
                type="email"
                className={styles.input}
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
          </div>

          {/* Password */}
          <div className={styles.fieldGroup}>
            <div className={styles.inputWrapper}>
              <span className={styles.inputIcon}>
                <HiOutlineLockClosed />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                className={`${styles.input} ${styles.inputWithToggle}`}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className={styles.togglePassword}
                onClick={() => setShowPassword((prev) => !prev)}
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <HiOutlineEyeOff /> : <HiOutlineEye />}
              </button>
            </div>
          </div>

          {/* Forgot password link */}
          <div className={styles.forgotLink}>
            <Link to="/forgot-password" className={styles.link}>
              Forgot your password?
            </Link>
          </div>

          {/* Submit */}
          <button type="submit" className={styles.button} disabled={loading}>
            {loading ? <span className={styles.spinner} /> : 'Sign In'}
          </button>
        </form>

        {/* Footer */}
        <p className={styles.footer}>
          Don&apos;t have an account?{' '}
          <Link to="/signup">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
