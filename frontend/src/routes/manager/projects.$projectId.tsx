import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/app-shell";
import { requireRole } from "@/lib/route-guards";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Link } from "@tanstack/react-router";
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
import {
  Calendar,
  Flag,
  Loader2,
  AlertCircle,
  Plus,
  Trash2,
  ArrowRight,
  ArrowLeft,
  UserPlus,
  List,
  LayoutGrid,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getProjectById,
  getProjectTasks,
  getProjectMembers,
  getProjectStats,
  createTask,
  updateTaskStatus,
  deleteTask,
  updateTask,
} from "@/lib/api";
import type { Task } from "@/lib/api";

export const Route = createFileRoute("/manager/projects/$projectId")({
  beforeLoad: () => requireRole("/manager"),
  head: () => ({ meta: [{ title: "تفاصيل المشروع — تيرّا" }] }),
  component: Page,
});

const tabs = ["نظرة عامة", "المهام", "الفريق"] as const;
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

// ========== حوار مشترك لإضافة / تعديل مهمة ==========
function TaskDialog({
  open,
  onOpenChange,
  task,
  projectId,
  onSuccess,
  trigger,
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  task?: Task | null;
  projectId: number;
  onSuccess: (data: any) => void;
  trigger?: React.ReactNode;
}) {
  const [title, setTitle] = useState(task?.title || "");
  const [description, setDescription] = useState(task?.description || "");
  const [priority, setPriority] = useState(task?.priority || "MEDIUM");
  const [assigneeId, setAssigneeId] = useState<string>(
    task?.assigneeId?.toString() || "none"
  );
  const [dueDate, setDueDate] = useState(task?.dueDate?.split("T")[0] || "");
  const [status, setStatus] = useState(task?.status || "TODO");

  const { data: members } = useQuery({
    queryKey: ["projectMembers", projectId],
    queryFn: () => getProjectMembers(projectId),
    enabled: open,
  });

  const handleSubmit = () => {
    if (!title.trim()) return;
    onSuccess({
      id: task?.id,
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      assigneeId: assigneeId === "none" ? null : parseInt(assigneeId),
      dueDate: dueDate || null,
      status: status as ColKey,
    });
    if (!task) {
      setTitle("");
      setDescription("");
      setPriority("MEDIUM");
      setAssigneeId("none");
      setDueDate("");
      setStatus("TODO");
    }
    onOpenChange?.(false);
  };

  const content = (
    <div className="grid gap-4 py-4">
      <div>
        <Label>العنوان *</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="عنوان المهمة" />
      </div>
      <div>
        <Label>الوصف</Label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="وصف المهمة"
          rows={3}
        />
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
      {task && (
        <div>
          <Label>الحالة</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COLS.map((c) => (
                <SelectItem key={c.key} value={c.key}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );

  return trigger ? (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{task ? "تعديل المهمة" : "إضافة مهمة جديدة"}</DialogTitle>
        </DialogHeader>
        {content}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange?.(false)}>
            إلغاء
          </Button>
          <Button onClick={handleSubmit}>{task ? "تحديث" : "إنشاء"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  ) : (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{task ? "تعديل المهمة" : "إضافة مهمة جديدة"}</DialogTitle>
        </DialogHeader>
        {content}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange?.(false)}>
            إلغاء
          </Button>
          <Button onClick={handleSubmit}>{task ? "تحديث" : "إنشاء"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ========== عرض المهام على شكل قائمة (List) مع عمليات CRUD ==========
function TaskListView({
  tasks,
  projectId,
  refetch,
}: {
  tasks: Task[];
  projectId: number;
  refetch: () => void;
}) {
  const queryClient = useQueryClient();
  const [editTask, setEditTask] = useState<Task | null>(null);

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projectTasks", projectId] });
      toast.success("تم حذف المهمة");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => updateTask(data.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projectTasks", projectId] });
      toast.success("تم تحديث المهمة");
    },
  });

  if (!tasks.length)
    return <div className="text-center p-12 text-muted-foreground">لا توجد مهام حالياً.</div>;

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
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Link
                  to="/manager/tasks/$taskId"
                  params={{ taskId: t.id.toString() }}
                  className="font-medium hover:text-primary transition-colors"
                >
                  {t.title}
                </Link>
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
                <span>مسند إلى {t.assigneeId ? `#${t.assigneeId}` : "غير معين"}</span>
                {t.dueDate && (
                  <span>تاريخ: {new Date(t.dueDate).toLocaleDateString("ar-EG")}</span>
                )}
                <Badge variant="outline">{t.status}</Badge>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setEditTask(t)}>
                تعديل
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => deleteMutation.mutate(t.id)}
                disabled={deleteMutation.isPending}
              >
                حذف
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
      <TaskDialog
        open={!!editTask}
        onOpenChange={(o) => !o && setEditTask(null)}
        task={editTask}
        projectId={projectId}
        onSuccess={(data) => updateMutation.mutate(data)}
      />
    </Card>
  );
}

// ========== عرض المهام على شكل كانبان مع CRUD ==========
function TaskKanbanView({ tasks, projectId }: { tasks: Task[]; projectId: number }) {
  const queryClient = useQueryClient();
  const [dragId, setDragId] = useState<number | null>(null);
  const [overCol, setOverCol] = useState<ColKey | null>(null);
  const [createDialogCol, setCreateDialogCol] = useState<ColKey | null>(null);
  const [editTask, setEditTask] = useState<Task | null>(null);

  const createMutation = useMutation({
    mutationFn: (data: any) => createTask(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projectTasks", projectId] });
      toast.success("تمت إضافة المهمة");
    },
  });

  const moveMutation = useMutation({
    mutationFn: ({ taskId, status }: { taskId: number; status: ColKey }) =>
      updateTaskStatus(taskId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projectTasks", projectId] });
    },
    onError: (err: any) => {
      toast.error(err.message || "فشل نقل المهمة");
      queryClient.invalidateQueries({ queryKey: ["projectTasks", projectId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projectTasks", projectId] });
      toast.success("تم حذف المهمة");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => updateTask(data.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projectTasks", projectId] });
      toast.success("تم تحديث المهمة");
    },
  });

  const handleDrop = useCallback(
    (status: ColKey) => {
      if (dragId !== null) moveMutation.mutate({ taskId: dragId, status });
      setDragId(null);
      setOverCol(null);
    },
    [dragId, moveMutation]
  );

  const handleShift = useCallback(
    (task: Task, dir: -1 | 1) => {
      const col = statusToCol(task.status);
      const idx = STATUS_ORDER.indexOf(col);
      const next = STATUS_ORDER[idx + dir];
      if (next) moveMutation.mutate({ taskId: task.id, status: next });
    },
    [moveMutation]
  );

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {COLS.map((col) => {
        const cards = tasks.filter((t) => statusToCol(t.status) === col.key);
        const isOver = overCol === col.key;
        return (
          <div
            key={col.key}
            onDragOver={(e) => {
              e.preventDefault();
              setOverCol(col.key);
            }}
            onDragLeave={() => setOverCol((cur) => (cur === col.key ? null : cur))}
            onDrop={() => handleDrop(col.key)}
            className={cn(
              "rounded-2xl border p-3 transition-colors",
              isOver ? "border-primary bg-primary/5" : "border-border bg-secondary/40"
            )}
          >
            <div className="mb-3 flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className={cn("h-2.5 w-2.5 rounded-full", col.accent)} />
                <span className="font-semibold">{col.name}</span>
                <span className="text-xs text-muted-foreground">({cards.length})</span>
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                onClick={() => setCreateDialogCol(col.key)}
              >
                <Plus className="h-4 w-4" />
              </Button>
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
                    draggable
                    onDragStart={() => setDragId(t.id)}
                    onDragEnd={() => {
                      setDragId(null);
                      setOverCol(null);
                    }}
                    className="group cursor-grab border-border/80 transition-all hover:shadow-md active:cursor-grabbing"
                  >
                    <CardContent className="p-3.5">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium leading-snug flex-1">{t.title}</p>
                        <div className="flex items-center gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100"
                            onClick={() => setEditTask(t)}
                          >
                            <span className="sr-only">تعديل</span>
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="lucide lucide-pencil"
                            >
                              <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                              <path d="m15 5 4 4" />
                            </svg>
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 text-destructive"
                            onClick={() => deleteMutation.mutate(t.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
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
                            disabled={idx === 0}
                            onClick={() => handleShift(t, -1)}
                            className="grid h-6 w-6 place-items-center rounded-md text-muted-foreground hover:bg-muted disabled:opacity-30"
                          >
                            <ArrowRight className="h-3.5 w-3.5" />
                          </button>
                          <button
                            disabled={idx === 3}
                            onClick={() => handleShift(t, 1)}
                            className="grid h-6 w-6 place-items-center rounded-md text-muted-foreground hover:bg-muted disabled:opacity-30"
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
      <TaskDialog
        open={!!createDialogCol}
        onOpenChange={(o) => !o && setCreateDialogCol(null)}
        projectId={projectId}
        onSuccess={(data) => createMutation.mutate({ ...data, status: createDialogCol })}
      />
      <TaskDialog
        open={!!editTask}
        onOpenChange={(o) => !o && setEditTask(null)}
        task={editTask}
        projectId={projectId}
        onSuccess={(data) => updateMutation.mutate(data)}
      />
    </div>
  );
}

// ========== الصفحة الرئيسية ==========
function Page() {
  const { projectId } = Route.useParams();
  const id = parseInt(projectId);
  const [tab, setTab] = useState<(typeof tabs)[number]>("نظرة عامة");
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");

  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ["project", id],
    queryFn: () => getProjectById(id),
  });
  const {
    data: tasks,
    isLoading: tasksLoading,
    refetch: refetchTasks,
  } = useQuery({
    queryKey: ["projectTasks", id],
    queryFn: () => getProjectTasks(id),
  });
  const { data: members, isLoading: membersLoading } = useQuery({
    queryKey: ["projectMembers", id],
    queryFn: () => getProjectMembers(id),
  });
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["projectStats", id],
    queryFn: () => getProjectStats(id),
  });

  if (projectLoading)
    return (
      <AppShell persona="manager">
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

  if (!project)
    return (
      <AppShell persona="manager">
        <div className="flex h-[400px] flex-col items-center justify-center text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-bold">المشروع غير موجود</h2>
          <Button variant="outline" className="mt-4" onClick={() => window.history.back()}>
            العودة
          </Button>
        </div>
      </AppShell>
    );

  return (
    <AppShell persona="manager" projectId={id}>
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
          <Button size="lg" className="cta-glow gap-2">
            <UserPlus className="h-4 w-4" />
            تعيين مهمة
          </Button>
        }
      />

      <div className="mb-6 inline-flex rounded-2xl border border-border bg-card p-1">
        {tabs.map((t) => (
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
            <TaskDialog
              projectId={id}
              onSuccess={(data) =>
                createTask(id, { ...data, status: "TODO" }).then(() => refetchTasks())
              }
              trigger={<Button size="sm">+ إضافة مهمة</Button>}
            />
          </div>

          {tasksLoading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : tasks ? (
            viewMode === "list" ? (
              <TaskListView tasks={tasks} projectId={id} refetch={refetchTasks} />
            ) : (
              <TaskKanbanView tasks={tasks} projectId={id} />
            )
          ) : (
            <div className="text-center p-12 text-muted-foreground">لا توجد مهام حالياً.</div>
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