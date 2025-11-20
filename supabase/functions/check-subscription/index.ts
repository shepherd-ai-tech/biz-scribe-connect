import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
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
    logStep("サブスクリプションチェック開始");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEYが設定されていません");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("認証ヘッダーがありません");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`認証エラー: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("ユーザーが認証されていません");

    logStep("ユーザー認証完了", { userId: user.id, email: user.email });

    // ホワイトリストをチェック
    const { data: whitelistData, error: whitelistError } = await supabaseClient
      .from('whitelisted_users')
      .select('email')
      .eq('email', user.email)
      .maybeSingle();

    if (whitelistError) {
      logStep("ホワイトリストチェックエラー", { error: whitelistError.message });
    }

    if (whitelistData) {
      logStep("ホワイトリストユーザーが見つかりました - アクセス許可", { email: user.email });
      return new Response(JSON.stringify({
        subscribed: true,
        initial_payment_completed: true,
        subscription_end: null
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    logStep("ホワイトリストに見つかりませんでした - Stripeチェックを続行");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("顧客が見つかりません");
      return new Response(JSON.stringify({ 
        subscribed: false,
        initial_payment_completed: false 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Stripe顧客が見つかりました", { customerId });

    // アクティブなサブスクリプションをチェック
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });
    const hasActiveSub = subscriptions.data.length > 0;
    let subscriptionEnd = null;

    if (hasActiveSub) {
      const subscription = subscriptions.data[0];
      subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
      logStep("アクティブなサブスクリプションが見つかりました", { 
        subscriptionId: subscription.id, 
        endDate: subscriptionEnd 
      });
    }

    // 初期費用の支払いをチェック
    const payments = await stripe.paymentIntents.list({
      customer: customerId,
      limit: 100,
    });
    
    const initialPaymentCompleted = payments.data.some(
      (payment: Stripe.PaymentIntent) => payment.status === "succeeded" && payment.amount === 100000
    );

    logStep("支払い状況", { 
      subscribed: hasActiveSub, 
      initialPaymentCompleted,
      subscriptionEnd 
    });

    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      initial_payment_completed: initialPaymentCompleted,
      subscription_end: subscriptionEnd
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("エラー", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
