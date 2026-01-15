'use client';

// ===========================================
// BlackHole - Brain Dump（思考のゴミ捨て場）
// 思いついたことを投げ込み、アーカイブ or 廃棄する
// ===========================================

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTaskStore } from '@/stores/taskStore';
import { Trash2, Archive, Zap } from 'lucide-react';

type BlackHoleTab = 'active' | 'archived';

export function BlackHole() {
  const { blackHole, addToBlackHole, archiveBlackHoleItem, deleteBlackHoleItem } = useTaskStore();
  const [inputValue, setInputValue] = useState('');
  const [activeTab, setActiveTab] = useState<BlackHoleTab>('active');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // アーカイブ済み/未アーカイブでフィルタ
  const activeItems = blackHole.filter((item) => !item.archived);
  const archivedItems = blackHole.filter((item) => item.archived);
  const displayItems = activeTab === 'active' ? activeItems : archivedItems;

  // 入力欄をクリア
  const handleAddItem = () => {
    if (inputValue.trim()) {
      addToBlackHole(inputValue);
      setInputValue('');
    }
  };

  // 廃棄アニメーション
  const handleDelete = (id: string) => {
    setDeletingId(id);
    // アニメーション後に削除
    setTimeout(() => {
      deleteBlackHoleItem(id);
      setDeletingId(null);
    }, 500);
  };

  // Enterキー対応
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleAddItem();
    }
  };

  return (
    <section className="mb-6">
      {/* ヘッダー */}
      <h2 className="text-lg font-semibold text-zinc-400 mb-4 flex items-center gap-2">
        <Zap size={20} className="text-purple-500" />
        Black Hole
        <span className="text-sm text-zinc-500">
          ({activeItems.length + archivedItems.length})
        </span>
      </h2>

      {/* 入力エリア */}
      <div className="mb-4">
        <textarea
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="思いついたことを投げ込む... (Ctrl+Enter で追加)"
          className="w-full rounded-lg bg-zinc-800 text-zinc-100 placeholder-zinc-600 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 border border-zinc-700 resize-none"
          rows={3}
        />
        <button
          onClick={handleAddItem}
          disabled={!inputValue.trim()}
          className="mt-2 w-full rounded-lg bg-purple-600 text-white font-medium py-2 hover:bg-purple-700 transition-colors disabled:bg-zinc-700 disabled:text-zinc-500 disabled:cursor-not-allowed"
        >
          投げ込む
        </button>
      </div>

      {/* タブ */}
      <div className="mb-4 flex gap-2 border-b border-zinc-700">
        <button
          onClick={() => setActiveTab('active')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'active'
              ? 'text-purple-500 border-b-2 border-purple-500'
              : 'text-zinc-500 hover:text-zinc-400'
          }`}
        >
          未整理 ({activeItems.length})
        </button>
        <button
          onClick={() => setActiveTab('archived')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'archived'
              ? 'text-indigo-500 border-b-2 border-indigo-500'
              : 'text-zinc-500 hover:text-zinc-400'
          }`}
        >
          アーカイブ ({archivedItems.length})
        </button>
      </div>

      {/* アイテム一覧 */}
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {displayItems.length === 0 ? (
            <div className="text-center py-6 text-zinc-600">
              {activeTab === 'active'
                ? 'まだアイテムはありません'
                : 'アーカイブはまだありません'}
            </div>
          ) : (
            displayItems.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={
                  deletingId === item.id
                    ? {
                        opacity: 0,
                        scale: 0,
                        x: 0,
                        transition: { duration: 0.5 },
                      }
                    : { opacity: 0, x: 20 }
                }
                className="rounded-lg bg-zinc-800 border border-zinc-700 p-3 hover:bg-zinc-700/80 transition-colors"
              >
                {/* コンテンツ */}
                <p className="text-sm text-zinc-300 mb-3 line-clamp-3 whitespace-pre-wrap break-words">
                  {item.content}
                </p>

                {/* メタ情報 */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-500">
                    {new Date(item.createdAt).toLocaleString('ja-JP', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>

                  {/* ボタン */}
                  <div className="flex gap-2">
                    {activeTab === 'active' ? (
                      <>
                        <button
                          onClick={() => archiveBlackHoleItem(item.id)}
                          className="p-1.5 rounded text-indigo-500 hover:bg-zinc-700 transition-colors"
                          title="アーカイブ"
                        >
                          <Archive size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 rounded text-red-500 hover:bg-zinc-700 transition-colors"
                          title="廃棄"
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 rounded text-red-500 hover:bg-zinc-700 transition-colors"
                        title="削除"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
