'use client';

// ===========================================
// FocusSection - 今やることエリア
// 仕様書 v1.2 準拠
// 最大3タスクをフォーカス表示
// スワイプ完了対応（右スワイプ100px以上で完了）
// ===========================================

import { useState } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { useDroppable } from '@dnd-kit/core';
import { useTaskStore } from '@/stores/taskStore';
import { Check, ArrowDown } from 'lucide-react';

const MAX_FOCUS = 3;
const SWIPE_THRESHOLD = 100; // 完了判定の閾値

export function FocusSection() {
  const { tasks, completeTask, unfocusTask } = useTaskStore();
  // 各タスクのスワイプ位置を管理
  const [dragOffsets, setDragOffsets] = useState<Record<string, number>>({});

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
          {focusedTasks.map((task) => {
            const dragX = dragOffsets[task.id] || 0;
            const isNearComplete = dragX > 50;

            return (
              <motion.div
                key={task.id}
                layout
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0, x: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={{ left: 0, right: 0.3 }}
                onDrag={(_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
                  // 左方向は無効（0以下は0にする）
                  const offset = Math.max(0, info.offset.x);
                  setDragOffsets((prev) => ({ ...prev, [task.id]: offset }));
                }}
                onDragEnd={(_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
                  if (info.offset.x > SWIPE_THRESHOLD) {
                    completeTask(task.id);
                  }
                  setDragOffsets((prev) => ({ ...prev, [task.id]: 0 }));
                }}
                className="group relative rounded-lg border-industrial bg-zinc-900/80 p-4 overflow-hidden cursor-grab active:cursor-grabbing"
              >
                {/* スワイプ中の視覚フィードバック */}
                {isNearComplete && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 bg-green-500/20 flex items-center pl-4 pointer-events-none"
                  >
                    <Check className="text-green-500" size={24} />
                  </motion.div>
                )}

                <div className="flex items-center gap-3 relative z-10">
                  {/* 完了ボタン（タッチターゲット最適化: 40px） */}
                  <button
                    onClick={() => completeTask(task.id)}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full ring-amber text-amber-500 transition-all hover:text-black focus:ring-2 focus:ring-amber-400 active:scale-95 active:ring-2 active:ring-amber-400/50"
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
                    className="flex h-10 w-10 items-center justify-center rounded-lg text-zinc-500 opacity-0 transition-all hover:bg-zinc-700 hover:text-zinc-300 group-hover:opacity-100 focus:opacity-100 focus:ring-2 focus:ring-amber-400 active:scale-95 active:ring-2 active:ring-zinc-400/50"
                    aria-label="控え室に戻す"
                    title="控え室に戻す"
                  >
                    <ArrowDown size={18} />
                  </button>
                </div>
              </motion.div>
            );
          })}
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
