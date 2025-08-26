import { useEffect, useState } from "react";
import api from "../api/client";

type Task = { id: number; title: string; status: string };

export default function Board() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get<Task[]>("/api/tasks")
      .then(res => setTasks(res.data))
      .catch(e => setError(e?.response?.data?.message || "Failed to load"));
  }, []);

  if (error) return <div style={{ color: "crimson" }}>{error}</div>;

  return (
    <div>
      <h2>My Tasks</h2>
      <ul>
        {tasks.map(t => (
          <li key={t.id}>
            {t.title} — <b>{t.status}</b>
          </li>
        ))}
      </ul>
    </div>
  );
}
