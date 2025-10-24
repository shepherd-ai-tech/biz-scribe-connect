import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Building2, User, Mail, Send } from "lucide-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface MeetingDetailDialogProps {
  record: any;
  open: boolean;
  onClose: () => void;
}

export const MeetingDetailDialog = ({ record, open, onClose }: MeetingDetailDialogProps) => {
  const { toast } = useToast();
  const [isSending, setIsSending] = useState(false);

  const sendEmailMutation = useMutation({
    mutationFn: async () => {
      if (!record?.customers?.email) {
        throw new Error("顧客のメールアドレスが登録されていません");
      }

      const { error } = await supabase.functions.invoke('send-meeting-email', {
        body: {
          to: record.customers.email,
          customerName: record.customers.name,
          summary: record.summary,
          transcription: record.transcription,
        },
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "メールを送信しました",
      });
    },
    onError: (error: any) => {
      toast({
        title: "エラー",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (!record) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>議事録詳細</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {record.customers && (
            <Card className="p-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{record.customers.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {record.customers.company_name}
                  </span>
                </div>
                {record.customers.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {record.customers.email}
                    </span>
                  </div>
                )}
              </div>
            </Card>
          )}

          <div className="text-sm text-muted-foreground">
            作成日時: {format(new Date(record.created_at), "yyyy年MM月dd日 HH:mm", { locale: ja })}
          </div>

          <Tabs defaultValue="summary" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="summary">要約</TabsTrigger>
              <TabsTrigger value="full">全文</TabsTrigger>
            </TabsList>

            <TabsContent value="summary" className="mt-4">
              <Card className="p-6">
                <p className="whitespace-pre-wrap">{record.summary || "要約がありません"}</p>
              </Card>
            </TabsContent>

            <TabsContent value="full" className="mt-4">
              <Card className="p-6">
                <p className="whitespace-pre-wrap">{record.transcription || "文字起こしがありません"}</p>
              </Card>
            </TabsContent>
          </Tabs>

          {record.customers?.email && (
            <div className="flex justify-end">
              <Button
                onClick={() => sendEmailMutation.mutate()}
                disabled={sendEmailMutation.isPending}
                className="gap-2"
              >
                <Send className="w-4 h-4" />
                {sendEmailMutation.isPending ? "送信中..." : "メールで送信"}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
