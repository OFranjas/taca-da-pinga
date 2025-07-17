// src/pages/Home.js
import React from "react";
import { Link } from "react-router-dom";
import styles from "./Home.module.css";
import Header from "../components/Header";

export default function Home() {
  return (
    <>
      <Header/>
      <section className={styles.hero}>
        <h1 className={styles.title}>Taça da Pinga</h1>
        <div className={styles.buttonGroup}>
          <Link
            to="/leaderboard"
            className={`${styles.button} ${styles.leader}`}
          >
            Leaderboard
          </Link>
          <Link to="/admin" className={`${styles.button} ${styles.admin}`}>
            Admin Panel
          </Link>
        </div>
      </section>
    </>
  );
}
