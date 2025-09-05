import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import styles from './Header.module.css';
import logo from '../assets/logo.png';

export default function Header() {
  const { pathname } = useLocation();
  const isActive = (to) => pathname.startsWith(to);

  return (
    <header className={styles.header}>
      <div className={styles.centerWrap}>
        <Link to="/" className={styles.brand}>
          <img src={logo} alt="Logo Taça da Pinga" className={styles.logo} />
          <span className={styles.brandText}>Taça da Pinga</span>
        </Link>
        <nav className={styles.nav} aria-label="Main">
          <Link
            to="/leaderboard"
            className={`${styles.navLink} ${isActive('/leaderboard') ? styles.active : ''}`}
            aria-current={isActive('/leaderboard') ? 'page' : undefined}
          >
            Leaderboard
          </Link>
          <Link
            to="/admin"
            className={`${styles.navLink} ${styles.outline} ${
              isActive('/admin') ? styles.activeOutline : ''
            }`}
            aria-current={isActive('/admin') ? 'page' : undefined}
          >
            Admin
          </Link>
        </nav>
      </div>
    </header>
  );
}
