import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { MeetingRecordList } from "./meetings/MeetingRecordList";
import { CreateMeetingDialog } from "./meetings/CreateMeetingDialog";

export const MeetingRecordsTab = () => {
  const [dialogOpen, setDialogOpen] = useState(false);

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

      <MeetingRecordList records={records || []} isLoading={isLoading} />

      <CreateMeetingDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </div>
  );
};
