import {
  DndContext,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragStartEvent, DragEndEvent, Over } from '@dnd-kit/core';

import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';

import { CSS } from '@dnd-kit/utilities';
import { useMemo, useState } from 'react';


type Task = { id: number; title: string; position: number; priority: 'LOW'|'MEDIUM'|'HIGH' };
type Column = { id: number; name: string; tasks: Task[] };

export default function Board({
  columns,
  onMove,
}: {
  columns: Column[];
  onMove: (taskId: number, toColumnId: number, newPosition: number) => Promise<void>;
}) {
  // Keep currently dragging task id just for styling
  const [activeId, setActiveId] = useState<number | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 5 } }),
  );

  // Convenience lookups
  const taskById = useMemo(() => {
    const map = new Map<number, { task: Task; columnId: number }>();
    columns.forEach(c => c.tasks.forEach(t => map.set(t.id, { task: t, columnId: c.id })));
    return map;
  }, [columns]);

  function getNewPositionForIndex(list: Task[], insertIndex: number): number {
    // fractional “position” calculation to avoid reindexing whole list
    if (list.length === 0) return 1000;
    if (insertIndex <= 0) return list[0].position - 1000;
    if (insertIndex >= list.length) return list[list.length - 1].position + 1000;

    const before = list[insertIndex - 1].position;
    const after = list[insertIndex].position;
    return (before + after) / 2;
  }

  function findTargetColumnId(over: Over | null): number | null {
    if (!over) return null;
    const id = String(over.id);
    // We’ll give each column a droppable id like "col-<id>" and each task "<id>"
    if (id.startsWith('col-')) return Number(id.slice(4));
    // If hovering a task, put into its column
    const info = taskById.get(Number(id));
    return info ? info.columnId : null;
  }

  function indexInColumn(columnId: number, taskId: number | null, overId: string): number {
    const col = columns.find(c => c.id === columnId)!;
    const ordered = [...col.tasks].sort((a, b) => a.position - b.position);

    // if over a column (empty space), drop at end
    if (overId.startsWith('col-')) return ordered.length;

    const overIdx = ordered.findIndex(t => String(t.id) === overId);
    if (overIdx === -1) return ordered.length;

    // If dragging from above vs below, choose the insert location
    if (taskId == null) return overIdx;
    const currentIdx = ordered.findIndex(t => t.id === taskId);
    return currentIdx < overIdx ? overIdx : overIdx; // simple: insert at overIdx
  }

  function handleDragStart(e: DragStartEvent) {
    const id = Number(e.active.id);
    setActiveId(id);
  }

  async function handleDragEnd(e: DragEndEvent) {
    const activeIdNum = Number(e.active.id);
    const over = e.over;

    setActiveId(null);
    if (!over) return;

    const from = taskById.get(activeIdNum);
    if (!from) return;

    const toColumnId = findTargetColumnId(over);
    if (toColumnId == null) return;

    const insertIdx = indexInColumn(toColumnId, activeIdNum, String(over.id));
    const targetTasksSorted = [...(columns.find(c => c.id === toColumnId)?.tasks ?? [])]
      .sort((a, b) => a.position - b.position);

    const newPos = getNewPositionForIndex(targetTasksSorted.filter(t => t.id !== activeIdNum), insertIdx);
    await onMove(activeIdNum, toColumnId, newPos);
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
        {columns.map(col => (
          <ColumnDroppable key={col.id} column={col}>
            <SortableContext
              // each column manages sorting of its children (tasks)
              items={[...col.tasks].sort((a, b) => a.position - b.position).map(t => String(t.id))}
              strategy={verticalListSortingStrategy}
            >
              <h3>{col.name}</h3>
              {[...col.tasks]
                .sort((a, b) => a.position - b.position)
                .map(t => (
                  <TaskCard key={t.id} task={t} active={activeId === t.id} />
                ))}
            </SortableContext>
          </ColumnDroppable>
        ))}
      </div>
    </DndContext>
  );
}

/** Column drop target */
function ColumnDroppable({ column, children }: { column: Column; children: React.ReactNode }) {
  // Just render a container; DndContext lets us use the column’s id as another "over" target
  return (
    <div
      id={`col-${column.id}`}
      style={{ background: '#f4f4f4', padding: 12, borderRadius: 8, minHeight: 220 }}
    >
      {children}
    </div>
  );
}

/** Sortable task card */
function TaskCard({ task, active }: { task: Task; active: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: String(task.id),
  });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    background: '#fff',
    padding: 8,
    margin: '8px 0',
    borderRadius: 6,
    boxShadow: isDragging ? '0 6px 16px rgba(0,0,0,.20)' : '0 1px 2px rgba(0,0,0,.1)',
    opacity: isDragging ? 0.9 : 1,
    outline: active ? '2px solid #6aa9ff' : 'none',
    cursor: 'grab',
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <div style={{ fontWeight: 600 }}>{task.title}</div>
      <div style={{ fontSize: 12, opacity: 0.7 }}>
        #{task.id} — {task.priority}
      </div>
    </div>
  );
}
