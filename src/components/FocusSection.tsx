'use client';

// ===========================================
// FocusSection - 今やることエリア
// Phase 2.10: D&D並び替え対応
// スワイプ完了（右スワイプ100px以上で完了）維持
// ===========================================

import { useState } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { useDroppable } from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useTaskStore } from '@/stores/taskStore';
import type { Task } from '@/types';
import { Check, ArrowDown, GripVertical } from 'lucide-react';

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
        <SortableContext items={focusedTasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          <AnimatePresence mode="popLayout">
            {focusedTasks.map((task) => (
              <FocusTaskItem
                key={task.id}
                task={task}
                dragOffset={dragOffsets[task.id] || 0}
                onDragOffset={(offset) => setDragOffsets((prev) => ({ ...prev, [task.id]: offset }))}
                onComplete={completeTask}
                onUnfocus={unfocusTask}
              />
            ))}
          </AnimatePresence>
        </SortableContext>

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

// ソート可能 + スワイプ完了対応のタスクアイテム
function FocusTaskItem({
  task,
  dragOffset,
  onDragOffset,
  onComplete,
  onUnfocus,
}: {
  task: Task;
  dragOffset: number;
  onDragOffset: (offset: number) => void;
  onComplete: (id: string) => void;
  onUnfocus: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const isNearComplete = dragOffset > 50;

  // dnd-kit の transform（y軸の並び替え）
  const sortableStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <motion.div
      ref={setNodeRef}
      layout={!isDragging}
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{
        opacity: isDragging ? 0.5 : 1,
        y: 0,
        scale: 1,
      }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 20,
      }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="group relative rounded-lg border-industrial bg-zinc-900/80 p-4 overflow-hidden"
      style={sortableStyle}
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
        {/* ドラッグハンドル（並び替え用） */}
        <div
          className="flex h-10 w-6 shrink-0 items-center justify-center text-zinc-600 cursor-grab active:cursor-grabbing touch-none"
          title="ドラッグして並び替え"
          {...attributes}
          {...listeners}
        >
          <GripVertical size={18} />
        </div>

        {/* 完了ボタン（タッチターゲット最適化: 40px） */}
        <button
          onClick={() => onComplete(task.id)}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full ring-amber text-amber-500 transition-all hover:text-black focus:ring-2 focus:ring-amber-400 active:scale-95 active:ring-2 active:ring-amber-400/50"
          aria-label="タスクを完了"
        >
          <Check size={20} />
        </button>

        {/* タスク名（スワイプ完了用ドラッグエリア） */}
        <motion.span
          className="flex-1 text-zinc-100 font-medium cursor-grab active:cursor-grabbing"
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={{ left: 0, right: 0.3 }}
          onDrag={(_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
            // 左方向は無効（0以下は0にする）
            const offset = Math.max(0, info.offset.x);
            onDragOffset(offset);
          }}
          // onDragEnd: ドラッグ完了 or キャンセル（Escape含む）で呼ばれる
          onDragEnd={(_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
            if (info.offset.x >= SWIPE_THRESHOLD) {
              onComplete(task.id);
            }
            onDragOffset(0); // 必ずリセット
          }}
        >
          {task.title}
        </motion.span>

        {/* 控え室に戻すボタン（タッチターゲット最適化: 40px） */}
        <button
          onClick={() => onUnfocus(task.id)}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-zinc-500 opacity-0 transition-all hover:bg-zinc-700 hover:text-zinc-300 group-hover:opacity-100 focus:opacity-100 focus:ring-2 focus:ring-amber-400 active:scale-95 active:ring-2 active:ring-zinc-400/50"
          aria-label="控え室に戻す"
          title="控え室に戻す"
        >
          <ArrowDown size={18} />
        </button>
      </div>
    </motion.div>
  );
}
