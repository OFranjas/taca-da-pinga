import React from "react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import styles from "./Home.module.css";
import logo from "../assets/logo.png";

export default function Home() {
  return (
    <>
      <Header />
      <main className={styles.hero}>
        <section className={styles.panel}>
          <img src={logo} alt="Logo Taça da Pinga" className={styles.logo} />
          <h1 className={styles.title}>Taça da Pinga</h1>
          <div className={styles.buttonGroup}>
            <Link
              to="/leaderboard"
              className={`${styles.button} ${styles.leader}`}
            >
              Ver leaderboard
            </Link>
            <Link to="/admin" className={`${styles.button} ${styles.admin}`}>
              Admin panel
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
