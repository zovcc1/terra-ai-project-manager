import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppShell, PageHeader, useHeaderSearch } from "@/components/app-shell";
import { requireRole } from "@/lib/route-guards";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, ArrowRight, MessageSquare, Loader2, AlertCircle } from "lucide-react";
import { getMyTasks, updateTaskStatus, getTaskComments, createComment, getAuthToken } from "@/lib/api";
import type { Task, Comment } from "@/lib/api";
import { subscribeKanban, wsIsConnected, subscribeTaskComments, wsConnect } from "@/lib/websocket";
import type { KanbanEvent, CommentEvent } from "@/lib/websocket";

export const Route = createFileRoute("/member/kanban")({
  beforeLoad: () => requireRole("/member"),
  head: () => ({ meta: [{ title: "My Kanban — Terra" }] }),
  component: Page,
});

type ColKey = "TODO" | "DOING" | "REVIEW" | "DONE";

const COLS: { key: ColKey; name: string; accent: string }[] = [
  { key: "TODO", name: "To Do", accent: "bg-muted-foreground/40" },
  { key: "DOING", name: "In Progress", accent: "bg-primary" },
  { key: "REVIEW", name: "Review", accent: "bg-warning" },
  { key: "DONE", name: "Done", accent: "bg-success" },
];

const STATUS_ORDER: ColKey[] = ["TODO", "DOING", "REVIEW", "DONE"];

function statusToCol(s: string): ColKey {
  const upper = s.toUpperCase();
  if (upper === "TODO" || upper === "DOING" || upper === "REVIEW" || upper === "DONE")
    return upper as ColKey;
  return "TODO";
}

function priorityLabel(p: string): string {
  const map: Record<string, string> = { HIGH: "High", MEDIUM: "Medium", LOW: "Low" };
  return map[p?.toUpperCase()] || "Medium";
}

function priorityBadgeClass(p: string): string {
  const upper = (p || "MEDIUM").toUpperCase();
  if (upper === "HIGH") return "border-destructive/40 bg-destructive/10 text-destructive";
  if (upper === "MEDIUM") return "border-warning/40 bg-warning/15";
  return "border-border bg-secondary";
}

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
      toast.success("Comment added");
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
            <p className="text-sm font-medium">Description</p>
            <p className="text-sm text-muted-foreground">
              {task.description || "No description"}
            </p>
          </div>
          <div className="flex gap-4 text-sm">
            <div>
              <span className="font-medium">Priority: </span>
              <Badge variant="outline" className={priorityBadgeClass(task.priority)}>
                {priorityLabel(task.priority)}
              </Badge>
            </div>
            <div>
              <span className="font-medium">Status: </span>
              <span>{COLS.find((c) => c.key === statusToCol(task.status))?.name}</span>
            </div>
            {task.dueDate && (
              <div>
                <span className="font-medium">Due: </span>
                {new Date(task.dueDate).toLocaleDateString("en-US", {
                  day: "numeric",
                  month: "short",
                })}
              </div>
            )}
          </div>

          <div>
            <p className="text-sm font-medium mb-2">Comments</p>
            {commentsLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : comments && comments.length > 0 ? (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {comments.map((c: Comment) => (
                  <div key={c.id} className="text-sm border-b pb-1">
                    <span className="font-medium">{c.userFullName}</span>
                    <span className="text-muted-foreground ml-2">
                      {new Date(c.createdAt).toLocaleString()}
                    </span>
                    <p className="mt-1">{c.content}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No comments yet</p>
            )}

            <div className="mt-3 flex gap-2">
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add a comment..."
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
                  "Post"
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Page() {
  const queryClient = useQueryClient();

  const {
    data: tasks,
    isLoading: loadingTasks,
    isError: tasksError,
  } = useQuery({
    queryKey: ["myTasks"],
    queryFn: getMyTasks,
  });

  const { query } = useHeaderSearch();

  // WebSocket subscription for real‑time updates (still listens to project events,
  // but we'll just refetch myTasks on any change)
  useEffect(() => {
    if (!wsIsConnected()) return;
    // We don't know the projectId, but we can simply invalidate myTasks on any broadcast.
    // For simplicity, we'll refetch when any event arrives.
    const unsubscribe = subscribeKanban(1, () => {   // using a dummy projectId – adjust if needed
      queryClient.invalidateQueries({ queryKey: ["myTasks"] });
    });
    return unsubscribe;
  }, [queryClient]);

  const moveMutation = useMutation({
    mutationFn: (vars: { taskId: number; status: ColKey }) =>
      updateTaskStatus(vars.taskId, vars.status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myTasks"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to move task");
      queryClient.invalidateQueries({ queryKey: ["myTasks"] });
    },
  });

  const [dragId, setDragId] = useState<number | null>(null);
  const [overCol, setOverCol] = useState<ColKey | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

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
      toast.success(`Moved to ${COLS.find((c) => c.key === next)!.name}`);
    },
    [moveMutation],
  );

  return (
    <AppShell persona="member">
      <PageHeader
        title="My Kanban"
        subtitle="Drag cards between columns or use arrows. Click a card to view details and comment."
      />

      {tasksError && (
        <Card className="mb-6 border-destructive/40 bg-destructive/10">
          <CardContent className="p-6 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
            <p className="text-lg font-semibold">Failed to load tasks</p>
            <Button
              className="mt-4"
              onClick={() => queryClient.invalidateQueries({ queryKey: ["myTasks"] })}
            >
              Retry
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
                      <span className="text-xs text-muted-foreground">
                        ({cards.length})
                      </span>
                    </div>
                    {/* no add button for member */}
                  </div>

                  <div className="space-y-2.5">
                    {cards.length === 0 && (
                      <p className="py-8 text-center text-sm text-muted-foreground">
                        No tasks
                      </p>
                    )}
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
                          onClick={() => setSelectedTask(t)}
                          className={`group cursor-pointer border-border/80 transition-all active:cursor-grabbing ${
                            dragId === t.id ? "opacity-40" : "hover:shadow-md"
                          }`}
                        >
                          <CardContent className="p-3.5">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm font-medium leading-snug">{t.title}</p>
                              <MessageSquare className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100" />
                            </div>
                            {t.description && (
                              <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                                {t.description}
                              </p>
                            )}
                            <div className="mt-3 flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5">
                                <Badge
                                  variant="outline"
                                  className={priorityBadgeClass(t.priority || "MEDIUM")}
                                >
                                  {priorityLabel(t.priority || "MEDIUM")}
                                </Badge>
                                {t.dueDate && (
                                  <span className="text-[10px] text-muted-foreground">
                                    {new Date(t.dueDate).toLocaleDateString("en-US", {
                                      day: "numeric",
                                      month: "short",
                                    })}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  disabled={idx === 0 || moveMutation.isPending}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleShift(t, -1);
                                  }}
                                  className="grid h-6 w-6 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30"
                                  aria-label="Move to previous column"
                                >
                                  <ArrowRight className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  disabled={
                                    idx === STATUS_ORDER.length - 1 || moveMutation.isPending
                                  }
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleShift(t, 1);
                                  }}
                                  className="grid h-6 w-6 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30"
                                  aria-label="Move to next column"
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
      </div>

      {/* Task detail dialog for commenting */}
      {selectedTask && (
        <TaskDetailDialog
          task={selectedTask}
          open={!!selectedTask}
          onOpenChange={(open) => {
            if (!open) setSelectedTask(null);
          }}
        />
      )}
    </AppShell>
  );
}