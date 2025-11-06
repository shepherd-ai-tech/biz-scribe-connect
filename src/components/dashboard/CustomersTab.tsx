import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserPlus, Search } from "lucide-react";
import { CustomerList } from "./customers/CustomerList";
import { CustomerDialog } from "./customers/CustomerDialog";
import { useToast } from "@/hooks/use-toast";

export const CustomersTab = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: customers, isLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select(`
          *,
          meeting_records (
            id,
            created_at,
            summary
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast({
        title: "顧客を削除しました",
      });
    },
    onError: () => {
      toast({
        title: "エラー",
        description: "顧客の削除に失敗しました",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (customer: any) => {
    setEditingCustomer(customer);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("本当に削除しますか？")) {
      deleteMutation.mutate(id);
    }
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingCustomer(null);
  };

  const filteredCustomers = (customers || []).filter((customer) => {
    const query = searchQuery.toLowerCase();
    return (
      customer.name.toLowerCase().includes(query) ||
      customer.company_name.toLowerCase().includes(query) ||
      customer.email?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6 relative pb-20">
      <div>
        <h2 className="text-2xl font-bold">顧客管理</h2>
        <p className="text-muted-foreground">顧客情報を管理します</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="顧客名、会社名、メールアドレスで検索..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <CustomerList
        customers={filteredCustomers}
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <CustomerDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        customer={editingCustomer}
      />

      <Button
        onClick={() => setDialogOpen(true)}
        className="fixed bottom-8 right-8 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110 z-50"
        size="icon"
      >
        <UserPlus className="w-8 h-8" />
      </Button>
    </div>
  );
};
