import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/app-shell";
import { requireRole } from "@/lib/route-guards";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar, MessageSquare, Loader2, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getProjects, getRecentActivity } from "@/lib/api";

export const Route = createFileRoute("/manager/dashboard")({
  beforeLoad: () => requireRole("/manager"),
  head: () => ({ meta: [{ title: "لوحة التحكم — تيرّا" }] }),
  component: DashboardPage,
});

function DashboardPage() {
  const {
    data: projects,
    isLoading: projectsLoading,
    error: projectsError,
  } = useQuery({
    queryKey: ["projects"],
    queryFn: getProjects,
  });

  const {
    data: activity,
    isLoading: activityLoading,
    error: activityError,
  } = useQuery({
    queryKey: ["recentActivity"],
    queryFn: getRecentActivity,
  });

  return (
    <AppShell persona="manager">
      <PageHeader
        title="لوحة التحكم"
        subtitle="نظرة عامة على مشاريعك ونشاط فرقك."
        action={
          <Button asChild size="lg" className="cta-glow gap-2">
            <Link to="/manager/create-project">
              <Plus className="h-4 w-4" />
              إنشاء مشروع جديد
            </Link>
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {projectsLoading && (
            <div className="flex justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {projectsError && (
            <Card className="border-destructive/20 bg-destructive/10">
              <CardContent className="p-4 text-destructive">
                خطأ في تحميل البيانات. يرجى التأكد من تشغيل الخادم الخلفي.
              </CardContent>
            </Card>
          )}

          {projects?.map((p) => (
            <Card key={p.id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <Link
                      to="/manager/projects/$projectId"
                      params={{ projectId: p.id.toString() }}
                      className="text-lg font-semibold hover:text-primary"
                    >
                      {p.name}
                    </Link>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {p.dueDate
                          ? new Date(p.dueDate).toLocaleDateString("ar-EG", {
                              day: "numeric",
                              month: "long",
                            })
                          : "—"}
                      </span>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      p.status === "ACTIVE"
                        ? "border-success/40 bg-success/10 text-success"
                        : "border-destructive/40 bg-destructive/10 text-destructive"
                    }
                  >
                    {p.status === "ACTIVE" ? "نشط" : p.status}
                  </Badge>
                </div>
                <div className="mt-4">
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">التقدم</span>
                    <span className="font-medium">{p.progress}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${p.progress}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {!projectsLoading && projects?.length === 0 && (
            <div className="text-center p-12 text-muted-foreground">لا توجد مشاريع حالياً.</div>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">آخر النشاط</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {activityLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary/40" />
              </div>
            ) : activityError ? (
              <div className="p-4 text-center text-sm text-destructive">فشل تحميل النشاط</div>
            ) : activity && activity.length > 0 ? (
              activity.map((a) => (
                <div key={a.id} className="flex items-start gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-accent/20 text-xs">
                      {a.sourceUserName?.at(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm">
                      <span className="font-medium">{a.sourceUserName}</span> {a.content}
                    </p>
                    <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <MessageSquare className="h-3 w-3" />
                      {formatDate(a.createdAt)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-sm text-muted-foreground">لا يوجد نشاط مؤخراً.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

function formatDate(dateStr: string) {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return "الآن";
    if (minutes < 60) return `قبل ${minutes} دقيقة`;
    if (hours < 24) return `قبل ${hours} ساعة`;
    return `قبل ${days} يوم`;
  } catch {
    return dateStr;
  }
}
