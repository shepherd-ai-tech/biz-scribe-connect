import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[MANAGE-WHITELIST] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    logStep("ホワイトリスト管理開始");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("認証ヘッダーがありません");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`認証エラー: ${userError.message}`);
    const user = userData.user;
    if (!user) throw new Error("ユーザーが認証されていません");

    logStep("ユーザー認証完了", { userId: user.id });

    // 管理者権限チェック
    const { data: roleData, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (roleError || !roleData) {
      throw new Error("管理者権限がありません");
    }

    logStep("管理者権限確認完了");

    const { action, email, notes } = await req.json();

    if (action === 'add') {
      // ホワイトリストに追加
      const { data, error } = await supabaseClient
        .from('whitelisted_users')
        .insert({
          email,
          added_by: user.id,
          notes: notes || null
        })
        .select()
        .single();

      if (error) throw error;

      logStep("ホワイトリストに追加", { email });

      return new Response(JSON.stringify({
        success: true,
        message: `${email}をホワイトリストに追加しました`,
        data
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    } else if (action === 'remove') {
      // ホワイトリストから削除
      const { error } = await supabaseClient
        .from('whitelisted_users')
        .delete()
        .eq('email', email);

      if (error) throw error;

      logStep("ホワイトリストから削除", { email });

      return new Response(JSON.stringify({
        success: true,
        message: `${email}をホワイトリストから削除しました`
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    } else if (action === 'list') {
      // ホワイトリスト一覧を取得
      const { data, error } = await supabaseClient
        .from('whitelisted_users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      logStep("ホワイトリスト一覧取得");

      return new Response(JSON.stringify({
        success: true,
        data
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    } else {
      throw new Error("無効なアクションです");
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("エラー", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
