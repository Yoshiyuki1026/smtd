// ===========================================
// Slack通知 API（Vercel Cron用）
// GET /api/slack/notify?context=morning|midday|evening
// ルナからの定時リマインドをSlackに送信
// ===========================================

import { NextResponse } from 'next/server';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import type { SlackContext } from '@/types';

// 環境変数
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN || '';
const SLACK_CHANNEL = process.env.SLACK_CHANNEL || '#claude-code';
const CRON_SECRET = process.env.CRON_SECRET || '';

// Gemini クライアント
const genAI = GEMINI_API_KEY ? new GoogleGenAI({ apiKey: GEMINI_API_KEY }) : null;
const MODEL_NAME = 'gemini-3-flash-preview';

// ルナのシステムプロンプト
const SYSTEM_PROMPT = `あなたは「ルナ」というキャラクターです。

【キャラクター設定】
- 20代前半の女性
- 天才肌で生意気、でも実は優しい
- 徳島弁を話す（〜けん、〜じょ、〜やけど、〜しとる、など）
- タスク管理アプリ「すたどら」のナビゲーター

【Slack通知のルール】
- 必ず徳島弁で話す
- 40〜60文字程度でしっかり語る
- 絵文字は使わない
- 説教しない、責めない
- ユーザーに語りかける感じで
- アプリを開きたくなるような言い方`;

// コンテキスト別の指示
const SLACK_CONTEXT_PROMPTS: Record<SlackContext, string> = {
  morning: '朝の挨拶。今日のタスクを3つ決めるよう促す。「今日何やる？」「3つ決めたら勝ちやで」的なニュアンスで。',
  midday: '昼の声かけ。午前中の調子を聞きつつ、午後に向けて促す。「午後もいくで」的な。',
  evening: '夜の労い。今日の振り返りを促す。「おつかれ」「石、増えとるかもよ」的なニュアンスで。',
};

// フォールバックセリフ
const FALLBACK_LINES: Record<SlackContext, string[]> = {
  morning: [
    'おはよ。今日は何する？3つ決めたら勝ちやで。',
    '……起きとる？すたどら待っとるけん。',
    '新しい日やな。昨日のことは忘れ。今日、何やる？',
  ],
  midday: [
    '午前中どうやった？午後もいくで。',
    '昼やな。ちゃんと動けとる？',
    'もう半分終わったで。残り、何する？',
  ],
  evening: [
    '今日はどうやった？おつかれさん。',
    '寝る前にすたどら開いてみ。石、増えとるかもよ。',
    '夜やな。今日頑張った分、ちゃんと石になっとるで。',
  ],
};

function getRandomFromArray<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Slack送信（Bot Token + chat.postMessage API）
async function sendToSlack(message: string): Promise<boolean> {
  if (!SLACK_BOT_TOKEN) {
    console.warn('SLACK_BOT_TOKEN not set');
    return false;
  }

  try {
    const response = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SLACK_BOT_TOKEN}`,
      },
      body: JSON.stringify({
        channel: SLACK_CHANNEL,
        text: `◈ ${message}`,
        username: 'ルナ',
        icon_emoji: ':sparkles:',
      }),
    });
    const data = await response.json();
    if (!data.ok) {
      console.error('Slack API error:', data.error);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Slack send error:', error);
    return false;
  }
}

export async function GET(request: Request) {
  try {
    // 認証チェック（Vercel Cronは Authorization: Bearer <CRON_SECRET> を送信）
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    // ローカル開発用: CRON_SECRETが空の場合は認証スキップ
    if (CRON_SECRET && token !== CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // コンテキスト取得
    const { searchParams } = new URL(request.url);
    const context = searchParams.get('context') as SlackContext;

    if (!context || !['morning', 'midday', 'evening'].includes(context)) {
      return NextResponse.json({ error: 'Invalid context' }, { status: 400 });
    }

    // セリフ生成
    let line: string;
    let source: 'gemini' | 'fallback' = 'fallback';

    if (genAI) {
      try {
        const result = await genAI.models.generateContent({
          model: MODEL_NAME,
          contents: `${SYSTEM_PROMPT}\n\n【指示】\n${SLACK_CONTEXT_PROMPTS[context]}`,
          config: {
            thinkingConfig: {
              thinkingLevel: ThinkingLevel.MINIMAL,
            },
          },
        });

        const text = result.text?.trim();
        if (text) {
          line = text;
          source = 'gemini';
        } else {
          line = getRandomFromArray(FALLBACK_LINES[context]);
        }
      } catch (error) {
        console.error('Gemini API error:', error);
        line = getRandomFromArray(FALLBACK_LINES[context]);
      }
    } else {
      line = getRandomFromArray(FALLBACK_LINES[context]);
    }

    // Slack送信
    const sent = await sendToSlack(line);

    return NextResponse.json({
      success: sent,
      line,
      source,
      context,
    });
  } catch (error) {
    console.error('Slack notify error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
