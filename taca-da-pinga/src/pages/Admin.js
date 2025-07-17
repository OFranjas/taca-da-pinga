import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  increment,
  addDoc,
  where,
  getDocs
} from 'firebase/firestore';
import Header from '../components/Header';
import TeamCard from '../components/TeamCard';
import styles from './Admin.module.css';
import { toast } from 'react-toastify';

export default function Admin() {
  const [user, setUser] = useState(null);
  const [teams, setTeams] = useState([]);
  const [section, setSection] = useState('add');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [selected, setSelected] = useState('');
  const [amount, setAmount] = useState(1);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(u => setUser(u));
    return unsub;
  }, []);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'teams'), orderBy('name'));
    return onSnapshot(q, snap => setTeams(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, [user]);

  const login = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success('Logged in successfully');
    } catch (e) {
      toast.error(e.message);
    }
  };

  const logout = async () => {
    await signOut(auth);
    toast.info('Logged out');
  };

  const addPingas = async () => {
    if (!selected || amount < 1) {
      toast.error('Please select a team and enter a valid number');
      return;
    }
    try {
      const ref = doc(db, 'teams', selected);
      await updateDoc(ref, { pingas: increment(amount) });
      toast.success('Pingas added successfully');
      setAmount(1);
    } catch (e) {
      toast.error(e.message);
    }
  };

  const createTeam = async () => {
    const nameTrim = newName.trim();
    if (!nameTrim) {
      toast.error('Team name cannot be empty');
      return;
    }
    try {
      const q = query(collection(db, 'teams'), where('name', '==', nameTrim));
      const snap = await getDocs(q);
      if (!snap.empty) {
        toast.error('Team already exists');
        return;
      }
      await addDoc(collection(db, 'teams'), { name: nameTrim, pingas: 0 });
      toast.success('Team created successfully');
      setNewName('');
    } catch (e) {
      toast.error(e.message);
    }
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
            onClick={() => setSection('add')}>
            Add Pingas
          </button>
          <button
            className={section === 'manage' ? styles.activeTab : styles.tab}
            onClick={() => setSection('manage')}>
            Manage Teams
          </button>
        </div>

        {section === 'add' ? (
          <div className={styles.formGroup}>
            <select
              value={selected}
              onChange={e => setSelected(e.target.value)}
              className={styles.select}>
              <option value="">Select Team</option>
              {teams.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            <input
              type="number"
              min="1"
              value={amount}
              onChange={e => setAmount(Number(e.target.value) || 1)}
              className={styles.inputSmall}
            />
            <button onClick={addPingas} className={styles.button}>
              Add Pingas
            </button>
          </div>
        ) : (
          <div className={styles.formGroup}>
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="New Team Name"
              className={styles.input}
            />
            <button onClick={createTeam} className={styles.button}>
              Create Team
            </button>
          </div>
        )}

        <h3 className={styles.subTitle}>Current Teams</h3>
        <div className={styles.grid}>
          {teams.map(team => (
            <TeamCard key={team.id} team={team} />
          ))}
        </div>
      </div>
    </>
  );
}
