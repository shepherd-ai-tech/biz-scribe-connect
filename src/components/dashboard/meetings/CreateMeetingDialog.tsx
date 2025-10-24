import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, Loader2, Mic, Square, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

interface CreateMeetingDialogProps {
  open: boolean;
  onClose: () => void;
}

export const CreateMeetingDialog = ({ open, onClose }: CreateMeetingDialogProps) => {
  const [selectedCustomer, setSelectedCustomer] = useState<string>("");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const {
    isRecording,
    recordedBlob,
    recordingTime,
    startRecording,
    stopRecording,
    clearRecording,
    formatTime,
  } = useAudioRecorder();

  // 録音データをFileオブジェクトに変換
  useEffect(() => {
    if (recordedBlob) {
      const file = new File([recordedBlob], `recording-${Date.now()}.webm`, {
        type: 'audio/webm',
      });
      setAudioFile(file);
    }
  }, [recordedBlob]);

  const { data: customers } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if ((!audioFile && !pastedText) || !selectedCustomer) {
        throw new Error("入力データと顧客を選択してください");
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("認証が必要です");

      let transcriptionText = "";
      let audioUrl = null;

      // テキストが直接入力された場合
      if (pastedText) {
        transcriptionText = pastedText;
      } 
      // 音声ファイルがある場合
      else if (audioFile) {
        // 音声ファイルをアップロード
        const fileExt = audioFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('meeting-audios')
          .upload(fileName, audioFile);

        if (uploadError) throw uploadError;

        // 公開URLを取得
        const { data: { publicUrl } } = supabase.storage
          .from('meeting-audios')
          .getPublicUrl(fileName);
        
        audioUrl = publicUrl;

        // Base64に変換
        const reader = new FileReader();
        const audioBase64 = await new Promise<string>((resolve) => {
          reader.onloadend = () => {
            const base64 = reader.result as string;
            resolve(base64.split(',')[1]);
          };
          reader.readAsDataURL(audioFile);
        });

        // 文字起こしAPI呼び出し
        const { data: transcriptData, error: transcriptError } = await supabase.functions.invoke(
          'transcribe-audio',
          { body: { audio: audioBase64 } }
        );

        if (transcriptError) throw transcriptError;
        transcriptionText = transcriptData.text;
      }

      // 要約API呼び出し
      const { data: summaryData, error: summaryError } = await supabase.functions.invoke(
        'summarize-meeting',
        { body: { text: transcriptionText } }
      );

      if (summaryError) throw summaryError;

      // 議事録を保存
      const { error: insertError } = await supabase
        .from('meeting_records')
        .insert([{
          user_id: user.id,
          customer_id: selectedCustomer,
          audio_url: audioUrl,
          transcription: transcriptionText,
          summary: summaryData.summary,
        }]);

      if (insertError) throw insertError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meeting-records'] });
      toast({
        title: "議事録を作成しました",
      });
      onClose();
      setAudioFile(null);
      setPastedText("");
      setSelectedCustomer("");
    },
    onError: (error: any) => {
      let errorMessage = error.message;
      
      // OpenAI APIクォータエラーの場合、わかりやすいメッセージに変換
      if (error.message?.includes("quota") || error.message?.includes("insufficient_quota")) {
        errorMessage = "OpenAI APIの使用制限に達しました。APIキーのクレジットを確認してください。";
      } else if (error.message?.includes("Edge Function returned a non-2xx")) {
        errorMessage = "処理中にエラーが発生しました。しばらく経ってから再度お試しください。";
      }
      
      toast({
        title: "エラー",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAudioFile(e.target.files[0]);
      clearRecording();
    }
  };

  const handleDialogClose = () => {
    onClose();
    setAudioFile(null);
    setPastedText("");
    setSelectedCustomer("");
    clearRecording();
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>議事録を作成</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>顧客</Label>
            <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
              <SelectTrigger>
                <SelectValue placeholder="顧客を選択" />
              </SelectTrigger>
              <SelectContent>
                {customers?.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.name} - {customer.company_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>入力方法</Label>
            {!selectedCustomer && (
              <p className="text-sm text-muted-foreground">先に顧客を選択してください</p>
            )}
            <Tabs defaultValue="upload" className="w-full">
              <TabsList className={`grid w-full grid-cols-3 ${!selectedCustomer ? 'pointer-events-none opacity-50' : ''}`}>
                <TabsTrigger value="upload">アップロード</TabsTrigger>
                <TabsTrigger value="record">録音</TabsTrigger>
                <TabsTrigger value="text">テキスト</TabsTrigger>
              </TabsList>
              
              <TabsContent value="upload" className="space-y-2">
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="audio-upload"
                  disabled={!selectedCustomer}
                />
                <label
                  htmlFor="audio-upload"
                  className={`flex items-center justify-center gap-2 p-6 border-2 border-dashed rounded-lg transition-colors ${
                    selectedCustomer ? 'cursor-pointer hover:bg-secondary' : 'cursor-not-allowed opacity-50'
                  }`}
                >
                  <Upload className="w-5 h-5" />
                  <span className="text-sm">
                    {audioFile && !recordedBlob ? audioFile.name : "音声ファイルを選択"}
                  </span>
                </label>
              </TabsContent>
              
              <TabsContent value="record" className="space-y-3">
                {!recordedBlob ? (
                  <div className="flex flex-col items-center gap-3 p-6 border-2 border-dashed rounded-lg">
                    {isRecording && (
                      <div className="text-2xl font-mono font-bold text-destructive">
                        {formatTime(recordingTime)}
                      </div>
                    )}
                    <Button
                      type="button"
                      variant={isRecording ? "destructive" : "default"}
                      size="lg"
                      onClick={isRecording ? stopRecording : startRecording}
                      className="gap-2"
                      disabled={!selectedCustomer}
                    >
                      {isRecording ? (
                        <>
                          <Square className="w-5 h-5" />
                          停止
                        </>
                      ) : (
                        <>
                          <Mic className="w-5 h-5" />
                          録音開始
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-4 border rounded-lg bg-secondary">
                    <div className="flex items-center gap-2">
                      <Mic className="w-5 h-5 text-muted-foreground" />
                      <span className="text-sm">録音済み ({formatTime(recordingTime)})</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        clearRecording();
                        setAudioFile(null);
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="text" className="space-y-2">
                <textarea
                  value={pastedText}
                  onChange={(e) => {
                    setPastedText(e.target.value);
                    setAudioFile(null);
                    clearRecording();
                  }}
                  placeholder="商談内容をここに貼り付けてください..."
                  className="w-full min-h-[200px] p-4 border-2 border-dashed rounded-lg resize-y focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!selectedCustomer}
                />
              </TabsContent>
            </Tabs>
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={handleDialogClose}>
              キャンセル
            </Button>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={(!audioFile && !pastedText) || !selectedCustomer || createMutation.isPending}
            >
              {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              作成
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
