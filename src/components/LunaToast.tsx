'use client';

// ===========================================
// LunaToast - ルナのセリフ（トースト表示）
// 仕様書 v1.4 準拠
// Gemini API でセリフを動的生成
// ===========================================

import { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTaskStore } from '@/stores/taskStore';
import type { LunaContext } from '@/types';

// フォールバック用の静的セリフ（API呼び出し前・エラー時）
const FALLBACK_LINES: Record<LunaContext, string[]> = {
  ignition: ['おはよ。今日も走るで？', 'エンジン、かかっとるで。', 'ほな、始めよか。'],
  success: ['やるやん。ちょっと見直したわ。', 'ええセンスしとるな。', 'おお、できたやん。'],
  failure: ['あはは、やめたんか。まあええけど。', 'サボりも休憩のうちやで。', 'ダサい負け方はあかんで？'],
  idle: ['暇なんか？', 'なんかせえへんの？', '待っとるで。'],
  bond: ['こんな時間までおるん？', '無理せんでええんやで。', '私はおるから。'],
};

// ランダムにセリフを選択
const getRandomLine = (context: LunaContext): string => {
  const lines = FALLBACK_LINES[context];
  return lines[Math.floor(Math.random() * lines.length)];
};

export function LunaToast() {
  const { lunaContext, lunaMode } = useTaskStore();
  const [visible, setVisible] = useState(false);
  const [currentLine, setCurrentLine] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const prevContextRef = useRef<LunaContext | null>(null);

  // セリフを取得（APIまたはフォールバック）
  const fetchLine = useCallback(async (context: LunaContext) => {
    setIsLoading(true);

    // まずフォールバックを表示（即座に反応）
    const fallback = getRandomLine(context);
    setCurrentLine(fallback);
    setVisible(true);

    try {
      const response = await fetch('/api/luna', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: lunaMode,
          context,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.line && data.source !== 'error') {
          // API成功時は置き換え
          setCurrentLine(data.line);
        }
      }
    } catch (error) {
      // エラー時はフォールバックのまま
      console.error('Failed to fetch Luna line:', error);
    } finally {
      setIsLoading(false);
    }
  }, [lunaMode]);

  useEffect(() => {
    // コンテキストが変わったらトースト表示
    if (prevContextRef.current !== lunaContext) {
      fetchLine(lunaContext);

      // 4秒後に消える（API待ち時間を考慮して長めに）
      const timer = setTimeout(() => {
        setVisible(false);
      }, 4000);

      prevContextRef.current = lunaContext;

      return () => clearTimeout(timer);
    }
  }, [lunaContext, fetchLine]);

  // entertainedモードの時は背景色を変える
  const bgColor = lunaMode === 'entertained'
    ? 'bg-pink-500/20 border-pink-500/50'
    : 'bg-purple-500/20 border-purple-500/50';

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          className={`fixed top-4 left-1/2 z-50 -translate-x-1/2 rounded-xl border px-6 py-3 backdrop-blur-sm ${bgColor}`}
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">🌙</span>
            <span className={`text-zinc-100 font-medium ${isLoading ? 'opacity-70' : ''}`}>
              {currentLine}
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
