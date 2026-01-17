'use client';

// ===========================================
// SMTD メイン画面（Cockpit）
// ジョブズ版: シンプル、本質的、直感的
// ===========================================

import { useEffect, useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
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
import { Settings as SettingsIcon } from 'lucide-react';
// DiamondPile は CompletedToday 内で表示（重複防止）

export default function Home() {
  const { checkDateChange, focusTask, reorderTasks, gameState } = useTaskStore();
  const { user, isLoading: authLoading, signOut } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<'backlog' | 'completed' | 'blackhole'>('backlog');

  // センサー設定（タップ/スクロールとの競合回避）
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    })
  );

  // ドラッグ終了時のハンドラ
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    // Case 1: タスク同士のドロップ（並び替え）
    if (over.id !== 'focus-droppable') {
      if (active.id !== over.id) {
        reorderTasks(String(active.id), String(over.id));
      }
      return;
    }

    // Case 2: 空のFocusエリアへのドロップ（控え室→今やること）
    if (over.id === 'focus-droppable') {
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
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
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
          {/* ヘッダー: タイトル + ストリーク + ゴールカウンター + 認証 + 設定 */}
          <header className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                {/* Phase 2.9: ストリーク表示（タイトル削除、ストリークのみ左寄せ） */}
                {gameState.streak > 0 ? (
                  <div className="flex items-center gap-1 px-2 py-1 bg-amber-500/20 rounded-full">
                    <span className="text-lg">🔥</span>
                    <span className="text-sm font-bold text-amber-400">
                      {gameState.streak === 1 ? '1日目' : `${gameState.streak}日連続`}
                    </span>
                  </div>
                ) : (
                  <div className="h-8" />
                )}
              </div>
              <div className="flex items-center gap-2">
                {/* 設定ボタン */}
                <button
                  onClick={() => setIsSettingsOpen(true)}
                  className="h-9 w-9 flex items-center justify-center rounded-lg bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-100 transition-colors"
                  title="設定"
                >
                  <SettingsIcon size={20} />
                </button>

                {/* 認証ボタン */}
                {!authLoading && (
                  user ? (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center justify-center h-9 w-9 rounded-full bg-purple-600 text-white text-sm font-bold">
                        {(user.email?.[0] || '?').toUpperCase()}
                      </div>
                      <button
                        onClick={signOut}
                        className="h-9 px-4 rounded-lg bg-zinc-800 text-zinc-300 text-sm hover:bg-zinc-700 transition-colors"
                      >
                        ログアウト
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsAuthModalOpen(true)}
                      className="h-9 px-4 rounded-lg bg-purple-600 text-white text-sm hover:bg-purple-700 transition-colors"
                    >
                      ログイン
                    </button>
                  )
                )}
              </div>
            </div>
            {/* ゴールカウンター（ヘッダー統合） */}
            <div className="flex items-center justify-between">
              <GoalCounter />
              {/* Phase 2.9: 今日の一撃バッジ（達成/未達成で分岐） */}
              {gameState.todayStrikeAchieved ? (
                <div className="text-xs text-green-400 flex items-center gap-1">
                  <span>✓</span>
                  <span>今日の一撃達成</span>
                </div>
              ) : (
                <div className="text-xs text-amber-400 flex items-center gap-1 animate-pulse">
                  <span>⚡</span>
                  <span>今日の一撃を狙え</span>
                </div>
              )}
            </div>
          </header>

          {/* ルナ（主役！タイトルと今やることの間） */}
          <LunaBar />

          {/* 今やること（フォーカスエリア） */}
          <FocusSection />

          {/* タスク追加（常時表示） */}
          <TaskInput />

          {/* セクションタブ: 控え室 / 完了タスク / Black Hole */}
          <section className="mb-6">
            {/* タブバー */}
            <div className="flex gap-2 border-b border-zinc-700 mb-4">
              <button
                onClick={() => setActiveSection('backlog')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  activeSection === 'backlog'
                    ? 'border-b-2 border-amber-500 text-amber-500'
                    : 'text-zinc-500 hover:text-zinc-400'
                }`}
              >
                控え室
              </button>
              <button
                onClick={() => setActiveSection('completed')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  activeSection === 'completed'
                    ? 'border-b-2 border-amber-500 text-amber-500'
                    : 'text-zinc-500 hover:text-zinc-400'
                }`}
              >
                完了タスク
              </button>
              <button
                onClick={() => setActiveSection('blackhole')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  activeSection === 'blackhole'
                    ? 'border-b-2 border-amber-500 text-amber-500'
                    : 'text-zinc-500 hover:text-zinc-400'
                }`}
              >
                Black Hole
              </button>
            </div>

            {/* コンテンツ（排他的に表示） */}
            {activeSection === 'backlog' && <BacklogSection />}
            {activeSection === 'completed' && <CompletedToday />}
            {activeSection === 'blackhole' && <BlackHole />}
          </section>

          {/* フッター */}
          <footer className="mt-12 text-center text-xs text-zinc-700">
            Supermassive Task Drive v0.3.0
          </footer>
        </main>
      </div>
    </DndContext>
  );
}
