import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

interface PaymentStatus {
  subscribed: boolean;
  initial_payment_completed: boolean;
  subscription_end?: string;
  loading: boolean;
}

interface PaymentContextType {
  paymentStatus: PaymentStatus;
  refreshPaymentStatus: () => Promise<void>;
  hasAccess: boolean;
}

const PaymentContext = createContext<PaymentContextType | undefined>(undefined);

export function PaymentProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>({
    subscribed: false,
    initial_payment_completed: false,
    loading: true,
  });

  useEffect(() => {
    // 認証状態の監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          setTimeout(() => {
            checkPaymentStatus();
          }, 0);
        } else {
          setPaymentStatus({
            subscribed: false,
            initial_payment_completed: false,
            loading: false,
          });
        }
      }
    );

    // 初期セッションチェック
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkPaymentStatus();
      } else {
        setPaymentStatus({
          subscribed: false,
          initial_payment_completed: false,
          loading: false,
        });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkPaymentStatus = async () => {
    try {
      setPaymentStatus(prev => ({ ...prev, loading: true }));
      const { data, error } = await supabase.functions.invoke("check-subscription");
      
      if (error) {
        console.error("支払いステータスの取得エラー:", error);
        setPaymentStatus({
          subscribed: false,
          initial_payment_completed: false,
          loading: false,
        });
        return;
      }
      
      setPaymentStatus({
        subscribed: data.subscribed || false,
        initial_payment_completed: data.initial_payment_completed || false,
        subscription_end: data.subscription_end,
        loading: false,
      });
    } catch (error) {
      console.error("支払いステータスチェックエラー:", error);
      setPaymentStatus({
        subscribed: false,
        initial_payment_completed: false,
        loading: false,
      });
    }
  };

  const refreshPaymentStatus = async () => {
    await checkPaymentStatus();
  };

  // アクセス権限: 初期費用とサブスクリプション両方が必要
  const hasAccess = paymentStatus.initial_payment_completed && paymentStatus.subscribed;

  return (
    <PaymentContext.Provider value={{ paymentStatus, refreshPaymentStatus, hasAccess }}>
      {children}
    </PaymentContext.Provider>
  );
}

export function usePayment() {
  const context = useContext(PaymentContext);
  if (context === undefined) {
    throw new Error("usePayment must be used within a PaymentProvider");
  }
  return context;
}
