import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell, PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Users, FolderKanban, CheckCircle2, Activity, RefreshCcw } from "lucide-react";
import { requireRole } from "@/lib/route-guards";
import { getSystemStats, getAnalyticsInsights } from "@/lib/api";

export const Route = createFileRoute("/admin/system-stats")({
  beforeLoad: () => requireRole("/admin"),
  head: () => ({ meta: [{ title: "إحصاءات النظام — تيرّا" }] }),
  component: Page,
});

function Page() {
  const { 
    data: stats, 
    isLoading: statsLoading, 
    refetch: refetchStats 
  } = useQuery({
    queryKey: ["systemStats"],
    queryFn: getSystemStats,
  });

  const { 
    data: insights, 
    isLoading: insightsLoading 
  } = useQuery({
    queryKey: ["analyticsInsights"],
    queryFn: getAnalyticsInsights,
  });

  const kpis = [
    { 
      label: "إجمالي المستخدمين", 
      value: stats?.totalUsers.toLocaleString() || "0", 
      icon: Users, 
      delta: "+4.2%" 
    },
    { 
      label: "المشاريع النشطة", 
      value: stats?.activeProjects.toLocaleString() || "0", 
      icon: FolderKanban, 
      delta: "+8" 
    },
    { 
      label: "المهام المكتملة هذا الشهر", 
      value: stats?.completedTasksThisMonth.toLocaleString() || "0", 
      icon: CheckCircle2, 
      delta: "+12%" 
    },
    { 
      label: "وقت تشغيل المنصة", 
      value: stats?.uptime || "99.98%", 
      icon: Activity, 
      delta: "مستقر" 
    },
  ];

  return (
    <AppShell persona="admin">
      <PageHeader 
        title="إحصاءات النظام" 
        subtitle="نظرة سريعة على صحة المنصة وأدائها." 
        action={
          <Button variant="outline" size="sm" onClick={() => refetchStats()} className="gap-2">
            <RefreshCcw className="h-4 w-4" />
            تحديث البيانات
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                  <k.icon className="h-5 w-5" />
                </span>
                <span className="text-xs font-medium text-success">{k.delta}</span>
              </div>
              {statsLoading ? (
                <Skeleton className="mt-4 h-8 w-20" />
              ) : (
                <p className="mt-4 text-2xl font-bold">{k.value}</p>
              )}
              <p className="text-xs text-muted-foreground">{k.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dynamic Bottleneck alerts */}
      {insightsLoading ? (
        <Skeleton className="mt-6 h-32 w-full rounded-2xl" />
      ) : insights && insights.length > 0 ? (
        insights
          .filter((i) => !i.isDismissed)
          .map((insight) => (
            <Card key={insight.id} className="mt-6 border-warning/40 bg-warning/10">
              <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
                <div className="flex items-start gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-warning/30 text-warning-foreground">
                    <AlertTriangle className="h-5 w-5" />
                  </span>
                  <div>
                    <CardTitle className="text-base">{insight.message || `تنبيه ${insight.suggestionType || "تحليلي"}`}</CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {insight.suggestionType === "BOTTLENECK" ? "تم اكتشاف ضغط في سير العمل. ننصح بإعادة التوزيع." : "تنبيه من محرك التحليل الذكي."}
                    </p>
                  </div>
                </div>
                <Button size="lg" className="cta-glow shrink-0">
                  عرض التفاصيل
                </Button>
              </CardHeader>
            </Card>
          ))
      ) : null}

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">نشاط المنصة (آخر 30 يومًا)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-48 items-end gap-1.5">
              {Array.from({ length: 30 }).map((_, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t bg-primary/70"
                  style={{ height: `${30 + Math.abs(Math.sin(i)) * 70}%` }}
                />
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">أعلى الفرق إنتاجية</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {["فريق التطوير", "فريق التصميم", "فريق المنتج", "فريق التسويق"].map((t, i) => (
              <div key={t}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span>{t}</span>
                  <span className="text-muted-foreground">{92 - i * 8}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${92 - i * 8}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
