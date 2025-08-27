// frontend/src/pages/BoardPage.tsx
import { useState } from "react";
import Board from "../components/Board";
import type { Task } from "../components/Board";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { API_BASE } from "../config"; // 👈 central API base

const token = () => localStorage.getItem("token") ?? "";

// HashRouter-friendly login redirect
const goLogin = () => {
  // works locally and on GitHub Pages (with HashRouter)
  window.location.hash = "#/login";
};

function joinUrl(base: string, path: string) {
  if (/^https?:\/\//i.test(path)) return path;
  const a = base.replace(/\/+$/, "");
  const b = path.replace(/^\/+/, "");
  return `${a}/${b}`;
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const url = joinUrl(API_BASE, path); // 👈 prefix every call with API_BASE

  const res = await fetch(url, {
    ...init,
    mode: "cors",
    headers: {
      "Content-Type": "application/json",
      Authorization: token() ? `Bearer ${token()}` : "",
      ...(init?.headers || {}),
    },
  });

  if (res.status === 401) {
    localStorage.removeItem("token");
    goLogin();
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText}: ${body}`);
  }

  // Some endpoints may return no body
  try {
    return (await res.json()) as T;
  } catch {
    return undefined as T;
  }
}

export default function BoardPage() {
  const qc = useQueryClient();
  const [newTitle, setNewTitle] = useState("");

  // Load
  const { data: tasks = [], isLoading, error } = useQuery({
    queryKey: ["tasks"],
    queryFn: async () => {
      if (!token()) throw new Error("No token found. Please log in again.");
      return api<Task[]>("/api/tasks");
    },
    retry: 1,
  });

  // Create
  const createTask = useMutation({
    mutationFn: (title: string) =>
      api<Task>("/api/tasks", {
        method: "POST",
        body: JSON.stringify({ title, status: "Todo" }),
      }),
    onSuccess: () => {
      toast.success("Task added");
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: (e: any) => toast.error(e.message || "Create failed"),
  });

  // Reorder/Move
  const reorderTask = useMutation({
    mutationFn: ({ id, status, index }: { id: number; status: Task["status"]; index: number }) =>
      api<void>(`/api/tasks/${id}/reorder`, {
        method: "PATCH",
        body: JSON.stringify({ status, index }),
      }),
    onMutate: async (vars) => {
      await qc.cancelQueries({ queryKey: ["tasks"] });
      const prev = qc.getQueryData<Task[]>(["tasks"]) || [];

      // optimistic re-order
      const moved = prev.find((t) => t.id === vars.id);
      if (!moved) return { prev };

      const others = prev.filter((t) => t.id !== vars.id);
      const target = others.filter((t) => t.status === vars.status);
      const notTarget = others.filter((t) => t.status !== vars.status);

      const insertAt = Math.max(0, Math.min(vars.index, target.length));
      const newCol = [
        ...target.slice(0, insertAt),
        { ...moved, status: vars.status },
        ...target.slice(insertAt),
      ];

      qc.setQueryData(["tasks"], [...newCol, ...notTarget]);
      return { prev };
    },
    onError: (e, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(["tasks"], ctx.prev);
      toast.error((e as any)?.message || "Move failed");
    },
    onSuccess: () => toast.success("Moved"),
    onSettled: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });

  // Edit
  const editTask = useMutation({
    mutationFn: ({ id, title }: { id: number; title: string }) =>
      api<Task>(`/api/tasks/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ title }),
      }),
    onMutate: async ({ id, title }) => {
      await qc.cancelQueries({ queryKey: ["tasks"] });
      const prev = qc.getQueryData<Task[]>(["tasks"]) || [];
      qc.setQueryData(["tasks"], prev.map((t) => (t.id === id ? { ...t, title } : t)));
      return { prev };
    },
    onError: (e, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(["tasks"], ctx.prev);
      toast.error((e as any)?.message || "Update failed");
    },
    onSuccess: () => toast.success("Updated"),
    onSettled: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });

  // Delete
  const deleteTask = useMutation({
    mutationFn: (id: number) =>
      api<void>(`/api/tasks/${id}`, { method: "DELETE" }),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["tasks"] });
      const prev = qc.getQueryData<Task[]>(["tasks"]) || [];
      qc.setQueryData(["tasks"], prev.filter((t) => t.id !== id));
      return { prev };
    },
    onError: (e, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(["tasks"], ctx.prev);
      toast.error((e as any)?.message || "Delete failed");
    },
    onSuccess: () => toast.success("Deleted"),
    onSettled: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });

  const addTask = () => {
    const title = newTitle.trim();
    if (!title) return;
    setNewTitle("");
    createTask.mutate(title);
  };

  const moveTask = (taskId: number, toStatus: Task["status"], toIndex = 0) =>
    reorderTask.mutate({ id: taskId, status: toStatus, index: toIndex });

  if (isLoading) return <div className="page-loading">Loading…</div>;
  if (error) return <div className="page-error">{(error as Error).message}</div>;

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
        <button className="btn" onClick={addTask} disabled={createTask.isPending}>
          Add
        </button>
      </div>

      <Board
        tasks={tasks}
        onMove={moveTask}
        onEdit={(id, title) => editTask.mutate({ id, title })}
        onDelete={(id) => deleteTask.mutate(id)}
      />
    </div>
  );
}
