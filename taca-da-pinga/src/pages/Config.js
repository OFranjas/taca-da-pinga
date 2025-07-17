import React, { useState, useEffect } from 'react';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '../firebase';
import Layout from '../components/Layout';
import styles from './Config.module.css';
import { Link } from 'react-router-dom';

export default function Config() {
  const [user, setUser] = useState(null);
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(u => setUser(u));
    return unsub;
  }, []);

  const addTeam = async () => {
    setError('');
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Team name cannot be empty');
      return;
    }
    // Check for existing name
    const q = query(collection(db, 'teams'), where('name', '==', trimmed));
    const snap = await getDocs(q);
    if (!snap.empty) {
      setError('A team with this name already exists');
      return;
    }
    // Add new team
    await addDoc(collection(db, 'teams'), { name: trimmed, pingas: 0 });
    setName('');
  };

  if (!user) {
    return (
      <Layout showBack>
        <div className={styles.container}>
          <div className={styles.card}>
            <h2 className={styles.title}>Authentication Required</h2>
            <p>Please <Link to="/admin" className={styles.button}>login</Link> as admin to configure teams.</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout showBack>
      <div className={styles.container}>
        <div className={styles.card}>
          <h2 className={styles.title}>Configure Teams</h2>
          {error && <div className={styles.error}>{error}</div>}
          <div className={styles.form}>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Team Name"
              className={styles.input}
            />
            <button onClick={addTeam} className={styles.button}>Add Team</button>
          </div>
        </div>
      </div>
    </Layout>
  );
}