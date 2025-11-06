import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Building2, Trash2, FileText, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

interface MeetingRecord {
  id: string;
  created_at: string;
  summary: string | null;
}

interface Customer {
  id: string;
  name: string;
  company_name: string;
  email: string | null;
  created_at: string;
  meeting_records?: MeetingRecord[];
}

interface CustomerListProps {
  customers: Customer[];
  isLoading: boolean;
  onEdit: (customer: Customer) => void;
  onDelete: (id: string) => void;
}

export const CustomerList = ({ customers, isLoading, onEdit, onDelete }: CustomerListProps) => {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="p-6 animate-pulse">
            <div className="h-6 bg-muted rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-muted rounded w-1/2 mb-4"></div>
            <div className="h-4 bg-muted rounded w-full"></div>
          </Card>
        ))}
      </div>
    );
  }

  if (customers.length === 0) {
    return (
      <Card className="p-12 text-center">
        <p className="text-muted-foreground">顧客がまだ登録されていません</p>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {customers.map((customer) => {
        const meetingRecords = customer.meeting_records || [];
        const latestRecord = meetingRecords.length > 0 
          ? meetingRecords.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
          : null;
        
        return (
          <Card 
            key={customer.id} 
            className="cursor-pointer hover:bg-secondary/50 transition-colors"
            onClick={() => onEdit(customer)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <h3 className="font-semibold">{customer.name}</h3>
                    <Badge variant="secondary" className="ml-2">
                      <FileText className="w-3 h-3 mr-1" />
                      {meetingRecords.length}件
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Building2 className="w-3 h-3" />
                    <span>{customer.company_name}</span>
                  </div>
                  {customer.email && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="w-3 h-3" />
                      <span>{customer.email}</span>
                    </div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(customer.id);
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            {latestRecord && (
              <CardContent className="pt-0">
                <div className="bg-muted/50 rounded-lg p-3 space-y-1">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <FileText className="w-3 h-3" />
                    <span>最新の議事録</span>
                    <span>•</span>
                    <span>{format(new Date(latestRecord.created_at), "yyyy/MM/dd", { locale: ja })}</span>
                  </div>
                  <p className="text-sm line-clamp-2">{latestRecord.summary}</p>
                </div>
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
};
