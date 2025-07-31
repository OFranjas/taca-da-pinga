import React, { useEffect, useMemo, useState } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import Header from "../components/Header";
import LeaderboardBars from "../components/LeaderboardBars";
import styles from "./Leaderboard.module.css";

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

  const total = useMemo(
    () => teams.reduce((sum, t) => sum + (Number(t.pingas) || 0), 0),
    [teams]
  );

  return (
    <>
      <Header />
      <main className={styles.wrapper}>
        <div className={styles.pageHeader}>
          <h1 className={styles.title}>Leaderboard</h1>
          <div className={styles.totals}>
            <span className={styles.totalLabel}>Total drinks</span>
            <span className={styles.totalValue}>{total}</span>
          </div>
        </div>
        <LeaderboardBars teams={teams} />
      </main>
    </>
  );
}
