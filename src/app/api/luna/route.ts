// ===========================================
// Luna セリフ生成 API
// POST /api/luna
// 新SDK: @google/genai + thinkingLevel: MINIMAL
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
// - gemini-3-flash-preview + thinkingLevel: MINIMAL で最速
const MODEL_NAME = 'gemini-3-flash-preview';

// キャッシュ（メモリ内、5分間有効）
const lineCache = new Map<string, { line: string; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5分

// プロンプトテンプレート
const SYSTEM_PROMPT = `あなたは「ルナ」というキャラクターです。

【キャラクター設定】
- 20代前半の女性
- 天才肌で生意気、でも実は優しい
- 徳島弁を話す（〜けん、〜じょ、〜やけど、〜しとる、など）
- タスク管理アプリのナビゲーター

【モード】
- standard: 通常時、アンニュイで落ち着いた雰囲気
- entertained: ユーザーが失敗した時、楽しそうに笑う

【セリフのルール】
- 必ず徳島弁で話す
- 40〜60文字程度でしっかり語る（短すぎNG）
- 絵文字は使わない
- 説教しない、責めない
- 自然な口語体で
- 独り言っぽく、ユーザーに語りかける感じ`;

// コンテキスト別の指示
const CONTEXT_PROMPTS: Record<LunaContext, string> = {
  ignition: 'アプリを起動した時の挨拶。「おはよう」「さあ始めよう」的なニュアンスで。',
  success: 'タスクを完了した時の褒め言葉。タスク名が渡されたら、その内容に触れて具体的に褒める。ちょっと上から目線で。',
  failure: 'タスクを削除（サボった）時。タスク名が渡されたら、その内容に触れつつ笑いながら許す。責めない。',
  idle: '何もしていない時。暇そうに話しかける。',
  bond: '深夜や長時間作業の時。労いと優しさ。',
  breakthrough: `先延ばしにしていることを聞いた後の叱咤激励。
【ルール】
- 生意気だけど愛がある態度で
- タスクの内容に合わせた自然な煽り（仕事系、生活系、趣味系など柔軟に）
- 最後に「やるん？やらんの？」的な二択で締める
- 60〜80文字でしっかり語る
【注意】
- 抽象的な名言をそのまま使わない
- タスクの具体的な内容に言及する
- 「寝る」なら「さっさと布団入り」、「掃除」なら「ホコリまみれで平気なん？」みたいに具体的に`,
};

// フォールバック用の静的セリフ
const FALLBACK_LINES: Record<LunaContext, string[]> = {
  ignition: ['おはよ。今日も走るで？', 'エンジン、かかっとるで。'],
  success: ['やるやん。ちょっと見直したわ。', 'ええセンスしとるな。'],
  failure: ['あはは、やめたんか。まあええけど。', 'サボりも休憩のうちやで。'],
  idle: ['暇なんか？', 'なんかせえへんの？'],
  bond: ['こんな時間までおるん？', '無理せんでええんやで。'],
  breakthrough: ['いつやるん？明日？来週？...来んで、そんな日は。やるん？やらんの？', 'また逃げるん？まあ、あんたらしいけど。で、どうするん？'],
};

// 電波が悪い時のメッセージ
const CONNECTION_ERROR_LINES = [
  '...（電波が悪いけん、ちょっと待って）',
  '...（なんか聞こえへんかった）',
  '...（あれ、通信エラーやわ）',
];

function getRandomFromArray<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { mode, context, taskTitle } = body as {
      mode: LunaMode;
      context: LunaContext;
      taskTitle?: string;
    };

    // キャッシュキー生成
    const cacheKey = `${mode}-${context}`;

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

    // 時刻情報
    const now = new Date();
    const hour = now.getHours();
    const timeContext = hour >= 0 && hour < 5 ? '深夜' :
                        hour < 12 ? '午前' :
                        hour < 18 ? '午後' : '夜';

    // ユーザープロンプト組み立て
    let userPrompt = `【状況】
- モード: ${mode}
- コンテキスト: ${context}
- 時間帯: ${timeContext}（${hour}時）`;

    if (taskTitle) {
      userPrompt += `\n- タスク名: ${taskTitle}`;
    }

    userPrompt += `\n\n【指示】\n${CONTEXT_PROMPTS[context]}`;

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

    const text = result.text?.trim() || '';

    // 空の場合はフォールバック
    if (!text) {
      const fallbackLine = getRandomFromArray(FALLBACK_LINES[context] || FALLBACK_LINES.idle);
      return NextResponse.json({ line: fallbackLine, source: 'fallback' });
    }

    // キャッシュに保存
    lineCache.set(cacheKey, { line: text, timestamp: Date.now() });

    return NextResponse.json({ line: text, source: 'gemini' });
  } catch (error) {
    console.error('Gemini API error:', error);
    // 接続エラーの場合は特別なメッセージ
    const errorLine = getRandomFromArray(CONNECTION_ERROR_LINES);
    return NextResponse.json({ line: errorLine, source: 'error' });
  }
}
