'use client';

// ===========================================
// NavigatorBar - ナビゲーター（ルナ/ボス）のセリフ
// CATS: ルナ（ネオンパープル、シアン）
// DOGS: ボス（オリーブドラブ、アンバー）
// ===========================================

import { useEffect, useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { useTaskStore } from '@/stores/taskStore';
import type { LunaContext } from '@/types';

// idle発火までの時間（5分）
const IDLE_TIMEOUT = 5 * 60 * 1000;

// アプリ復帰時のセリフ更新クールダウン（3分）
const VISIBILITY_COOLDOWN = 3 * 60 * 1000;

export function LunaBar() {
  const { lunaContext, lunaMode, lunaTaskTitle, navigatorMode, setNavigatorMode } = useTaskStore();
  const isDogs = navigatorMode === 'dogs';
  const [mounted, setMounted] = useState(false);
  const [currentLine, setCurrentLine] = useState('...');
  const [isLoading, setIsLoading] = useState(false);
  const lastContextRef = useRef<string | null>(null);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasFiredIdleRef = useRef(false);
  const lastFetchTimeRef = useRef<number>(0);  // セリフ取得時刻（クールダウン用）

  // Hydration対策: クライアント側でのみレンダリング
  useEffect(() => {
    setMounted(true);
  }, []);

  // セリフを取得
  const fetchLine = useCallback(async (context: LunaContext, taskTitle?: string | null) => {
    setIsLoading(true);
    setCurrentLine('...');

    // モードに応じてAPIエンドポイントを切り替え
    const endpoint = isDogs ? '/api/boss' : '/api/luna';

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: lunaMode, context, taskTitle }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.line && data.source !== 'error') {
          setCurrentLine(data.line);
          lastFetchTimeRef.current = Date.now();  // 成功時に時刻記録
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
  }, [lunaMode, isDogs]);

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

  // アプリ復帰時（ページ表示時）にセリフ更新（クールダウン付き）
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const elapsed = Date.now() - lastFetchTimeRef.current;
        if (elapsed >= VISIBILITY_COOLDOWN) {
          // クールダウン経過後なら新しいセリフを取得
          const hour = new Date().getHours();
          const context: LunaContext = (hour >= 0 && hour < 5) ? 'bond' : 'ignition';
          fetchLine(context);
          resetIdleTimer();
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [fetchLine, resetIdleTimer]);

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
    };
  }, []);

  // スタイル（CATS: シアン/パープル、DOGS: オリーブ/アンバー）
  const barStyle = isDogs
    ? 'bg-amber-900/20 border-amber-700/40'
    : lunaMode === 'entertained'
      ? 'bg-amber-500/10 border-amber-500/30'
      : 'bg-cyan-500/10 border-cyan-500/30';

  const iconColor = isDogs ? '🐺' : (lunaMode === 'entertained' ? '⚡' : '🐾');
  const textColor = isDogs ? 'text-amber-400' : (lunaMode === 'entertained' ? 'text-amber-400' : 'text-cyan-400');
  const avatarBorder = isDogs ? 'border-amber-600/50 shadow-amber-600/20' : 'border-cyan-500/50 shadow-cyan-500/20';
  const avatarSrc = isDogs ? '/boss-avatar.png' : '/luna-avatar-v6.png';
  const navigatorName = isDogs ? 'ボス' : 'ルナ';

  // マウント前は何も表示しない（SSR対策）
  if (!mounted) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`mb-6 rounded-xl border backdrop-blur-md ${barStyle}`}
    >
      <div className="px-4 py-4">
        <div className="flex items-center gap-4">
          {/* ナビゲーターアバター（タップで切り替え） */}
          <button
            onClick={() => setNavigatorMode(isDogs ? 'cats' : 'dogs')}
            className="shrink-0 relative group"
            title={`${isDogs ? 'ルナ' : 'ボス'}に切り替え`}
          >
            <Image
              src={avatarSrc}
              alt={navigatorName}
              width={72}
              height={72}
              className={`rounded-full border-2 ${avatarBorder} shadow-lg transition-transform group-hover:scale-105`}
            />
            {/* モードインジケーター */}
            <span className={`absolute -bottom-1 -right-1 text-sm ${textColor}`}>
              {iconColor}
            </span>
          </button>
          <span className={`text-zinc-100 font-medium tracking-wide text-sm ${isLoading ? 'animate-pulse' : ''}`}>
            {currentLine}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
