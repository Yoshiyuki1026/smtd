'use client';

// ===========================================
// FocusSection - 今やることエリア
// 仕様書 v1.2 準拠
// 最大3タスクをフォーカス表示
// ===========================================

import { motion, AnimatePresence } from 'framer-motion';
import { useDroppable } from '@dnd-kit/core';
import { useTaskStore } from '@/stores/taskStore';
import { Check, ArrowDown } from 'lucide-react';

const MAX_FOCUS = 3;

export function FocusSection() {
  const { tasks, completeTask, unfocusTask } = useTaskStore();

  // フォーカス中の未完了タスク
  const focusedTasks = tasks.filter((t) => t.focused && !t.completed);
  const emptySlots = MAX_FOCUS - focusedTasks.length;

  // ドロップ可能エリアの設定
  const { setNodeRef, isOver } = useDroppable({
    id: 'focus-droppable',
  });

  return (
    <section className="mb-6" ref={setNodeRef}>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-400">
          今やること
        </h2>
        <span className="text-sm text-zinc-500">
          {focusedTasks.length} / {MAX_FOCUS}
        </span>
      </div>

      <div
        className={`space-y-3 rounded-lg p-3 transition-colors ${
          isOver ? 'bg-amber-500/10 border border-amber-500/50' : 'bg-transparent'
        }`}
      >
        <AnimatePresence mode="popLayout">
          {focusedTasks.map((task) => (
            <motion.div
              key={task.id}
              layout
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="group relative rounded-lg border-industrial bg-zinc-900/80 p-4"
            >
              <div className="flex items-center gap-3">
                {/* 完了ボタン（タッチターゲット最適化: 40px） */}
                <button
                  onClick={() => completeTask(task.id)}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full ring-amber text-amber-500 transition-all hover:text-black focus:ring-2 focus:ring-amber-400"
                  aria-label="タスクを完了"
                >
                  <Check size={20} />
                </button>

                {/* タスク名 */}
                <span className="flex-1 text-zinc-100 font-medium">
                  {task.title}
                </span>

                {/* 控え室に戻すボタン（タッチターゲット最適化: 40px） */}
                <button
                  onClick={() => unfocusTask(task.id)}
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-zinc-500 opacity-0 transition-all hover:bg-zinc-700 hover:text-zinc-300 group-hover:opacity-100 focus:ring-2 focus:ring-amber-400"
                  aria-label="控え室に戻す"
                  title="控え室に戻す"
                >
                  <ArrowDown size={18} />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* 空きスロット表示 */}
        {emptySlots > 0 && (
          <div className="rounded-xl border border-dashed border-zinc-700 p-4 text-center text-zinc-600">
            {focusedTasks.length === 0 ? (
              <span>控え室からタスクを選んで始めよう</span>
            ) : (
              <span>あと {emptySlots} つ追加できる</span>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
