'use client';

// ===========================================
// FocusSection - 今やることエリア
// 仕様書 v1.2 準拠
// 最大3タスクをフォーカス表示
// ===========================================

import { motion, AnimatePresence } from 'framer-motion';
import { useTaskStore } from '@/stores/taskStore';
import { Check, ArrowDown } from 'lucide-react';

const MAX_FOCUS = 3;

export function FocusSection() {
  const { tasks, completeTask, unfocusTask } = useTaskStore();

  // フォーカス中の未完了タスク
  const focusedTasks = tasks.filter((t) => t.focused && !t.completed);
  const emptySlots = MAX_FOCUS - focusedTasks.length;

  return (
    <section className="mb-6">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-400">
          今やること
        </h2>
        <span className="text-sm text-zinc-500">
          {focusedTasks.length} / {MAX_FOCUS}
        </span>
      </div>

      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {focusedTasks.map((task) => (
            <motion.div
              key={task.id}
              layout
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="group relative rounded-xl bg-zinc-800/80 border border-zinc-700/50 p-4"
            >
              <div className="flex items-center gap-3">
                {/* 完了ボタン */}
                <button
                  onClick={() => completeTask(task.id)}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-purple-500 text-purple-500 transition-all hover:bg-purple-500 hover:text-white"
                  aria-label="タスクを完了"
                >
                  <Check size={16} />
                </button>

                {/* タスク名 */}
                <span className="flex-1 text-zinc-100 font-medium">
                  {task.title}
                </span>

                {/* 控え室に戻すボタン */}
                <button
                  onClick={() => unfocusTask(task.id)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-500 opacity-0 transition-all hover:bg-zinc-700 hover:text-zinc-300 group-hover:opacity-100"
                  aria-label="控え室に戻す"
                  title="控え室に戻す"
                >
                  <ArrowDown size={14} />
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
