'use client';

// ===========================================
// LunaToast - ルナのセリフ（トースト表示）
// Industrial Noir Theme
// ルナ: シアン/ターコイズ（天才肌のデジタル感）
// ===========================================

import { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTaskStore } from '@/stores/taskStore';
import type { LunaContext } from '@/types';

// フォールバック用の静的セリフ
const FALLBACK_LINES: Record<LunaContext, string[]> = {
  ignition: ['おはよ。今日も走るで？', 'エンジン、かかっとるで。', 'ほな、始めよか。'],
  success: ['やるやん。ちょっと見直したわ。', 'ええセンスしとるな。', 'おお、できたやん。'],
  failure: ['あはは、やめたんか。まあええけど。', 'サボりも休憩のうちやで。', 'ダサい負け方はあかんで？'],
  idle: ['暇なんか？', 'なんかせえへんの？', '待っとるで。'],
  bond: ['こんな時間までおるん？', '無理せんでええんやで。', '私はおるから。'],
};

const getRandomLine = (context: LunaContext): string => {
  const lines = FALLBACK_LINES[context];
  return lines[Math.floor(Math.random() * lines.length)];
};

export function LunaToast() {
  const { lunaContext, lunaMode } = useTaskStore();
  const [visible, setVisible] = useState(false);
  const [currentLine, setCurrentLine] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCount, setShowCount] = useState(0); // トリガー用
  const lastContextRef = useRef<string | null>(null);

  // セリフを取得
  const fetchLine = useCallback(async (context: LunaContext) => {
    setIsLoading(true);

    // フォールバックを即表示
    const fallback = getRandomLine(context);
    setCurrentLine(fallback);
    setVisible(true);

    try {
      const response = await fetch('/api/luna', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: lunaMode, context }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.line && data.source !== 'error') {
          setCurrentLine(data.line);
        }
      }
    } catch (error) {
      console.error('Failed to fetch Luna line:', error);
    } finally {
      setIsLoading(false);
    }
  }, [lunaMode]);

  // 初回マウント時
  useEffect(() => {
    setShowCount(1);
  }, []);

  // showCountが変わったらトースト表示
  useEffect(() => {
    if (showCount === 0) return;

    fetchLine(lunaContext);
    lastContextRef.current = lunaContext;

    const timer = setTimeout(() => {
      setVisible(false);
    }, 8000);

    return () => clearTimeout(timer);
  }, [showCount, fetchLine, lunaContext]);

  // コンテキスト変更時（初回以降）
  useEffect(() => {
    if (lastContextRef.current && lastContextRef.current !== lunaContext) {
      setShowCount(prev => prev + 1);
    }
  }, [lunaContext]);

  // ルナ: シアン、Entertained: アンバー（嘲笑モード）
  const toastStyle = lunaMode === 'entertained'
    ? 'bg-amber-500/10 border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.15)]'
    : 'bg-cyan-500/10 border-cyan-500/40 shadow-[0_0_20px_rgba(6,182,212,0.15)]';

  const iconColor = lunaMode === 'entertained' ? '⚡' : '◈';

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          className={`fixed top-4 left-1/2 z-50 -translate-x-1/2 rounded-lg border px-6 py-3 backdrop-blur-md ${toastStyle}`}
        >
          <div className="flex items-center gap-3">
            <span className={`text-lg ${lunaMode === 'entertained' ? 'text-amber-400' : 'text-cyan-400'}`}>
              {iconColor}
            </span>
            <span className={`text-zinc-100 font-medium tracking-wide ${isLoading ? 'opacity-70' : ''}`}>
              {currentLine}
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
