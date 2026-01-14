'use client';

// ===========================================
// Onboarding - 初回起動ツールチップガイド
// 3ステップ: タスク追加 → 昇格 → 完了
// Industrial Noir Theme
// ===========================================

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Plus } from 'lucide-react';
import { useTaskStore } from '@/stores/taskStore';

type Step = 1 | 2 | 3;

export function Onboarding() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [isMounted, setIsMounted] = useState(false);
  const [taskInput, setTaskInput] = useState('');
  const { addTask } = useTaskStore();

  // Hydration対策: クライアント側でのみレンダリング
  // eslint-disable react-hooks/exhaustive-deps
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // isMountedが変更されたら、localStorageをチェックしてisOpenを設定
  // eslint-disable react-hooks/exhaustive-deps
  useEffect(() => {
    if (!isMounted) return;

    // 初回起動判定：localStorage に `smtd-onboarding-done` がなければ表示
    const isDone = localStorage.getItem('smtd-onboarding-done');
    if (!isDone) {
      setIsOpen(true);
    }
  }, [isMounted]);

  // Hydration 中は何も表示しない
  if (!isMounted) return null;

  // ステップ情報
  const steps: Record<
    Step,
    {
      title: string;
      description: string;
      hint: string;
      icon: string;
      targetElement?: 'task-input' | 'backlog-section' | 'focus-section';
    }
  > = {
    1: {
      title: 'タスクを追加してみよう',
      description:
        '今日やりたいことを入力してみて。なんでもOK！',
      hint: '例：買い物、メール返信、部屋の掃除',
      icon: '📝',
      targetElement: 'task-input',
    },
    2: {
      title: '控え室から「今やること」へ',
      description:
        '追加したタスクは「控え室」に入ります。矢印ボタンで「今やること」に移動させましょう。（最大3つまで）',
      hint: 'FOCUS: ワーキングメモリ保護。多すぎるタスクは脳を疲れさせます。',
      icon: '⬆️',
      targetElement: 'backlog-section',
    },
    3: {
      title: '完了ボタンをタップ！',
      description:
        '「今やること」のタスクをやり終わったら、左のチェックボタンをタップ。完了！紙吹雪が舞います。',
      hint: '完了したタスクは積み上がる。それが君の資産。',
      icon: '✓',
    },
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep((currentStep + 1) as Step);
    }
  };

  // Step 1: タスク追加 → 自動で次へ
  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskInput.trim()) return;
    addTask(taskInput.trim());
    setTaskInput('');
    handleNext(); // 自動で次のステップへ
  };

  const handleSkip = () => {
    completeOnboarding();
  };

  const handleStart = () => {
    completeOnboarding();
  };

  const completeOnboarding = () => {
    localStorage.setItem('smtd-onboarding-done', 'true');
    setIsOpen(false);
  };

  const step = steps[currentStep];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={handleSkip}
        >
          {/* メインモーダル */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="w-full max-w-md rounded-xl bg-zinc-900 border border-amber-500/30 p-8 shadow-[0_0_40px_rgba(245,158,11,0.15)]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* ステップ表示 */}
            <div className="mb-6 flex items-center justify-between">
              <span className="text-sm font-medium text-amber-400">
                ステップ {currentStep} / 3
              </span>
              <div className="flex gap-1">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`h-1 w-6 rounded-full transition-colors ${
                      i <= currentStep
                        ? 'bg-amber-500'
                        : 'bg-zinc-700'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* アイコン + タイトル */}
            <div className="mb-4 flex items-start gap-3">
              <span className="text-4xl">{step.icon}</span>
              <h2 className="text-xl font-bold text-amber-400">
                {step.title}
              </h2>
            </div>

            {/* 説明文 */}
            <div className="mb-6 space-y-3">
              <p className="text-sm leading-relaxed text-zinc-300">
                {step.description}
              </p>
              <div className="rounded-lg bg-zinc-900/50 border border-amber-500/20 px-4 py-3">
                <p className="text-xs text-amber-300 leading-relaxed">
                  💡 {step.hint}
                </p>
              </div>
            </div>

            {/* Step 1: タスク入力欄 */}
            {currentStep === 1 && (
              <form onSubmit={handleAddTask} className="mb-6">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={taskInput}
                    onChange={(e) => setTaskInput(e.target.value)}
                    placeholder="やることを入力..."
                    autoFocus
                    className="flex-1 rounded-lg bg-zinc-800 border border-zinc-600 px-4 py-3 text-zinc-100 placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                  <button
                    type="submit"
                    disabled={!taskInput.trim()}
                    className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-500 transition-colors hover:bg-amber-500/30 disabled:opacity-30 disabled:cursor-not-allowed"
                    aria-label="追加"
                  >
                    <Plus size={24} />
                  </button>
                </div>
              </form>
            )}

            {/* ボタン群 */}
            <div className="flex gap-3">
              {/* スキップボタン */}
              {currentStep < 3 && (
                <button
                  onClick={handleSkip}
                  className="flex-1 rounded-lg bg-zinc-800 border border-zinc-700 py-3 text-sm text-zinc-400 hover:bg-zinc-700 transition-colors font-medium"
                >
                  スキップ
                </button>
              )}

              {/* 次へボタン（Step 1-2） */}
              {currentStep < 3 && (
                <button
                  onClick={handleNext}
                  className="flex-1 rounded-lg bg-amber-500/20 border border-amber-500/40 py-3 text-sm text-amber-400 hover:bg-amber-500/30 transition-colors font-bold flex items-center justify-center gap-2"
                >
                  次へ
                  <ChevronRight size={16} />
                </button>
              )}

              {/* 始めるボタン（Step 3） */}
              {currentStep === 3 && (
                <button
                  onClick={handleStart}
                  className="w-full rounded-lg bg-amber-500/20 border border-amber-500/40 py-3 text-amber-400 hover:bg-amber-500/30 transition-colors font-bold"
                >
                  始める
                </button>
              )}
            </div>
          </motion.div>

          {/* ツールチップ（Step 2のみ、Step 1は入力欄埋め込みなので不要） */}
          {currentStep === 2 && step.targetElement && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ delay: 0.2 }}
              className="pointer-events-none absolute bottom-32 left-1/2 -translate-x-1/2 z-40"
            >
              <div className="rounded-lg bg-amber-500/10 border border-amber-500/40 px-3 py-2 text-xs text-amber-300 whitespace-nowrap shadow-lg">
                ↓ ここです
              </div>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
