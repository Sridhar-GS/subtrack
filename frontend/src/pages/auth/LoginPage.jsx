import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
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

  const handleGoogleSuccess = async (credentialResponse) => {
    setError('');
    setLoading(true);
    try {
      const loggedInUser = await googleLogin(credentialResponse.credential);
      const dest = loggedInUser.role === 'portal' ? '/' : '/dashboard';
      navigate(dest, { replace: true });
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
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

        {/* Google Sign-In */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setError('Google sign-in failed. Please try again.')}
            text="continue_with"
            shape="rectangular"
            width="340"
          />
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
