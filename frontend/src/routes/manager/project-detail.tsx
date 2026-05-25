import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Calendar, Flag } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/manager/project-detail")({
  head: () => ({ meta: [{ title: "تفاصيل المشروع — تيرّا" }] }),
  component: Page,
});

const tabs = ["نظرة عامة", "المهام", "الفريق"] as const;

const tasks = [
  { title: "إعداد دليل التصميم", assignee: "نورا", status: "قيد التنفيذ", due: "12 أغسطس" },
  { title: "بناء صفحة الهبوط", assignee: "خالد", status: "للقيام", due: "18 أغسطس" },
  { title: "اختبار قابلية الاستخدام", assignee: "ريم", status: "مراجعة", due: "20 أغسطس" },
  { title: "تحسين الأداء", assignee: "سعد", status: "مكتمل", due: "5 أغسطس" },
];

function Page() {
  const [tab, setTab] = useState<(typeof tabs)[number]>("نظرة عامة");

  return (
    <AppShell persona="manager">
      <PageHeader
        title="إعادة تصميم الموقع"
        subtitle="مشروع نشط — يستهدف 15 أغسطس"
        action={
          <Button size="lg" className="cta-glow gap-2">
            <UserPlus className="h-4 w-4" />
            تعيين مهمة
          </Button>
        }
      />

      <div className="mb-6 inline-flex rounded-2xl border border-border bg-card p-1">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "rounded-xl px-4 py-2 text-sm font-medium transition-colors",
              tab === t
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "نظرة عامة" && (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold">وصف المشروع</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                إعادة تصميم شاملة للموقع الإلكتروني تشمل تحديث الهوية البصرية، تحسين تجربة المستخدم،
                وبناء نظام محتوى جديد قابل للتوسع. يشارك في المشروع 6 أعضاء من فرق التصميم والتطوير.
              </p>
              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <Stat label="المهام الكلية" value="42" />
                <Stat label="المكتملة" value="28" />
                <Stat label="المتأخرة" value="3" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <h3 className="text-base font-semibold">تفاصيل سريعة</h3>
              <div className="mt-4 space-y-3 text-sm">
                <Row icon={<Calendar className="h-4 w-4" />} label="الموعد النهائي" value="15 أغسطس" />
                <Row icon={<Flag className="h-4 w-4" />} label="الأولوية" value="عالية" />
                <Row icon={<UserPlus className="h-4 w-4" />} label="القائد" value="نورا الحربي" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {tab === "المهام" && (
        <Card>
          <CardContent className="p-0">
            {tasks.map((t, i) => (
              <div
                key={t.title}
                className={cn(
                  "flex items-center justify-between gap-4 p-4",
                  i !== tasks.length - 1 && "border-b border-border"
                )}
              >
                <div>
                  <p className="font-medium">{t.title}</p>
                  <p className="text-xs text-muted-foreground">
                    مسند إلى {t.assignee} • يستحق {t.due}
                  </p>
                </div>
                <Badge variant="outline" className="border-border bg-secondary/60">
                  {t.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {tab === "الفريق" && (
        <div className="grid gap-3 sm:grid-cols-2">
          {["نورا الحربي", "خالد المطيري", "ريم الزهراني", "سعد العتيبي", "ليلى السبيعي", "عبدالله القرني"].map(
            (m) => (
              <Card key={m}>
                <CardContent className="flex items-center gap-3 p-4">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-accent/20">{m.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{m}</p>
                    <p className="text-xs text-muted-foreground">عضو فريق</p>
                  </div>
                </CardContent>
              </Card>
            )
          )}
        </div>
      )}
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-secondary/50 p-4">
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="inline-flex items-center gap-2 text-muted-foreground">
        {icon}
        {label}
      </span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
