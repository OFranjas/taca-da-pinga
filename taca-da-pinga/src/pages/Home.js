import React from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import styles from './Home.module.css';
export default function Home() {
  return (
    <Layout>
      <div className={styles.container}>
        <h2 className={styles.title}>Taça da Pinga</h2>
        <div className={styles.buttonGroup}>
          <Link to="/leaderboard" className={`${styles.button} ${styles.leader}`}>Leaderboard</Link>
          <Link to="/admin" className={`${styles.button} ${styles.admin}`}>Admin Panel</Link>
        </div>
      </div>
    </Layout>
  );
}