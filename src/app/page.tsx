'use client';

// ===========================================
// SMTD メイン画面（Cockpit）
// ジョブズ版: シンプル、本質的、直感的
// ===========================================

import { useEffect } from 'react';
import { useTaskStore } from '@/stores/taskStore';
import { FocusSection } from '@/components/FocusSection';
import { BacklogSection } from '@/components/BacklogSection';
import { CompletedToday } from '@/components/CompletedToday';
import { GoalCounter } from '@/components/GoalCounter';
import { TaskInput } from '@/components/TaskInput';
import { LunaBar } from '@/components/LunaBar';
import { RewardEffect } from '@/components/RewardEffect';
import { ProcrastinationBreakthrough } from '@/components/ProcrastinationBreakthrough';

export default function Home() {
  const { checkDateChange } = useTaskStore();

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
    <div className="min-h-screen bg-black text-zinc-100">
      {/* 報酬演出 */}
      <RewardEffect />

      {/* 先延ばしブレイクスルー */}
      <ProcrastinationBreakthrough />

      {/* ルナバー（画面下部固定） */}
      <LunaBar />

      <main className="mx-auto max-w-lg px-4 py-8 pb-24">
        {/* ヘッダー: タイトル + ゴールカウンター */}
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            <span className="text-rust-gradient">
              すたどら
            </span>
          </h1>
          {/* ゴールカウンター（ヘッダー統合） */}
          <GoalCounter />
        </header>

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
  );
}
