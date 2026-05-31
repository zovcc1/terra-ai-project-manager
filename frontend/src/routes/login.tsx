import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { requireGuest } from "@/lib/route-guards";
import { Leaf, Loader2, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { login } from "@/lib/api";
import { loginSchema, type LoginFormData } from "@/lib/validations/auth";

export const Route = createFileRoute("/login")({
  beforeLoad: () => requireGuest(),
  head: () => ({
    meta: [
      { title: "تسجيل الدخول — تيرّا" },
      { name: "description", content: "سجل دخولك إلى حسابك في تيرّا." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { login: authLogin } = useAuth();
  const navigate = useNavigate();

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      const response = await login(data);
      const { token, id, email, roles } = response;
      const primaryRole = roles[0];

      const user = {
        id,
        email,
        role: primaryRole,
        roles,
      };

      authLogin(token, user);
      toast.success("تم تسجيل الدخول بنجاح");

      if (primaryRole === "ADMIN") {
        navigate({ to: "/admin/system-stats" });
      } else if (primaryRole === "MANAGER") {
        navigate({ to: "/manager/dashboard" });
      } else {
        navigate({ to: "/member/kanban" });
      }
    } catch (err: any) {
      toast.error(err.message || "فشل تسجيل الدخول. تأكد من بياناتك.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4" dir="rtl">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-border bg-card p-8 shadow-lg">
        <div className="text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground">
            <Leaf className="h-7 w-7" />
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground">تيرّا</h2>
          <p className="mt-2 text-sm text-muted-foreground">قم بتسجيل الدخول للوصول إلى حسابك</p>
        </div>

        <Form {...form}>
          <form className="mt-6 space-y-6" method="post"onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>البريد الإلكتروني</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      autoComplete="email"
                      placeholder="أدخل بريدك الإلكتروني"
                      className="w-full text-right"
                      dir="ltr"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>كلمة المرور</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="password"
                      autoComplete="current-password"
                      placeholder="أدخل كلمة المرور"
                      className="w-full text-right"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="cta-glow w-full gap-2"
              size="lg"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  جاري التحميل...
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  تسجيل الدخول
                </>
              )}
            </Button>
          </form>
        </Form>

        <div className="space-y-3 text-center text-sm">
          <div className="flex items-center justify-center gap-4 text-muted-foreground">
            <Link to="/forgot-password" className="text-primary hover:underline">
              نسيت كلمة المرور؟
            </Link>
            <span className="text-border">|</span>
            <Link to="/verify" className="text-primary hover:underline">
              تأكيد البريد الإلكتروني
            </Link>
          </div>

          <div className="rounded-xl border border-border bg-secondary/30 p-3">
            <p className="text-xs text-muted-foreground" dir="ltr">
              الحسابات التجريبية: <br />
              admin@terra.com / password <br />
              manager@terra.com / password <br />
              member@terra.com / password
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
