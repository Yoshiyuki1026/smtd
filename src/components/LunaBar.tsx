'use client';

// ===========================================
// LunaBar - ルナのセリフ（画面下部固定）
// Industrial Noir Theme
// ジョブズ版: 常時表示、Dock的存在感
// ===========================================

import { useEffect, useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useTaskStore } from '@/stores/taskStore';
import type { LunaContext } from '@/types';

// idle発火までの時間（5分）
const IDLE_TIMEOUT = 5 * 60 * 1000;

export function LunaBar() {
  const { lunaContext, lunaMode, lunaTaskTitle } = useTaskStore();
  const [mounted, setMounted] = useState(false);
  const [currentLine, setCurrentLine] = useState('...');
  const [isLoading, setIsLoading] = useState(false);
  const lastContextRef = useRef<string | null>(null);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasFiredIdleRef = useRef(false);

  // Hydration対策: クライアント側でのみレンダリング
  useEffect(() => {
    setMounted(true);
  }, []);

  // セリフを取得
  const fetchLine = useCallback(async (context: LunaContext, taskTitle?: string | null) => {
    setIsLoading(true);
    setCurrentLine('...');

    try {
      const response = await fetch('/api/luna', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: lunaMode, context, taskTitle }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.line && data.source !== 'error') {
          setCurrentLine(data.line);
        } else {
          setCurrentLine('...（ちょっと待って）');
        }
      } else {
        setCurrentLine('...（ちょっと待って）');
      }
    } catch (error) {
      console.error('Failed to fetch Luna line:', error);
      setCurrentLine('...（ちょっと待って）');
    } finally {
      setIsLoading(false);
    }
  }, [lunaMode]);

  // idleタイマーをリセット
  const resetIdleTimer = useCallback(() => {
    hasFiredIdleRef.current = false;
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }
    idleTimerRef.current = setTimeout(() => {
      if (!hasFiredIdleRef.current) {
        hasFiredIdleRef.current = true;
        fetchLine('idle');
      }
    }, IDLE_TIMEOUT);
  }, [fetchLine]);

  // 初回マウント時
  useEffect(() => {
    const hour = new Date().getHours();
    const initialContext: LunaContext = (hour >= 0 && hour < 5) ? 'bond' : 'ignition';
    fetchLine(initialContext);
    lastContextRef.current = initialContext;
    resetIdleTimer();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // コンテキスト変更時
  useEffect(() => {
    if (lastContextRef.current && lastContextRef.current !== lunaContext) {
      fetchLine(lunaContext, lunaTaskTitle);
      lastContextRef.current = lunaContext;
      resetIdleTimer();
    }
  }, [lunaContext, lunaTaskTitle, fetchLine, resetIdleTimer]);

  // ユーザー操作でidleタイマーリセット
  useEffect(() => {
    const handleActivity = () => resetIdleTimer();
    window.addEventListener('click', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('touchstart', handleActivity);
    return () => {
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
    };
  }, [resetIdleTimer]);

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
    };
  }, []);

  // スタイル
  const barStyle = lunaMode === 'entertained'
    ? 'bg-amber-500/10 border-amber-500/30'
    : 'bg-cyan-500/10 border-cyan-500/30';

  const iconColor = lunaMode === 'entertained' ? '⚡' : '◈';
  const textColor = lunaMode === 'entertained' ? 'text-amber-400' : 'text-cyan-400';

  // マウント前は何も表示しない（SSR対策）
  if (!mounted) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`fixed bottom-0 left-0 right-0 z-50 border-t backdrop-blur-md ${barStyle}`}
    >
      <div className="mx-auto max-w-lg px-4 py-3">
        <div className="flex items-center gap-3">
          <span className={`text-lg shrink-0 ${textColor}`}>
            {iconColor}
          </span>
          <span className={`text-zinc-100 font-medium tracking-wide text-sm ${isLoading ? 'animate-pulse' : ''}`}>
            {currentLine}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
