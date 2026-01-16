// ===========================================
// SMTD 型定義
// 仕様書 v1.1 準拠
// ===========================================

/**
 * タスク
 */
export interface Task {
  id: string;
  title: string;
  completed: boolean;
  focused: boolean;     // 今やることに表示するか
  createdAt: string;    // ISO8601
  completedAt?: string; // ISO8601
}

/**
 * ゲーム状態
 */
export interface GameState {
  completedToday: number;    // 今日の完了数（ゴール判定用）
  totalStones: number;       // 総資産（累計タスク完了数）
  combo: number;             // 現在のコンボ数
  lastCompletedAt?: string;  // 最後にタスク完了した日時
  todayDate: string;         // 今日の日付（YYYY-MM-DD）
  rebirthCount: number;      // 転生回数
}

/**
 * ルナのモード
 * - standard: 通常時、成功時（アンニュイ）
 * - entertained: 失敗時、長時間放置時（爆笑）
 */
export type LunaMode = 'standard' | 'entertained';

/**
 * ルナのコンテキスト（セリフカテゴリ）
 * - ignition: エンジン始動（アプリ起動時）
 * - success: タスク完了時
 * - failure: タスク削除時
 * - idle: 待機中
 * - bond: 連星の絆（深夜帯、長時間放置）
 * - breakthrough: 先延ばしブレイクスルー（叱咤激励）
 */
export type LunaContext = 'ignition' | 'success' | 'failure' | 'idle' | 'bond' | 'breakthrough';

/**
 * ルナの状態
 */
export interface LunaState {
  mode: LunaMode;
  context: LunaContext;
  currentLine: string;
}

/**
 * 報酬演出データ
 */
export interface Reward {
  points: number;
  combo: number;
}

/**
 * 報酬履歴アイテム
 */
export interface RewardHistoryItem {
  points: number;
  combo: number;
  taskTitle: string;
  completedAt: string;  // ISO8601
}

/**
 * Slack通知のコンテキスト
 * - morning: 朝9時（今日のスタート）
 * - midday: 昼12時（午後に向けて）
 * - evening: 夜21時（振り返り）
 */
export type SlackContext = 'morning' | 'midday' | 'evening';

/**
 * Black Holeアイテム（Brain Dump）
 * 思いついたことを投げ込み、アーカイブまたは廃棄する
 */
export interface BlackHoleItem {
  id: string;
  content: string;
  createdAt: string;    // ISO8601
  archived: boolean;    // true=アーカイブ済み
}
