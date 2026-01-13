'use client';

// ===========================================
// TaskInput - タスク追加入力欄（常時表示）
// ジョブズ版: シンプルで直感的
// ===========================================

import { useState } from 'react';
import { useTaskStore } from '@/stores/taskStore';
import { Plus } from 'lucide-react';

export function TaskInput() {
  const { addTask } = useTaskStore();
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    addTask(inputValue.trim());
    setInputValue('');
  };

  return (
    <form onSubmit={handleSubmit} className="mb-6">
      <div className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="タスクを追加..."
          className="flex-1 rounded-lg bg-zinc-900 border border-zinc-700/50 px-4 py-3 text-zinc-100 placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none focus:ring-2 focus:ring-amber-400"
        />
        <button
          type="submit"
          disabled={!inputValue.trim()}
          className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-500 transition-colors hover:bg-amber-500/30 disabled:opacity-30 disabled:cursor-not-allowed focus:ring-2 focus:ring-amber-400"
          aria-label="追加"
        >
          <Plus size={24} />
        </button>
      </div>
    </form>
  );
}
