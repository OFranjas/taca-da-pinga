import React, { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import Header from "../components/Header";
import HorizontalBarChart from "../components/HorizontalBarChart";
import styles from "./Leaderboard.module.css";

export default function Leaderboard() {
  const [teams, setTeams] = useState([]);

  useEffect(()=> {
    const q = query(
      collection(db,"teams"),
      orderBy("pingas","desc"),
      orderBy("name")
    );
    return onSnapshot(q,snap=>{
      setTeams(snap.docs.map(d=>({ id:d.id, ...d.data() })));
    });
  },[]);

  return (
    <>
      <Header />
      <main className={styles.wrapper}>
        <h1 className={styles.title}>Leaderboard</h1>
        <HorizontalBarChart data={teams} highlight={5}/>
      </main>
    </>
  );
}
