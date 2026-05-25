import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar, MessageSquare, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getProjects } from "@/lib/api";

export const Route = createFileRoute("/manager/dashboard")({
  head: () => ({ meta: [{ title: "لوحة التحكم — تيرّا" }] }),
  component: DashboardPage,
});

const activity = [
  { who: "نورا", what: "أضافت مهمة جديدة في إعادة تصميم الموقع", when: "قبل 5 دقائق" },
  { who: "خالد", what: "أكمل مهمة «إعداد قاعدة البيانات»", when: "قبل ساعة" },
  { who: "ريم", what: "علّقت على مهمة في حملة الخريف", when: "قبل ساعتين" },
  { who: "سعد", what: "غيّر حالة مهمة إلى مراجعة", when: "اليوم" },
];

export function DashboardPage() {
  const { data: projects, isLoading, error } = useQuery({
    queryKey: ["projects"],
    queryFn: getProjects,
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
          {isLoading && (
            <div className="flex justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
          
          {error && (
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
                      to="/manager/project-detail"
                      className="text-lg font-semibold hover:text-primary"
                    >
                      {p.name}
                    </Link>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(p.dueDate).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long' })}
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

          {!isLoading && projects?.length === 0 && (
            <div className="text-center p-12 text-muted-foreground">
              لا توجد مشاريع حالياً.
            </div>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">آخر النشاط</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {activity.map((a, i) => (
              <div key={i} className="flex items-start gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-accent/20 text-xs">{a.who.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm">
                    <span className="font-medium">{a.who}</span> {a.what}
                  </p>
                  <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <MessageSquare className="h-3 w-3" />
                    {a.when}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
