'use client';

// ===========================================
// Onboarding - 初回起動ツールチップガイド
// 3ステップ: タスク追加 → 昇格 → 完了
// Industrial Noir Theme
// ===========================================

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight } from 'lucide-react';

type Step = 1 | 2 | 3;

export function Onboarding() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [hasCheckedStorage, setHasCheckedStorage] = useState(false);

  // SSR/Hydration対策：マウント後にlocalStorageを確認
  useEffect(() => {
    // ブラウザ環境でのみ実行
    if (typeof window === 'undefined') return;

    if (hasCheckedStorage) return;
    setHasCheckedStorage(true);

    // 初回起動判定：localStorage に `smtd-onboarding-done` がなければ表示
    const isDone = localStorage.getItem('smtd-onboarding-done');
    if (!isDone) {
      setIsOpen(true);
    }
  }, [hasCheckedStorage]);

  // Hydration チェック中は何も表示しない
  if (!hasCheckedStorage) return null;

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
        'まずは「タスクを追加...」にやることを入力してみて。今日やりたいことなんでもOK。',
      hint: '例：パッケージ更新、メール返信、コーヒー飲む',
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

  const handleSkip = () => {
    completeOnboarding();
  };

  const handleStart = () => {
    completeOnboarding();
  };

  const completeOnboarding = () => {
    localStorage.setItem('smtd-onboarding-done', 'true');
    setState({ isOpen: false, isMounted: true });
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

          {/* ツールチップ（Step 1-2のみ） */}
          {currentStep < 3 && step.targetElement && (
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
