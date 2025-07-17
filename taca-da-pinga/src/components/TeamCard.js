import React from 'react';
import styles from './TeamCard.module.css';
export default function TeamCard({ team }) {
  return (
    <div className={styles.card}>
      <div className={styles.info}>
        <span className={styles.name}>{team.name}</span>
        <span className={styles.pingas}>Pingas: {team.pingas}</span>
      </div>
    </div>
  );
}