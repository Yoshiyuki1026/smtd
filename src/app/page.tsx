'use client';

// ===========================================
// SMTD メイン画面（Cockpit）
// ジョブズ版: シンプル、本質的、直感的
// ===========================================

import { useEffect, useState } from 'react';
import { DndContext, DragEndEvent } from '@dnd-kit/core';
import { useTaskStore } from '@/stores/taskStore';
import { useAuth } from '@/providers/AuthProvider';
import { FocusSection } from '@/components/FocusSection';
import { BacklogSection } from '@/components/BacklogSection';
import { CompletedToday } from '@/components/CompletedToday';
import { BlackHole } from '@/components/BlackHole';
import { GoalCounter } from '@/components/GoalCounter';
import { TaskInput } from '@/components/TaskInput';
import { LunaBar } from '@/components/LunaBar';
import { RewardEffect } from '@/components/RewardEffect';
import { ProcrastinationBreakthrough } from '@/components/ProcrastinationBreakthrough';
import { Onboarding } from '@/components/Onboarding';
import { AuthModal } from '@/components/AuthModal';
import { Settings } from '@/components/Settings';

export default function Home() {
  const { checkDateChange, focusTask } = useTaskStore();
  const { user, isLoading: authLoading, signOut } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [bottomTab, setBottomTab] = useState<'completed' | 'blackhole'>('completed');

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

        {/* 認証モーダル */}
        <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />

        {/* 設定モーダル */}
        <Settings isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

        <main className="mx-auto max-w-lg px-4 py-8">
          {/* ヘッダー: タイトル + ゴールカウンター + 認証 + 設定 */}
          <header className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-2xl font-bold tracking-tight">
                <span className="text-rust-gradient">
                  Supermassive Task Drive
                </span>
              </h1>
              <div className="flex items-center gap-2">
                {/* 設定ボタン */}
                <button
                  onClick={() => setIsSettingsOpen(true)}
                  className="text-xl p-2 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100 transition-colors"
                  title="設定"
                >
                  ⚙️
                </button>

                {/* 認証ボタン */}
                {!authLoading && (
                  user ? (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-600 text-white text-xs font-bold">
                        {user.email?.[0].toUpperCase()}
                      </div>
                      <button
                        onClick={signOut}
                        className="text-xs px-3 py-1 rounded-md bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors"
                      >
                        ログアウト
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsAuthModalOpen(true)}
                      className="text-xs px-3 py-1 rounded-md bg-purple-600 text-white hover:bg-purple-700 transition-colors"
                    >
                      ログイン
                    </button>
                  )
                )}
              </div>
            </div>
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

          {/* ボトムタブ: 完了タスク / Black Hole */}
          <section className="mb-6">
            {/* タブ */}
            <div className="flex gap-2 border-b border-zinc-700 mb-4">
              <button
                onClick={() => setBottomTab('completed')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  bottomTab === 'completed'
                    ? 'text-purple-500 border-b-2 border-purple-500'
                    : 'text-zinc-500 hover:text-zinc-400'
                }`}
              >
                完了タスク
              </button>
              <button
                onClick={() => setBottomTab('blackhole')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  bottomTab === 'blackhole'
                    ? 'text-purple-500 border-b-2 border-purple-500'
                    : 'text-zinc-500 hover:text-zinc-400'
                }`}
              >
                Black Hole
              </button>
            </div>

            {/* コンテンツ */}
            {bottomTab === 'completed' ? <CompletedToday /> : <BlackHole />}
          </section>

          {/* フッター */}
          <footer className="mt-12 text-center text-xs text-zinc-600">
            <p>Supermassive Task Drive v0.3.0</p>
          </footer>
        </main>
      </div>
    </DndContext>
  );
}
