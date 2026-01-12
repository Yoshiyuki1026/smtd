// ===========================================
// SMTD Zustand Store
// 仕様書 v1.2 準拠
// ===========================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Task, GameState, LunaMode, LunaContext, Reward } from '@/types';

// ユニークID生成
const generateId = () => Math.random().toString(36).substring(2, 9);

// 今日の日付（YYYY-MM-DD）
const getTodayDate = () => new Date().toISOString().split('T')[0];

// コンボ判定（5分以内なら継続）
const isComboActive = (lastCompletedAt?: string) => {
  if (!lastCompletedAt) return false;
  const diff = Date.now() - new Date(lastCompletedAt).getTime();
  return diff < 5 * 60 * 1000; // 5分
};

interface TaskStore {
  // タスク
  tasks: Task[];
  addTask: (title: string) => void;      // 控え室に追加
  completeTask: (id: string) => void;
  deleteTask: (id: string) => void;
  focusTask: (id: string) => void;       // 控え室 → 今やること
  unfocusTask: (id: string) => void;     // 今やること → 控え室

  // ゲーム状態
  gameState: GameState;
  checkDateChange: () => void;

  // ルナ
  lunaMode: LunaMode;
  lunaContext: LunaContext;
  currentLine: string;
  setLunaState: (mode: LunaMode, context: LunaContext, line: string) => void;

  // 報酬演出
  lastReward: Reward | null;
  clearReward: () => void;
}

export const useTaskStore = create<TaskStore>()(
  persist(
    (set, get) => ({
      // ===========================================
      // タスク
      // ===========================================
      tasks: [],

      addTask: (title: string) => {
        const { tasks } = get();

        // 無制限に控え室に追加
        const newTask: Task = {
          id: generateId(),
          title: title.trim(),
          completed: false,
          focused: false,  // 控え室に追加
          createdAt: new Date().toISOString(),
        };

        set({ tasks: [...tasks, newTask] });
      },

      focusTask: (id: string) => {
        const { tasks } = get();
        const focusedCount = tasks.filter((t) => t.focused && !t.completed).length;

        // 3つ以上はフォーカスできない
        if (focusedCount >= 3) return;

        set({
          tasks: tasks.map((t) =>
            t.id === id ? { ...t, focused: true } : t
          ),
        });
      },

      unfocusTask: (id: string) => {
        const { tasks } = get();

        set({
          tasks: tasks.map((t) =>
            t.id === id ? { ...t, focused: false } : t
          ),
        });
      },

      completeTask: (id: string) => {
        const { tasks, gameState } = get();
        const task = tasks.find((t) => t.id === id);
        if (!task || task.completed) return;

        // コンボ計算
        const comboActive = isComboActive(gameState.lastCompletedAt);
        const newCombo = comboActive ? Math.min(gameState.combo + 1, 10) : 1;

        // ポイント計算（基本1000pt × コンボ倍率）
        const points = 1000 * newCombo;

        // タスク更新（完了時にfocusedも解除）
        const updatedTasks = tasks.map((t) =>
          t.id === id
            ? { ...t, completed: true, focused: false, completedAt: new Date().toISOString() }
            : t
        );

        set({
          tasks: updatedTasks,
          gameState: {
            ...gameState,
            completedToday: gameState.completedToday + 1,
            totalStones: gameState.totalStones + 1,
            combo: newCombo,
            lastCompletedAt: new Date().toISOString(),
          },
          lunaMode: 'standard',
          lunaContext: 'success',
          lastReward: { points, combo: newCombo },
        });
      },

      deleteTask: (id: string) => {
        const { tasks } = get();

        set({
          tasks: tasks.filter((t) => t.id !== id),
          lunaMode: 'entertained',
          lunaContext: 'failure',
        });
      },

      // ===========================================
      // ゲーム状態
      // ===========================================
      gameState: {
        completedToday: 0,
        totalStones: 0,
        combo: 0,
        todayDate: getTodayDate(),
      },

      checkDateChange: () => {
        const { gameState, tasks } = get();
        const today = getTodayDate();

        if (gameState.todayDate !== today) {
          // 日付が変わった
          // completedToday, comboをリセット、完了済みタスクを削除
          set({
            gameState: {
              ...gameState,
              completedToday: 0,
              combo: 0,
              todayDate: today,
              lastCompletedAt: undefined,
            },
            tasks: tasks.filter((t) => !t.completed),
            lunaMode: 'standard',
            lunaContext: 'ignition',
          });
        }
      },

      // ===========================================
      // ルナ
      // ===========================================
      lunaMode: 'standard',
      lunaContext: 'ignition',
      currentLine: '',

      setLunaState: (mode, context, line) => {
        set({ lunaMode: mode, lunaContext: context, currentLine: line });
      },

      // ===========================================
      // 報酬演出
      // ===========================================
      lastReward: null,

      clearReward: () => set({ lastReward: null }),
    }),
    {
      name: 'smtd-storage',
      partialize: (state) => ({
        tasks: state.tasks,
        gameState: state.gameState,
      }),
    }
  )
);
