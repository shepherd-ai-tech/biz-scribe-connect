import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { text } = await req.json();
    
    if (!text) {
      throw new Error('文字起こしテキストが提供されていません');
    }

    console.log('要約生成を開始します');

    // AI APIキーを取得（AI_API_KEYがなければLOVABLE_API_KEYをフォールバック）
    const AI_API_KEY = Deno.env.get('AI_API_KEY') || Deno.env.get('LOVABLE_API_KEY');
    if (!AI_API_KEY) {
      throw new Error('AI APIキーが設定されていません');
    }

    // AIで要約を生成
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/gpt-5-nano',
        messages: [
          {
            role: 'system',
            content: '商談の議事録を要約してください。以下の形式で構造化して記載してください：\n\n重要なポイント：\n（重要な点を箇条書きで）\n\n決定事項：\n（決まったことを箇条書きで）\n\n次のアクション：\n（今後やるべきことを箇条書きで）\n\nその他：\n（上記以外の情報があれば記載）'
          },
          {
            role: 'user',
            content: `以下の商談内容を要約してください：\n\n${text}`
          }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('レート制限に達しました。しばらく待ってから再試行してください。');
      }
      if (response.status === 402) {
        throw new Error('AIの利用可能クレジットが不足しています。');
      }
      const errorText = await response.text();
      console.error('AIエラー:', response.status, errorText);
      throw new Error(`AIエラー: ${errorText}`);
    }

    const result = await response.json();
    const summary = result.choices?.[0]?.message?.content;

    if (!summary) {
      throw new Error('要約の生成に失敗しました');
    }

    console.log('要約生成完了');

    return new Response(
      JSON.stringify({ summary }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('要約エラー:', error);
    const errorMessage = error instanceof Error ? error.message : '不明なエラー';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
