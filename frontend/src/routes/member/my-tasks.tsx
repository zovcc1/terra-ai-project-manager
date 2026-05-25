import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Calendar } from "lucide-react";

export const Route = createFileRoute("/member/my-tasks")({
  head: () => ({ meta: [{ title: "مهامي — تيرّا" }] }),
  component: Page,
});

const tasks = [
  { title: "بناء واجهة لوحة التحكم", project: "إعادة تصميم الموقع", due: "18 أغسطس", priority: "عالية" },
  { title: "تحسين أداء الاستعلامات", project: "تطبيق الجوال", due: "22 أغسطس", priority: "متوسطة" },
  { title: "كتابة محتوى الصفحة", project: "حملة الخريف", due: "12 أغسطس", priority: "منخفضة" },
  { title: "مراجعة دليل التصميم", project: "إعادة تصميم الموقع", due: "15 أغسطس", priority: "متوسطة" },
  { title: "اختبار صفحة الدفع", project: "تكامل واجهة الدفع", due: "20 أغسطس", priority: "عالية" },
];

function Page() {
  return (
    <AppShell persona="member">
      <PageHeader title="مهامي" subtitle="جميع المهام المسندة إليك." />

      <Card>
        <CardContent className="p-0">
          {tasks.map((t, i) => (
            <div
              key={t.title}
              className={
                "flex flex-wrap items-center justify-between gap-4 p-4" +
                (i !== tasks.length - 1 ? " border-b border-border" : "")
              }
            >
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-1 h-5 w-5 cursor-pointer rounded border-border accent-[oklch(0.52_0.08_150)]"
                />
                <div>
                  <p className="font-medium">{t.title}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span>{t.project}</span>
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {t.due}
                    </span>
                    <Badge
                      variant="outline"
                      className={
                        t.priority === "عالية"
                          ? "border-destructive/40 bg-destructive/10 text-destructive"
                          : t.priority === "متوسطة"
                            ? "border-warning/40 bg-warning/15"
                            : "border-border bg-secondary"
                      }
                    >
                      {t.priority}
                    </Badge>
                  </div>
                </div>
              </div>
              <Button className="cta-glow gap-2">
                <Check className="h-4 w-4" />
                وضع علامة كمنجز
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </AppShell>
  );
}
