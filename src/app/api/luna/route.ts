// ===========================================
// Luna セリフ生成 API
// POST /api/luna
// ===========================================

import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { LunaMode, LunaContext } from '@/types';

// APIキーはサーバーサイドの環境変数から取得
const API_KEY = process.env.GEMINI_API_KEY || '';

// Gemini クライアント初期化
const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

// モデル設定
const MODEL_NAME = 'gemini-2.0-flash';

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
- 1〜2文で簡潔に
- 絵文字は使わない
- 説教しない、責めない
- 自然な口語体で`;

// コンテキスト別の指示
const CONTEXT_PROMPTS: Record<LunaContext, string> = {
  ignition: 'アプリを起動した時の挨拶。「おはよう」「さあ始めよう」的なニュアンスで。',
  success: 'タスクを完了した時の褒め言葉。素直に褒めるが、ちょっと上から目線で。',
  failure: 'タスクを削除（サボった）時。笑いながら許す感じで。責めない。',
  idle: '何もしていない時。暇そうに話しかける。',
  bond: '深夜や長時間作業の時。労いと優しさ。',
};

// フォールバック用の静的セリフ
const FALLBACK_LINES: Record<LunaContext, string[]> = {
  ignition: ['おはよ。今日も走るで？', 'エンジン、かかっとるで。'],
  success: ['やるやん。ちょっと見直したわ。', 'ええセンスしとるな。'],
  failure: ['あはは、やめたんか。まあええけど。', 'サボりも休憩のうちやで。'],
  idle: ['暇なんか？', 'なんかせえへんの？'],
  bond: ['こんな時間までおるん？', '無理せんでええんやで。'],
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

    // APIキーがない場合はフォールバック
    if (!genAI) {
      console.warn('Gemini API key not set, using fallback');
      const fallbackLine = getRandomFromArray(FALLBACK_LINES[context] || FALLBACK_LINES.idle);
      return NextResponse.json({ line: fallbackLine, source: 'fallback' });
    }

    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

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

    const result = await model.generateContent([
      { text: SYSTEM_PROMPT },
      { text: userPrompt },
    ]);

    const response = result.response;
    const text = response.text().trim();

    // 空の場合はフォールバック
    if (!text) {
      const fallbackLine = getRandomFromArray(FALLBACK_LINES[context] || FALLBACK_LINES.idle);
      return NextResponse.json({ line: fallbackLine, source: 'fallback' });
    }

    return NextResponse.json({ line: text, source: 'gemini' });
  } catch (error) {
    console.error('Gemini API error:', error);
    // 接続エラーの場合は特別なメッセージ
    const errorLine = getRandomFromArray(CONNECTION_ERROR_LINES);
    return NextResponse.json({ line: errorLine, source: 'error' });
  }
}
