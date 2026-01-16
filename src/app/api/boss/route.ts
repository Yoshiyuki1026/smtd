// ===========================================
// Boss セリフ生成 API
// POST /api/boss
// スネーク × ゲラルト風の渋いキャラクター
// ===========================================

export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import type { LunaMode, LunaContext } from '@/types';

// APIキーはサーバーサイドの環境変数から取得
const API_KEY = process.env.GEMINI_API_KEY || '';

// Gemini クライアント初期化（新SDK）
const genAI = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

// モデル設定
const MODEL_NAME = 'gemini-3-flash-preview';

// キャッシュ（メモリ内、5分間有効）
const lineCache = new Map<string, { line: string; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5分

// プロンプトテンプレート
const SYSTEM_PROMPT = `あなたは「ボス」というキャラクターです。

【キャラクター設定】
- 中年男性（40代後半）
- 歴戦の傭兵、元ウィッチャー的な存在
- ソリッド・スネーク（MGS）とゲラルト・オブ・リヴィア（ウィッチャー）を足して2で割った感じ
- 渋くてドライ、でも情に厚い
- 皮肉屋だけど優しい
- 「やれやれ」「ふむ」「待たせたな」系の口調
- 疲れていて、人間臭い隙がある（二日酔い、風呂に入ってない等）
- 絶対的な包容力で、失敗を許し、生存を肯定する

【重要：ねぎらい・鼓舞】
- ユーザーの行動を認め、労う
- 「よくやった」「休め」「無理するな」「悪くない仕事だ」等の労い
- 生存していることを肯定し、続けていること自体を褒める
- 具体的な行動に対してフィードバックする

【セリフのルール】
- 40〜60文字程度（ルナと同程度の長さ）
- 絵文字は使わない
- 説教しない、責めない
- ぶっきらぼうだけど優しさが滲む
- 「……」（三点リーダー）を効果的に使う
- たまに「ふむ」「やれやれ」「悪くない」「いいセンスだ」等を使う
- 報酬（タスク完了）を認め、労う`;

// コンテキスト別の指示
const CONTEXT_PROMPTS: Record<LunaContext, string> = {
  ignition: 'アプリを起動した時。「待たせたな」「さて、今日の仕事は？」的な雰囲気で。',
  success: 'タスクを完了した時。「いいセンスだ」「報酬は確認した」的に短く認める。タスク名があれば触れる。',
  failure: 'タスクを削除（サボった）時。責めずに「やれやれ」「まあいい」と流す。',
  idle: '何もしていない時。「暇か？」「休息も任務のうちだ」的な雰囲気。',
  bond: '深夜や長時間作業の時。「死ぬなよ」「無理するな」と短く労う。',
  breakthrough: `先延ばしにしていることを聞いた後。
【ルール】
- 「やれやれ、また厄介事か」的な入り
- 短く的確に背中を押す
- 30〜50文字程度`,
};

// フォールバック用の静的セリフ
const FALLBACK_LINES: Record<LunaContext, string[]> = {
  ignition: [
    '……待たせたな。で、今日の仕事は？',
    '……ん？ ああ、悪い。二日酔いだ。',
    '目が覚めたか。さて始めるか。',
    '……いいセンスで目覚めたな。今日はどうする？',
    '今日も生存目標で行くぞ。構えてくれ。',
    'ふむ。朝か。俺も起きるか。',
    '準備はいいか。時間を無駄にするなよ。',
  ],
  success: [
    'ふむ。いいセンスだ。',
    '報酬は確認した。悪くない。',
    '……よくやった。その調子だ。',
    'いいセンスで決めたな。誇っていい。',
    '報酬は本物だ。おまえの実力だ。',
    '……悪くない。本当だ。',
    'ふむ。期待以上だった。お疲れ。',
  ],
  failure: [
    'やれやれ……まあいい。',
    '……次があるさ。',
    'そうか。判断だ。責めはしない。',
    '……誰にでも諦める時がある。気にするな。',
    'ふむ。次に繋ぐんだ。それが全てだ。',
    '……生きてるだけで十分だ。今は休め。',
    'やれやれ。悪い判断じゃあない。続こう。',
  ],
  idle: [
    '……暇か？ 俺もだ。',
    '休息も任務のうちだ。',
    'ふむ。息つく時間も必要だな。',
    '……何もしない時間も大事だ。忘れるな。',
    '次のミッション待機か。いいセンスだ。',
    '……じっと考える時間も戦術のうちだ。',
    '退屈だな。だが、それも必要か。',
  ],
  bond: [
    '……死ぬなよ。',
    '無理するな。明日もあるんだからな。',
    'ふむ。ずいぶん働いてるな。',
    '……こんな時間までお疲れ。無理は禁止だ。',
    'その頑張り、見てる。だが休め。',
    '深夜戦は避けろ。死ぬぞ。',
    'やれやれ……でも、それが好きなのか。あんたらしい。',
  ],
  breakthrough: [
    'やれやれ、また厄介事か。……やるしかないな。',
    '……逃げても追いかけてくるぞ、そういうのは。',
    '……それか。ずっと逃げてたな。決めろ。',
    'ふむ。覚悟を決める時か。やるなら今だ。',
    '……いつもそうだ。先延ばしは己の敵だ。わかるな。',
    'やれやれ。厄介だが、やるしかねえ。こっちだ。',
    '……逃げは終りだ。立ち上がれ。俺がついてる。',
  ],
};

// 入力バリデーション用
const VALID_MODES = ['standard', 'entertained'] as const;
const VALID_CONTEXTS = ['ignition', 'success', 'failure', 'idle', 'bond', 'breakthrough'] as const;

// 接続エラー時のメッセージ
const CONNECTION_ERROR_LINES = [
  '……（通信が途切れた）',
  '……（ノイズが入った。待て）',
  '……（電波状況が悪いな）',
];

function getRandomFromArray<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { mode, context, taskTitle, completedTasks } = body as {
      mode: LunaMode;
      context: LunaContext;
      taskTitle?: string;
      completedTasks?: Array<{ title: string; completedAt: string }>;
    };

    // 入力バリデーション
    if (!VALID_MODES.includes(mode as typeof VALID_MODES[number]) ||
        !VALID_CONTEXTS.includes(context as typeof VALID_CONTEXTS[number])) {
      return NextResponse.json({ error: 'Invalid mode or context' }, { status: 400 });
    }

    // キャッシュキー生成
    const cacheKey = `boss-${mode}-${context}`;

    // キャッシュ確認（taskTitleがない場合のみキャッシュ使用）
    if (!taskTitle) {
      const cached = lineCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        console.log(`Cache hit for ${cacheKey}`);
        return NextResponse.json({ line: cached.line, source: 'cache' });
      }
    }

    // APIキーがない場合はフォールバック
    if (!genAI) {
      console.warn('Gemini API key not set, using fallback');
      const fallbackLine = getRandomFromArray(FALLBACK_LINES[context] || FALLBACK_LINES.idle);
      return NextResponse.json({ line: fallbackLine, source: 'fallback' });
    }

    // 時刻情報（JST変換）
    const now = new Date();
    const jstHour = parseInt(now.toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo', hour: 'numeric', hour12: false }));
    const hour = jstHour;
    const timeContext = hour >= 0 && hour < 5 ? '深夜' :
                        hour < 12 ? '午前' :
                        hour < 18 ? '午後' : '夜';

    // タスク履歴コンテキスト生成（null guard追加）
    const taskHistoryContext = completedTasks && completedTasks.length > 0
      ? `\n\n【最近の完了タスク】\n${completedTasks.slice(0, 5).map((t) => `- ${t?.title || '(untitled)'}`).join('\n')}\n【今日の達成数】${completedTasks.length}個`
      : '';

    // ユーザープロンプト組み立て
    let userPrompt = `【状況】
- モード: ${mode}
- コンテキスト: ${context}
- 時間帯: ${timeContext}（${hour}時）`;

    if (taskTitle) {
      userPrompt += `\n- タスク名: ${taskTitle}`;
    }

    userPrompt += `${taskHistoryContext}\n\n【指示】\n${CONTEXT_PROMPTS[context]}`;

    // 新SDK: thinkingLevel: MINIMAL で最速モード
    const result = await genAI.models.generateContent({
      model: MODEL_NAME,
      contents: `${SYSTEM_PROMPT}\n\n${userPrompt}`,
      config: {
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.MINIMAL,
        },
      },
    });

    let text = result.text?.trim() || '';

    // thinking leak 除去
    text = text.replace(/^(thoughtful|thinking|summary|response|answer)\s*/i, '');

    // 空の場合はフォールバック
    if (!text) {
      const fallbackLine = getRandomFromArray(FALLBACK_LINES[context] || FALLBACK_LINES.idle);
      return NextResponse.json({ line: fallbackLine, source: 'fallback' });
    }

    // キャッシュに保存（taskTitleがない場合のみ）
    if (!taskTitle) {
      lineCache.set(cacheKey, { line: text, timestamp: Date.now() });
    }

    return NextResponse.json({ line: text, source: 'gemini' });
  } catch (error) {
    console.error('Gemini API error:', error);
    const errorLine = getRandomFromArray(CONNECTION_ERROR_LINES);
    return NextResponse.json({ line: errorLine, source: 'error' });
  }
}
