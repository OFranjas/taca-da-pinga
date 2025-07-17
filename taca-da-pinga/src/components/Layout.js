import React from 'react';
import { Link } from 'react-router-dom';
import styles from './Layout.module.css';
export default function Layout({ children, showBack }) {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Taça da Pinga</h1>
        <nav>
          {showBack
            ? <Link to="/" className={styles.backButton}>Home</Link>
            : <Link to="/leaderboard" className={styles.navButton}>Leaderboard</Link>
          }
        </nav>
      </header>
      <main className={styles.main}>{children}</main>
    </div>
  );
}