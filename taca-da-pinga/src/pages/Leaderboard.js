import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import TeamCard from '../components/TeamCard';
import Layout from '../components/Layout';
import styles from './Leaderboard.module.css';
export default function Leaderboard() {
  const [teams, setTeams] = useState([]);
  useEffect(() => {
    const q = query(collection(db, 'teams'), orderBy('pingas', 'desc'));
    return onSnapshot(q, snap => setTeams(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, []);
  return (
    <Layout showBack>
      <h2 className={styles.title}>Leaderboard</h2>
      <div className={styles.grid}>
        {teams.map(team => <TeamCard key={team.id} team={team} />)}
      </div>
    </Layout>
  );
}