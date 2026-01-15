// ===========================================
// SMTD Zustand Store
// 仕様書 v1.2 準拠
// ===========================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Task, GameState, LunaMode, LunaContext, Reward, BlackHoleItem } from '@/types';

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

// ナビゲーターモード: CATS(ルナ) / DOGS(ボス)
type NavigatorMode = 'cats' | 'dogs';

interface TaskStore {
  // タスク
  tasks: Task[];
  addTask: (title: string) => void;      // 控え室に追加
  addTaskWithFocus: (title: string) => void;  // 3つ未満なら即フォーカス
  completeTask: (id: string) => void;
  deleteTask: (id: string) => void;
  focusTask: (id: string) => void;       // 控え室 → 今やること
  unfocusTask: (id: string) => void;     // 今やること → 控え室

  // ゲーム状態
  gameState: GameState;
  checkDateChange: () => void;
  rebirth: () => void;

  // ナビゲーターモード（CATS/DOGS切り替え）
  navigatorMode: NavigatorMode;
  setNavigatorMode: (mode: NavigatorMode) => void;

  // ルナ
  lunaMode: LunaMode;
  lunaContext: LunaContext;
  lunaTaskTitle: string | null;  // コンテキストに関連するタスク名
  currentLine: string;
  setLunaState: (mode: LunaMode, context: LunaContext, line: string) => void;

  // 報酬演出
  lastReward: Reward | null;
  clearReward: () => void;

  // Black Hole（Brain Dump）
  blackHole: BlackHoleItem[];
  addToBlackHole: (content: string) => void;
  archiveBlackHoleItem: (id: string) => void;
  unarchiveBlackHoleItem: (id: string) => void;  // アーカイブ→未整理
  deleteBlackHoleItem: (id: string) => void;
  convertBlackHoleToTask: (id: string) => void;  // BlackHole→控え室タスク
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

      addTaskWithFocus: (title: string) => {
        const { tasks } = get();

        // 3つ未満ならfocusedで追加、3つ以上なら控え室に追加
        const focusedCount = tasks.filter((t) => t.focused && !t.completed).length;
        const shouldFocus = focusedCount < 3;

        const newTask: Task = {
          id: generateId(),
          title: title.trim(),
          completed: false,
          focused: shouldFocus,
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
          lunaTaskTitle: task.title,  // タスク名を保存
          lastReward: { points, combo: newCombo },
        });
      },

      deleteTask: (id: string) => {
        const { tasks } = get();
        const task = tasks.find((t) => t.id === id);

        set({
          tasks: tasks.filter((t) => t.id !== id),
          lunaTaskTitle: task?.title || null,  // タスク名を保存
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
        rebirthCount: 0,
      },

      checkDateChange: () => {
        const { gameState } = get();
        const today = getTodayDate();

        if (gameState.todayDate !== today) {
          // 日付が変わった
          // completedToday, comboをリセット（タスクは維持）
          set({
            gameState: {
              ...gameState,
              completedToday: 0,
              combo: 0,
              todayDate: today,
              lastCompletedAt: undefined,
            },
            // タスクは削除しない（完了タスクも維持）
            lunaMode: 'standard',
            lunaContext: 'ignition',
          });
        }
      },

      rebirth: () => {
        const { gameState, blackHole } = get();

        // Black Holeのアーカイブ済みアイテムのみ保持、未アーカイブは削除
        const archivedBlackHole = blackHole.filter((item) => item.archived);

        set({
          tasks: [],
          gameState: {
            completedToday: 0,
            totalStones: gameState.totalStones,  // 保持
            combo: 0,
            todayDate: getTodayDate(),
            rebirthCount: gameState.rebirthCount + 1,  // インクリメント
            lastCompletedAt: undefined,
          },
          blackHole: archivedBlackHole,
          lunaMode: 'standard',
          lunaContext: 'ignition',
        });
      },

      // ===========================================
      // ナビゲーターモード
      // ===========================================
      navigatorMode: 'cats',

      setNavigatorMode: (mode) => set({ navigatorMode: mode }),

      // ===========================================
      // ルナ
      // ===========================================
      lunaMode: 'standard',
      lunaContext: 'ignition',
      lunaTaskTitle: null,
      currentLine: '',

      setLunaState: (mode, context, line) => {
        set({ lunaMode: mode, lunaContext: context, currentLine: line });
      },

      // ===========================================
      // 報酬演出
      // ===========================================
      lastReward: null,

      clearReward: () => set({ lastReward: null }),

      // ===========================================
      // Black Hole（Brain Dump）
      // ===========================================
      blackHole: [],

      addToBlackHole: (content: string) => {
        const { blackHole } = get();

        const newItem: BlackHoleItem = {
          id: generateId(),
          content: content.trim(),
          createdAt: new Date().toISOString(),
          archived: false,
        };

        set({ blackHole: [...blackHole, newItem] });
      },

      archiveBlackHoleItem: (id: string) => {
        const { blackHole } = get();

        set({
          blackHole: blackHole.map((item) =>
            item.id === id ? { ...item, archived: true } : item
          ),
        });
      },

      deleteBlackHoleItem: (id: string) => {
        const { blackHole } = get();

        set({
          blackHole: blackHole.filter((item) => item.id !== id),
        });
      },

      // アーカイブ解除（アーカイブ→未整理）
      unarchiveBlackHoleItem: (id: string) => {
        const { blackHole } = get();

        set({
          blackHole: blackHole.map((item) =>
            item.id === id ? { ...item, archived: false } : item
          ),
        });
      },

      // BlackHoleアイテムをタスク（控え室）に変換
      convertBlackHoleToTask: (id: string) => {
        const { blackHole, tasks } = get();
        const item = blackHole.find((i) => i.id === id);
        if (!item) return;

        // 新しいタスクを作成（控え室に追加）
        const newTask: Task = {
          id: generateId(),
          title: item.content,
          completed: false,
          focused: false,
          createdAt: new Date().toISOString(),
        };

        set({
          tasks: [...tasks, newTask],
          blackHole: blackHole.filter((i) => i.id !== id),
        });
      },
    }),
    {
      name: 'smtd-storage',
      partialize: (state) => ({
        tasks: state.tasks,
        gameState: state.gameState,
        navigatorMode: state.navigatorMode,
        blackHole: state.blackHole,
      }),
    }
  )
);
