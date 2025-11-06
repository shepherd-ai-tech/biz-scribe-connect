import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// タイムスタンプを HH:MM:SS 形式にフォーマット
function formatTimestamp(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { audio } = await req.json();
    
    if (!audio) {
      throw new Error('音声データが提供されていません');
    }

    console.log('音声文字起こしを開始します');

    // Base64をバイナリに変換
    const binaryString = atob(audio);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // FormDataを作成
    const formData = new FormData();
    const blob = new Blob([bytes], { type: 'audio/webm' });
    formData.append('file', blob, 'audio.webm');
    formData.append('model', 'whisper-1');
    formData.append('language', 'ja');
    formData.append('response_format', 'verbose_json');
    formData.append('timestamp_granularities[]', 'segment');

    // OpenAI Whisper APIに送信
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI APIエラー:', response.status, errorText);
      throw new Error(`OpenAI APIエラー: ${errorText}`);
    }

    const result = await response.json();
    console.log('文字起こし完了');

    // セグメントごとにタイムスタンプ付きテキストを生成
    let formattedText = '';
    if (result.segments && Array.isArray(result.segments)) {
      for (const segment of result.segments) {
        const startTime = formatTimestamp(segment.start);
        formattedText += `${startTime}　話者：\n${segment.text.trim()}\n\n`;
      }
    } else {
      // フォールバック: セグメントがない場合は通常のテキストを返す
      formattedText = result.text;
    }

    return new Response(
      JSON.stringify({ text: formattedText.trim() }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('文字起こしエラー:', error);
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
