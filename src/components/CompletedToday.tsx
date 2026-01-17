'use client';

// ===========================================
// CompletedToday - 今日完了したタスク一覧
// Industrial Noir Theme
// 折り畳み可能、デフォルト閉じ
// ===========================================

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTaskStore } from '@/stores/taskStore';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { DiamondPile } from '@/components/DiamondPile';

export function CompletedToday() {
  const { tasks } = useTaskStore();
  const [isOpen, setIsOpen] = useState(false);

  // 今日完了したタスク
  const completedToday = tasks.filter((t) => {
    if (!t.completed || !t.completedAt) return false;
    const completedDate = new Date(t.completedAt).toDateString();
    const today = new Date().toDateString();
    return completedDate === today;
  });

  // 空の場合はメッセージ表示
  if (completedToday.length === 0) {
    return (
      <section className="mb-6 text-center text-zinc-500 py-8">
        <p>今日の完了タスクはまだありません</p>
        <p className="text-sm mt-1">タスクを完了するとここに表示されます 💎</p>
      </section>
    );
  }

  // 完了時刻をフォーマット（HH:MM）
  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <section className="mb-6">
      {/* ダイヤパイル（常時表示） */}
      <div className="mb-4">
        <DiamondPile />
      </div>

      {/* ヘッダー（折り畳みトグル） */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="mb-3 flex w-full items-center justify-between text-left"
      >
        <h2 className="text-lg font-semibold text-zinc-400">
          完了タスク
          <span className="ml-2 text-sm text-zinc-500">
            ({completedToday.length})
          </span>
        </h2>
        <span className="text-zinc-500">
          {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            {/* タスク一覧 */}
            <div className="space-y-2">
              <AnimatePresence mode="popLayout">
                {completedToday.map((task) => (
                  <motion.div
                    key={task.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="flex items-center justify-between rounded-lg bg-zinc-900/50 border border-zinc-800 px-4 py-3"
                  >
                    {/* タスク名 */}
                    <span className="flex-1 text-zinc-300 text-sm line-through text-opacity-70">
                      {task.title}
                    </span>

                    {/* 完了時刻 */}
                    {task.completedAt && (
                      <span className="ml-4 text-xs text-zinc-500 shrink-0">
                        {formatTime(task.completedAt)}
                      </span>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
