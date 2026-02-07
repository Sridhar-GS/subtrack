import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import styles from './Portal.module.css';

export default function MyProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState({
    full_name: user?.full_name || '',
    phone: user?.phone || '',
    company: user?.company || '',
    street: user?.street || '',
    city: user?.city || '',
    state: user?.state || '',
    zip_code: user?.zip_code || '',
    country: user?.country || '',
  });
  const [passwords, setPasswords] = useState({ old_password: '', new_password: '', confirm: '' });
  const [profileMsg, setProfileMsg] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');
  const [profileErr, setProfileErr] = useState('');
  const [passwordErr, setPasswordErr] = useState('');

  const handleProfileSave = async () => {
    setProfileMsg('');
    setProfileErr('');
    try {
      await api.put('/users/me/profile', profile);
      setProfileMsg('Profile updated successfully');
    } catch (err) {
      setProfileErr(err.response?.data?.detail || 'Failed to update profile');
    }
  };

  const handlePasswordChange = async () => {
    setPasswordMsg('');
    setPasswordErr('');
    if (passwords.new_password !== passwords.confirm) {
      setPasswordErr('Passwords do not match');
      return;
    }
    try {
      await api.post('/users/me/change-password', {
        old_password: passwords.old_password,
        new_password: passwords.new_password,
      });
      setPasswordMsg('Password changed successfully');
      setPasswords({ old_password: '', new_password: '', confirm: '' });
    } catch (err) {
      setPasswordErr(err.response?.data?.detail || 'Failed to change password');
    }
  };

  return (
    <div>
      <h2 className={styles.sectionTitle}>My Profile</h2>
      <div className={styles.profileCard}>
        <div className={styles.profileSection}>
          <h3>Personal Information</h3>
          <div className={styles.formGroup}>
            <label>Email</label>
            <input value={user?.email || ''} disabled style={{ background: '#F9FAFB' }} />
          </div>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Full Name</label>
              <input value={profile.full_name} onChange={(e) => setProfile({ ...profile, full_name: e.target.value })} />
            </div>
            <div className={styles.formGroup}>
              <label>Phone</label>
              <input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
            </div>
          </div>
          <div className={styles.formGroup}>
            <label>Company</label>
            <input value={profile.company} onChange={(e) => setProfile({ ...profile, company: e.target.value })} />
          </div>
        </div>

        <div className={styles.profileSection}>
          <h3>Address</h3>
          <div className={styles.formGroup}>
            <label>Street</label>
            <input value={profile.street} onChange={(e) => setProfile({ ...profile, street: e.target.value })} />
          </div>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>City</label>
              <input value={profile.city} onChange={(e) => setProfile({ ...profile, city: e.target.value })} />
            </div>
            <div className={styles.formGroup}>
              <label>State</label>
              <input value={profile.state} onChange={(e) => setProfile({ ...profile, state: e.target.value })} />
            </div>
          </div>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>ZIP Code</label>
              <input value={profile.zip_code} onChange={(e) => setProfile({ ...profile, zip_code: e.target.value })} />
            </div>
            <div className={styles.formGroup}>
              <label>Country</label>
              <input value={profile.country} onChange={(e) => setProfile({ ...profile, country: e.target.value })} />
            </div>
          </div>
          {profileMsg && <div className={styles.alertSuccess}>{profileMsg}</div>}
          {profileErr && <div className={styles.alertError}>{profileErr}</div>}
          <button className={styles.saveBtn} onClick={handleProfileSave}>Save Profile</button>
        </div>

        <div className={styles.profileSection}>
          <h3>Change Password</h3>
          <div className={styles.formGroup}>
            <label>Current Password</label>
            <input type="password" value={passwords.old_password} onChange={(e) => setPasswords({ ...passwords, old_password: e.target.value })} />
          </div>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>New Password</label>
              <input type="password" value={passwords.new_password} onChange={(e) => setPasswords({ ...passwords, new_password: e.target.value })} />
            </div>
            <div className={styles.formGroup}>
              <label>Confirm Password</label>
              <input type="password" value={passwords.confirm} onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })} />
            </div>
          </div>
          {passwordMsg && <div className={styles.alertSuccess}>{passwordMsg}</div>}
          {passwordErr && <div className={styles.alertError}>{passwordErr}</div>}
          <button className={styles.saveBtn} onClick={handlePasswordChange}>Change Password</button>
        </div>
      </div>
    </div>
  );
}
