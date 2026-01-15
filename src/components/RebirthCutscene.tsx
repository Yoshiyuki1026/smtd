'use client';

// ===========================================
// RebirthCutscene - 転生演出
// 星が流れる、キラキラパーティクル、フェードイン/アウト
// ===========================================

import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

interface RebirthCutsceneProps {
  isOpen: boolean;
  onClose: () => void;
  rebirthCount: number;
}

export function RebirthCutscene({ isOpen, onClose, rebirthCount }: RebirthCutsceneProps) {
  const [showText, setShowText] = useState(false);
  const isOpenRef = useRef(isOpen);

  // 星のパーティクル効果
  const fireStarConfetti = useCallback(() => {
    const count = 150;
    const defaults = {
      origin: { y: 0.5 },
      zIndex: 9999,
      colors: [
        '#60a5fa', // blue-400
        '#a78bfa', // violet-400
        '#c084fc', // purple-400
        '#fbbf24', // amber-400
        '#fca5a5', // rose-300
      ],
    };

    // 左から右へ流れる
    const fire = (particleRatio: number, opts: confetti.Options) => {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
      });
    };

    // 複数箇所から発射
    fire(0.3, {
      spread: 180,
      startVelocity: 50,
      origin: { x: 0, y: 0.5 },
    });
    fire(0.3, {
      spread: 180,
      startVelocity: 50,
      origin: { x: 1, y: 0.5 },
    });
    fire(0.4, {
      spread: 180,
      startVelocity: 60,
      origin: { x: 0.5, y: 0 },
    });
  }, []);

  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      // カットシーンが閉じたらshowTextをリセット
      setShowText(false);
      return;
    }

    // 星の演出開始
    fireStarConfetti();

    // 1秒後にテキスト表示
    const textTimer = setTimeout(() => {
      if (isOpenRef.current) {
        setShowText(true);
      }
    }, 500);

    // 3秒後に自動で閉じる
    const closeTimer = setTimeout(() => {
      onClose();
    }, 3000);

    return () => {
      clearTimeout(textTimer);
      clearTimeout(closeTimer);
    };
  }, [isOpen, onClose, fireStarConfetti]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[9998] bg-black/80 backdrop-blur-sm flex items-center justify-center"
        >
          <div className="text-center space-y-4">
            {/* メインテキスト */}
            <AnimatePresence>
              {showText && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 1.5, y: -50 }}
                  transition={{
                    duration: 0.8,
                    type: 'spring',
                    stiffness: 100,
                  }}
                  className="space-y-4"
                >
                  <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-purple-400 to-pink-400 drop-shadow-[0_0_40px_rgba(168,85,247,0.5)]">
                    転 生
                  </h1>

                  {/* サブテキスト */}
                  <p className="text-lg text-zinc-300 font-medium tracking-wide">
                    0になるだけでマイナスじゃない
                  </p>

                  {/* 転生回数 */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-sm text-purple-400 font-semibold pt-4"
                  >
                    第 {rebirthCount} 周目
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
