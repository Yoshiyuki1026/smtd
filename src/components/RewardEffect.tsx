'use client';

// ===========================================
// RewardEffect - 報酬演出
// Industrial Noir Theme
// 紙吹雪（アンバー系） + ポイント弾け飛び + コンボ
// ===========================================

import { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { useTaskStore } from '@/stores/taskStore';

// Industrial Noir カラーパレット
const CONFETTI_COLORS = [
  '#fbbf24', // amber-400
  '#f59e0b', // amber-500
  '#d97706', // amber-600
  '#fef3c7', // amber-100 (light spark)
  '#78350f', // amber-900 (dark ember)
];

// レア演出用の虹色パレット
const RAINBOW_COLORS = [
  '#ff0000', // 赤
  '#ff7f00', // オレンジ
  '#ffff00', // 黄
  '#00ff00', // 緑
  '#0000ff', // 青
  '#8b00ff', // 紫
];

export function RewardEffect() {
  const { lastReward, clearReward } = useTaskStore();

  // 紙吹雪を発射
  const fireConfetti = useCallback((isRare: boolean = false) => {
    // Phase 2.7: 3倍化（200→600）+ 初速度アップ、レア時は1.5倍（900）
    const count = isRare ? 900 : 600;
    const colors = isRare ? RAINBOW_COLORS : CONFETTI_COLORS;
    const defaults = {
      origin: { y: 0.7 },
      zIndex: 9999,
      colors,
    };

    const fire = (particleRatio: number, opts: confetti.Options) => {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
      });
    };

    // 複数箇所から発射（初速度20-27%アップ）
    fire(0.25, {
      spread: 26,
      startVelocity: 70, // 55→70
      origin: { x: 0.2, y: 0.7 },
    });
    fire(0.2, {
      spread: 60,
      origin: { x: 0.5, y: 0.7 },
    });
    fire(0.35, {
      spread: 100,
      decay: 0.91,
      scalar: 0.8,
      origin: { x: 0.8, y: 0.7 },
    });
    fire(0.1, {
      spread: 120,
      startVelocity: 35, // 25→35
      decay: 0.92,
      scalar: 1.2,
      origin: { x: 0.5, y: 0.6 },
    });
    fire(0.1, {
      spread: 120,
      startVelocity: 55, // 45→55
      origin: { x: 0.5, y: 0.7 },
    });

    // レア時は追加で星形パーティクルを中央から発射
    if (isRare) {
      setTimeout(() => {
        confetti({
          particleCount: 50,
          spread: 360,
          origin: { y: 0.5, x: 0.5 },
          shapes: ['star'],
          colors: RAINBOW_COLORS,
          scalar: 1.5,
          zIndex: 9999,
        });
      }, 200);
    }
  }, []);

  // 報酬発生時に演出
  useEffect(() => {
    if (lastReward) {
      fireConfetti(lastReward.isRare ?? false);

      // レア時は少し長め（2.5秒）、通常は2秒
      const duration = lastReward.isRare ? 2500 : 2000;
      const timer = setTimeout(() => {
        clearReward();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [lastReward, fireConfetti, clearReward]);

  return (
    <AnimatePresence>
      {lastReward && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 1.5, y: -100 }}
          transition={{ duration: 0.5, type: 'spring' }}
          className="fixed inset-0 flex items-center justify-center pointer-events-none z-50"
        >
          <div className="text-center">
            {/* ポイント表示 */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.2, 1] }}
              transition={{ duration: 0.5 }}
              className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-500 to-orange-600 drop-shadow-[0_0_30px_rgba(245,158,11,0.5)]"
            >
              +{lastReward.points.toLocaleString()}
            </motion.div>

            {/* コンボ表示 */}
            {lastReward.combo > 1 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-2 text-2xl font-bold text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]"
              >
                🔥 {lastReward.combo}x COMBO!
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
