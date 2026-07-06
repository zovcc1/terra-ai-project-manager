import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/app-shell";
import { requireRole } from "@/lib/route-guards";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Calendar, Flag, Loader2, AlertCircle, MessageSquare, Send, Trash2, Edit2, Check, X, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getTaskById,
  getProjectMembers,
  getTaskComments,
  addComment,
  updateComment,
  deleteComment,
  updateTaskStatus,
  type Task,
  type Comment,
} from "@/lib/api";
import { subscribeTaskComments, wsConnect } from "@/lib/websocket";
import type { CommentEvent } from "@/lib/websocket";

export const Route = createFileRoute("/manager/tasks/$taskId")({
  beforeLoad: () => requireRole("/manager"),
  head: () => ({ meta: [{ title: "تفاصيل المهمة — تيرّا" }] }),
  component: TaskDetailPage,
});

const statuses = [
  { label: "للقيام", value: "TODO" },
  { label: "قيد التنفيذ", value: "DOING" },
  { label: "مراجعة", value: "REVIEW" },
  { label: "مكتمل", value: "DONE" },
];

function TaskDetailPage() {
  const { taskId } = Route.useParams();
  const id = parseInt(taskId);
  const queryClient = useQueryClient();
  const [openStatus, setOpenStatus] = useState(false);

  const { data: task, isLoading: taskLoading } = useQuery({
    queryKey: ["task", id],
    queryFn: () => getTaskById(id),
  });

  const projectId = task?.projectId;
  const { data: members } = useQuery({
    queryKey: ["projectMembers", projectId],
    queryFn: () => getProjectMembers(projectId!),
    enabled: !!projectId,
  });

  const { data: comments, isLoading: commentsLoading, isError: commentsError } = useQuery({
    queryKey: ["taskComments", id],
    queryFn: () => getTaskComments(id),
    retry: false,
  });

useEffect(() => {
  const token = localStorage.getItem("terra_token");
  if (!token) return;

  let cancelled = false;
  let unsubscribe: (() => void) | undefined;

  wsConnect(token)
    .then(() => {
      if (cancelled) return;

      unsubscribe = subscribeTaskComments(id, (event: CommentEvent) => {
        if ("type" in event && event.type === "DELETE_COMMENT") {
          queryClient.setQueryData<Comment[]>(["taskComments", id], (old = []) =>
            old.filter((c) => c.id !== event.commentId)
          );
        } else {
          const comment = event as Comment;
          queryClient.setQueryData<Comment[]>(["taskComments", id], (old = []) => {
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
}, [id, queryClient]); // لا تضع taskId هنا كمتغير متغير

  const updateStatusMutation = useMutation({
    mutationFn: (status: string) => updateTaskStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task", id] });
      toast.success("تم تحديث الحالة");
      setOpenStatus(false);
    },
    onError: (err: any) => toast.error(err.message || "فشل تحديث الحالة"),
  });

  const addCommentMutation = useMutation({
    mutationFn: (content: string) => addComment(id, content),
    onSuccess: () => {
      // DO NOT update cache manually – WebSocket will deliver the new comment
      setNewComment("");
      setShowMentionPopover(false);
      toast.success("تم إضافة التعليق");
    },
    onError: (err: any) => toast.error(err.message || "فشل إضافة التعليق"),
  });

  const updateCommentMutation = useMutation({
    mutationFn: ({ commentId, content }: { commentId: number; content: string }) =>
      updateComment(id, commentId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["taskComments", id] });
      setEditingCommentId(null);
      setEditCommentContent("");
      toast.success("تم تحديث التعليق");
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: number) => deleteComment(id, commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["taskComments", id] });
      toast.success("تم حذف التعليق");
    },
  });

  const [newComment, setNewComment] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editCommentContent, setEditCommentContent] = useState("");
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionStart, setMentionStart] = useState(-1);
  const [showMentionPopover, setShowMentionPopover] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setNewComment(value);
    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = value.slice(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf("@");
    if (lastAtIndex !== -1 && cursorPos - lastAtIndex > 1) {
      const query = textBeforeCursor.slice(lastAtIndex + 1);
      if (query.length > 0 && !query.includes(" ")) {
        setMentionQuery(query);
        setMentionStart(lastAtIndex);
        setShowMentionPopover(true);
        return;
      }
    }
    setShowMentionPopover(false);
  };

  const insertMention = (username: string, fullName: string) => {
    if (mentionStart === -1) return;
    const before = newComment.slice(0, mentionStart);
    const after = newComment.slice(mentionStart + 1 + mentionQuery.length);
    const mentionText = `@${username} `;
    const newValue = before + mentionText + after;
    setNewComment(newValue);
    setShowMentionPopover(false);
    textareaRef.current?.focus();
  };

  const filteredMembers = members?.filter((m) =>
    m.username.toLowerCase().includes(mentionQuery.toLowerCase())
  );

  const handleSubmitComment = () => {
    if (!newComment.trim()) return;
    addCommentMutation.mutate(newComment);
  };

  if (taskLoading) {
    return (
      <AppShell persona="manager">
        <PageHeader title="جاري التحميل..." />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-48 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
          </div>
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </AppShell>
    );
  }

  if (!task) {
    return (
      <AppShell persona="manager">
        <div className="flex h-[400px] flex-col items-center justify-center text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-bold">المهمة غير موجودة</h2>
          <p className="text-muted-foreground mt-2">عذراً، لم نتمكن من العثور على المهمة المطلوبة.</p>
          <Button variant="outline" className="mt-4" onClick={() => window.history.back()}>العودة</Button>
        </div>
      </AppShell>
    );
  }

  const currentStatusLabel = statuses.find(s => s.value === task.status)?.label || task.status;

  return (
    <AppShell persona="manager" projectId={task.projectId}>
      <PageHeader title="تفاصيل المهمة" subtitle={`المشروع #${task.projectId} › المهام`} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold">{task.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {task.description || "لا يوجد وصف متوفر لهذه المهمة."}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Badge variant="outline" className="border-border bg-secondary/60">
                  {task.priority === "HIGH" ? "أولوية عالية" : task.priority === "MEDIUM" ? "أولوية متوسطة" : "أولوية منخفضة"}
                </Badge>
                <Badge variant="outline" className="border-border bg-secondary/60">
                  {task.status}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                التعليقات ({comments?.length || 0})
              </h3>
              <div className="mt-4 space-y-4 max-h-[400px] overflow-y-auto">
                {commentsLoading ? (
                  <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-primary/40" /></div>
                ) : commentsError ? (
                  <p className="text-center py-8 text-sm text-destructive">
                    تعذر تحميل التعليقات. قد لا تملك صلاحية الوصول إلى هذه المهمة.
                  </p>
                ) : comments && comments.length > 0 ? (
                  comments.map((c) => (
                    <div key={c.id} className="flex items-start gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-accent/20 text-xs">
                          {c.userFullName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 rounded-xl bg-secondary/50 p-3">
                        {editingCommentId === c.id ? (
                          <>
                            <Textarea
                              value={editCommentContent}
                              onChange={(e) => setEditCommentContent(e.target.value)}
                              className="text-sm mb-2"
                              rows={2}
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() =>
                                  updateCommentMutation.mutate({
                                    commentId: c.id,
                                    content: editCommentContent,
                                  })
                                }
                              >
                                <Check className="h-3 w-3 ml-1" /> حفظ
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setEditingCommentId(null);
                                  setEditCommentContent("");
                                }}
                              >
                                <X className="h-3 w-3 ml-1" /> إلغاء
                              </Button>
                            </div>
                          </>
                        ) : (
                          <>
                            <p className="text-xs font-semibold">{c.userFullName}</p>
                            <p className="mt-1 text-sm">{c.content}</p>
                            <div className="mt-1 flex justify-between items-center">
                              <p className="text-[10px] text-muted-foreground">
                                {new Date(c.createdAt).toLocaleString("ar-EG")}
                              </p>
                              <div className="flex gap-1">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-6 w-6"
                                  onClick={() => {
                                    setEditingCommentId(c.id);
                                    setEditCommentContent(c.content);
                                  }}
                                >
                                  <Edit2 className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-6 w-6 text-destructive"
                                  onClick={() => deleteCommentMutation.mutate(c.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center py-8 text-sm text-muted-foreground">لا توجد تعليقات بعد.</p>
                )}
              </div>

              <Separator className="my-4" />

              <div className="relative">
                <div className="flex gap-2">
                  <Textarea
                    ref={textareaRef}
                    value={newComment}
                    onChange={handleCommentChange}
                    placeholder="اكتب تعليقك... استخدم @ لذكر شخص"
                    className="flex-1 text-sm"
                    rows={2}
                  />
                  <Button
                    onClick={handleSubmitComment}
                    disabled={addCommentMutation.isPending || !newComment.trim()}
                    className="self-end"
                  >
                    {addCommentMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
                {showMentionPopover && filteredMembers && filteredMembers.length > 0 && (
                  <div className="absolute bottom-full mb-2 w-64 bg-popover border rounded-md shadow-lg z-10">
                    <div className="p-1 max-h-48 overflow-y-auto">
                      {filteredMembers.map((member) => (
                        <button
                          key={member.id}
                          className="flex items-center gap-2 w-full p-2 hover:bg-muted rounded-sm text-sm"
                          onClick={() => insertMention(member.username, member.fullName)}
                        >
                          <Avatar className="h-5 w-5"><AvatarFallback>{member.fullName.charAt(0)}</AvatarFallback></Avatar>
                          <span>{member.fullName}</span>
                          <span className="text-xs text-muted-foreground">@{member.username}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardContent className="space-y-4 p-5">
              <div>
                <p className="text-xs text-muted-foreground">الحالة</p>
                <div className="relative mt-2">
                  <Button
                    onClick={() => setOpenStatus((o) => !o)}
                    size="lg"
                    className="w-full justify-between"
                  >
                    <span className="inline-flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-primary-foreground/80" />
                      تغيير الحالة — {currentStatusLabel}
                    </span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                  {openStatus && (
                    <div className="absolute z-10 mt-2 w-full overflow-hidden rounded-xl border border-border bg-popover shadow-lg">
                      {statuses.map((s) => (
                        <button
                          key={s.value}
                          onClick={() => updateStatusMutation.mutate(s.value)}
                          className={cn(
                            "block w-full px-4 py-2.5 text-right text-sm hover:bg-muted",
                            s.value === task.status && "bg-primary/10 text-primary"
                          )}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3 border-t border-border pt-4 text-sm">
                <Row 
                  icon={<Calendar className="h-4 w-4" />} 
                  label="الاستحقاق" 
                  value={task.dueDate ? new Date(task.dueDate).toLocaleDateString("ar-EG", { day: 'numeric', month: 'long' }) : "—"} 
                />
                <Row icon={<Flag className="h-4 w-4" />} label="الأولوية" value={task.priority} />
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">المسند</span>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="bg-accent/20 text-[10px]">
                        {task.assigneeName?.charAt(0) || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{task.assigneeName || "غير معين"}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
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