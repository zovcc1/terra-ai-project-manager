import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { Lock, Leaf, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import { requireGuest } from "@/lib/route-guards";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/reset-password")({
  beforeLoad: () => requireGuest(),
  head: () => ({
    meta: [
      { title: "إعادة تعيين كلمة المرور — تيرّا" },
      { name: "description", content: "عيّن كلمة مرور جديدة لحسابك في تيرّا." },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as { email?: string; token?: string };

  const [email, setEmail] = useState(search.email ?? "");
  const [token, setToken] = useState(search.token ?? "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !token || !newPassword || !confirmPassword) {
      setError("الرجاء ملء جميع الحقول");
      return;
    }

    if (newPassword.length < 6) {
      setError("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("كلمتا المرور غير متطابقتين");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("http://localhost:8080/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token, newPassword }),
      });

      if (!response.ok) {
        let errorMsg = "فشل إعادة تعيين كلمة المرور";
        try {
          const errJson = await response.json();
          if (errJson.message) errorMsg = errJson.message;
        } catch {}
        throw new Error(errorMsg);
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "حدث خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4" dir="rtl">
        <div className="w-full max-w-md space-y-6 rounded-2xl border border-border bg-card p-8 shadow-lg text-center">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-success/10 text-success">
            <CheckCircle2 className="h-8 w-8" />
          </span>
          <h2 className="text-2xl font-bold tracking-tight">تم تغيير كلمة المرور</h2>
          <p className="text-sm text-muted-foreground">
            تم إعادة تعيين كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة.
          </p>
          <Button asChild size="lg" className="cta-glow w-full gap-2">
            <Link to="/login">
              تسجيل الدخول
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4" dir="rtl">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-border bg-card p-8 shadow-lg">
        <div className="text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary/10 text-primary">
            <Lock className="h-7 w-7" />
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground">
            إعادة تعيين كلمة المرور
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            أدخل بريدك الإلكتروني ورمز إعادة التعيين وكلمة المرور الجديدة
          </p>
        </div>

        <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reset-email">البريد الإلكتروني</Label>
              <Input
                id="reset-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@terra.app"
                className="w-full text-right"
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reset-token">رمز إعادة التعيين</Label>
              <Input
                id="reset-token"
                type="text"
                required
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="الرمز المستلم عبر البريد"
                className="w-full text-right"
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">كلمة المرور الجديدة</Label>
              <Input
                id="new-password"
                type="password"
                autoComplete="new-password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="6 أحرف على الأقل"
                className="w-full text-right"
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">تأكيد كلمة المرور</Label>
              <Input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="أعد إدخال كلمة المرور"
                className="w-full text-right"
                dir="ltr"
              />
            </div>
          </div>

          {error && (
            <Card className="border-destructive/40 bg-destructive/10">
              <CardContent className="p-3 py-2 text-center text-sm text-destructive">
                {error}
              </CardContent>
            </Card>
          )}

          <Button type="submit" className="cta-glow w-full" size="lg" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin ml-2" />
                جاري التعيين...
              </>
            ) : (
              "تعيين كلمة المرور الجديدة"
            )}
          </Button>

          <div className="text-center text-sm text-muted-foreground">
            <Link to="/login" className="text-primary hover:underline">
              العودة لتسجيل الدخول
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
