import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/manager/analytics")({
  head: () => ({ meta: [{ title: "تحليلات المشاريع — تيرّا" }] }),
  component: Page,
});

function Page() {
  return (
    <AppShell persona="manager">
      <PageHeader
        title="تحليلات المشاريع"
        subtitle="رؤى حول إنتاجية فرقك وتقدم مشاريعك."
      />

      <Card className="mb-6 border-warning/40 bg-warning/10">
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-warning/30 text-warning-foreground">
              <AlertTriangle className="h-5 w-5" />
            </span>
            <div>
              <CardTitle className="text-base">اختناق محتمل في «تطبيق الجوال»</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                المهام في عمود المراجعة تتراكم منذ 4 أيام. ننصح بمراجعة التوزيع.
              </p>
            </div>
          </div>
          <Button size="lg" className="cta-glow shrink-0">
            عرض تنبيه الاختناق
          </Button>
        </CardHeader>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">المهام المكتملة أسبوعيًا</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-56 items-end gap-3">
              {[40, 55, 48, 70, 62, 80, 75].map((h, i) => (
                <div key={i} className="flex flex-1 flex-col items-center gap-2">
                  <div
                    className="w-full rounded-t-lg bg-primary"
                    style={{ height: `${h}%` }}
                  />
                  <span className="text-[10px] text-muted-foreground">أ{i + 1}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">معدّل دورة المهام</CardTitle>
          </CardHeader>
          <CardContent>
            <svg viewBox="0 0 300 200" className="h-56 w-full">
              <polyline
                fill="none"
                stroke="oklch(0.52 0.08 150)"
                strokeWidth="3"
                points="0,150 40,120 80,135 120,90 160,110 200,70 240,80 300,50"
              />
              <polyline
                fill="none"
                stroke="oklch(0.5 0.08 70)"
                strokeWidth="3"
                strokeDasharray="4 4"
                points="0,170 40,160 80,145 120,140 160,125 200,115 240,100 300,90"
              />
            </svg>
            <div className="mt-3 flex gap-4 text-xs">
              <span className="inline-flex items-center gap-2">
                <span className="h-2 w-3 rounded-full bg-primary" /> الفعلي
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="h-2 w-3 rounded-full bg-accent" /> المتوقع
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">توزيع المهام حسب الحالة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-6 overflow-hidden rounded-full">
              <div className="bg-muted-foreground/40" style={{ width: "20%" }} />
              <div className="bg-primary" style={{ width: "35%" }} />
              <div className="bg-warning" style={{ width: "15%" }} />
              <div className="bg-success" style={{ width: "30%" }} />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
              <Legend color="bg-muted-foreground/40" label="للقيام" v="20%" />
              <Legend color="bg-primary" label="قيد التنفيذ" v="35%" />
              <Legend color="bg-warning" label="مراجعة" v="15%" />
              <Legend color="bg-success" label="مكتمل" v="30%" />
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

function Legend({ color, label, v }: { color: string; label: string; v: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className={`h-3 w-3 rounded-sm ${color}`} />
      {label} <span className="text-muted-foreground">({v})</span>
    </span>
  );
}
