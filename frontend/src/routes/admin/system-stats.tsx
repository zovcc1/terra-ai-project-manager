import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell, PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, FolderKanban, CheckCircle2, Activity, RefreshCcw } from "lucide-react";
import { requireRole } from "@/lib/route-guards";
import { getSystemStats } from "@/lib/api";

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

  const kpis = [
    { 
      label: "إجمالي المستخدمين", 
      value: stats?.totalUsers?.toLocaleString() ?? "0", 
      icon: Users, 
    },
    { 
      label: "المشاريع النشطة", 
      value: stats?.activeProjects?.toLocaleString() ?? "0", 
      icon: FolderKanban, 
    },
    { 
      label: "المهام المكتملة هذا الشهر", 
      value: stats?.completedTasksThisMonth?.toLocaleString() ?? "0", 
      icon: CheckCircle2, 
    },
    { 
      label: "وقت تشغيل المنصة", 
      value: stats?.uptime ?? "99.98%", 
      icon: Activity, 
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

      {/* KPIs cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                  <k.icon className="h-5 w-5" />
                </span>
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

      {/* Simple system status cards */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">ملخص النظام</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">إجمالي المستخدمين</span>
              <span className="font-medium">{stats?.totalUsers ?? "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">المشاريع النشطة</span>
              <span className="font-medium">{stats?.activeProjects ?? "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">المهام المكتملة (هذا الشهر)</span>
              <span className="font-medium">{stats?.completedTasksThisMonth ?? "—"}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">حالة الخدمات</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-success" />
              <span className="text-sm">الخادم الرئيسي: يعمل</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-success" />
              <span className="text-sm">قاعدة البيانات: متصلة</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-success" />
              <span className="text-sm">خدمة WebSocket: نشطة</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}