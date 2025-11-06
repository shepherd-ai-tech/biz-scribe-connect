import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { FileText } from "lucide-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { MeetingDetailDialog } from "../meetings/MeetingDetailDialog";
import { useState } from "react";
import { Separator } from "@/components/ui/separator";

const formSchema = z.object({
  name: z.string().min(1, "氏名を入力してください").max(100),
  company_name: z.string().min(1, "会社名を入力してください").max(100),
  email: z.string().email("有効なメールアドレスを入力してください").optional().or(z.literal("")),
});

interface CustomerDialogProps {
  open: boolean;
  onClose: () => void;
  customer?: any;
}

export const CustomerDialog = ({ open, onClose, customer }: CustomerDialogProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedRecord, setSelectedRecord] = useState<any>(null);

  const { data: meetingRecords } = useQuery({
    queryKey: ['customer-meetings', customer?.id],
    queryFn: async () => {
      if (!customer?.id) return [];
      const { data, error } = await supabase
        .from('meeting_records')
        .select('*')
        .eq('customer_id', customer.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!customer?.id,
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      company_name: "",
      email: "",
    },
  });

  useEffect(() => {
    if (customer) {
      form.reset({
        name: customer.name,
        company_name: customer.company_name,
        email: customer.email || "",
      });
    } else {
      form.reset({
        name: "",
        company_name: "",
        email: "",
      });
    }
  }, [customer, form]);

  const mutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("ユーザーが認証されていません");

      const customerData = {
        name: values.name,
        company_name: values.company_name,
        email: values.email || null,
        user_id: user.id,
      };

      if (customer) {
        const { error } = await supabase
          .from('customers')
          .update(customerData)
          .eq('id', customer.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('customers')
          .insert([customerData]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast({
        title: customer ? "顧客を更新しました" : "顧客を追加しました",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "エラー",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    mutation.mutate(values);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className={customer ? "max-w-4xl max-h-[80vh] overflow-y-auto" : ""}>
        <DialogHeader>
          <DialogTitle>{customer ? "顧客詳細" : "顧客を追加"}</DialogTitle>
        </DialogHeader>
        
        {customer ? (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">基本情報</h3>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>氏名 *</FormLabel>
                        <FormControl>
                          <Input placeholder="山田太郎" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="company_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>会社名 *</FormLabel>
                        <FormControl>
                          <Input placeholder="株式会社サンプル" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>メールアドレス（任意）</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="example@company.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex gap-2 justify-end">
                    <Button type="button" variant="outline" onClick={onClose}>
                      キャンセル
                    </Button>
                    <Button type="submit" disabled={mutation.isPending}>
                      {mutation.isPending ? "保存中..." : "保存"}
                    </Button>
                  </div>
                </form>
              </Form>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-semibold mb-4">議事録履歴</h3>
              {meetingRecords && meetingRecords.length > 0 ? (
                <div className="space-y-3">
                  {meetingRecords.map((record) => (
                    <Card 
                      key={record.id} 
                      className="p-4 hover:bg-secondary transition-colors cursor-pointer"
                      onClick={() => setSelectedRecord({
                        ...record,
                        customers: customer
                      })}
                    >
                      <div className="flex items-start gap-3">
                        <FileText className="w-5 h-5 text-muted-foreground mt-1" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium">
                            {format(new Date(record.created_at), "yyyy年MM月dd日 HH:mm", { locale: ja })}
                          </div>
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-3">
                            {record.summary}
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  この顧客の議事録はまだありません
                </div>
              )}
            </div>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>氏名 *</FormLabel>
                    <FormControl>
                      <Input placeholder="山田太郎" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="company_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>会社名 *</FormLabel>
                    <FormControl>
                      <Input placeholder="株式会社サンプル" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>メールアドレス（任意）</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="example@company.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={onClose}>
                  キャンセル
                </Button>
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending ? "保存中..." : "保存"}
                </Button>
              </div>
            </form>
          </Form>
        )}

        <MeetingDetailDialog
          record={selectedRecord}
          open={!!selectedRecord}
          onClose={() => setSelectedRecord(null)}
        />
      </DialogContent>
    </Dialog>
  );
};
