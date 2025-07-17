import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import AddPingasPanel from '../components/AddPingasPanel';
import ManageTeamsPanel from '../components/ManageTeamsPanel';
import { auth } from '../firebase';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import styles from './Admin.module.css';
import { toast } from 'react-toastify';

export default function Admin() {
  const [user, setUser] = useState(null);
  const [section, setSection] = useState('add');

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(u => setUser(u));
    return unsub;
  }, []);

  // Login handler
  const login = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success('Logged in successfully');
    } catch (e) {
      toast.error(e.message);
    }
  };

  // Logout handler
  const logout = async () => {
    await signOut(auth);
    toast.info('Logged out');
  };

  if (!user) {
    return (
      <>
        <Header />
        <div className={styles.card}>
          <h2 className={styles.title}>Admin Login</h2>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className={styles.input}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className={styles.input}
          />
          <button onClick={login} className={styles.button}>
            Login
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className={styles.card}>
        <div className={styles.header}>
          <h2 className={styles.title}>Admin Panel</h2>
          <button onClick={logout} className={styles.logoutBtn}>
            Logout
          </button>
        </div>
        <div className={styles.tabBar}>
          <button
            className={section === 'add' ? styles.activeTab : styles.tab}
            onClick={() => setSection('add')}
          >
            Add Pingas
          </button>
          <button
            className={section === 'manage' ? styles.activeTab : styles.tab}
            onClick={() => setSection('manage')}
          >
            Manage Teams
          </button>
        </div>

        {section === 'add' ? <AddPingasPanel /> : <ManageTeamsPanel />}
      </div>
    </>
  );
}
