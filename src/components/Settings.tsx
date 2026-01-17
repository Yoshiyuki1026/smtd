'use client';

// ===========================================
// Settings - 設定画面
// 転生ボタン、現在の転生回数、総資産表示
// ===========================================

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTaskStore } from '@/stores/taskStore';
import { RebirthCutscene } from './RebirthCutscene';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Settings({ isOpen, onClose }: SettingsProps) {
  const { gameState, rebirth, rewardHistory } = useTaskStore();
  const [showRebirthConfirm, setShowRebirthConfirm] = useState(false);
  const [showRebirthCutscene, setShowRebirthCutscene] = useState(false);

  const handleRebirthConfirm = () => {
    setShowRebirthConfirm(false);
    setShowRebirthCutscene(true);
    // rebirth()は演出後に実行
  };

  const handleCutsceneClose = () => {
    setShowRebirthCutscene(false);
    rebirth();
    onClose();
  };

  return (
    <>
      {/* 設定モーダル */}
      <AnimatePresence>
        {isOpen && !showRebirthCutscene && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center"
            onClick={onClose}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-zinc-900 rounded-2xl border border-zinc-700 p-6 max-w-sm w-full mx-4 space-y-6"
            >
              {/* ヘッダー */}
              <div>
                <h2 className="text-2xl font-bold text-zinc-100">設定</h2>
              </div>

              {/* 総資産ハイライト */}
              <div className="bg-zinc-800/50 rounded-lg p-4">
                <div className="text-center mb-4">
                  <span className="text-4xl font-bold text-amber-400">
                    {gameState.totalStones.toLocaleString()}
                  </span>
                  <p className="text-sm text-zinc-500 mt-1">Total Diamonds 💎</p>
                </div>

                {/* 転生回数 */}
                <div className="flex items-center justify-between py-2 border-t border-zinc-700">
                  <span className="text-zinc-400 text-sm">転生回数</span>
                  <span className="text-lg font-bold text-purple-400">
                    第 {gameState.rebirthCount ?? 0} 周目
                  </span>
                </div>
              </div>

              {/* 直近の報酬履歴 */}
              {rewardHistory.length > 0 && (
                <div className="bg-zinc-800/50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-zinc-400 mb-3">📊 最近の達成</h3>
                  <div className="space-y-2">
                    {rewardHistory.slice(0, 5).map((item, i) => (
                      <div key={i} className="flex justify-between items-center text-sm">
                        <span className="text-zinc-300 truncate max-w-[60%]">
                          {item.taskTitle}
                        </span>
                        <span className="text-amber-400 font-medium">
                          +{item.points.toLocaleString()}
                          {item.combo > 1 && (
                            <span className="text-xs text-orange-400 ml-1">
                              ×{item.combo}
                            </span>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 転生ボタン */}
              <button
                onClick={() => setShowRebirthConfirm(true)}
                className="w-full px-4 py-3 rounded-lg bg-red-600/20 border border-red-600/40 text-red-400 font-semibold hover:bg-red-600/30 hover:border-red-600/60 transition-colors"
              >
                🔄 転生する
              </button>

              {/* クローズボタン */}
              <button
                onClick={onClose}
                className="w-full px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300 font-medium hover:bg-zinc-700 transition-colors"
              >
                キャンセル
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 転生確認ダイアログ */}
      <AnimatePresence>
        {showRebirthConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[51] bg-black/80 backdrop-blur-sm flex items-center justify-center"
            onClick={() => setShowRebirthConfirm(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-zinc-900 rounded-xl border border-red-600/40 p-6 max-w-sm w-full mx-4 space-y-4"
            >
              <h3 className="text-xl font-bold text-zinc-100">本当に転生しますか？</h3>

              <div className="text-sm text-zinc-400 space-y-2">
                <div>
                  以下の内容が
                  <span className="text-red-400 font-semibold">リセット</span>
                  されます：
                </div>
                <ul className="list-disc list-inside text-zinc-500 space-y-1 ml-2">
                  <li>全タスク（控え室・今やること・完了済み）</li>
                  <li>今日の完了数</li>
                  <li>コンボ</li>
                </ul>
              </div>

              <div className="text-sm text-zinc-400 space-y-2">
                <div>
                  以下の内容は
                  <span className="text-amber-400 font-semibold">保持</span>
                  されます：
                </div>
                <ul className="list-disc list-inside text-zinc-500 space-y-1 ml-2">
                  <li>総資産（ダイヤ）</li>
                  <li>転生回数（+1）</li>
                  <li>Black Hole アーカイブ</li>
                </ul>
              </div>

              {/* ボタン */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowRebirthConfirm(false)}
                  className="flex-1 px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300 font-medium hover:bg-zinc-700 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleRebirthConfirm}
                  className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white font-bold hover:bg-red-700 transition-colors"
                >
                  転生する
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 転生カットシーン */}
      <RebirthCutscene
        isOpen={showRebirthCutscene}
        onClose={handleCutsceneClose}
        rebirthCount={gameState.rebirthCount + 1}
      />
    </>
  );
}
