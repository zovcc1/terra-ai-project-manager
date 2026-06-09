import { useState, useRef, useEffect, useCallback } from "react";
import { MessageCircle, X, Send, CheckCircle, XCircle, Sparkles, Wand2 } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { sendAiCommand, confirmAiAction } from "@/lib/api";
import type { AiCommandResponse, PendingAction } from "@/lib/api";
import { toast } from "sonner";
import { subscribeAiPending, wsIsConnected } from "@/lib/websocket";

type Message = {
  id: string;
  from: "me" | "them";
  who: string;
  text: string;
  time: string;
  isAction?: boolean;
  actionType?: string;
  pendingAction?: {
    actionId: number;
    resolved?: boolean;
    approved?: boolean;
  };
};

const WELCOME_MSG: Message = {
  id: "welcome",
  from: "them",
  who: "ت",
  text: "مرحباً! أنا المساعد الذكي لتيرّا. يمكنني مساعدتك في إدارة مهامك عبر جميع مشاريعك. جرّب قول:\n\n• \"أضف مهمة جديدة بعنوان تصميم الصفحة في مشروع X\"\n• \"انقل مهمة Setup Database إلى مكتمل\"\n• \"حذف مهمة تحسين الأداء\"\n• \"عيّن مهمة كتابة المحتوى للعضو رقم 2\"\n• \"حلل حالة المشاريع\"",
  time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
};

