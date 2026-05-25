import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, CheckCircle, XCircle } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { sendAiCommand, confirmAiAction, AiCommandResponse } from "@/lib/api";
import { toast } from "sonner";

type Message = {
  id: string;
  from: "me" | "them";
  who: string;
  text: string;
  time: string;
  pendingAction?: {
    actionId: number;
    resolved?: boolean;
    approved?: boolean;
  };
};

export function ChatBubble({ persona }: { persona: string }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      from: "them",
      who: "ت",
      text: "مرحباً! أنا المساعد الذكي الخاص بك. كيف يمكنني مساعدتك اليوم في إدارة مشاريعك؟",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

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
      // Hardcoded projectId = 1 for demo purposes. In a real app, this would be context-aware.
      const response = await sendAiCommand({ message: userMessage, projectId: 1 });
      
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        from: "them",
        who: "ت",
        text: response.aiMessage || "تم استلام الطلب.",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      if (response.requiresConfirmation && response.actionId) {
        aiMsg.pendingAction = { actionId: response.actionId };
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
          text: "عذراً، حدث خطأ أثناء معالجة طلبك.",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (messageId: string, actionId: number, approved: boolean) => {
    try {
      await confirmAiAction(actionId, approved);
      toast.success(approved ? "تم التأكيد بنجاح" : "تم إلغاء الإجراء");
      
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id === messageId && msg.pendingAction) {
            return {
              ...msg,
              pendingAction: { ...msg.pendingAction, resolved: true, approved },
            };
          }
          return msg;
        })
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
          <div ref={scrollRef} className="flex max-h-80 flex-col gap-3 overflow-y-auto bg-background/40 px-4 py-4">
            {messages.map((m) => (
              <div
                key={m.id}
                className={cn(
                  "flex items-end gap-2",
                  m.from === "me" ? "flex-row-reverse" : "flex-row"
                )}
              >
                <Avatar className="h-7 w-7 shrink-0">
                  <AvatarFallback
                    className={cn(
                      "text-[10px]",
                      m.from === "me"
                        ? "bg-primary text-primary-foreground"
                        : "bg-accent/20 text-accent-foreground"
                    )}
                  >
                    {m.who.slice(0, 1)}
                  </AvatarFallback>
                </Avatar>
                <div className={cn("flex max-w-[85%] flex-col", m.from === "me" ? "items-start" : "items-end")}>
                  <div
                    className={cn(
                      "rounded-2xl px-3.5 py-2 text-sm leading-relaxed shadow-sm",
                      m.from === "me"
                        ? "rounded-bl-sm bg-primary text-primary-foreground"
                        : "rounded-br-sm bg-card text-card-foreground border border-border"
                    )}
                  >
                    {m.text}
                    
                    {/* Pending Action UI */}
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
                    
                    {/* Resolved Action UI */}
                    {m.pendingAction && m.pendingAction.resolved && (
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
                  <AvatarFallback className="bg-accent/20 text-accent-foreground text-[10px]">ت</AvatarFallback>
                </Avatar>
                <div className="flex max-w-[75%] flex-col items-end">
                  <div className="rounded-2xl rounded-br-sm bg-card text-card-foreground border border-border px-3.5 py-2 text-sm">
                    <span className="animate-pulse">يكتب...</span>
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
              placeholder="اكتب رسالتك للمساعد الذكي…" 
              className="bg-background text-right" 
              disabled={loading}
            />
            <Button type="submit" size="icon" className="shrink-0" disabled={loading || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "group relative grid h-14 w-14 cursor-pointer place-items-center rounded-full bg-primary text-primary-foreground shadow-xl transition-transform hover:scale-105 active:scale-95",
          "cta-glow"
        )}
        aria-label="فتح المحادثة"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>
    </div>
  );
}
