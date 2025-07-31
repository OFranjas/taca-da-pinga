// src/components/Header.js
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import styles from './Header.module.css';
import logo from '../assets/logo.png';

export default function Header() {
  const { pathname } = useLocation();
  const showHome = pathname !== '/';

  // The ghost element ensures symmetry
  return (
    <header className={styles.header}>
      <div className={styles.logoWrapper}>
        {showHome ? (
          <Link to="/" className={styles.logoLink}>
            <img src={logo} alt="Logo Taça da Pinga" className={styles.logo} />
          </Link>
        ) : (
          <img src={logo} alt="Logo Taça da Pinga" className={styles.logo} />
        )}
      </div>
      <h1 className={styles.title}>Taça da Pinga</h1>
      {/* Ghost div with same width as logo to center the title */}
      <div className={styles.logoWrapper} aria-hidden="true"></div>
    </header>
  );
}
