import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Mic } from "lucide-react";

export const AuthPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate("/dashboard");
      }
    });
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary to-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-primary mb-4 shadow-lg">
            <Mic className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold mb-2">DEKISUGIKUN</h1>
          <p className="text-muted-foreground">
            音声から自動で議事録を作成し、顧客管理を効率化
          </p>
        </div>
        
        <div className="bg-card p-8 rounded-2xl shadow-lg border border-border">
          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: 'hsl(237 84% 64%)',
                    brandAccent: 'hsl(250 84% 72%)',
                  },
                },
              },
            }}
            localization={{
              variables: {
                sign_in: {
                  email_label: 'メールアドレス',
                  password_label: 'パスワード',
                  button_label: 'ログイン',
                  loading_button_label: 'ログイン中...',
                  link_text: 'すでにアカウントをお持ちですか？',
                },
                sign_up: {
                  email_label: 'メールアドレス',
                  password_label: 'パスワード',
                  button_label: '新規登録',
                  loading_button_label: '登録中...',
                  link_text: 'アカウントをお持ちでない方',
                },
              },
            }}
            providers={[]}
          />
        </div>
      </div>
    </div>
  );
};
