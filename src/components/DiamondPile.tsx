'use client';

import { useCallback, useEffect, useRef } from 'react';
import {
  Engine,
  World,
  Bodies,
  Render,
  Runner,
  Events,
  type Engine as EngineType,
  type Body,
} from 'matter-js';
import { useTaskStore } from '@/stores/taskStore';
import { useDeviceOrientation } from '@/hooks/useDeviceOrientation';

interface Stone {
  body: Body;
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
  const engineRef = useRef<EngineType | null>(null);
  const stonesRef = useRef<Stone[]>([]);

  const { gameState, lastReward } = useTaskStore();
  const { gravity } = useDeviceOrientation();

  // ダイヤを追加
  const addStone = useCallback(() => {
    if (!engineRef.current || !canvasRef.current) return;

    const engine = engineRef.current;
    const width = canvasRef.current.clientWidth;

    // 古いダイヤを削除（最大50個まで）
    if (stonesRef.current.length >= 50) {
      const oldStone = stonesRef.current.shift();
      if (oldStone) {
        World.remove(engine.world, oldStone.body);
      }
    }

    // 新しいダイヤを作成（上から落下）
    const body = Bodies.circle(Math.random() * (width - 40) + 20, -20, 12, {
      restitution: 0.6,
      friction: 0.3,
      frictionAir: 0.01,
    });

    World.add(engine.world, body);
    stonesRef.current.push({ body, createdAt: Date.now() });
  }, []);

  // 初期化
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const width = canvas.clientWidth;
    const height = 180;

    // Canvas サイズ設定
    canvas.width = width;
    canvas.height = height;

    // Engine 作成
    const engine = Engine.create();
    engineRef.current = engine;

    // World 設定
    engine.world.gravity.y = 1;
    engine.world.gravity.x = 0;

    // 境界（壁）の作成
    const wallThickness = 20;

    // 下部（床）
    World.add(engine.world, [
      Bodies.rectangle(width / 2, height - wallThickness / 2, width, wallThickness, {
        isStatic: true,
        label: 'ground',
      }),
      // 左壁
      Bodies.rectangle(-wallThickness / 2, height / 2, wallThickness, height + 40, {
        isStatic: true,
        label: 'wall',
      }),
      // 右壁
      Bodies.rectangle(width + wallThickness / 2, height / 2, wallThickness, height + 40, {
        isStatic: true,
        label: 'wall',
      }),
    ]);

    // Renderer 作成（カスタム描画）
    const render = Render.create({
      canvas,
      engine,
      options: {
        width,
        height,
        wireframes: false,
        background: 'transparent',
      },
    });

    // Runner 実行
    const runner = Runner.create();
    Runner.run(runner, engine);

    // イベント：毎フレーム描画
    Events.on(render, 'afterRender', () => {
      drawStones(canvas, stonesRef.current);
    });

    // クリーンアップ時に削除
    return () => {
      Runner.stop(runner);
      Render.stop(render);
      World.clear(engine.world, false);
      Engine.clear(engine);
      engineRef.current = null;
    };
  }, []);

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

  return (
    <div className="w-full flex flex-col items-center gap-2">
      {/* キャンバス */}
      <canvas
        ref={canvasRef}
        className="w-full border border-amber-600 rounded-lg bg-gradient-to-b from-slate-900 to-slate-950"
        style={{ height: '180px' }}
      />

      {/* 総資産表示 */}
      <div className="text-center text-sm text-amber-200">
        <span className="font-bold text-lg text-amber-400">💎 {gameState.totalStones}</span>
        <p className="text-xs text-slate-400">Total Stones</p>
      </div>
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
