import { useState } from 'react';
import { Link } from 'react-router-dom';
import { HiOutlineMail } from 'react-icons/hi';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../firebase';
import api from '../../api';
import styles from './Auth.module.css';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      // Step 1: Verify email exists in our database
      await api.post('/auth/forgot-password', { email: email.trim() });

      // Step 2: Send Firebase password reset email
      await sendPasswordResetEmail(auth, email.trim(), {
        url: window.location.origin + '/login',
        handleCodeInApp: false,
      });

      setSuccess(true);
    } catch (err) {
      if (err.response?.data?.detail) {
        // Backend error (e.g. email not found)
        setError(err.response.data.detail);
      } else if (err.code === 'auth/user-not-found') {
        setError('Email does not exist');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many requests. Please try again later.');
      } else {
        setError(err.message || 'Something went wrong. Please try again.');
      }
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
          <p className={styles.subtitle}>Reset your password</p>
          <p className={styles.description}>
            Enter your email and we&apos;ll send you a reset link.
          </p>
        </div>

        {/* Success message */}
        {success && (
          <div className={`${styles.alert} ${styles.alertSuccess}`}>
            <p style={{ margin: 0 }}>
              A password reset link has been sent to <strong>{email}</strong>.
              Please check your inbox and click the link to reset your password.
            </p>
          </div>
        )}

        {/* Error alert */}
        {error && (
          <div className={`${styles.alert} ${styles.alertError}`}>{error}</div>
        )}

        {!success && (
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

            {/* Submit */}
            <button type="submit" className={styles.button} disabled={loading}>
              {loading ? <span className={styles.spinner} /> : 'Send Reset Link'}
            </button>
          </form>
        )}

        {/* Footer */}
        <p className={styles.footer}>
          <Link to="/login">Back to Sign In</Link>
        </p>
      </div>
    </div>
  );
}
