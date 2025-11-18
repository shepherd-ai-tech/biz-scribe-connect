import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // 既存のクーポンを取得
    const coupons = await stripe.coupons.list({ limit: 10 });
    console.log("Existing coupons:", coupons.data);

    // "dfree"というプロモーションコードが既に存在するか確認
    const existingPromoCodes = await stripe.promotionCodes.list({ code: "dfree" });
    
    if (existingPromoCodes.data.length > 0) {
      return new Response(
        JSON.stringify({ 
          message: "プロモーションコード 'dfree' は既に存在します",
          promotionCode: existingPromoCodes.data[0]
        }), 
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // 汎用的な100%オフクーポンを作成（まだ存在しない場合）
    const universalCoupon = await stripe.coupons.create({
      percent_off: 100,
      duration: "once",
      name: "dfree - 全額無料クーポン",
    });

    // "dfree"プロモーションコードを作成
    const promotionCode = await stripe.promotionCodes.create({
      coupon: universalCoupon.id,
      code: "dfree",
      active: true,
    });

    return new Response(
      JSON.stringify({ 
        success: true,
        coupon: universalCoupon,
        promotionCode: promotionCode,
        message: "プロモーションコード 'dfree' が作成されました"
      }), 
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("プロモーションコード作成エラー:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
