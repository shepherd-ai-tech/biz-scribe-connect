import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Eye, Building2, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";
import { useState } from "react";
import { MeetingDetailDialog } from "./MeetingDetailDialog";

interface MeetingRecord {
  id: string;
  transcription: string | null;
  summary: string | null;
  created_at: string;
  customers: {
    id: string;
    name: string;
    company_name: string;
    email: string | null;
  } | null;
}

interface MeetingRecordListProps {
  records: MeetingRecord[];
  isLoading: boolean;
}

export const MeetingRecordList = ({ records, isLoading }: MeetingRecordListProps) => {
  const [selectedRecord, setSelectedRecord] = useState<MeetingRecord | null>(null);

  if (isLoading) {
    return (
      <div className="grid gap-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="p-6 animate-pulse">
            <div className="h-6 bg-muted rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-muted rounded w-1/2 mb-4"></div>
            <div className="h-20 bg-muted rounded w-full"></div>
          </Card>
        ))}
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <Card className="p-12 text-center">
        <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">議事録がまだ作成されていません</p>
      </Card>
    );
  }

  return (
    <>
      <div className="grid gap-4">
        {records.map((record) => (
          <Card key={record.id} className="p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>
                    {formatDistanceToNow(new Date(record.created_at), {
                      addSuffix: true,
                      locale: ja,
                    })}
                  </span>
                </div>
                
                {record.customers && (
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span>{record.customers.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-muted-foreground" />
                      <span>{record.customers.company_name}</span>
                    </div>
                  </div>
                )}

                {record.summary && (
                  <p className="text-sm line-clamp-2 text-muted-foreground">
                    {record.summary}
                  </p>
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedRecord(record)}
              >
                <Eye className="w-4 h-4 mr-1" />
                詳細
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <MeetingDetailDialog
        record={selectedRecord}
        open={!!selectedRecord}
        onClose={() => setSelectedRecord(null)}
      />
    </>
  );
};
