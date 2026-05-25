import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { login } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login: authLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error("الرجاء إدخال اسم المستخدم وكلمة المرور");
      return;
    }

    setLoading(true);
    try {
      const response = await login({ username, password });
      if (response.accessToken && response.user) {
        authLogin(response.accessToken, response.user);
        toast.success("تم تسجيل الدخول بنجاح");
        
        // Redirect based on role
        if (response.user.role === "ADMIN") {
          navigate({ to: "/admin/system-stats" });
        } else if (response.user.role === "MANAGER") {
          navigate({ to: "/manager/dashboard" });
        } else {
          navigate({ to: "/member/kanban" });
        }
      }
    } catch (err: any) {
      toast.error(err.message || "فشل تسجيل الدخول. تأكد من بياناتك.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4" dir="rtl">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-border bg-card p-8 shadow-lg">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">تيرّا</h2>
          <p className="mt-2 text-sm text-muted-foreground">قم بتسجيل الدخول للوصول إلى حسابك</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">اسم المستخدم</Label>
              <Input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="أدخل اسم المستخدم"
                className="w-full text-right"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">كلمة المرور</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="أدخل كلمة المرور"
                className="w-full text-right"
              />
            </div>
          </div>

          <Button
            type="submit"
            className="cta-glow w-full"
            size="lg"
            disabled={loading}
          >
            {loading ? "جاري التحميل..." : "تسجيل الدخول"}
          </Button>
          
          <div className="text-center mt-4">
            <p className="text-xs text-muted-foreground">
              الحسابات التجريبية: <br/>
              admin / password <br/>
              manager / password <br/>
              member / password
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
