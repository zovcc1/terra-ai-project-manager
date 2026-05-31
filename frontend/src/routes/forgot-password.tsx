import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, Leaf, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import { requireGuest } from "@/lib/route-guards";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/forgot-password")({
  beforeLoad: () => requireGuest(),
  head: () => ({
    meta: [
      { title: "استعادة كلمة المرور — تيرّا" },
      { name: "description", content: "استعد الوصول إلى حسابك في تيرّا." },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("الرجاء إدخال البريد الإلكتروني");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("http://localhost:8080/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        let errorMsg = "فشل إرسال رابط الاستعادة";
        try {
          const errJson = await response.json();
          if (errJson.message) errorMsg = errJson.message;
        } catch {}
        throw new Error(errorMsg);
      }

      setSent(true);
    } catch (err: any) {
      setError(err.message || "حدث خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4" dir="rtl">
        <div className="w-full max-w-md space-y-6 rounded-2xl border border-border bg-card p-8 shadow-lg text-center">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-success/10 text-success">
            <CheckCircle2 className="h-8 w-8" />
          </span>
          <h2 className="text-2xl font-bold tracking-tight">تم إرسال رابط الاستعادة</h2>
          <p className="text-sm text-muted-foreground">
            إذا كان البريد الإلكتروني «{email}» مسجلاً لدينا، فستتلقى رابطاً لإعادة تعيين كلمة
            المرور.
          </p>
          <Button asChild size="lg" className="cta-glow w-full gap-2">
            <Link to="/login">
              العودة لتسجيل الدخول
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
            <Mail className="h-7 w-7" />
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground">
            استعادة كلمة المرور
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            أدخل بريدك الإلكتروني وسنرسل لك رابطاً لإعادة تعيين كلمة المرور
          </p>
        </div>

        <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="forgot-email">البريد الإلكتروني</Label>
            <Input
              id="forgot-email"
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
                جاري الإرسال...
              </>
            ) : (
              "إرسال رابط الاستعادة"
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
