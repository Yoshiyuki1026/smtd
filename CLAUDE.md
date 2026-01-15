# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

**すたどら（SMTD: Supermassive Task Drive）**

> 「8勝7敗で、生き残れ。」

ADHDの脳に最適化されたドーパミン駆動タスク管理アプリ。
タスクを「消す」のではなく「積み上げる」。完璧主義を否定し、55%で勝ち越しを肯定する。

**詳細企画書**: `../his-dev/ideas/supermassive-task-drive/企画書_v1.7.md`

---

## 開発コマンド

```bash
npm run dev    # 開発サーバー起動 (localhost:3000)
npm run build  # プロダクションビルド
npm run lint   # ESLint実行
```

---

## デプロイ

**Cloudflare Pages** + GitHub Actions 自動デプロイ。

- mainブランチへのマージで自動デプロイ
- 手動: `npm run pages:deploy`

---

## 技術スタック

| レイヤー | 選定 |
|----------|------|
| Framework | Next.js 15.5.2 (App Router) |
| UI | Tailwind CSS v4 |
| State | Zustand |
| Animation | Framer Motion |
| Physics | matter.js |
| Confetti | canvas-confetti |
| Sound | use-sound |
| Data (Phase 1) | localStorage / IndexedDB |
| Data (Phase 2+) | Supabase |
| Deploy | Cloudflare Pages |

---

## Phase 1 スコープ（幕下）

### 作るもの
1. **Today's Mission画面**（タスク3つ制限）
2. **インフレ演出**（+1000pt弾け飛び、コンボ倍率）
3. **物理演算ダイヤ**（完了タスクが石として蓄積）
4. **勝ち越しカウンター**（「あと1勝で勝ち越し！」）
5. **キャラクターセリフ**（テキストのみ、ボス/ルナ）

### 作らないもの（Phase 2以降）
- 認証 / Supabase連携
- Black Hole（Brain Dump）
- 転生システム

---

## キャラクター設定（Two Command Centers）

### 🐺 DOGSモード（ボス / Boss）

> **「生存こそが正義」**

| 項目 | 内容 |
|------|------|
| **属性** | 歴戦の傭兵、哀愁、人間臭い隙（二日酔い）、絶対的包容力 |
| **脳内CV** | 大塚明夫（『MGS』スネーク） |
| **役割** | 心理的安全性。失敗を許し、生存を肯定する |
| **デザイン** | オリーブドラブ、錆びた鉄、アナログ計器 |

**セリフ例**:
- 「……ん？ ああ、悪い。二日酔いだ。……で、今日の仕事は？」
- 「いいセンスだ。」
- 「休息も任務のうちだ。……死ぬなよ。」

### 🐾 CATSモード（ルナ / Luna）

> **「センスを見せなよ」**

| 項目 | 内容 |
|------|------|
| **属性** | 天才肌の若者、生意気、新しいもの好き、実力主義 |
| **脳内CV** | 早見沙織（『鬼滅』しのぶ / 透明感のあるSっ気） |
| **役割** | 美的動機づけ。古いやり方を笑い、スマートさを要求する |
| **デザイン** | ネオンパープル、ホログラム、デジタル表示 |

**セリフ例**:
- 「ねえ、まだ寝てるの？ 私はもう準備できてるんだけど。」
- 「へえ、やるじゃん。ちょっと見直したかも。」
- 「サボるのはいいけどさ、ダサい負け方はしないでよね。」

---

## 機能仕様

### タスク
- 最大3つまで登録可能（ワーキングメモリ保護）
- 1タスク完了 = 1勝
- 完了時演出：紙吹雪 + 効果音 + ポイント弾け飛び
- 完了タスクは「ダイヤの原石」として画面下部に蓄積

### 報酬系エンジン

| 要素 | 内容 |
|------|------|
| **インフレ演出** | +1000pt弾け飛び、コンボで倍率アップ |
| **視覚** | 紙吹雪（canvas-confetti）、アニメーション |
| **聴覚** | 達成音（use-sound） |
| **触覚** | バイブレーション |
| **物理演算** | 完了タスク（石）が転がる（matter.js） |

---

## ディレクトリ構成（推奨）

```
src/
├── app/
│   ├── page.tsx          # メイン画面（Today's Mission）
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── TaskCard.tsx      # タスクカード
│   ├── WinCounter.tsx    # 勝ち越しカウンター
│   ├── DiamondPile.tsx   # 物理演算ダイヤ
│   ├── RewardEffect.tsx  # 報酬演出（紙吹雪、ポイント）
│   └── Navigator.tsx     # キャラクターセリフ
├── stores/
│   └── taskStore.ts      # Zustand store
├── hooks/
│   └── useLocalStorage.ts
├── lib/
│   └── sounds.ts         # 効果音
└── types/
    └── task.ts           # 型定義
```

---

## コーディング規約

1. **TypeScript必須**: 型定義をしっかり
2. **コンポーネント分離**: 1ファイル1責務
3. **Tailwind優先**: CSS-in-JSより先にTailwindで試す
4. **派手な演出を恐れるな**: ドーパミンが出るかどうかが判断基準
5. **ダークモード必須**: 黒背景でStarlightが映える

---

## PRフロー（必須）

機能追加・バグ修正後は必ず以下のフローを実行：

1. `/preq` - PR作成
2. `/check-pr` - CodeRabbit/Qodo/Codexのレビュー確認
3. レビュー指摘を修正
4. マージ → 自動デプロイ

**こまめにPR出してレビュー受ける**ことで品質を担保。

---

## コア哲学（忘れるな）

> 「お前の脳は壊れてない。ツールが壊れてるんだ。」

- 完璧主義を捨てろ。8勝7敗で十分。
- タスクは「消える借金」ではなく「積み上がる資産」。
- 飽きたら転生。0になるだけでマイナスじゃない。
- ドーパミンしか勝たん。
