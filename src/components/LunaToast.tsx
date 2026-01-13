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

// エラー時のメッセージ
const ERROR_MESSAGE = '...（ちょっと待って）';

export function LunaToast() {
  const { lunaContext, lunaMode } = useTaskStore();
  const [visible, setVisible] = useState(false);
  const [currentLine, setCurrentLine] = useState('...');
  const [isLoading, setIsLoading] = useState(false);
  const [showCount, setShowCount] = useState(0);
  const lastContextRef = useRef<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // セリフを取得（API完了後にタイマー開始）
  const fetchLine = useCallback(async (context: LunaContext) => {
    setIsLoading(true);
    setVisible(true);
    setCurrentLine('...');

    // 既存のタイマーをクリア
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

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
        } else {
          // エラーの場合はフォールバック
          setCurrentLine(ERROR_MESSAGE);
        }
      } else {
        setCurrentLine(ERROR_MESSAGE);
      }
    } catch (error) {
      console.error('Failed to fetch Luna line:', error);
      setCurrentLine(ERROR_MESSAGE);
    } finally {
      setIsLoading(false);
      // API完了後に8秒タイマー開始
      timerRef.current = setTimeout(() => {
        setVisible(false);
      }, 8000);
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
  }, [showCount, fetchLine, lunaContext]);

  // コンテキスト変更時（初回以降）
  useEffect(() => {
    if (lastContextRef.current && lastContextRef.current !== lunaContext) {
      setShowCount(prev => prev + 1);
    }
  }, [lunaContext]);

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

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
          className={`fixed top-4 left-1/2 z-50 -translate-x-1/2 rounded-lg border px-6 py-3 backdrop-blur-md max-w-md ${toastStyle}`}
        >
          <div className="flex items-center gap-3">
            <span className={`text-lg shrink-0 ${lunaMode === 'entertained' ? 'text-amber-400' : 'text-cyan-400'}`}>
              {iconColor}
            </span>
            <span className={`text-zinc-100 font-medium tracking-wide text-sm ${isLoading ? 'animate-pulse' : ''}`}>
              {currentLine}
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
