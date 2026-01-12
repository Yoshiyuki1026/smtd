'use client';

// ===========================================
// GoalCounter - ゴールカウンター
// 仕様書 v1.2 準拠
// 3完了で今日のゴール達成
// ===========================================

import { motion } from 'framer-motion';
import { useTaskStore } from '@/stores/taskStore';

const DAILY_GOAL = 3;

export function GoalCounter() {
  const { gameState } = useTaskStore();
  const { completedToday, totalStones } = gameState;

  // 3完了でゴール達成
  const remaining = Math.max(0, DAILY_GOAL - completedToday);
  const isGoalAchieved = completedToday >= DAILY_GOAL;

  return (
    <div className="flex flex-col items-center gap-2 rounded-xl bg-zinc-800/50 border border-zinc-700/50 p-4">
      {/* ゴールカウンター */}
      <div className="text-center">
        {isGoalAchieved ? (
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="text-2xl font-bold text-yellow-400"
          >
            🏆 今日のゴール達成！
          </motion.div>
        ) : (
          <div className="text-xl font-medium text-zinc-300">
            あと{' '}
            <span className="text-3xl font-bold text-purple-400">
              {remaining}
            </span>{' '}
            つでゴール！
          </div>
        )}
      </div>

      {/* 完了数・資産表示 */}
      <div className="flex items-center gap-4 text-sm text-zinc-500">
        <span>
          今日:{' '}
          <span className="text-green-400 font-medium">{completedToday}完了</span>
        </span>
        <span className="text-zinc-600">|</span>
        <span>
          総資産:{' '}
          <span className="text-purple-400 font-medium">
            {totalStones.toLocaleString()}石
          </span>
        </span>
      </div>
    </div>
  );
}
