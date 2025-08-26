import { useMemo, useState } from 'react';
import Board from '../components/Board';

type Task = { id: number; title: string; position: number; priority: 'LOW' | 'MEDIUM' | 'HIGH' };
type Column = { id: number; name: string; tasks: Task[] };

export default function BoardPage() {
  const initial = useMemo<Column[]>(
    () => [
      {
        id: 101,
        name: 'Todo',
        tasks: [
          { id: 1, title: 'Set up backend', position: 1000, priority: 'HIGH' },
          { id: 2, title: 'Create auth routes', position: 2000, priority: 'MEDIUM' },
        ],
      },
      {
        id: 102,
        name: 'In Progress',
        tasks: [{ id: 3, title: 'Design Kanban UI', position: 1000, priority: 'LOW' }],
      },
      {
        id: 103,
        name: 'Done',
        tasks: [{ id: 4, title: 'Initialize Vite app', position: 1000, priority: 'LOW' }],
      },
    ],
    []
  );

  const [columns, setColumns] = useState<Column[]>(initial);

  async function onMove(taskId: number, toColumnId: number, newPosition: number) {
    setColumns(prev => {
      let moving: Task | undefined;

      const without = prev.map(c => {
        const idx = c.tasks.findIndex(t => t.id === taskId);
        if (idx >= 0) {
          moving = c.tasks[idx];
          const copy = [...c.tasks];
          copy.splice(idx, 1);
          return { ...c, tasks: copy };
        }
        return c;
      });

      if (!moving) return prev;

      const targetIdx = without.findIndex(c => c.id === toColumnId);
      if (targetIdx === -1) return prev;

      const target = without[targetIdx];
      const updatedTask = { ...moving, position: newPosition };
      const nextTasks = [...target.tasks, updatedTask].sort((a, b) => a.position - b.position);
      const nextCols = [...without];
      nextCols[targetIdx] = { ...target, tasks: nextTasks };
      return nextCols;
    });
  }

  return (
    <div style={{ padding: 16 }}>
      <h2>Board</h2>
      <Board columns={columns} onMove={onMove} />
    </div>
  );
}
