'use client';

// ===========================================
// SMTD メイン画面（Cockpit）
// ジョブズ版: シンプル、本質的、直感的
// ===========================================

import { useEffect } from 'react';
import { DndContext, DragEndEvent } from '@dnd-kit/core';
import { useTaskStore } from '@/stores/taskStore';
import { FocusSection } from '@/components/FocusSection';
import { BacklogSection } from '@/components/BacklogSection';
import { CompletedToday } from '@/components/CompletedToday';
import { GoalCounter } from '@/components/GoalCounter';
import { TaskInput } from '@/components/TaskInput';
import { LunaBar } from '@/components/LunaBar';
import { RewardEffect } from '@/components/RewardEffect';
import { ProcrastinationBreakthrough } from '@/components/ProcrastinationBreakthrough';
import { Onboarding } from '@/components/Onboarding';

export default function Home() {
  const { checkDateChange, focusTask } = useTaskStore();

  // ドラッグ終了時のハンドラ
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    // ドロップ対象が FocusSection の場合
    if (over?.id === 'focus-droppable') {
      focusTask(String(active.id));
    }
  };

  // 起動時に日付変更をチェック
  useEffect(() => {
    checkDateChange();
  }, [checkDateChange]);

  // フォーカス復帰時にも日付変更をチェック
  useEffect(() => {
    const handleFocus = () => checkDateChange();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [checkDateChange]);

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="min-h-screen bg-black text-zinc-100">
        {/* 報酬演出 */}
        <RewardEffect />

        {/* オンボーディング */}
        <Onboarding />

        {/* 先延ばしブレイクスルー（中央揃え） */}
        <ProcrastinationBreakthrough />

        <main className="mx-auto max-w-lg px-4 py-8">
          {/* ヘッダー: タイトル + ゴールカウンター */}
          <header className="mb-6 text-center">
            <h1 className="text-2xl font-bold tracking-tight mb-2">
              <span className="text-rust-gradient">
                Supermassive Task Drive
              </span>
            </h1>
            {/* ゴールカウンター（ヘッダー統合） */}
            <GoalCounter />
          </header>

          {/* ルナ（主役！タイトルと今やることの間） */}
          <LunaBar />

          {/* 今やること（フォーカスエリア） */}
          <FocusSection />

          {/* タスク追加（常時表示） */}
          <TaskInput />

          {/* 控え室（折りたたみ式） */}
          <BacklogSection />

          {/* 完了タスク（折りたたみ式） */}
          <CompletedToday />

          {/* フッター */}
          <footer className="mt-12 text-center text-xs text-zinc-600">
            <p>Supermassive Task Drive v0.3.0</p>
          </footer>
        </main>
      </div>
    </DndContext>
  );
}
