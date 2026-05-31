import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/app-shell";
import { requireRole } from "@/lib/route-guards";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Pencil, Mail, Shield } from "lucide-react";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/user/profile")({
  beforeLoad: () => requireRole("/user"),
  head: () => ({ meta: [{ title: "الملف الشخصي — تيرّا" }] }),
  component: Page,
});

const roleLabels: Record<string, string> = {
  ADMIN: "مدير النظام",
  MANAGER: "مدير مشروع",
  MEMBER: "عضو فريق",
  USER: "مستخدم فردي",
};

function Page() {
  const { user } = useAuth();

  const displayName = user?.fullName || user?.username || user?.email?.split("@")[0] || "مستخدم";
  const initials = displayName
    .split(" ")
    .map((w) => w.charAt(0))
    .join("")
    .slice(0, 2);

  return (
    <AppShell persona="user">
      <PageHeader
        title="الملف الشخصي"
        subtitle="معلوماتك الشخصية وتفضيلات الحساب."
        action={
          <Button size="lg" className="cta-glow gap-2" disabled>
            <Pencil className="h-4 w-4" />
            تعديل الملف الشخصي
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardContent className="flex flex-col items-center p-6 text-center">
            <Avatar className="h-24 w-24 border-4 border-card shadow-md">
              <AvatarFallback className="bg-accent/30 text-2xl font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <h2 className="mt-4 text-xl font-bold">{displayName}</h2>
            <p className="text-sm text-muted-foreground">
              {roleLabels[user?.role || ""] || user?.role || "مستخدم"}
            </p>
            <div className="mt-6 w-full space-y-3 text-right text-sm">
              <Row icon={<Mail className="h-4 w-4" />} value={user?.email || "—"} />
              <Row
                icon={<Shield className="h-4 w-4" />}
                value={roleLabels[user?.role || ""] || user?.role || "—"}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardContent className="p-6">
            <h3 className="font-semibold">معلومات الحساب</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              هذه معلومات حسابك المسجلة في النظام. يمكنك التواصل مع مدير النظام لتعديل بياناتك.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <Stat label="المعرف" value={user?.id != null ? `#${user.id}` : "—"} />
              <Stat label="الدور" value={roleLabels[user?.role || ""] || "—"} />
              <Stat label="الحالة" value="نشط" />
            </div>

            <div className="mt-8 rounded-xl border border-border bg-secondary/30 p-4">
              <p className="text-sm text-muted-foreground">
                💡 لتعديل بياناتك أو تغيير كلمة المرور، يرجى التواصل مع مدير النظام.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

function Row({ icon, value }: { icon: React.ReactNode; value: string }) {
  return (
    <div className="flex items-center gap-2 text-muted-foreground">
      <span className="text-primary">{icon}</span>
      <span>{value}</span>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-secondary/50 p-4 text-center">
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
