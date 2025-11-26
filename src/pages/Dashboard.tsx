import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LogOut, Users, FileText } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CustomersTab } from "@/components/dashboard/CustomersTab";
import { MeetingRecordsTab } from "@/components/dashboard/MeetingRecordsTab";
import { Loader2 } from "lucide-react";

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const { hasAccess, paymentStatus } = usePayment();

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    // 支払いが完了していない場合、支払い設定ページへリダイレクト
    if (!loading && !paymentStatus.loading && !hasAccess) {
      navigate("/payment-setup");
    }
  }, [hasAccess, loading, paymentStatus.loading, navigate]);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/");
    }
    setLoading(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (loading || paymentStatus.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  // 支払いが完了していない場合は何も表示しない（リダイレクト処理中）
  if (!hasAccess) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">DEKISUGIKUN</h1>
          <Button onClick={handleSignOut} variant="outline" size="sm">
            <LogOut className="w-4 h-4 mr-2" />
            ログアウト
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="records" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
            <TabsTrigger value="records" className="gap-2">
              <FileText className="w-4 h-4" />
              議事録
            </TabsTrigger>
            <TabsTrigger value="customers" className="gap-2">
              <Users className="w-4 h-4" />
              顧客管理
            </TabsTrigger>
          </TabsList>

          <TabsContent value="records">
            <MeetingRecordsTab />
          </TabsContent>

          <TabsContent value="customers">
            <CustomersTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
