import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendMeetingEmailRequest {
  to: string;
  customerName: string;
  summary: string;
  transcription: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, customerName, summary, transcription }: SendMeetingEmailRequest = await req.json();

    console.log('メール送信を開始します:', to);

    const emailBody = `
${customerName} 様

いつもお世話になっております。

先日の商談内容を議事録としてお送りいたします。

【要約】
${summary}

【詳細な内容】
${transcription}

ご確認のほど、よろしくお願いいたします。
`;

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: '商談議事録 <onboarding@resend.dev>',
        to: [to],
        subject: '商談議事録のご送付',
        text: emailBody,
      }),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      throw new Error(`Resend APIエラー: ${errorText}`);
    }

    const result = await emailResponse.json();

    console.log("メール送信成功:", result);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("メール送信エラー:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
