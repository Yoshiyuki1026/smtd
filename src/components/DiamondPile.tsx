'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTaskStore } from '@/stores/taskStore';
import { useDeviceOrientation } from '@/hooks/useDeviceOrientation';

// matter-js の型定義
type MatterEngine = import('matter-js').Engine;
type MatterBody = import('matter-js').Body;
type MatterRunner = import('matter-js').Runner;

interface Stone {
  body: MatterBody;
  createdAt: number;
}

/**
 * DiamondPile - 物理演算ダイヤコンポーネント
 *
 * 機能:
 * - タスク完了時に上から落下するダイヤを描画
 * - matter-jsで物理演算（重力、衝突）
 * - デバイス傾きに応じて重力方向を変更
 * - 最大50個のダイヤを保持
 */
export const DiamondPile: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<MatterEngine | null>(null);
  const runnerRef = useRef<MatterRunner | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const stonesRef = useRef<Stone[]>([]);
  const matterRef = useRef<typeof import('matter-js') | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const { gameState, lastReward } = useTaskStore();
  const { gravity, needsPermission, permissionState, requestPermission } = useDeviceOrientation();

  // matter-js を動的インポート（SSR回避）
  useEffect(() => {
    import('matter-js')
      .then((Matter) => {
        matterRef.current = Matter;
        setIsLoaded(true);
      })
      .catch((error) => {
        console.error('Failed to load matter-js:', error);
        setLoadError('物理演算エンジンの読み込みに失敗しました');
      });
  }, []);

  // ダイヤを追加
  const addStone = useCallback(() => {
    if (!engineRef.current || !canvasRef.current || !matterRef.current) return;

    const Matter = matterRef.current;
    const engine = engineRef.current;
    const width = canvasRef.current.clientWidth;

    // 古いダイヤを削除（最大50個まで）
    if (stonesRef.current.length >= 50) {
      const oldStone = stonesRef.current.shift();
      if (oldStone) {
        Matter.World.remove(engine.world, oldStone.body);
      }
    }

    // 新しいダイヤを作成（上から落下）
    const body = Matter.Bodies.circle(Math.random() * (width - 40) + 20, -20, 12, {
      restitution: 0.6,
      friction: 0.3,
      frictionAir: 0.01,
    });

    Matter.World.add(engine.world, body);
    stonesRef.current.push({ body, createdAt: Date.now() });
  }, []);

  // 初期化（matter-jsがロードされた後）
  useEffect(() => {
    if (!isLoaded || !canvasRef.current || !matterRef.current) return;

    const Matter = matterRef.current;
    const canvas = canvasRef.current;
    const width = canvas.clientWidth;
    const height = 180;

    // Canvas サイズ設定
    canvas.width = width;
    canvas.height = height;

    // Engine 作成
    const engine = Matter.Engine.create();
    engineRef.current = engine;

    // World 設定
    engine.world.gravity.y = 1;
    engine.world.gravity.x = 0;

    // 境界（壁）の作成
    const wallThickness = 20;

    // 下部（床）
    Matter.World.add(engine.world, [
      Matter.Bodies.rectangle(width / 2, height - wallThickness / 2, width, wallThickness, {
        isStatic: true,
        label: 'ground',
      }),
      // 左壁
      Matter.Bodies.rectangle(-wallThickness / 2, height / 2, wallThickness, height + 40, {
        isStatic: true,
        label: 'wall',
      }),
      // 右壁
      Matter.Bodies.rectangle(width + wallThickness / 2, height / 2, wallThickness, height + 40, {
        isStatic: true,
        label: 'wall',
      }),
    ]);

    // Runner 実行（物理演算のみ）
    const runner = Matter.Runner.create();
    runnerRef.current = runner;
    Matter.Runner.run(runner, engine);

    // 描画ループ（requestAnimationFrame）
    const animate = () => {
      drawStones(canvas, stonesRef.current);
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    animate();

    // クリーンアップ時に削除
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      if (runnerRef.current) {
        Matter.Runner.stop(runnerRef.current);
        runnerRef.current = null;
      }
      Matter.World.clear(engine.world, false);
      Matter.Engine.clear(engine);
      engineRef.current = null;
    };
  }, [isLoaded]);

  // 重力方向の更新
  useEffect(() => {
    if (!engineRef.current) return;
    engineRef.current.world.gravity.x = gravity.x * 2;
    engineRef.current.world.gravity.y = gravity.y;
  }, [gravity]);

  // lastReward の変化を監視して新しいダイヤを追加
  useEffect(() => {
    if (!lastReward || !engineRef.current) return;

    addStone();
  }, [lastReward, addStone]);

  // エラー時のフォールバック表示
  if (loadError) {
    return (
      <div className="w-full flex flex-col items-center gap-2">
        <div className="w-full h-[180px] border border-amber-600/50 rounded-lg bg-gradient-to-b from-slate-900 to-slate-950 flex items-center justify-center">
          <span className="text-amber-400/50 text-sm">{loadError}</span>
        </div>
        <div className="text-center text-sm text-amber-200">
          <span className="font-bold text-lg text-amber-400">💎 {gameState.totalStones}</span>
          <p className="text-xs text-slate-400">Total Stones</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center gap-2">
      {/* キャンバス */}
      <canvas
        ref={canvasRef}
        className="w-full border border-amber-600/50 rounded-lg bg-gradient-to-b from-slate-900 to-slate-950"
        style={{ height: '180px' }}
      />

      {/* 総資産表示 */}
      <div className="text-center text-sm text-amber-200">
        <span className="font-bold text-lg text-amber-400">💎 {gameState.totalStones}</span>
        <p className="text-xs text-slate-400">Total Stones</p>
      </div>

      {/* iOS傾きセンサー許可ボタン（iOS 13+のみ表示） */}
      {needsPermission && permissionState === 'unknown' && (
        <button
          onClick={requestPermission}
          className="text-xs px-3 py-1 rounded-md bg-amber-600/20 border border-amber-600/40 text-amber-400 hover:bg-amber-600/30 transition-colors"
        >
          📱 傾きセンサーを有効化
        </button>
      )}
    </div>
  );
};

/**
 * カスタム描画関数
 * matter-js の Bodies を描画
 */
function drawStones(canvas: HTMLCanvasElement, stones: Stone[]) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // 背景クリア
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 各ダイヤを描画
  stones.forEach(({ body }) => {
    const { x, y } = body.position;
    const radius = 12;

    // グラデーション作成（ゴールド）
    const gradient = ctx.createRadialGradient(x - 4, y - 4, 0, x, y, radius);
    gradient.addColorStop(0, '#fbbf24'); // amber-400
    gradient.addColorStop(0.5, '#f59e0b'); // amber-500
    gradient.addColorStop(1, '#b45309'); // amber-700

    // 円を描画
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    // ハイライト（光沢）
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.arc(x - 4, y - 4, 4, 0, Math.PI * 2);
    ctx.fill();

    // アウトライン
    ctx.strokeStyle = '#92400e'; // amber-900
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.stroke();
  });
}
