import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppShell, PageHeader, useHeaderSearch } from "@/components/app-shell";
import { requireRole } from "@/lib/route-guards";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sparkles, ArrowLeft, ArrowRight, Plus, Loader2, AlertCircle, Trash2 } from "lucide-react";
import {
  getProjectTasks,
  createTask,
  updateTaskStatus,
  deleteTask,
  dismissInsight,
  getKanbanInsights,
  getProjectMembers,
} from "@/lib/api";
import type { Task, KanbanInsight } from "@/lib/api";
import { subscribeKanban, wsIsConnected } from "@/lib/websocket";
import type { KanbanEvent } from "@/lib/websocket";

export const Route = createFileRoute("/manager/kanban")({
  beforeLoad: () => requireRole("/manager"),
  head: () => ({ meta: [{ title: "لوحة كانبان — مدير" }] }),
  component: Page,
});

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
  if (upper === "TODO" || upper === "DOING" || upper === "REVIEW" || upper === "DONE") return upper as ColKey;
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

function CreateTaskDialog({
  projectId,
  columnKey,
  onSuccess,
  children,
}: {
  projectId: number;
  columnKey: ColKey;
  onSuccess: (data: any) => void;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [assigneeId, setAssigneeId] = useState<string>("");
  const [dueDate, setDueDate] = useState("");

  const { data: members } = useQuery({
    queryKey: ["projectMembers", projectId],
    queryFn: () => getProjectMembers(projectId),
    enabled: open,
  });

  const handleSubmit = () => {
    if (!title.trim()) return;
    onSuccess({
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      assigneeId: assigneeId ? parseInt(assigneeId) : null,
      dueDate: dueDate || null,
      status: columnKey,
    });
    setOpen(false);
    setTitle("");
    setDescription("");
    setPriority("MEDIUM");
    setAssigneeId("");
    setDueDate("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>إضافة مهمة جديدة</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div>
            <Label>العنوان *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="عنوان المهمة" />
          </div>
          <div>
            <Label>الوصف</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="وصف المهمة" rows={3} />
          </div>
          <div>
            <Label>الأولوية</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LOW">منخفضة</SelectItem>
                <SelectItem value="MEDIUM">متوسطة</SelectItem>
                <SelectItem value="HIGH">عالية</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>المسند</Label>
            <Select value={assigneeId} onValueChange={setAssigneeId}>
              <SelectTrigger>
                <SelectValue placeholder="غير معين" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">غير معين</SelectItem>
                {members?.map((m) => (
                  <SelectItem key={m.id} value={m.id.toString()}>
                    {m.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>تاريخ الاستحقاق</Label>
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>إلغاء</Button>
          <Button onClick={handleSubmit}>إنشاء</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Page() {
  const queryClient = useQueryClient();
  const projectId = 1;

  const {
    data: tasks,
    isLoading: loadingTasks,
    isError: tasksError,
  } = useQuery({
    queryKey: ["projectTasks", projectId],
    queryFn: () => getProjectTasks(projectId),
  });

  const { data: insights } = useQuery({
    queryKey: ["kanbanInsights", projectId],
    queryFn: () => getKanbanInsights(projectId),
  });

  const { query } = useHeaderSearch();

  useEffect(() => {
    if (!wsIsConnected()) return;
    const unsubscribe = subscribeKanban(projectId, (event: KanbanEvent) => {
      queryClient.setQueryData<Task[]>(["projectTasks", projectId], (prev = []) => {
        if ("type" in event && event.type === "DELETE_TASK") {
          return prev.filter((t) => t.id !== event.taskId);
        }
        const task = event as Task;
        const exists = prev.some((t) => t.id === task.id);
        return exists ? prev.map((t) => (t.id === task.id ? task : t)) : [...prev, task];
      });
    });
    return unsubscribe;
  }, [projectId, queryClient]);

  const createMutation = useMutation({
    mutationFn: (vars: {
      title: string;
      status: ColKey;
      description?: string;
      priority?: string;
      assigneeId?: number | null;
      dueDate?: string | null;
    }) =>
      createTask(projectId, {
        title: vars.title,
        status: vars.status,
        description: vars.description,
        priority: vars.priority || "MEDIUM",
        assigneeId: vars.assigneeId,
        dueDate: vars.dueDate,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projectTasks", projectId] });
      toast.success("تمت إضافة المهمة");
    },
  });

  const moveMutation = useMutation({
    mutationFn: (vars: { taskId: number; status: ColKey }) =>
      updateTaskStatus(vars.taskId, vars.status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projectTasks", projectId] });
    },
    onError: (err: any) => {
      toast.error(err.message || "فشل نقل المهمة");
      queryClient.invalidateQueries({ queryKey: ["projectTasks", projectId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (taskId: number) => deleteTask(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projectTasks", projectId] });
      toast.success("تم حذف المهمة");
    },
  });

  const [dragId, setDragId] = useState<number | null>(null);
  const [overCol, setOverCol] = useState<ColKey | null>(null);

  const activeInsight = useMemo(() => {
    return insights?.find((i: KanbanInsight) => !i.isDismissed);
  }, [insights]);

  const dismissMutation = useMutation({
    mutationFn: (id: number) => dismissInsight(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kanbanInsights", projectId] });
    },
  });

  const handleDrop = useCallback(
    (status: ColKey) => {
      if (dragId !== null) {
        moveMutation.mutate({ taskId: dragId, status });
      }
      setDragId(null);
      setOverCol(null);
    },
    [dragId, moveMutation],
  );

  const handleShift = useCallback(
    (task: Task, dir: -1 | 1) => {
      const col = statusToCol(task.status);
      const idx = STATUS_ORDER.indexOf(col);
      const next = STATUS_ORDER[idx + dir];
      if (!next) return;
      moveMutation.mutate({ taskId: task.id, status: next });
      toast.success(`تم نقل المهمة إلى «${COLS.find((c) => c.key === next)!.name}»`);
    },
    [moveMutation],
  );

  const handleDelete = useCallback(
    (id: number) => {
      deleteMutation.mutate(id);
    },
    [deleteMutation],
  );

  const handleAcceptInsight = useCallback(
    (insight: KanbanInsight) => {
      if (insight.taskIds) {
        try {
          const ids: number[] = JSON.parse(insight.taskIds);
          if (ids.length > 0) {
            moveMutation.mutate({ taskId: ids[0], status: "DONE" });
          }
        } catch {
          // ignore
        }
      }
      dismissMutation.mutate(insight.id);
      toast.success("تم قبول الاقتراح الذكي");
    },
    [moveMutation, dismissMutation],
  );

  return (
    <AppShell persona="manager" projectId={projectId}>
      <PageHeader title="لوحة كانبان" subtitle="اسحب البطاقات بين الأعمدة أو استخدم الأسهم. يمكنك أيضاً استخدام المساعد الذكي." />

      {activeInsight ? (
        <Card className="mb-6 border-primary/40 bg-primary/8">
          <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/20 text-primary">
                <Sparkles className="h-5 w-5" />
              </span>
              <div>
                <p className="font-semibold">اقتراح ذكي: {activeInsight.message || `اقتراح ذكي للمهمة #${activeInsight.taskIds}`}</p>
                <p className="text-sm text-muted-foreground">{activeInsight.suggestionType || "لم يطرأ تغيير على المهمة منذ فترة."}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => dismissMutation.mutate(activeInsight.id)} disabled={dismissMutation.isPending}>
                تجاهل
              </Button>
              <Button size="lg" className="cta-glow gap-2" onClick={() => handleAcceptInsight(activeInsight)} disabled={dismissMutation.isPending || moveMutation.isPending}>
                <ArrowLeft className="h-4 w-4" />
                قبول النقل الذكي
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {tasksError && (
        <Card className="mb-6 border-destructive/40 bg-destructive/10">
          <CardContent className="p-6 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
            <p className="text-lg font-semibold">فشل تحميل المهام</p>
            <Button className="mt-4" onClick={() => queryClient.invalidateQueries({ queryKey: ["projectTasks", projectId] })}>
              إعادة المحاولة
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {loadingTasks
          ? COLS.map((c) => (
              <div key={c.key} className="rounded-2xl border border-border bg-secondary/40 p-3">
                <Skeleton className="h-6 w-24 mb-3" />
                <Skeleton className="h-24 w-full rounded-xl mb-2" />
                <Skeleton className="h-24 w-full rounded-xl" />
              </div>
            ))
          : COLS.map((c) => {
              const cards = (tasks || [])
                .filter((t) => t.title.toLowerCase().includes(query.toLowerCase()))
                .filter((t) => statusToCol(t.status) === c.key);
              const isOver = overCol === c.key;
              return (
                <div
                  key={c.key}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setOverCol(c.key);
                  }}
                  onDragLeave={() => setOverCol((cur) => (cur === c.key ? null : cur))}
                  onDrop={() => handleDrop(c.key)}
                  className={`rounded-2xl border p-3 transition-colors ${
                    isOver ? "border-primary bg-primary/5" : "border-border bg-secondary/40"
                  }`}
                >
                  <div className="mb-3 flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${c.accent}`} />
                      <span className="font-semibold">{c.name}</span>
                      <span className="text-xs text-muted-foreground">({cards.length})</span>
                    </div>
                    <CreateTaskDialog
                      projectId={projectId}
                      columnKey={c.key}
                      onSuccess={(newTask) => createMutation.mutate(newTask)}
                    >
                      <button
                        className="grid h-6 w-6 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                        aria-label="إضافة مهمة"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </CreateTaskDialog>
                  </div>

                  <div className="space-y-2.5">
                    {cards.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">لا توجد مهام</p>}
                    {cards.map((t) => {
                      const col = statusToCol(t.status);
                      const idx = STATUS_ORDER.indexOf(col);
                      return (
                        <Card
                          key={t.id}
                          draggable
                          onDragStart={() => setDragId(t.id)}
                          onDragEnd={() => {
                            setDragId(null);
                            setOverCol(null);
                          }}
                          className={`group cursor-grab border-border/80 transition-all active:cursor-grabbing ${
                            dragId === t.id ? "opacity-40" : "hover:shadow-md"
                          }`}
                        >
                          <CardContent className="p-3.5">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm font-medium leading-snug">{t.title}</p>
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  onClick={() => handleDelete(t.id)}
                                  className="opacity-0 transition-opacity group-hover:opacity-100"
                                  aria-label="حذف"
                                  title="حذف المهمة"
                                >
                                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                                </button>
                              </div>
                            </div>
                            {t.description && <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{t.description}</p>}
                            <div className="mt-3 flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5">
                                <Badge variant="outline" className={priorityBadgeClass(t.priority || "MEDIUM")}>
                                  {priorityLabel(t.priority || "MEDIUM")}
                                </Badge>
                                {t.dueDate && (
                                  <span className="text-[10px] text-muted-foreground">
                                    {new Date(t.dueDate).toLocaleDateString("ar-EG", { day: "numeric", month: "short" })}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  disabled={idx === 0 || moveMutation.isPending}
                                  onClick={() => handleShift(t, -1)}
                                  className="grid h-6 w-6 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30"
                                  aria-label="نقل للعمود السابق"
                                >
                                  <ArrowRight className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  disabled={idx === STATUS_ORDER.length - 1 || moveMutation.isPending}
                                  onClick={() => handleShift(t, 1)}
                                  className="grid h-6 w-6 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30"
                                  aria-label="نقل للعمود التالي"
                                >
                                  <ArrowLeft className="h-3.5 w-3.5" />
                                </button>
                                <Avatar className="h-6 w-6">
                                  <AvatarFallback className="bg-accent/20 text-[10px]">
                                    {t.assigneeId ? String(t.assigneeId) : "—"}
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
      </div>
    </AppShell>
  );
}