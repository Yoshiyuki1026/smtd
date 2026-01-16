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
    const body = Matter.Bodies.circle(Math.random() * (width - 40) + 20, -100, 12, {
      restitution: 0.6,
      friction: 0.3,
      frictionAir: 0.01,
    });

    // 下向きの初速度を設定して勢いをつける
    Matter.Body.setVelocity(body, { x: 0, y: 10 });

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
 * 8角形ダイヤモンド形状を描画
 */
function drawDiamondShape(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, rotation: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);

  ctx.beginPath();
  const angles = 8;
  for (let i = 0; i < angles; i++) {
    const angle = (i / angles) * Math.PI * 2 - Math.PI / 2;
    // 交互に半径を変えてダイヤモンド感を出す
    const radius = i % 2 === 0 ? size : size * 0.75;
    const px = Math.cos(angle) * radius;
    const py = Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();

  ctx.restore();
}

/**
 * 十字形ハイライト（宝石の輝き）
 */
function drawSparkle(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';

  // 縦線
  ctx.fillRect(x - 0.5, y - size, 1, size * 2);
  // 横線
  ctx.fillRect(x - size, y - 0.5, size * 2, 1);

  // 小さな中心点
  ctx.beginPath();
  ctx.arc(x, y, 1.5, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * カスタム描画関数
 * matter-js の Bodies を多角形ダイヤモンドとして描画
 */
function drawStones(canvas: HTMLCanvasElement, stones: Stone[]) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // 背景クリア
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 各ダイヤを描画
  stones.forEach(({ body }) => {
    const { x, y } = body.position;
    const rotation = body.angle; // 物理演算の回転を反映
    const size = 14;

    // ドロップシャドウ
    ctx.save();
    ctx.shadowColor = 'rgba(245, 158, 11, 0.5)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 3;

    // グラデーション作成（深みのあるゴールド）
    const gradient = ctx.createRadialGradient(x - 3, y - 3, 0, x, y, size);
    gradient.addColorStop(0, '#fef3c7');   // 明るいハイライト（amber-100）
    gradient.addColorStop(0.25, '#fcd34d'); // amber-300
    gradient.addColorStop(0.5, '#fbbf24');  // amber-400
    gradient.addColorStop(0.75, '#f59e0b'); // amber-500
    gradient.addColorStop(1, '#92400e');    // 深い影（amber-800）

    // ダイヤモンド形状を描画
    ctx.fillStyle = gradient;
    drawDiamondShape(ctx, x, y, size, rotation);
    ctx.fill();

    ctx.restore();

    // アウトライン（回転を反映）
    ctx.strokeStyle = '#78350f'; // amber-900
    ctx.lineWidth = 1.5;
    drawDiamondShape(ctx, x, y, size, rotation);
    ctx.stroke();

    // 内側のファセット線（カット面を表現）
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);

    ctx.strokeStyle = 'rgba(254, 243, 199, 0.3)'; // amber-100の透明版
    ctx.lineWidth = 0.5;

    // 中心から各頂点への線（4本）
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2 - Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(angle) * size * 0.6, Math.sin(angle) * size * 0.6);
      ctx.stroke();
    }
    ctx.restore();

    // ハイライト（十字形の輝き）- 左上に配置
    drawSparkle(ctx, x - 4, y - 4, 4);
  });
}
