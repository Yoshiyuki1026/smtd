'use client';

// ===========================================
// RewardEffect - 報酬演出
// 仕様書 v1.1 準拠
// 紙吹雪 + ポイント弾け飛び + コンボ
// ===========================================

import { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { useTaskStore } from '@/stores/taskStore';

export function RewardEffect() {
  const { lastReward, clearReward } = useTaskStore();

  // 紙吹雪を発射
  const fireConfetti = useCallback(() => {
    const count = 200;
    const defaults = {
      origin: { y: 0.7 },
      zIndex: 9999,
    };

    const fire = (particleRatio: number, opts: confetti.Options) => {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
      });
    };

    // 複数箇所から発射
    fire(0.25, {
      spread: 26,
      startVelocity: 55,
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
      startVelocity: 25,
      decay: 0.92,
      scalar: 1.2,
      origin: { x: 0.5, y: 0.6 },
    });
    fire(0.1, {
      spread: 120,
      startVelocity: 45,
      origin: { x: 0.5, y: 0.7 },
    });
  }, []);

  // 報酬発生時に演出
  useEffect(() => {
    if (lastReward) {
      fireConfetti();

      // 2秒後にクリア
      const timer = setTimeout(() => {
        clearReward();
      }, 2000);

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
              className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500"
            >
              +{lastReward.points.toLocaleString()}
            </motion.div>

            {/* コンボ表示 */}
            {lastReward.combo > 1 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-2 text-2xl font-bold text-orange-400"
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
