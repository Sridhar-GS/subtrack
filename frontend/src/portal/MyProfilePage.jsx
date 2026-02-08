import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import styles from './Portal.module.css';

export default function MyProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    street: user?.street || '',
    city: user?.city || '',
    state: user?.state || '',
    zip_code: user?.zip_code || '',
    country: user?.country || '',
    company: user?.company || '',
  });
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const handleChange = (field, value) => setProfile({ ...profile, [field]: value });

  const handleSave = async () => {
    setMsg(''); setErr('');
    try {
      await api.put('/users/me/profile', profile);
      setMsg('Profile updated successfully');
    } catch (e) {
      setErr(e.response?.data?.detail || 'Failed to update profile');
    }
  };

  return (
    <div>
      <h2 className={styles.sectionTitle}>User Details</h2>
      <div className={styles.profileCard}>
        <div className={styles.formGroup}>
          <label>User Name</label>
          <input value={profile.full_name} onChange={(e) => handleChange('full_name', e.target.value)} placeholder="Enter your name" />
        </div>
        <div className={styles.formGroup}>
          <label>Email</label>
          <input type="email" value={profile.email} onChange={(e) => handleChange('email', e.target.value)} placeholder="Enter your email" />
        </div>
        <div className={styles.formGroup}>
          <label>Phone Number</label>
          <input value={profile.phone} onChange={(e) => handleChange('phone', e.target.value)} placeholder="Enter your phone number" />
        </div>
        <div className={styles.formGroup}>
          <label>Address</label>
          <input value={profile.street} onChange={(e) => handleChange('street', e.target.value)} placeholder="Street address" />
        </div>
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label>City</label>
            <input value={profile.city} onChange={(e) => handleChange('city', e.target.value)} placeholder="City" />
          </div>
          <div className={styles.formGroup}>
            <label>State</label>
            <input value={profile.state} onChange={(e) => handleChange('state', e.target.value)} placeholder="State" />
          </div>
        </div>
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label>ZIP Code</label>
            <input value={profile.zip_code} onChange={(e) => handleChange('zip_code', e.target.value)} placeholder="ZIP code" />
          </div>
          <div className={styles.formGroup}>
            <label>Country</label>
            <input value={profile.country} onChange={(e) => handleChange('country', e.target.value)} placeholder="Country" />
          </div>
        </div>
        <div className={styles.formGroup}>
          <label>Company</label>
          <input value={profile.company} onChange={(e) => handleChange('company', e.target.value)} placeholder="Company name" />
        </div>

        {msg && <div className={styles.alertSuccess}>{msg}</div>}
        {err && <div className={styles.alertError}>{err}</div>}
        <button className={styles.saveBtn} onClick={handleSave}>Save Changes</button>
      </div>
    </div>
  );
}
