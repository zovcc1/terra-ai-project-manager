import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell, PageHeader, useHeaderSearch } from "@/components/app-shell";
import { requireRole } from "@/lib/route-guards";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Calendar, Loader2, AlertCircle } from "lucide-react";
import { getMyTasks } from "@/lib/api";

export const Route = createFileRoute("/member/my-tasks")({
  beforeLoad: () => requireRole("/member"),
  head: () => ({ meta: [{ title: "مهامي — تيرّا" }] }),
  component: Page,
});

function Page() {
  const { data: tasks, isLoading, isError } = useQuery({
    queryKey: ["myTasks"],
    queryFn: getMyTasks,
  });

  const { query } = useHeaderSearch();
  const filteredTasks = tasks?.filter((t) =>
    t.title.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <AppShell persona="member">
      <PageHeader title="مهامي" subtitle="جميع المهام المسندة إليك عبر جميع المشاريع." />

      {isLoading ? (
        <div className="flex h-64 items-center justify-center rounded-2xl border border-border bg-card">
          <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
        </div>
      ) : isError ? (
        <Card className="border-destructive/20 bg-destructive/5 text-destructive">
          <CardContent className="flex flex-col items-center justify-center p-12">
            <AlertCircle className="mb-4 h-12 w-12" />
            <p className="text-lg font-bold">عذراً، حدث خطأ أثناء تحميل المهام</p>
            <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>إعادة المحاولة</Button>
          </CardContent>
        </Card>
      ) : tasks && tasks.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            {filteredTasks?.map((t, i) => (
              <div
                key={t.id}
                className={
                  "flex flex-wrap items-center justify-between gap-4 p-4" +
                  (i !== filteredTasks.length - 1 ? " border-b border-border" : "")
                }
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    className="mt-1 h-5 w-5 cursor-pointer rounded border-border accent-[oklch(0.52_0.08_150)]"
                  />
                  <div>
                    <Link 
                      to="/member/tasks/$taskId" 
                      params={{ taskId: t.id.toString() }}
                      className="font-medium hover:text-primary transition-colors"
                    >
                      {t.title}
                    </Link>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {t.dueDate ? new Date(t.dueDate).toLocaleDateString("ar-EG", { day: 'numeric', month: 'long' }) : "—"}
                      </span>
                      <Badge
                        variant="outline"
                        className={
                          t.priority === "HIGH"
                            ? "border-destructive/40 bg-destructive/10 text-destructive"
                            : t.priority === "MEDIUM"
                              ? "border-warning/40 bg-warning/15"
                              : "border-border bg-secondary"
                        }
                      >
                        {t.priority === "HIGH" ? "عالية" : t.priority === "MEDIUM" ? "متوسطة" : "منخفضة"}
                      </Badge>
                      <Badge variant="outline" className="border-border bg-secondary/50">
                        {t.status}
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
      ) : (
        <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 text-center">
           <p className="text-muted-foreground">لا توجد مهام مسندة إليك حالياً.</p>
           <Button variant="link" asChild className="mt-2"><Link to="/member/kanban">تصفح لوحة المهام</Link></Button>
        </div>
      )}
    </AppShell>
  );
}
