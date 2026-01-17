'use client';

// ===========================================
// BacklogSection - 控え室エリア
// Industrial Noir Theme
// 無制限タスク登録、タブで表示制御
// ===========================================

import { motion, AnimatePresence } from 'framer-motion';
import { useDraggable } from '@dnd-kit/core';
import { useTaskStore } from '@/stores/taskStore';
import type { Task } from '@/types';
import { ArrowUp, Trash2 } from 'lucide-react';

export function BacklogSection() {
  const { tasks, focusTask, deleteTask } = useTaskStore();

  // 控え室のタスク（focused=false かつ 未完了）
  const backlogTasks = tasks.filter((t) => !t.focused && !t.completed);

  // フォーカス中の数（3つ制限チェック用）
  const focusedCount = tasks.filter((t) => t.focused && !t.completed).length;
  const canFocus = focusedCount < 3;

  return (
    <div className="space-y-2">
      <AnimatePresence mode="popLayout">
        {backlogTasks.map((task) => (
          <BacklogTaskItem
            key={task.id}
            task={task}
            canFocus={canFocus}
            onFocus={focusTask}
            onDelete={deleteTask}
          />
        ))}
      </AnimatePresence>

      {backlogTasks.length === 0 && (
        <div className="rounded-lg border border-dashed border-zinc-800 p-4 text-center text-sm text-zinc-600">
          控え室は空です
        </div>
      )}
    </div>
  );
}

// ドラッグ可能なタスクアイテム
function BacklogTaskItem({
  task,
  canFocus,
  onFocus,
  onDelete,
}: {
  task: Task;
  canFocus: boolean;
  onFocus: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id,
  });

  return (
    <motion.div
      ref={setNodeRef}
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: isDragging ? 0.5 : 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="group flex items-center gap-3 rounded-lg bg-zinc-900/50 border border-zinc-800 px-4 py-3"
      style={{
        opacity: isDragging ? 0.5 : 1,
      }}
      {...attributes}
    >
      {/* 今やることに昇格ボタン（タッチターゲット最適化: 40px） */}
      <button
        onClick={() => onFocus(task.id)}
        disabled={!canFocus}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-amber-500 transition-all hover:bg-amber-500/20 disabled:opacity-30 disabled:cursor-not-allowed focus:ring-2 focus:ring-amber-400 active:scale-95 active:ring-2 active:ring-amber-400/50"
        aria-label="今やることに追加"
        title={canFocus ? '今やることに追加' : '3つまで'}
      >
        <ArrowUp size={20} />
      </button>

      {/* タスク名（drag handle） */}
      <span
        className="flex-1 text-zinc-300 text-sm cursor-grab active:cursor-grabbing"
        {...listeners}
      >
        {task.title}
      </span>

      {/* 削除ボタン（タッチターゲット最適化: 40px） */}
      <button
        onClick={() => onDelete(task.id)}
        className="flex h-10 w-10 items-center justify-center rounded-lg text-zinc-600 opacity-0 transition-all hover:bg-red-500/20 hover:text-red-400 group-hover:opacity-100 focus:opacity-100 focus:ring-2 focus:ring-amber-400 active:scale-95 active:ring-2 active:ring-red-400/50"
        aria-label="削除"
      >
        <Trash2 size={18} />
      </button>
    </motion.div>
  );
}
