'use client';

// ===========================================
// GoalCounter - ゴールカウンター
// ジョブズ版: 「●●○ あと1つ」形式
// ヘッダー統合用にシンプル化
// ===========================================

import { motion } from 'framer-motion';
import { useTaskStore } from '@/stores/taskStore';

const DAILY_GOAL = 3;

export function GoalCounter() {
  const { gameState } = useTaskStore();
  const { completedToday } = gameState;

  // 3完了でゴール達成
  const remaining = Math.max(0, DAILY_GOAL - completedToday);
  const isGoalAchieved = completedToday >= DAILY_GOAL;

  // ●○表示を生成
  const dots = Array.from({ length: DAILY_GOAL }, (_, i) => (
    <span
      key={i}
      className={i < completedToday ? 'text-amber-400' : 'text-zinc-600'}
    >
      {i < completedToday ? '●' : '○'}
    </span>
  ));

  return (
    <div className="flex items-center justify-center gap-3">
      {/* ●●○ ドット表示 */}
      <div className="flex gap-1 text-lg tracking-wider">
        {dots}
      </div>

      {/* ステータステキスト */}
      {isGoalAchieved ? (
        <motion.span
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          className="text-sm font-bold text-amber-400"
        >
          ⚡ 達成！
        </motion.span>
      ) : (
        <span className="text-sm text-zinc-400">
          あと<span className="text-amber-400 font-bold mx-1">{remaining}</span>つ
        </span>
      )}
    </div>
  );
}
