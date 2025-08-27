import { useEffect, useState } from "react";
import Board from "../components/Board";
import type { Task } from "../components/Board";

export default function BoardPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [newTitle, setNewTitle] = useState<string>("");

  const token = () => localStorage.getItem("token") ?? "";

  const handleUnauthorized = (status?: number) => {
    if (status === 401) {
      localStorage.removeItem("token");
      window.location.assign("/login");
      return true;
    }
    return false;
  };

  const fetchTasks = async () => {
    setLoading(true);
    setError("");
    try {
      const t = token();
      if (!t) {
        setError("No token found. Please log in again.");
        return;
      }
      const res = await fetch("/api/tasks", { headers: { Authorization: `Bearer ${t}` } });
      if (handleUnauthorized(res.status)) return;
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`GET /api/tasks failed: ${res.status} ${res.statusText}${text ? ` — ${text}` : ""}`);
      }
      const data: any[] = await res.json();
      const normalized: Task[] = (data || []).map((t) => ({
        id: Number(t.id),
        title: String(t.title ?? ""),
        status: (t.status as Task["status"]) ?? "Todo",
      }));
      setTasks(normalized);
    } catch (e: any) {
      setError(e?.message || "Network error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTasks(); }, []);

  const addTask = async () => {
    const title = newTitle.trim();
    if (!title) return;
    setError("");

    const optimistic: Task = { id: Date.now(), title, status: "Todo" };
    setTasks((prev) => [optimistic, ...prev]);
    setNewTitle("");

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ title, status: "Todo" }),
      });
      if (handleUnauthorized(res.status)) return;
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      const created = await res.json();
      setTasks((prev) => [
        { id: Number(created.id), title: String(created.title), status: created.status as Task["status"] },
        ...prev.filter((t) => t.id !== optimistic.id),
      ]);
    } catch (e: any) {
      setTasks((prev) => prev.filter((t) => t.id !== optimistic.id));
      setError(e?.message || "Create failed");
    }
  };

  type MoveFn = (taskId: number, toStatus: Task["status"], toIndex?: number) => void;
  const moveTask: MoveFn = async (taskId, toStatus, toIndex = 0) => {
    const snapshot = tasks;
    setTasks((prev) => {
      const moved = prev.find((t) => t.id === taskId);
      if (!moved) return prev;
      const others = prev.filter((t) => t.id !== taskId);
      const target = others.filter((t) => t.status === toStatus);
      const notTarget = others.filter((t) => t.status !== toStatus);
      const insertAt = Math.max(0, Math.min(toIndex, target.length));
      const newCol = [...target.slice(0, insertAt), { ...moved, status: toStatus }, ...target.slice(insertAt)];
      return [...newCol, ...notTarget];
    });

    try {
      const res = await fetch(`/api/tasks/${taskId}/reorder`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ status: toStatus, index: toIndex }),
      });
      if (handleUnauthorized(res.status)) return;
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    } catch (e: any) {
      setTasks(snapshot);
      setError(e?.message || "Move failed");
    }
  };

  const editTask = async (taskId: number, newTitle: string) => {
    const title = newTitle.trim();
    if (!title) return;
    const snapshot = tasks;
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, title } : t)));
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ title }),
      });
      if (handleUnauthorized(res.status)) return;
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    } catch (e: any) {
      setTasks(snapshot);
      setError(e?.message || "Update failed");
    }
  };

  const deleteTask = async (taskId: number) => {
    const snapshot = tasks;
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    try {
      const res = await fetch(`/api/tasks/${taskId}`, { method: "DELETE", headers: { Authorization: `Bearer ${token()}` } });
      if (handleUnauthorized(res.status)) return;
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    } catch (e: any) {
      setTasks(snapshot);
      setError(e?.message || "Delete failed");
    }
  };

  if (loading) return <div className="page-loading">Loading…</div>;
  if (error) return <div className="page-error">{error}</div>;

  return (
    <div className="page">
      <h2 className="title">My Tasks</h2>

      <div className="add-row">
        <input
          className="input"
          placeholder="Add a task…"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addTask()}
        />
        <button className="btn" onClick={addTask}>Add</button>
      </div>

      <Board tasks={tasks} onMove={moveTask} onEdit={editTask} onDelete={deleteTask} />
    </div>
  );
}
