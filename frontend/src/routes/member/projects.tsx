import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useState, useCallback, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AppShell, PageHeader, useHeaderSearch } from "@/components/app-shell";
import { requireRole } from "@/lib/route-guards";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Calendar,
  Flag,
  Loader2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  UserPlus,
  List,
  LayoutGrid,
  MessageSquare,
  Plus,
  Pencil,
  Trash2,
  FolderOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getProjectById,
  getMyTasks,
  getProjectMembers,
  getProjectStats,
  updateTaskStatus,
  getTaskComments,
  createComment,
  getMyProjects,
  getAuthToken,
} from "@/lib/api";
import type { Task, Comment, Project } from "@/lib/api";
import { wsConnect, subscribeTaskComments } from "@/lib/websocket";
import type { CommentEvent } from "@/lib/websocket";

export const Route = createFileRoute("/member/projects")({
  beforeLoad: () => requireRole("/member"),
  head: () => ({ meta: [{ title: "المشاريع — تيرّا" }] }),
  component: Page,
});

// ========== أنواع الأعمدة والدوال المساعدة ==========
type ColKey = "TODO" | "DOING" | "REVIEW" | "DONE";

const COLS: { key: ColKey; name: string; accent: string }[] = [
  { key: "TODO", name: "للقيام", accent: "bg-muted-foreground/40" },
  { key: "DOING", name: "قيد التنفيذ", accent: "bg-primary" },
  { key: "REVIEW", name: "مراجعة", accent: "bg-warning" },
  { key: "DONE", name: "مكتمل", accent: "bg-success" },
];

const STATUS_ORDER: ColKey[] = ["TODO", "DOING", "REVIEW", "DONE"];

function statusToCol(s: string): ColKey {
  const upper = s.toUpperCase();
  if (upper === "TODO" || upper === "DOING" || upper === "REVIEW" || upper === "DONE")
    return upper as ColKey;
  return "TODO";
}

function priorityLabel(p: string): string {
  const map: Record<string, string> = { HIGH: "عالية", MEDIUM: "متوسطة", LOW: "منخفضة" };
  return map[p?.toUpperCase()] || "متوسطة";
}

function priorityBadgeClass(p: string): string {
  const upper = (p || "MEDIUM").toUpperCase();
  if (upper === "HIGH") return "border-destructive/40 bg-destructive/10 text-destructive";
  if (upper === "MEDIUM") return "border-warning/40 bg-warning/15";
  return "border-border bg-secondary";
}

