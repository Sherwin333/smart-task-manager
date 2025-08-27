import { useMemo, useState } from "react";

// type-only export
export type Task = { id: number; title: string; status: "Todo" | "In Progress" | "Done" };

type Props = {
  tasks: Task[];
  onMove: (taskId: number, toStatus: Task["status"], toIndex?: number) => void;
  onEdit: (taskId: number, newTitle: string) => void;
  onDelete: (taskId: number) => void;
};

const STATUSES: Task["status"][] = ["Todo", "In Progress", "Done"];

export default function Board({ tasks, onMove, onEdit, onDelete }: Props) {
  const byStatus = useMemo(() => {
    const map: Record<string, Task[]> = { "Todo": [], "In Progress": [], "Done": [] };
    tasks.forEach((t) => map[t.status]?.push(t));
    return map;
  }, [tasks]);

  // target insertion point
  const [hover, setHover] = useState<{ status: Task["status"] | null; index: number | null }>({
    status: null,
    index: null,
  });
  // highlight column while dragging
  const [overCol, setOverCol] = useState<Task["status"] | null>(null);

  const onDragStart = (e: React.DragEvent<HTMLDivElement>, id: number) => {
    e.dataTransfer.setData("text/plain", String(id));
    e.dataTransfer.effectAllowed = "move";
  };

  const allowDrop = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); };

  const onDrop = (e: React.DragEvent<HTMLDivElement>, status: Task["status"]) => {
    e.preventDefault();
    const id = Number(e.dataTransfer.getData("text/plain"));
    if (Number.isNaN(id)) return;

    const toIndex =
      hover.status === status && hover.index != null ? hover.index : byStatus[status].length;

    onMove(id, status, toIndex);
    setHover({ status: null, index: null });
    setOverCol(null);
  };

  const DropIndicator = ({ active }: { active: boolean }) => (
    <div className={`drop-line ${active ? "active" : ""}`} />
  );

  return (
    <div className="board" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
      {STATUSES.map((status) => (
        <div
          key={status}
          className={`column ${overCol === status ? "is-over" : ""}`}
          onDragOver={(e) => {
            allowDrop(e);
            setOverCol(status);
            if (byStatus[status].length === 0) setHover({ status, index: 0 });
            else setHover((h) => (h.status === status ? h : { status, index: byStatus[status].length }));
          }}
          onDrop={(e) => onDrop(e, status)}
          onDragLeave={() => setOverCol(null)}
          style={{ minHeight: 260 }} // keeps your current height even if CSS not loaded
        >
          <div className="column-head">
            <span>{status}</span>
            <span className="muted">{byStatus[status].length}</span>
          </div>

          {byStatus[status].map((t, i) => (
            <div key={t.id} className="stack">
              {/* drop indicator BEFORE this card */}
              <DropIndicator active={hover.status === status && hover.index === i} />

              <div
                className="card"
                draggable
                onDragStart={(e) => onDragStart(e, t.id)}
                onDragOver={(e) => {
                  allowDrop(e);
                  setHover({ status, index: i });
                }}
              >
                <div className="card-title">{t.title}</div>
                <div className="card-actions">
                  <button
                    title="Edit title"
                    className="icon-btn"
                    onClick={() => {
                      const v = window.prompt("Edit task title:", t.title);
                      if (v != null) onEdit(t.id, v);
                    }}
                  >
                    ✏️
                  </button>
                  <button
                    title="Delete"
                    className="icon-btn danger"
                    onClick={() => {
                      if (window.confirm("Delete this task?")) onDelete(t.id);
                    }}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* drop indicator at end of column */}
          <DropIndicator
            active={
              hover.status === status &&
              hover.index === byStatus[status].length &&
              byStatus[status].length > 0
            }
          />

          {byStatus[status].length === 0 && <div className="empty">Drop tasks here</div>}
        </div>
      ))}
    </div>
  );
}
