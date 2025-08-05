import React, { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import Header from "../components/Header";
import LeaderboardBars from "../components/LeaderboardBars";
import SponsorsRail from "../components/SponsorsRail";
import styles from "./Leaderboard.module.css";

// import your 6 sponsor images from src/assets
import s1 from "../assets/s1.png";
import s2 from "../assets/s2.jpeg";
import s3 from "../assets/s3.png";
import s4 from "../assets/s4.png";
import s5 from "../assets/s5.png";
import s6 from "../assets/s6.png";
import s7 from "../assets/s7.jpeg";
import s8 from "../assets/s8.jpeg";
import s9 from "../assets/s9.jpeg";
import s10 from "../assets/s10.jpeg";
import s11 from "../assets/s11.png";
import s12 from "../assets/s12.png";

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

  const left = [s1, s3, s5, s7, s10, s11];
  const right = [s2, s4, s6, s8, s9, s12];

  return (
    <>
      <Header />
      <main className={styles.railsLayout}>
        <SponsorsRail images={left} side="left" />
        <div className={styles.wrapper}>
          <div className={styles.pageHeader}>
            <h1 className={styles.title}>Leaderboard</h1>
          </div>

          <LeaderboardBars teams={teams} />
        </div>

        <SponsorsRail images={right} side="right" />
      </main>
    </>
  );
}
