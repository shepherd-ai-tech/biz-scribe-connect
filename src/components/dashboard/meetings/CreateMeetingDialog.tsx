import { useState } from "react";
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
import { Upload, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CreateMeetingDialogProps {
  open: boolean;
  onClose: () => void;
}

export const CreateMeetingDialog = ({ open, onClose }: CreateMeetingDialogProps) => {
  const [selectedCustomer, setSelectedCustomer] = useState<string>("");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
      if (!audioFile || !selectedCustomer) {
        throw new Error("音声ファイルと顧客を選択してください");
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("認証が必要です");

      // 音声ファイルをアップロード
      const fileExt = audioFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('meeting-audios')
        .upload(fileName, audioFile);

      if (uploadError) throw uploadError;

      // 文字起こしと要約を実行
      const { data: { publicUrl } } = supabase.storage
        .from('meeting-audios')
        .getPublicUrl(fileName);

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

      // 要約API呼び出し
      const { data: summaryData, error: summaryError } = await supabase.functions.invoke(
        'summarize-meeting',
        { body: { text: transcriptData.text } }
      );

      if (summaryError) throw summaryError;

      // 議事録を保存
      const { error: insertError } = await supabase
        .from('meeting_records')
        .insert([{
          user_id: user.id,
          customer_id: selectedCustomer,
          audio_url: publicUrl,
          transcription: transcriptData.text,
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
      setSelectedCustomer("");
    },
    onError: (error: any) => {
      toast({
        title: "エラー",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAudioFile(e.target.files[0]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
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
            <Label>音声ファイル</Label>
            <div className="flex items-center gap-2">
              <input
                type="file"
                accept="audio/*"
                onChange={handleFileChange}
                className="hidden"
                id="audio-upload"
              />
              <label
                htmlFor="audio-upload"
                className="flex-1 flex items-center justify-center gap-2 p-4 border-2 border-dashed rounded-lg cursor-pointer hover:bg-secondary transition-colors"
              >
                <Upload className="w-5 h-5" />
                <span className="text-sm">
                  {audioFile ? audioFile.name : "音声ファイルを選択"}
                </span>
              </label>
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              キャンセル
            </Button>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={!audioFile || !selectedCustomer || createMutation.isPending}
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
