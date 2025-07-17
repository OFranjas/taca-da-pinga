// src/components/Header.js
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import styles from './Header.module.css';
import logo from '../assets/logo.png';

export default function Header() {
  const { pathname } = useLocation();
  const showHome = pathname !== '/';

  return (
    <header className={styles.header}>
      {showHome ? (
        <Link to="/" className={styles.logoLink}>
          <img src={logo} alt="Logo Taça da Pinga" className={styles.logo} />
        </Link>
      ) : (
        <img src={logo} alt="Logo Taça da Pinga" className={styles.logo} />
      )}
      <h1 className={styles.title}>Taça da Pinga</h1>
      {/* Removed separate Home button, logo now acts as Home link */}
    </header>
  );
}