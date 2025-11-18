import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, CheckCircle2, XCircle, Loader2, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { usePayment } from "@/contexts/PaymentContext";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function PaymentSetup() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { paymentStatus, refreshPaymentStatus, hasAccess } = usePayment();
  const [processingPayment, setProcessingPayment] = useState(false);
  const [processingSubscription, setProcessingSubscription] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    // 両方の支払いが完了したら自動的にダッシュボードへ
    if (hasAccess && !paymentStatus.loading) {
      navigate("/dashboard");
    }
  }, [hasAccess, paymentStatus.loading, navigate]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/");
    }
  };

  const handleInitialPayment = async () => {
    try {
      setProcessingPayment(true);
      const { data, error } = await supabase.functions.invoke("create-initial-payment");
      
      if (error) throw error;
      
      if (data?.url) {
        window.open(data.url, "_blank");
        toast({
          title: "支払いページを開きました",
          description: "支払い完了後、このページに戻って更新してください",
        });
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
        toast({
          title: "サブスクリプションページを開きました",
          description: "登録完了後、このページに戻って更新してください",
        });
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

  if (paymentStatus.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">DEKISUGIKUN</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center space-y-2 mb-8">
            <h2 className="text-3xl font-bold">サービスのご利用開始</h2>
            <p className="text-muted-foreground">
              DEKISUGIKUNをご利用いただくには、以下の2つのお支払いが必要です
            </p>
          </div>

          <Alert className="mb-6">
            <AlertDescription>
              <strong>テスト環境：</strong> Stripeテストカード番号 <code className="bg-muted px-2 py-1 rounded">4242 4242 4242 4242</code> を使用してテストできます。
              有効期限は未来の日付、CVCは任意の3桁の数字を入力してください。
            </AlertDescription>
          </Alert>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className={paymentStatus.initial_payment_completed ? "border-green-500" : ""}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  ステップ1: 初期導入費用
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
                
                {paymentStatus.initial_payment_completed ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="font-medium">支払い済み ✓</span>
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
                      size="lg"
                    >
                      {processingPayment ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          処理中...
                        </>
                      ) : (
                        <>
                          初期費用を支払う
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className={paymentStatus.subscribed ? "border-green-500" : ""}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  ステップ2: 月額利用料
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
                
                {paymentStatus.subscribed ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="font-medium">契約中 ✓</span>
                    </div>
                    {paymentStatus.subscription_end && (
                      <p className="text-sm text-muted-foreground">
                        次回更新日: {new Date(paymentStatus.subscription_end).toLocaleDateString('ja-JP')}
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
                      size="lg"
                    >
                      {processingSubscription ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          処理中...
                        </>
                      ) : (
                        <>
                          サブスクリプションを開始
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-center gap-4 pt-6">
            <Button onClick={refreshPaymentStatus} variant="outline">
              支払い状況を更新
            </Button>
            {hasAccess && (
              <Button onClick={() => navigate("/dashboard")} size="lg">
                ダッシュボードへ進む
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>

          <Card className="mt-8">
            <CardHeader>
              <CardTitle>ご利用ガイド</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                • 初期導入費用とサブスクリプション、両方のお支払いが完了すると、すべての機能をご利用いただけます
              </p>
              <p>
                • お支払いはStripeを通じて安全に処理されます
              </p>
              <p>
                • テスト環境ではテストカードを使用できます（本番環境では実際のカードが必要です）
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
