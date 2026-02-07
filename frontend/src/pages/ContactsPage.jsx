import { useState, useEffect } from 'react';
import { HiSearch, HiOutlineUser, HiOutlineMail, HiOutlinePhone } from 'react-icons/hi';
import api from '../api';
import styles from './Page.module.css';

export default function ContactsPage() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/users/')
      .then((res) => {
        const portalUsers = (res.data || []).filter((u) => u.role === 'portal');
        setContacts(portalUsers);
      })
      .catch(() => setContacts([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = contacts.filter((c) => {
    const q = search.toLowerCase();
    return (
      (c.full_name || '').toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      (c.company || '').toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}><div className={styles.spinner} /></div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <HiSearch />
          <input
            type="text"
            placeholder="Search contacts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Company</th>
                <th>City</th>
                <th>Country</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: '#9CA3AF' }}>
                    No contacts found
                  </td>
                </tr>
              ) : (
                filtered.map((contact) => (
                  <tr key={contact.id}>
                    <td style={{ fontWeight: 500 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#F3F0F2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#714B67', fontSize: 14 }}>
                          <HiOutlineUser />
                        </div>
                        {contact.full_name}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#6B7280' }}>
                        <HiOutlineMail style={{ fontSize: 14 }} /> {contact.email}
                      </div>
                    </td>
                    <td>
                      {contact.phone ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#6B7280' }}>
                          <HiOutlinePhone style={{ fontSize: 14 }} /> {contact.phone}
                        </div>
                      ) : '-'}
                    </td>
                    <td>{contact.company || '-'}</td>
                    <td>{contact.city || '-'}</td>
                    <td>{contact.country || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
