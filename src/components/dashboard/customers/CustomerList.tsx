import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Building2, Edit, Trash2 } from "lucide-react";

interface Customer {
  id: string;
  name: string;
  company_name: string;
  email: string | null;
  created_at: string;
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
      {customers.map((customer) => (
        <Card key={customer.id} className="p-6 hover:shadow-md transition-shadow">
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg">{customer.name}</h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                <Building2 className="w-4 h-4" />
                <span>{customer.company_name}</span>
              </div>
              {customer.email && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                  <Mail className="w-4 h-4" />
                  <span>{customer.email}</span>
                </div>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(customer)}
                className="flex-1"
              >
                <Edit className="w-4 h-4 mr-1" />
                編集
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDelete(customer.id)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};
