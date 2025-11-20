import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Trash2, Plus } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

interface WhitelistedUser {
  id: string;
  email: string;
  created_at: string;
  notes: string | null;
}

export const AdminWhitelistTab = () => {
  const [loading, setLoading] = useState(true);
  const [whitelistedUsers, setWhitelistedUsers] = useState<WhitelistedUser[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  const fetchWhitelist = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("セッションがありません");
      }

      const { data, error } = await supabase.functions.invoke('manage-whitelist', {
        body: { action: 'list' },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) throw error;

      if (data?.success) {
        setWhitelistedUsers(data.data || []);
      }
    } catch (error) {
      console.error("ホワイトリスト取得エラー:", error);
      toast({
        variant: "destructive",
        title: "エラー",
        description: "ホワイトリストの取得に失敗しました",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWhitelist();
  }, []);

  const handleAddEmail = async () => {
    if (!newEmail.trim()) {
      toast({
        variant: "destructive",
        title: "エラー",
        description: "メールアドレスを入力してください",
      });
      return;
    }

    try {
      setProcessing(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("セッションがありません");
      }

      const { data, error } = await supabase.functions.invoke('manage-whitelist', {
        body: { 
          action: 'add',
          email: newEmail.trim(),
          notes: notes.trim() || null
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "成功",
          description: data.message,
        });
        setNewEmail("");
        setNotes("");
        fetchWhitelist();
      }
    } catch (error: any) {
      console.error("追加エラー:", error);
      toast({
        variant: "destructive",
        title: "エラー",
        description: error.message || "ホワイトリストへの追加に失敗しました",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleRemoveEmail = async (email: string) => {
    if (!confirm(`${email}をホワイトリストから削除しますか？`)) {
      return;
    }

    try {
      setProcessing(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("セッションがありません");
      }

      const { data, error } = await supabase.functions.invoke('manage-whitelist', {
        body: { 
          action: 'remove',
          email
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "成功",
          description: data.message,
        });
        fetchWhitelist();
      }
    } catch (error: any) {
      console.error("削除エラー:", error);
      toast({
        variant: "destructive",
        title: "エラー",
        description: error.message || "ホワイトリストからの削除に失敗しました",
      });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>ホワイトリスト管理</CardTitle>
          <CardDescription>
            支払いなしでサービスを利用できるユーザーを管理します
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Input
              placeholder="メールアドレス"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              disabled={processing}
            />
            <Textarea
              placeholder="メモ（任意）"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={processing}
            />
            <Button 
              onClick={handleAddEmail} 
              disabled={processing}
              className="w-full"
            >
              {processing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              ホワイトリストに追加
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>登録済みユーザー ({whitelistedUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {whitelistedUsers.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              登録されているユーザーはいません
            </p>
          ) : (
            <div className="space-y-2">
              {whitelistedUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium">{user.email}</p>
                    {user.notes && (
                      <p className="text-sm text-muted-foreground">{user.notes}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      追加日時: {new Date(user.created_at).toLocaleString('ja-JP')}
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleRemoveEmail(user.email)}
                    disabled={processing}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
