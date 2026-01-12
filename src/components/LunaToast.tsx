'use client';

// ===========================================
// LunaToast - ルナのセリフ（トースト表示）
// 仕様書 v1.2 準拠
// イベント発生時にトースト表示
// ===========================================

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTaskStore } from '@/stores/taskStore';
import type { LunaContext } from '@/types';

// 静的セリフデータベース（後でGemini API生成に置き換え）
const LUNA_LINES: Record<LunaContext, string[]> = {
  ignition: [
    'おはよ。今日も走るで？',
    'エンジン、かかっとるで。',
    'ほな、始めよか。',
  ],
  success: [
    'やるやん。ちょっと見直したわ。',
    'ええセンスしとるな。',
    'おお、できたやん。',
  ],
  failure: [
    'あはは、やめたんか。まあええけど。',
    'サボりも休憩のうちやで。',
    'ダサい負け方はあかんで？',
  ],
  idle: [
    '暇なんか？',
    'なんかせえへんの？',
    '待っとるで。',
  ],
  bond: [
    'こんな時間までおるん？',
    '無理せんでええんやで。',
    '私はおるから。',
  ],
};

// ランダムにセリフを選択
const getRandomLine = (context: LunaContext): string => {
  const lines = LUNA_LINES[context];
  return lines[Math.floor(Math.random() * lines.length)];
};

export function LunaToast() {
  const { lunaContext, lunaMode } = useTaskStore();
  const [visible, setVisible] = useState(false);
  const [currentLine, setCurrentLine] = useState('');
  const prevContextRef = useRef<LunaContext | null>(null);

  useEffect(() => {
    // コンテキストが変わったらトースト表示
    if (prevContextRef.current !== lunaContext) {
      const line = getRandomLine(lunaContext);
      setCurrentLine(line);
      setVisible(true);

      // 3秒後に消える
      const timer = setTimeout(() => {
        setVisible(false);
      }, 3000);

      prevContextRef.current = lunaContext;

      return () => clearTimeout(timer);
    }
  }, [lunaContext]);

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
            <span className="text-zinc-100 font-medium">
              {currentLine}
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
