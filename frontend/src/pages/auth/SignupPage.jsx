import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import {
  HiOutlineUser,
  HiOutlineMail,
  HiOutlinePhone,
  HiOutlineOfficeBuilding,
  HiOutlineLockClosed,
  HiOutlineEye,
  HiOutlineEyeOff,
} from 'react-icons/hi';
import { useAuth } from '../../context/AuthContext';
import styles from './Auth.module.css';

export default function SignupPage() {
  const navigate = useNavigate();
  const { signup, googleLogin } = useAuth();

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    company: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const handleChange = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    // Clear field-level error on change
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validate = () => {
    const errors = {};

    if (!formData.full_name.trim()) {
      errors.full_name = 'Full name is required.';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email is required.';
    }

    if (!formData.password) {
      errors.password = 'Password is required.';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters.';
    }

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validate()) return;

    setLoading(true);

    try {
      const payload = {
        full_name: formData.full_name.trim(),
        email: formData.email.trim(),
        password: formData.password,
      };
      if (formData.phone.trim()) payload.phone = formData.phone.trim();
      if (formData.company.trim()) payload.company = formData.company.trim();

      await signup(payload);

      navigate('/login', {
        state: { message: 'Account created successfully! Please sign in.' },
        replace: true,
      });
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        'Something went wrong. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

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
        'Google sign-up failed. Please try again.';
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
          <p className={styles.subtitle}>Create your account</p>
        </div>

        {/* Error alert */}
        {error && (
          <div className={`${styles.alert} ${styles.alertError}`}>{error}</div>
        )}

        {/* Google Sign-Up */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setError('Google sign-up failed. Please try again.')}
            text="continue_with"
            shape="rectangular"
            width="340"
          />
        </div>

        <div className={styles.divider}>
          <span className={styles.dividerText}>or sign up with email</span>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          {/* Full Name */}
          <div className={styles.fieldGroup}>
            <div className={styles.inputWrapper}>
              <span className={styles.inputIcon}>
                <HiOutlineUser />
              </span>
              <input
                type="text"
                className={styles.input}
                placeholder="Full Name"
                value={formData.full_name}
                onChange={handleChange('full_name')}
                required
                autoComplete="name"
              />
            </div>
            {fieldErrors.full_name && (
              <span className={styles.fieldError}>{fieldErrors.full_name}</span>
            )}
          </div>

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
                value={formData.email}
                onChange={handleChange('email')}
                required
                autoComplete="email"
              />
            </div>
            {fieldErrors.email && (
              <span className={styles.fieldError}>{fieldErrors.email}</span>
            )}
          </div>

          {/* Phone (optional) */}
          <div className={styles.fieldGroup}>
            <div className={styles.inputWrapper}>
              <span className={styles.inputIcon}>
                <HiOutlinePhone />
              </span>
              <input
                type="tel"
                className={styles.input}
                placeholder="Phone number (optional)"
                value={formData.phone}
                onChange={handleChange('phone')}
                autoComplete="tel"
              />
            </div>
          </div>

          {/* Company (optional) */}
          <div className={styles.fieldGroup}>
            <div className={styles.inputWrapper}>
              <span className={styles.inputIcon}>
                <HiOutlineOfficeBuilding />
              </span>
              <input
                type="text"
                className={styles.input}
                placeholder="Company (optional)"
                value={formData.company}
                onChange={handleChange('company')}
                autoComplete="organization"
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
                value={formData.password}
                onChange={handleChange('password')}
                required
                autoComplete="new-password"
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
            {fieldErrors.password && (
              <span className={styles.fieldError}>{fieldErrors.password}</span>
            )}
          </div>

          {/* Confirm Password */}
          <div className={styles.fieldGroup}>
            <div className={styles.inputWrapper}>
              <span className={styles.inputIcon}>
                <HiOutlineLockClosed />
              </span>
              <input
                type={showConfirm ? 'text' : 'password'}
                className={`${styles.input} ${styles.inputWithToggle}`}
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleChange('confirmPassword')}
                required
                autoComplete="new-password"
              />
              <button
                type="button"
                className={styles.togglePassword}
                onClick={() => setShowConfirm((prev) => !prev)}
                tabIndex={-1}
                aria-label={showConfirm ? 'Hide password' : 'Show password'}
              >
                {showConfirm ? <HiOutlineEyeOff /> : <HiOutlineEye />}
              </button>
            </div>
            {fieldErrors.confirmPassword && (
              <span className={styles.fieldError}>
                {fieldErrors.confirmPassword}
              </span>
            )}
          </div>

          {/* Submit */}
          <button type="submit" className={styles.button} disabled={loading}>
            {loading ? <span className={styles.spinner} /> : 'Create Account'}
          </button>
        </form>

        {/* Footer */}
        <p className={styles.footer}>
          Already have an account?{' '}
          <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
