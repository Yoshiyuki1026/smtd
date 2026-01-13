'use client';

// ===========================================
// SMTD メイン画面（Cockpit）
// 仕様書 v1.2 準拠
// Codename: The Black Odyssey
// ===========================================

import { useEffect } from 'react';
import { useTaskStore } from '@/stores/taskStore';
import { FocusSection } from '@/components/FocusSection';
import { BacklogSection } from '@/components/BacklogSection';
import { GoalCounter } from '@/components/GoalCounter';
import { LunaToast } from '@/components/LunaToast';
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

      {/* ルナのトースト */}
      <LunaToast />

      {/* 先延ばしブレイクスルー */}
      <ProcrastinationBreakthrough />

      <main className="mx-auto max-w-lg px-4 py-8">
        {/* ヘッダー */}
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight">
            <span className="text-rust-gradient">
              すたどら
            </span>
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            3つ終わればゴール。シンプルに。
          </p>
        </header>

        {/* 今やること（フォーカスエリア） */}
        <FocusSection />

        {/* ゴールカウンター */}
        <section className="mb-6">
          <GoalCounter />
        </section>

        {/* 控え室（バックログ） */}
        <BacklogSection />

        {/* フッター */}
        <footer className="mt-12 text-center text-xs text-zinc-600">
          <p>Supermassive Task Drive v0.2.0</p>
          <p className="mt-1">
            「お前の脳は壊れてない。ツールが壊れてるんだ。」
          </p>
        </footer>
      </main>
    </div>
  );
}
