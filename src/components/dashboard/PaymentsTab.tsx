import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SubscriptionStatus {
  subscribed: boolean;
  initial_payment_completed: boolean;
  subscription_end?: string;
}

export function PaymentsTab() {
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [processingSubscription, setProcessingSubscription] = useState(false);
  const [status, setStatus] = useState<SubscriptionStatus>({
    subscribed: false,
    initial_payment_completed: false,
  });
  const { toast } = useToast();

  useEffect(() => {
    checkSubscriptionStatus();
  }, []);

  const checkSubscriptionStatus = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke("check-subscription");
      
      if (error) throw error;
      
      setStatus(data);
    } catch (error) {
      console.error("サブスクリプションステータスの取得エラー:", error);
      toast({
        title: "エラー",
        description: "サブスクリプションステータスの取得に失敗しました",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInitialPayment = async () => {
    try {
      setProcessingPayment(true);
      const { data, error } = await supabase.functions.invoke("create-initial-payment");
      
      if (error) throw error;
      
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (error) {
      console.error("初期費用支払いエラー:", error);
      toast({
        title: "エラー",
        description: "支払いページの作成に失敗しました",
        variant: "destructive",
      });
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleSubscription = async () => {
    try {
      setProcessingSubscription(true);
      const { data, error } = await supabase.functions.invoke("create-subscription");
      
      if (error) throw error;
      
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (error) {
      console.error("サブスクリプション作成エラー:", error);
      toast({
        title: "エラー",
        description: "サブスクリプションページの作成に失敗しました",
        variant: "destructive",
      });
    } finally {
      setProcessingSubscription(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">支払い管理</h2>
          <p className="text-muted-foreground mt-1">
            サービスの利用料金を管理します
          </p>
        </div>
        <Button onClick={checkSubscriptionStatus} variant="outline" size="sm">
          ステータス更新
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              初期導入費用
            </CardTitle>
            <CardDescription>
              システム導入時の一回限りのお支払い
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">¥100,000</span>
              <span className="text-muted-foreground">（税込）</span>
            </div>
            
            {status.initial_payment_completed ? (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-medium">支払い済み</span>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 text-amber-600">
                  <XCircle className="w-5 h-5" />
                  <span className="font-medium">未払い</span>
                </div>
                <Button
                  onClick={handleInitialPayment}
                  disabled={processingPayment}
                  className="w-full"
                >
                  {processingPayment ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      処理中...
                    </>
                  ) : (
                    "初期費用を支払う"
                  )}
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              月額利用料
            </CardTitle>
            <CardDescription>
              毎月自動的に請求されます
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">¥14,600</span>
              <span className="text-muted-foreground">/ 月</span>
            </div>
            
            {status.subscribed ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="font-medium">契約中</span>
                </div>
                {status.subscription_end && (
                  <p className="text-sm text-muted-foreground">
                    次回更新日: {new Date(status.subscription_end).toLocaleDateString('ja-JP')}
                  </p>
                )}
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 text-amber-600">
                  <XCircle className="w-5 h-5" />
                  <span className="font-medium">未契約</span>
                </div>
                <Button
                  onClick={handleSubscription}
                  disabled={processingSubscription}
                  className="w-full"
                >
                  {processingSubscription ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      処理中...
                    </>
                  ) : (
                    "サブスクリプションを開始"
                  )}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>ご利用ガイド</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            • 初期導入費用: システムのセットアップと初期設定に必要な一回限りの費用です
          </p>
          <p>
            • 月額利用料: サービスの継続利用のため、毎月自動的に請求されます
          </p>
          <p>
            • お支払いはStripeを通じて安全に処理されます
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
