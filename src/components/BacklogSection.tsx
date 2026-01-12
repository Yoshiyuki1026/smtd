'use client';

// ===========================================
// BacklogSection - 控え室エリア
// 仕様書 v1.2 準拠
// 無制限タスク登録、折り畳み可能
// ===========================================

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTaskStore } from '@/stores/taskStore';
import { ArrowUp, Trash2, ChevronDown, ChevronUp, Plus } from 'lucide-react';

export function BacklogSection() {
  const { tasks, addTask, focusTask, deleteTask } = useTaskStore();
  const [isOpen, setIsOpen] = useState(true);
  const [inputValue, setInputValue] = useState('');

  // 控え室のタスク（focused=false かつ 未完了）
  const backlogTasks = tasks.filter((t) => !t.focused && !t.completed);

  // フォーカス中の数（3つ制限チェック用）
  const focusedCount = tasks.filter((t) => t.focused && !t.completed).length;
  const canFocus = focusedCount < 3;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    addTask(inputValue.trim());
    setInputValue('');
  };

  return (
    <section className="mb-6">
      {/* ヘッダー（折り畳みトグル） */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="mb-3 flex w-full items-center justify-between text-left"
      >
        <h2 className="text-lg font-semibold text-zinc-400">
          控え室
          <span className="ml-2 text-sm text-zinc-500">
            ({backlogTasks.length})
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
            {/* タスク入力 */}
            <form onSubmit={handleSubmit} className="mb-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="新しいタスクを追加..."
                  className="flex-1 rounded-lg bg-zinc-800 border border-zinc-700 px-4 py-2 text-zinc-100 placeholder-zinc-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
                <button
                  type="submit"
                  disabled={!inputValue.trim()}
                  className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-600 text-white transition-colors hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="追加"
                >
                  <Plus size={20} />
                </button>
              </div>
            </form>

            {/* タスク一覧 */}
            <div className="space-y-2">
              <AnimatePresence mode="popLayout">
                {backlogTasks.map((task) => (
                  <motion.div
                    key={task.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="group flex items-center gap-3 rounded-lg bg-zinc-800/50 border border-zinc-700/30 px-4 py-3"
                  >
                    {/* 今やることに昇格ボタン */}
                    <button
                      onClick={() => focusTask(task.id)}
                      disabled={!canFocus}
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-purple-400 transition-all hover:bg-purple-500/20 disabled:opacity-30 disabled:cursor-not-allowed"
                      aria-label="今やることに追加"
                      title={canFocus ? '今やることに追加' : '3つまで'}
                    >
                      <ArrowUp size={16} />
                    </button>

                    {/* タスク名 */}
                    <span className="flex-1 text-zinc-300 text-sm">
                      {task.title}
                    </span>

                    {/* 削除ボタン */}
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-500 opacity-0 transition-all hover:bg-red-500/20 hover:text-red-400 group-hover:opacity-100"
                      aria-label="削除"
                    >
                      <Trash2 size={14} />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>

              {backlogTasks.length === 0 && (
                <div className="rounded-lg border border-dashed border-zinc-700/50 p-4 text-center text-sm text-zinc-600">
                  控え室は空です
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
