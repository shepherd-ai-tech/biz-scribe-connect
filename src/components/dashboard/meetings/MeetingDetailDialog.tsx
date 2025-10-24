import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Building2, User, Mail, Send, Copy, CheckCircle2 } from "lucide-react";
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
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const handleCopy = async (text: string, section: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSection(section);
      toast({
        title: "コピーしました",
      });
      setTimeout(() => setCopiedSection(null), 2000);
    } catch (error) {
      toast({
        title: "エラー",
        description: "コピーに失敗しました",
        variant: "destructive",
      });
    }
  };

  const parseStructuredSummary = (summary: string) => {
    const sections = {
      keyPoints: "",
      decisions: "",
      nextActions: "",
      other: summary,
    };

    const keyPointsMatch = summary.match(/(?:重要なポイント|重要事項|ポイント)[：:]\s*\n?([\s\S]*?)(?=(?:\n\n|決定事項|次のアクション|$))/i);
    const decisionsMatch = summary.match(/(?:決定事項|決定)[：:]\s*\n?([\s\S]*?)(?=(?:\n\n|次のアクション|重要なポイント|$))/i);
    const nextActionsMatch = summary.match(/(?:次のアクション|アクション|今後の予定)[：:]\s*\n?([\s\S]*?)(?=(?:\n\n|重要なポイント|決定事項|$))/i);

    if (keyPointsMatch) sections.keyPoints = keyPointsMatch[1].trim();
    if (decisionsMatch) sections.decisions = decisionsMatch[1].trim();
    if (nextActionsMatch) sections.nextActions = nextActionsMatch[1].trim();

    if (keyPointsMatch || decisionsMatch || nextActionsMatch) {
      sections.other = summary
        .replace(keyPointsMatch?.[0] || "", "")
        .replace(decisionsMatch?.[0] || "", "")
        .replace(nextActionsMatch?.[0] || "", "")
        .trim();
    }

    return sections;
  };

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
      <DialogContent className="max-w-full max-h-full h-screen w-screen p-0 gap-0">
        <div className="h-full overflow-y-auto p-6 space-y-6">{/* 内側のコンテナ */}
          <div className="max-w-4xl mx-auto space-y-6">{/* コンテンツ幅制限 */}
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">議事録詳細</h1>
              <Button variant="ghost" onClick={onClose}>閉じる</Button>
            </div>

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

              <TabsContent value="summary" className="mt-4 space-y-4">
                {record.summary ? (
                  <>
                    {(() => {
                      const sections = parseStructuredSummary(record.summary);
                      return (
                        <>
                          {sections.keyPoints && (
                            <Card className="p-4 border-l-4 border-l-primary">
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <h3 className="font-semibold text-primary">重要なポイント</h3>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleCopy(sections.keyPoints, 'keyPoints')}
                                  className="h-8 px-2"
                                >
                                  {copiedSection === 'keyPoints' ? (
                                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                                  ) : (
                                    <Copy className="w-4 h-4" />
                                  )}
                                </Button>
                              </div>
                              <p className="whitespace-pre-wrap text-sm">{sections.keyPoints}</p>
                            </Card>
                          )}
                          
                          {sections.decisions && (
                            <Card className="p-4 border-l-4 border-l-blue-500">
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <h3 className="font-semibold text-blue-600">決定事項</h3>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleCopy(sections.decisions, 'decisions')}
                                  className="h-8 px-2"
                                >
                                  {copiedSection === 'decisions' ? (
                                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                                  ) : (
                                    <Copy className="w-4 h-4" />
                                  )}
                                </Button>
                              </div>
                              <p className="whitespace-pre-wrap text-sm">{sections.decisions}</p>
                            </Card>
                          )}
                          
                          {sections.nextActions && (
                            <Card className="p-4 border-l-4 border-l-orange-500">
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <h3 className="font-semibold text-orange-600">次のアクション</h3>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleCopy(sections.nextActions, 'nextActions')}
                                  className="h-8 px-2"
                                >
                                  {copiedSection === 'nextActions' ? (
                                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                                  ) : (
                                    <Copy className="w-4 h-4" />
                                  )}
                                </Button>
                              </div>
                              <p className="whitespace-pre-wrap text-sm">{sections.nextActions}</p>
                            </Card>
                          )}
                          
                          {sections.other && (
                            <Card className="p-4">
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <h3 className="font-semibold">その他</h3>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleCopy(sections.other, 'other')}
                                  className="h-8 px-2"
                                >
                                  {copiedSection === 'other' ? (
                                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                                  ) : (
                                    <Copy className="w-4 h-4" />
                                  )}
                                </Button>
                              </div>
                              <p className="whitespace-pre-wrap text-sm">{sections.other}</p>
                            </Card>
                          )}
                        </>
                      );
                    })()}
                  </>
                ) : (
                  <Card className="p-6">
                    <p className="text-muted-foreground">要約がありません</p>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="full" className="mt-4">
                <Card className="p-6">
                  <div className="flex items-start justify-between gap-2 mb-4">
                    <h3 className="font-semibold">全文</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(record.transcription || "", 'full')}
                      className="h-8 px-2"
                    >
                      {copiedSection === 'full' ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  <p className="whitespace-pre-wrap text-sm">{record.transcription || "文字起こしがありません"}</p>
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
          </div>{/* コンテンツ幅制限終了 */}
        </div>{/* 内側のコンテナ終了 */}
      </DialogContent>
    </Dialog>
  );
};
