# CLAUDE.md - すたどら開発ガイド

## プロジェクト概要

**すたどら（SMTD: Supermassive Task Drive）**

> 「8勝7敗で、生き残れ。」

ADHDの脳に最適化されたドーパミン駆動タスク管理アプリ。
タスクを「消す」のではなく「積み上げる」。完璧主義を否定し、55%で勝ち越しを肯定する。

**詳細企画書**: `../his-dev/ideas/supermassive-task-drive/企画書_v1.2.md`

---

## 技術スタック

| レイヤー | 選定 |
|----------|------|
| Framework | Next.js 16 (App Router) |
| UI | Tailwind CSS |
| State | Zustand |
| Animation | Framer Motion |
| Physics | matter.js |
| Confetti | canvas-confetti |
| Sound | use-sound |
| Data (Phase 1) | localStorage / IndexedDB |
| Data (Phase 2+) | Supabase |
| Deploy | Vercel |

---

## Phase 1 スコープ（幕下）

### 作るもの
1. **Today's Mission画面**（タスク3つ制限）
2. **インフレ演出**（+1000pt弾け飛び、コンボ倍率）
3. **物理演算ダイヤ**（完了タスクが石として蓄積）
4. **勝ち越しカウンター**（「あと1勝で勝ち越し！」）
5. **キャラクターセリフ**（テキストのみ、ボス/ルナ）

### 作らないもの（Phase 2以降）
- 認証
- Supabase連携
- Black Hole（Brain Dump）
- 転生システム

---

## 機能仕様

### タスク
- 最大3つまで登録可能
- 1タスク完了 = 1勝
- 完了時に派手な演出（紙吹雪、効果音、ポイント弾け飛び）
- 完了タスクは「ダイヤの原石」として画面下部に蓄積

### キャラクター（Phase 1はテキストのみ）

**DOGSモード（ボス）**:
- 心理的安全性、失敗を許す
- セリフ例: 「いいセンスだ。」「休息も任務のうちだ。」

**CATSモード（ルナ）**:
- 美的動機づけ、スマートさを要求
- セリフ例: 「やるじゃん。」「ダサい負け方はしないでよね。」

---

## デザイントーン

- **基本**: ダークモード必須（黒背景でStarlightが映える）
- **DOGSモード**: オリーブドラブ、錆びた鉄、アナログ計器
- **CATSモード**: ネオンパープル、ホログラム、デジタル表示

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

---

## 開発コマンド

```bash
npm run dev    # 開発サーバー起動
npm run build  # ビルド
npm run lint   # ESLint
```

---

## 思想（忘れるな）

> 「お前の脳は壊れてない。ツールが壊れてるんだ。」

- 完璧主義を捨てろ。8勝7敗で十分。
- タスクは「消える借金」ではなく「積み上がる資産」。
- 飽きたら転生。0になるだけでマイナスじゃない。
- ドーパミンしか勝たん。