// ========== حوار تفاصيل المهمة والتعليقات ==========
function TaskDetailDialog({
  task,
  open,
  onOpenChange,
}: {
  task: Task;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [comment, setComment] = useState("");

  const { data: comments, isLoading: commentsLoading } = useQuery({
    queryKey: ["taskComments", task.id],
    queryFn: () => getTaskComments(task.id),
    enabled: open,
  });

  const commentMutation = useMutation({
    mutationFn: (content: string) => createComment(task.id, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["taskComments", task.id] });
      setComment("");
      toast.success("تم إضافة التعليق");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const handleSubmitComment = () => {
    if (!comment.trim()) return;
    commentMutation.mutate(comment.trim());
  };

  useEffect(() => {
    if (!open) return;
    const token = getAuthToken();
    if (!token) return;

    let cancelled = false;
    let unsubscribe: (() => void) | undefined;

    wsConnect(token)
      .then(() => {
        if (cancelled) return;
        unsubscribe = subscribeTaskComments(task.id, (event: CommentEvent) => {
          if ("type" in event && event.type === "DELETE_COMMENT") {
            queryClient.setQueryData<Comment[]>(["taskComments", task.id], (old = []) =>
              old.filter((c) => c.id !== event.commentId),
            );
          } else {
            const comment = event as Comment;
            queryClient.setQueryData<Comment[]>(["taskComments", task.id], (old = []) => {
              if (old.some((c) => c.id === comment.id)) return old;
              return [...old, comment];
            });
          }
        });
      })
      .catch(console.error);

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [task.id, open, queryClient]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{task.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium">الوصف</p>
            <p className="text-sm text-muted-foreground">
              {task.description || "لا يوجد وصف"}
            </p>
          </div>
          <div className="flex gap-4 text-sm">
            <div>
              <span className="font-medium">الأولوية: </span>
              <Badge variant="outline" className={priorityBadgeClass(task.priority)}>
                {priorityLabel(task.priority)}
              </Badge>
            </div>
            <div>
              <span className="font-medium">الحالة: </span>
              <span>{COLS.find((c) => c.key === statusToCol(task.status))?.name}</span>
            </div>
            {task.dueDate && (
              <div>
                <span className="font-medium">تاريخ الاستحقاق: </span>
                {new Date(task.dueDate).toLocaleDateString("ar-EG", {
                  day: "numeric",
                  month: "short",
                })}
              </div>
            )}
          </div>

          <div>
            <p className="text-sm font-medium mb-2">التعليقات</p>
            {commentsLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : comments && comments.length > 0 ? (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {comments.map((c: Comment) => (
                  <div key={c.id} className="text-sm border-b pb-1">
                    <span className="font-medium">{c.userFullName}</span>
                    <span className="text-muted-foreground ml-2">
                      {new Date(c.createdAt).toLocaleString("ar-EG")}
                    </span>
                    <p className="mt-1">{c.content}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">لا توجد تعليقات بعد</p>
            )}

            <div className="mt-3 flex gap-2">
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="أضف تعليقاً..."
                rows={2}
                className="text-sm"
              />
              <Button
                size="sm"
                onClick={handleSubmitComment}
                disabled={!comment.trim() || commentMutation.isPending}
              >
                {commentMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "إرسال"
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ========== عرض قائمة المهام (للأعضاء - معطل التعديل) ==========
function TaskListView({
  tasks,
  projectId,
}: {
  tasks: Task[];
  projectId: number;
}) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  if (!tasks.length)
    return <div className="text-center p-12 text-muted-foreground">لا توجد مهام لك في هذا المشروع.</div>;

  return (
    <Card>
      <CardContent className="p-0">
        {tasks.map((t, i) => (
          <div
            key={t.id}
            className={cn(
              "flex items-center justify-between gap-4 p-4",
              i !== tasks.length - 1 && "border-b border-border"
            )}
          >
            <div
              className="flex-1 cursor-pointer"
              onClick={() => setSelectedTask(t)}
            >
              <div className="flex items-center gap-2">
                <p className="font-medium">{t.title}</p>
                <Badge
                  variant="outline"
                  className={priorityBadgeClass(t.priority || "MEDIUM")}
                >
                  {priorityLabel(t.priority || "MEDIUM")}
                </Badge>
              </div>
              {t.description && (
                <p className="text-xs text-muted-foreground line-clamp-1">{t.description}</p>
              )}
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mt-1">
                <span>مسند إلى {t.assigneeName || `#${t.assigneeId}`}</span>
                {t.dueDate && (
                  <span>تاريخ: {new Date(t.dueDate).toLocaleDateString("ar-EG")}</span>
                )}
                <Badge variant="outline">{t.status}</Badge>
              </div>
            </div>
            <div className="flex gap-2 items-center">
              <Button
                size="sm"
                variant="outline"
                disabled
                className="opacity-50 cursor-not-allowed"
              >
                <Pencil className="h-3.5 w-3.5 ml-1" />
                تعديل
              </Button>
              <Button
                size="sm"
                variant="destructive"
                disabled
                className="opacity-50 cursor-not-allowed"
              >
                <Trash2 className="h-3.5 w-3.5 ml-1" />
                حذف
              </Button>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        ))}
      </CardContent>
      {selectedTask && (
        <TaskDetailDialog
          task={selectedTask}
          open={!!selectedTask}
          onOpenChange={(open) => { if (!open) setSelectedTask(null); }}
        />
      )}
    </Card>
  );
}

// ========== عرض الكانبان (للأعضاء - معطل بالكامل) ==========
function TaskKanbanView({ tasks, projectId }: { tasks: Task[]; projectId: number }) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = (e: React.DragEvent) => e.preventDefault();
  const preventDrag = (e: React.DragEvent) => e.preventDefault();

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {COLS.map((col) => {
        const cards = tasks.filter((t) => statusToCol(t.status) === col.key);
        return (
          <div
            key={col.key}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className="rounded-2xl border border-border bg-secondary/40 p-3"
          >
            <div className="mb-3 flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className={cn("h-2.5 w-2.5 rounded-full", col.accent)} />
                <span className="font-semibold">{col.name}</span>
                <span className="text-xs text-muted-foreground">({cards.length})</span>
              </div>
              <button
                disabled
                className="grid h-6 w-6 place-items-center rounded-md text-muted-foreground opacity-40 cursor-not-allowed"
                aria-label="إضافة مهمة (غير متاح)"
                title="إضافة مهمة (غير متاح للأعضاء)"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-2.5">
              {cards.length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">لا توجد مهام</p>
              )}
              {cards.map((t) => {
                const idx = STATUS_ORDER.indexOf(statusToCol(t.status));
                return (
                  <Card
                    key={t.id}
                    draggable={false}
                    onDragStart={preventDrag}
                    onClick={() => setSelectedTask(t)}
                    className="cursor-pointer border-border/80 transition-all hover:shadow-md"
                  >
                    <CardContent className="p-3.5">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium leading-snug flex-1">{t.title}</p>
                        <div className="flex items-center gap-1 opacity-30 pointer-events-none">
                          <button
                            disabled
                            className="grid h-6 w-6 place-items-center rounded-md text-muted-foreground"
                            aria-label="تعديل (غير متاح)"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            disabled
                            className="grid h-6 w-6 place-items-center rounded-md text-destructive"
                            aria-label="حذف (غير متاح)"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                      {t.description && (
                        <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                          {t.description}
                        </p>
                      )}
                      <div className="mt-3 flex items-center justify-between gap-2">
                        <Badge
                          variant="outline"
                          className={priorityBadgeClass(t.priority || "MEDIUM")}
                        >
                          {priorityLabel(t.priority || "MEDIUM")}
                        </Badge>
                        <div className="flex items-center gap-1">
                          <button
                            disabled
                            className="grid h-6 w-6 place-items-center rounded-md text-muted-foreground opacity-30 cursor-not-allowed"
                          >
                            <ArrowRight className="h-3.5 w-3.5" />
                          </button>
                          <button
                            disabled
                            className="grid h-6 w-6 place-items-center rounded-md text-muted-foreground opacity-30 cursor-not-allowed"
                          >
                            <ArrowLeft className="h-3.5 w-3.5" />
                          </button>
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="bg-accent/20 text-[10px]">
                              {t.assigneeName?.charAt(0) || "—"}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}
      {selectedTask && (
        <TaskDetailDialog
          task={selectedTask}
          open={!!selectedTask}
          onOpenChange={(open) => { if (!open) setSelectedTask(null); }}
        />
      )}
    </div>
  );
}

// ========== صفحة قائمة المشاريع ==========
function ProjectsListPage() {
  const { data: projects, isLoading, error } = useQuery({
    queryKey: ["myProjects"],
    queryFn: getMyProjects,
  });

  if (isLoading) {
    return (
      <AppShell persona="member">
        <PageHeader title="مشاريعي" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell persona="member">
        <PageHeader title="مشاريعي" />
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="p-6 text-center text-destructive">
            <AlertCircle className="h-10 w-10 mx-auto mb-2" />
            <p>حدث خطأ أثناء تحميل المشاريع</p>
          </CardContent>
        </Card>
      </AppShell>
    );
  }

  if (!projects || projects.length === 0) {
    return (
      <AppShell persona="member">
        <PageHeader title="مشاريعي" />
        <Card className="bg-muted/20">
          <CardContent className="p-12 text-center text-muted-foreground">
            <FolderOpen className="h-12 w-12 mx-auto mb-3 opacity-40" />
            <p>لا توجد مشاريع مسندة إليك حالياً.</p>
          </CardContent>
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell persona="member">
      <PageHeader title="مشاريعي" subtitle="جميع المشاريع التي تشارك فيها" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <Link
            key={project.id}
            to="/member/projects"
            search={{ id: project.id.toString() }}
            className="block transition-transform hover:scale-[1.02]"
          >
            <Card className="h-full cursor-pointer hover:border-primary/50">
              <CardContent className="p-5">
                <h3 className="text-lg font-semibold line-clamp-1">{project.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                  {project.description || "لا يوجد وصف"}
                </p>
                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {project.dueDate
                      ? new Date(project.dueDate).toLocaleDateString("ar-EG")
                      : "بدون موعد"}
                  </span>
                  <Badge variant="outline" className={priorityBadgeClass(project.priority)}>
                    {priorityLabel(project.priority)}
                  </Badge>
                </div>
                <div className="mt-2 h-1.5 w-full rounded-full bg-secondary">
                  <div
                    className="h-1.5 rounded-full bg-primary"
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
                <p className="mt-1 text-right text-xs text-muted-foreground">
                  التقدم: {project.progress}%
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}

// ========== صفحة تفاصيل المشروع ==========
function ProjectDetailPage({ projectId }: { projectId: number }) {
  const id = projectId;
  const [tab, setTab] = useState<"نظرة عامة" | "المهام" | "الفريق">("نظرة عامة");
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");

  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ["project", id],
    queryFn: () => getProjectById(id),
  });

  const { data: allMyTasks, isLoading: tasksLoading } = useQuery({
    queryKey: ["myTasks"],
    queryFn: getMyTasks,
  });

  const { query } = useHeaderSearch();
  const tasks = allMyTasks
    ? allMyTasks
        .filter((t) => t.projectId === id)
        .filter((t) => t.title.toLowerCase().includes(query.toLowerCase()))
    : [];

  const { data: members, isLoading: membersLoading } = useQuery({
    queryKey: ["projectMembers", id],
    queryFn: () => getProjectMembers(id),
  });
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["projectStats", id],
    queryFn: () => getProjectStats(id),
  });

  if (projectLoading) {
    return (
      <AppShell persona="member">
        <PageHeader title="جاري التحميل..." />
        <div className="space-y-4">
          <Skeleton className="h-12 w-48 rounded-xl" />
          <div className="grid gap-4 lg:grid-cols-3">
            <Skeleton className="lg:col-span-2 h-[300px] rounded-xl" />
            <Skeleton className="h-[300px] rounded-xl" />
          </div>
        </div>
      </AppShell>
    );
  }

  if (!project) {
    return (
      <AppShell persona="member">
        <div className="flex h-[400px] flex-col items-center justify-center text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-bold">المشروع غير موجود</h2>
          <Button variant="outline" asChild className="mt-4">
            <Link to="/member/projects">العودة إلى المشاريع</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell persona="member" projectId={id}>
      <PageHeader
        title={project.name}
        subtitle={`مشروع ${project.status === "ACTIVE" ? "نشط" : project.status}${
          project.dueDate
            ? ` — الموعد النهائي ${new Date(project.dueDate).toLocaleDateString("ar-EG", {
                day: "numeric",
                month: "long",
              })}`
            : ""
        }`}
        action={
          <Button variant="outline" asChild>
            <Link to="/member/projects">← جميع المشاريع</Link>
          </Button>
        }
      />

      <div className="mb-6 inline-flex rounded-2xl border border-border bg-card p-1">
        {(["نظرة عامة", "المهام", "الفريق"] as const).map((t) => (
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
                {project.description || "لا يوجد وصف متوفر لهذا المشروع."}
              </p>
              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                {statsLoading ? (
                  <>
                    <Skeleton className="h-20 rounded-xl" />
                    <Skeleton className="h-20 rounded-xl" />
                    <Skeleton className="h-20 rounded-xl" />
                  </>
                ) : (
                  <>
                    <Stat label="المهام الكلية" value={stats?.totalTasks.toString() || "0"} />
                    <Stat label="المكتملة" value={stats?.completedTasks.toString() || "0"} />
                    <Stat label="المتأخرة" value={stats?.overdueTasks.toString() || "0"} />
                  </>
                )}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <h3 className="text-base font-semibold">تفاصيل سريعة</h3>
              <div className="mt-4 space-y-3 text-sm">
                <Row
                  icon={<Calendar className="h-4 w-4" />}
                  label="الموعد النهائي"
                  value={
                    project.dueDate
                      ? new Date(project.dueDate).toLocaleDateString("ar-EG", {
                          day: "numeric",
                          month: "long",
                        })
                      : "—"
                  }
                />
                <Row icon={<Flag className="h-4 w-4" />} label="الأولوية" value={project.priority} />
                <Row icon={<UserPlus className="h-4 w-4" />} label="التقدم" value={`${project.progress}%`} />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {tab === "المهام" && (
        <div>
          <div className="mb-4 flex justify-between items-center">
            <div className="flex gap-2">
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4 ml-1" />
                قائمة
              </Button>
              <Button
                variant={viewMode === "kanban" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("kanban")}
              >
                <LayoutGrid className="h-4 w-4 ml-1" />
                كانبان
              </Button>
            </div>
            <Button size="sm" disabled className="opacity-50 cursor-not-allowed">
              <Plus className="h-4 w-4 ml-1" /> إضافة مهمة
            </Button>
          </div>

          {tasksLoading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : tasks.length > 0 ? (
            viewMode === "list" ? (
              <TaskListView tasks={tasks} projectId={id} />
            ) : (
              <TaskKanbanView tasks={tasks} projectId={id} />
            )
          ) : (
            <div className="text-center p-12 text-muted-foreground">
              لا توجد مهام مُسندة إليك في هذا المشروع.
            </div>
          )}
        </div>
      )}

      {tab === "الفريق" && (
        <div className="grid gap-3 sm:grid-cols-2">
          {membersLoading ? (
            <>
              <Skeleton className="h-20 rounded-xl" />
              <Skeleton className="h-20 rounded-xl" />
            </>
          ) : members && members.length > 0 ? (
            members.map((m) => (
              <Card key={m.id}>
                <CardContent className="flex items-center gap-3 p-4">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-accent/20">{m.fullName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{m.fullName}</p>
                    <p className="text-xs text-muted-foreground">
                      {m.role === "MANAGER" ? "مدير مشروع" : "عضو فريق"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-2 text-center p-12 text-muted-foreground">
              لا يوجد أعضاء فريق حالياً.
            </div>
          )}
        </div>
      )}
    </AppShell>
  );
}

// ========== الصفحة الرئيسية (تقرر إما عرض القائمة أو التفاصيل) ==========
function Page() {
  const search = useSearch({ from: Route.id }) as { id?: string };
  const projectId = search.id ? parseInt(search.id) : null;

  if (projectId) {
    return <ProjectDetailPage projectId={projectId} />;
  }
  return <ProjectsListPage />;
}

// ========== دوال مساعدة إضافية ==========
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