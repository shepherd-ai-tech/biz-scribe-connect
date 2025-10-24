import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { MeetingRecordList } from "./meetings/MeetingRecordList";
import { CreateMeetingDialog } from "./meetings/CreateMeetingDialog";

export const MeetingRecordsTab = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: records, isLoading } = useQuery({
    queryKey: ['meeting-records'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('meeting_records')
        .select(`
          *,
          customers (
            id,
            name,
            company_name,
            email
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const filteredRecords = (records || []).filter((record) => {
    const query = searchQuery.toLowerCase();
    return (
      record.customers?.name.toLowerCase().includes(query) ||
      record.customers?.company_name.toLowerCase().includes(query) ||
      record.summary?.toLowerCase().includes(query) ||
      record.transcription?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">議事録一覧</h2>
          <p className="text-muted-foreground">商談の議事録を管理します</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          議事録を作成
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="顧客名、会社名、議事録の内容で検索..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <MeetingRecordList records={filteredRecords} isLoading={isLoading} />

      <CreateMeetingDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </div>
  );
};
