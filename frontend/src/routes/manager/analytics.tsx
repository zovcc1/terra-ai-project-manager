import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell, PageHeader } from "@/components/app-shell";
import { requireRole } from "@/lib/route-guards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getManagerAnalytics } from "@/lib/api";

export const Route = createFileRoute("/manager/analytics")({
  beforeLoad: () => requireRole("/manager"),
  head: () => ({ meta: [{ title: "تحليلات المشاريع — تيرّا" }] }),
  component: Page,
});

function Page() {
  const { data, isLoading } = useQuery({
    queryKey: ["managerAnalytics"],
    queryFn: getManagerAnalytics,
  });

  return (
    <AppShell persona="manager">
      <PageHeader title="تحليلات المشاريع" subtitle="رؤى حول إنتاجية فرقك وتقدم مشاريعك." />

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="md:col-span-3 h-64 rounded-2xl" />
        </div>
      ) : data ? (
        <>
          <div className="grid gap-4 md:grid-cols-3 mb-6">
            <StatCard title="المشاريع النشطة" value={data.activeProjects} />
            <StatCard title="المشاريع المكتملة" value={data.completedProjects} />
            <StatCard title="إجمالي المشاريع" value={data.totalProjects} />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">المهام</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <ProgressRow
                    label="المهام المكتملة"
                    value={data.completedTasks}
                    total={data.totalTasks}
                    color="bg-success"
                  />
                  <ProgressRow
                    label="المهام المتأخرة"
                    value={data.overdueTasks}
                    total={data.totalTasks}
                    color="bg-destructive"
                  />
                  <div className="text-sm text-muted-foreground">
                    إجمالي المهام: {data.totalTasks}
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">نسبة الإنجاز</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center h-40">
                  <div className="text-4xl font-bold">{data.completionRate}%</div>
                  <p className="text-sm text-muted-foreground mt-2">من إجمالي المهام</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <div className="text-center p-12 text-muted-foreground">
          لا توجد بيانات تحليلية متاحة.
        </div>
      )}
    </AppShell>
  );
}

function StatCard({ title, value }: { title: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-6">
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-sm text-muted-foreground">{title}</p>
      </CardContent>
    </Card>
  );
}

function ProgressRow({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
}) {
  const percent = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span>{label}</span>
        <span>
          {value} ({percent}%)
        </span>
      </div>
      <div className="h-2 rounded-full bg-muted">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}