export function ChatBubble({ persona }: { persona: string }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME_MSG]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  // WebSocket listeners (unchanged)
  useEffect(() => {
    if (!wsIsConnected()) return;

    const unsubscribe = subscribeAiPending((action: PendingAction) => {
      const aiMsg: Message = {
        id: `ws-${action.id}-${Date.now()}`,
        from: "them",
        who: "ت",
        text: `طلب إجراء جديد: ${action.naturalLanguageCommand || action.actionType}\n\nيرجى مراجعة والإقرار.`,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        isAction: true,
        actionType: action.actionType,
        pendingAction: { actionId: action.id },
      };
      setMessages((prev) => [...prev, aiMsg]);
      toast.info("طلب إجراء جديد من المساعد الذكي");
    });

    return unsubscribe;
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");

    const newMsg: Message = {
      id: Date.now().toString(),
      from: "me",
      who: "أنا",
      text: userMessage,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, newMsg]);
    setLoading(true);

    try {
      // لم نعد نرسل projectId
      const response: AiCommandResponse = await sendAiCommand({ message: userMessage });

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        from: "them",
        who: "ت",
        text: response.aiMessage || "تم استلام الطلب.",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        isAction: !!response.executedAction,
        actionType: response.executedAction?.actionType,
      };

      if (response.requiresConfirmation && response.actionId) {
        aiMsg.pendingAction = { actionId: response.actionId };
      }

      if (response.executedAction) {
        const a = response.executedAction;
        const actionLabels: Record<string, string> = {
          CREATE: "✅ تم إنشاء مهمة",
          UPDATE: "✏️ تم تحديث مهمة",
          MOVE: "↕️ تم نقل مهمة",
          DELETE: "🗑️ تم حذف مهمة",
          ASSIGN: "👤 تم تعيين مهمة",
        };
        aiMsg.text = `${actionLabels[a.actionType] || a.actionType}: «${a.taskTitle || a.title || "—"}»\n${response.aiMessage || ""}`;
      }

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      toast.error(err.message || "حدث خطأ أثناء التواصل مع الذكاء الاصطناعي");
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          from: "them",
          who: "ت",
          text: "عذراً، حدث خطأ أثناء معالجة طلبك. تأكد من إعداد مفتاح API.",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // confirm/deny logic unchanged
  const handleConfirm = async (messageId: string, actionId: number, approved: boolean) => {
    try {
      await confirmAiAction(actionId, approved);
      toast.success(approved ? "تم تأكيد الإجراء بنجاح" : "تم إلغاء الإجراء");

      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id === messageId && msg.pendingAction) {
            return {
              ...msg,
              pendingAction: { ...msg.pendingAction, resolved: true, approved },
              text: approved
                ? `${msg.text}\n\n✅ تم التأكيد وتنفيذ الإجراء.`
                : `${msg.text}\n\n❌ تم الإلغاء.`,
            };
          }
          return msg;
        }),
      );
    } catch (err: any) {
      toast.error(err.message || "حدث خطأ أثناء التأكيد");
    }
  };

  return (
    <div className="fixed bottom-6 left-6 z-40" dir="rtl">
      {open && (
        <div className="mb-3 w-80 overflow-hidden rounded-2xl border border-border bg-card shadow-2xl sm:w-96">
          {/* Header */}
          <div className="flex items-center justify-between gap-3 border-b border-border bg-primary/5 px-4 py-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border border-border">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                  ت
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-semibold leading-tight">مساعد تيرّا الذكي</p>
                <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-success" />
                  متصل الآن
                </p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="إغلاق"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            className="flex max-h-80 flex-col gap-3 overflow-y-auto bg-background/40 px-4 py-4"
          >
            {messages.map((m) => (
              <div
                key={m.id}
                className={cn(
                  "flex items-end gap-2",
                  m.from === "me" ? "flex-row-reverse" : "flex-row",
                )}
              >
                <Avatar className="h-7 w-7 shrink-0">
                  <AvatarFallback
                    className={cn(
                      "text-[10px]",
                      m.from === "me"
                        ? "bg-primary text-primary-foreground"
                        : m.isAction
                          ? "bg-warning/20 text-warning-foreground"
                          : "bg-accent/20 text-accent-foreground",
                    )}
                  >
                    {m.from === "me" ? m.who.slice(0, 1) : m.isAction ? "⚡" : "ت"}
                  </AvatarFallback>
                </Avatar>
                <div
                  className={cn(
                    "flex max-w-[85%] flex-col",
                    m.from === "me" ? "items-start" : "items-end",
                  )}
                >
                  <div
                    className={cn(
                      "rounded-2xl px-3.5 py-2 text-sm leading-relaxed shadow-sm whitespace-pre-line",
                      m.from === "me"
                        ? "rounded-bl-sm bg-primary text-primary-foreground"
                        : m.isAction
                          ? "rounded-br-sm bg-warning/10 text-card-foreground border border-warning/30"
                          : "rounded-br-sm bg-card text-card-foreground border border-border",
                    )}
                  >
                    {m.isAction && m.actionType && (
                      <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold">
                        <Wand2 className="h-3.5 w-3.5 text-primary" />
                        {actionTypeLabel(m.actionType)}
                      </p>
                    )}
                    {m.text}

                    {m.pendingAction && !m.pendingAction.resolved && (
                      <div className="mt-3 flex gap-2 border-t border-border/50 pt-3">
                        <Button
                          size="sm"
                          variant="default"
                          className="h-7 flex-1 gap-1 text-xs"
                          onClick={() => handleConfirm(m.id, m.pendingAction!.actionId, true)}
                        >
                          <CheckCircle className="h-3 w-3" />
                          تأكيد
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="h-7 flex-1 gap-1 text-xs"
                          onClick={() => handleConfirm(m.id, m.pendingAction!.actionId, false)}
                        >
                          <XCircle className="h-3 w-3" />
                          إلغاء
                        </Button>
                      </div>
                    )}

                    {m.pendingAction?.resolved && (
                      <div className="mt-2 text-xs font-semibold opacity-80">
                        {m.pendingAction.approved ? "✅ تم التأكيد" : "❌ تم الإلغاء"}
                      </div>
                    )}
                  </div>
                  <span className="mt-1 text-[10px] text-muted-foreground">{m.time}</span>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-end gap-2 flex-row">
                <Avatar className="h-7 w-7 shrink-0">
                  <AvatarFallback className="bg-accent/20 text-accent-foreground text-[10px]">
                    ت
                  </AvatarFallback>
                </Avatar>
                <div className="flex max-w-[75%] flex-col items-end">
                  <div className="rounded-2xl rounded-br-sm bg-card text-card-foreground border border-border px-3.5 py-2 text-sm">
                    <span className="animate-pulse flex items-center gap-2">
                      <Sparkles className="h-3.5 w-3.5 animate-spin text-primary" />
                      جاري المعالجة...
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Composer */}
          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-2 border-t border-border bg-card px-3 py-3"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="اسأل عن أي مشروع..."
              className="bg-background text-right"
              disabled={loading}
            />
            <Button
              type="submit"
              size="icon"
              className="shrink-0"
              disabled={loading || !input.trim()}
            >
              {loading ? (
                <Sparkles className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        </div>
      )}

      {/* Floating button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "group relative grid h-14 w-14 cursor-pointer place-items-center rounded-full bg-primary text-primary-foreground shadow-xl transition-transform hover:scale-105 active:scale-95",
          "cta-glow",
          open && "ring-4 ring-primary/30",
        )}
        aria-label="فتح المحادثة"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
        {!open && (
          <span className="absolute -top-1 -left-1 grid h-5 w-5 place-items-center rounded-full bg-warning text-[10px] text-warning-foreground">
            <Sparkles className="h-3 w-3" />
          </span>
        )}
      </button>
    </div>
  );
}

function actionTypeLabel(type: string): string {
  const map: Record<string, string> = {
    CREATE: "إنشاء مهمة",
    UPDATE: "تحديث مهمة",
    MOVE: "نقل مهمة",
    DELETE: "حذف مهمة",
    ASSIGN: "تعيين مهمة",
    NONE: "بدون إجراء",
  };
  return map[type?.toUpperCase()] || type;
}