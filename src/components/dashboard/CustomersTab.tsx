import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { CustomerList } from "./customers/CustomerList";
import { CustomerDialog } from "./customers/CustomerDialog";
import { useToast } from "@/hooks/use-toast";

export const CustomersTab = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: customers, isLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">顧客管理</h2>
          <p className="text-muted-foreground">顧客情報を管理します</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          顧客を追加
        </Button>
      </div>

      <CustomerList
        customers={customers || []}
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <CustomerDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        customer={editingCustomer}
      />
    </div>
  );
};
