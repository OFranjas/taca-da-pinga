import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  where,
  getDocs,
  addDoc,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { toast } from "react-toastify";
import styles from "./ManageTeamsPanel.module.css";
import ConfirmModal from "./ConfirmModal";

export default function ManageTeamsPanel() {
  const [teams, setTeams] = useState([]);
  const [newName, setNewName] = useState("");
  const [filter, setFilter] = useState("");

  useEffect(() => {
    const q = query(collection(db, "teams"), orderBy("name"));
    return onSnapshot(q, (snap) => {
      setTeams(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, []);

  const createTeam = async () => {
    const nameTrim = newName.trim();
    if (!nameTrim) {
      toast.error("Name cannot be empty");
      return;
    }
    const q = query(collection(db, "teams"), where("name", "==", nameTrim));
    const snap = await getDocs(q);
    if (!snap.empty) {
      toast.error("Team exists");
      return;
    }
    await addDoc(collection(db, "teams"), { name: nameTrim, pingas: 0 });
    toast.success("Team created");
    setNewName("");
  };

  const [toDelete, setToDelete] = useState(null);

  const confirmDelete = async () => {
    await deleteDoc(doc(db, "teams", toDelete.id));
    toast.info(`"${toDelete.name}" deleted`);
    setToDelete(null);
  };

  const visible = teams.filter((t) =>
    t.name.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className={styles.panel}>
      <div className={styles.top}>
        <input
          type="text"
          placeholder="New team name..."
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className={styles.input}
        />
        <button onClick={createTeam} className={styles.createBtn}>
          Create
        </button>
      </div>

      <div className={styles.filterWrapper}>
        <input
          type="text"
          placeholder="Filter teams..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className={styles.input}
        />
      </div>

      <ul className={styles.list}>
        {visible.map((team) => (
          <li key={team.id} className={styles.item}>
            <span className={styles.teamName}>
              {team.name} ({team.pingas})
            </span>
            <button
              onClick={() => setToDelete(team)}
              className={styles.deleteBtn}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>

      <ConfirmModal
        isOpen={!!toDelete}
        title="Delete Team?"
        message={`Are you sure you want to delete "${toDelete?.name}"?`}
        onCancel={() => setToDelete(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
