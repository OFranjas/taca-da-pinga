import React, { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import styles from "./Leaderboard.module.css";
import Header from "../components/Header";

export default function Leaderboard() {
  const [teams, setTeams] = useState([]);

  useEffect(() => {
    const q = query(
      collection(db, "teams"),
      orderBy("pingas", "desc"),
      orderBy("name")
    );
    return onSnapshot(q, (snap) => {
      setTeams(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, []);

  const [first, second, third, ...rest] = teams;

  return (
    <div>
      <Header />
      <div className={styles.page}>
        <header className={styles.header}>
          <h1 className={styles.title}>Leaderboard</h1>
        </header>

        <section className={styles.podium}>
          {second && (
            <div className={`${styles.card} ${styles.second}`}>
              <div className={styles.rank}>2º</div>
              <div className={styles.name}>{second.name}</div>
              <div className={styles.score}>{second.pingas}</div>
            </div>
          )}
          {first && (
            <div className={`${styles.card} ${styles.first}`}>
              <div className={styles.rank}>1º</div>
              <div className={styles.name}>{first.name}</div>
              <div className={styles.score}>{first.pingas}</div>
            </div>
          )}
          {third && (
            <div className={`${styles.card} ${styles.third}`}>
              <div className={styles.rank}>3º</div>
              <div className={styles.name}>{third.name}</div>
              <div className={styles.score}>{third.pingas}</div>
            </div>
          )}
        </section>

        <ul className={styles.list}>
          {rest.map((t, i) => (
            <li key={t.id} className={styles.listItem}>
              <span className={styles.position}>{i + 4}.</span>
              <span className={styles.listName}>{t.name}</span>
              <span className={styles.listScore}>{t.pingas}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
