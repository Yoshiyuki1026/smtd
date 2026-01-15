'use client';

// ===========================================
// 先延ばしブレイクスルー
// 「何を先延ばしにしてる？」→ ルナが煽る → 二択
// Industrial Noir Theme
// ===========================================

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTaskStore } from '@/stores/taskStore';

type Phase = 'input' | 'loading' | 'response' | 'result';

export function ProcrastinationBreakthrough() {
  const { addTask, navigatorMode } = useTaskStore();
  const isDogs = navigatorMode === 'dogs';
  const [isOpen, setIsOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>('input');
  const [inputText, setInputText] = useState('');
  const [lunaResponse, setLunaResponse] = useState('');
  const [resultMessage, setResultMessage] = useState('');

  // モーダルを開く
  const handleOpen = useCallback(() => {
    setIsOpen(true);
    setPhase('input');
    setInputText('');
    setLunaResponse('');
    setResultMessage('');
  }, []);

  // モーダルを閉じる
  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Escキーでモーダルを閉じる
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose]);

  // 先延ばし内容を送信
  const handleSubmit = useCallback(async () => {
    if (!inputText.trim()) return;

    setPhase('loading');

    // navigatorModeに応じてAPIエンドポイントを切り替え
    const endpoint = isDogs ? '/api/boss' : '/api/luna';
    const fallbackLine = isDogs
      ? '……で、やるのか？やらんのか？'
      : 'で、やるん？やらんの？';

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'entertained',
          context: 'breakthrough',
          taskTitle: inputText.trim(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setLunaResponse(data.line || fallbackLine);
      } else {
        setLunaResponse(fallbackLine);
      }
      setPhase('response');
    } catch (error) {
      console.error('Failed to fetch response:', error);
      setLunaResponse(fallbackLine);
      setPhase('response');
    }
  }, [inputText, isDogs]);

  // 「今やる」を選択
  const handleDoIt = useCallback(() => {
    addTask(inputText.trim());
    const message = isDogs
      ? '……いいセンスだ。タスクに追加した。やれ。'
      : 'よっしゃ、タスクに追加したで。やるやん。';
    setResultMessage(message);
    setPhase('result');
  }, [addTask, inputText, isDogs]);

  // 「やらない」を選択
  const handleSkip = useCallback(() => {
    const message = isDogs
      ? '……やれやれ、まあいい。逃げるのも戦術だ。'
      : 'あははは！まあ、あんたらしいわ。また来いや。';
    setResultMessage(message);
    setPhase('result');
  }, [isDogs]);

  return (
    <>
      {/* トリガーボタン（中央揃え） */}
      <button
        onClick={handleOpen}
        className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 rounded-full bg-amber-500/20 border border-amber-500/40 px-4 py-3 text-amber-400 hover:bg-amber-500/30 transition-all shadow-[0_0_20px_rgba(245,158,11,0.2)]"
      >
        <span className="text-lg">{isDogs ? '🐺' : '⚡'}</span>
        <span className="text-sm font-medium">何か先延ばししてない？</span>
      </button>

      {/* モーダル */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={handleClose}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md rounded-xl bg-zinc-900 border border-amber-500/30 p-6 shadow-[0_0_40px_rgba(245,158,11,0.15)]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 入力フェーズ */}
              {phase === 'input' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-amber-400">
                    <span className="text-xl">{isDogs ? '🐺' : '⚡'}</span>
                    <h2 className="text-lg font-bold">先延ばしブレイクスルー</h2>
                  </div>
                  <p className="text-zinc-400 text-sm">
                    今、何を先延ばしにしてる？
                  </p>
                  <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="例: 確定申告の書類整理"
                    className="w-full h-24 rounded-lg bg-zinc-800 border border-zinc-700 px-4 py-3 text-zinc-100 placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none resize-none"
                    autoFocus
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={handleClose}
                      className="flex-1 rounded-lg bg-zinc-800 border border-zinc-700 py-3 text-zinc-400 hover:bg-zinc-700 transition-colors"
                    >
                      やめる
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={!inputText.trim()}
                      className="flex-1 rounded-lg bg-amber-500/20 border border-amber-500/40 py-3 text-amber-400 hover:bg-amber-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      聞いてみる
                    </button>
                  </div>
                </div>
              )}

              {/* ローディングフェーズ */}
              {phase === 'loading' && (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <div className="text-4xl animate-pulse">{isDogs ? '🐺' : '⚡'}</div>
                  <p className="text-amber-400 animate-pulse">
                    {isDogs ? 'ボスが考え中...' : 'ルナが考え中...'}
                  </p>
                </div>
              )}

              {/* レスポンスフェーズ */}
              {phase === 'response' && (
                <div className="space-y-6">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl shrink-0">{isDogs ? '🐺' : '⚡'}</span>
                    <div className="space-y-2">
                      <p className="text-zinc-300 text-sm">
                        「{inputText}」について...
                      </p>
                      <p className="text-amber-100 font-medium leading-relaxed">
                        {lunaResponse}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleSkip}
                      className="flex-1 rounded-lg bg-zinc-800 border border-zinc-700 py-4 text-zinc-400 hover:bg-zinc-700 transition-colors"
                    >
                      やらない
                    </button>
                    <button
                      onClick={handleDoIt}
                      className="flex-1 rounded-lg bg-amber-500/20 border border-amber-500/40 py-4 text-amber-400 hover:bg-amber-500/30 transition-colors font-bold"
                    >
                      今やる
                    </button>
                  </div>
                </div>
              )}

              {/* 結果フェーズ */}
              {phase === 'result' && (
                <div className="space-y-6">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl shrink-0">{isDogs ? '🐺' : '⚡'}</span>
                    <p className="text-amber-100 font-medium leading-relaxed">
                      {resultMessage}
                    </p>
                  </div>
                  <button
                    onClick={handleClose}
                    className="w-full rounded-lg bg-zinc-800 border border-zinc-700 py-3 text-zinc-300 hover:bg-zinc-700 transition-colors"
                  >
                    閉じる
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
