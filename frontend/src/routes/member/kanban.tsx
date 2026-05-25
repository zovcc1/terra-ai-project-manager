import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Sparkles, ArrowLeft, ArrowRight, Plus, X } from "lucide-react";

export const Route = createFileRoute("/member/kanban")({
  head: () => ({ meta: [{ title: "لوحة كانبان — تيرّا" }] }),
  component: Page,
});

type Priority = "عالية" | "متوسطة" | "منخفضة";
type ColKey = "todo" | "doing" | "review" | "done";
type Task = { id: string; title: string; who: string; priority: Priority; col: ColKey };

const COLS: { key: ColKey; name: string; accent: string }[] = [
  { key: "todo", name: "للقيام", accent: "bg-muted-foreground/40" },
  { key: "doing", name: "قيد التنفيذ", accent: "bg-primary" },
  { key: "review", name: "مراجعة", accent: "bg-warning" },
  { key: "done", name: "مكتمل", accent: "bg-success" },
];

const initial: Task[] = [
  { id: "k1", title: "تصميم شعار الحملة", who: "ن", priority: "متوسطة", col: "todo" },
  { id: "k2", title: "كتابة محتوى الصفحة", who: "ر", priority: "منخفضة", col: "todo" },
  { id: "k3", title: "بناء واجهة لوحة التحكم", who: "خ", priority: "عالية", col: "doing" },
  { id: "k4", title: "تحسين أداء الاستعلامات", who: "س", priority: "متوسطة", col: "doing" },
  { id: "k5", title: "مراجعة دليل التصميم", who: "ن", priority: "متوسطة", col: "doing" },
  { id: "k6", title: "اختبار صفحة الدفع", who: "ل", priority: "عالية", col: "review" },
  { id: "k7", title: "إعداد قاعدة البيانات", who: "خ", priority: "عالية", col: "done" },
  { id: "k8", title: "تكامل البريد الإلكتروني", who: "ع", priority: "متوسطة", col: "done" },
];

const ORDER: ColKey[] = ["todo", "doing", "review", "done"];

function Page() {
  const [tasks, setTasks] = useState<Task[]>(initial);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<ColKey | null>(null);
  const [adding, setAdding] = useState<ColKey | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [smartDone, setSmartDone] = useState(false);

  const move = (id: string, target: ColKey) => {
    setTasks((p) => p.map((t) => (t.id === id ? { ...t, col: target } : t)));
  };

  const shift = (t: Task, dir: -1 | 1) => {
    const idx = ORDER.indexOf(t.col);
    const next = ORDER[idx + dir];
    if (!next) return;
    move(t.id, next);
    toast.success(`تم نقل المهمة إلى «${COLS.find((c) => c.key === next)!.name}»`);
  };

  const onDrop = (col: ColKey) => {
    if (dragId) {
      move(dragId, col);
      toast.success("تم نقل المهمة");
    }
    setDragId(null);
    setOverCol(null);
  };

  const addTask = (col: ColKey) => {
    if (!newTitle.trim()) {
      setAdding(null);
      return;
    }
    setTasks((p) => [
      ...p,
      { id: `k${Date.now()}`, title: newTitle, who: "أ", priority: "متوسطة", col },
    ]);
    setNewTitle("");
    setAdding(null);
    toast.success("تمت إضافة مهمة");
  };

  const remove = (id: string) => {
    setTasks((p) => p.filter((t) => t.id !== id));
  };

  return (
    <AppShell persona="member">
      <PageHeader title="لوحة كانبان" subtitle="اسحب البطاقات بين الأعمدة أو استخدم الأسهم." />

      {!smartDone && (
        <Card className="mb-6 border-primary/40 bg-primary/8">
          <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/20 text-primary">
                <Sparkles className="h-5 w-5" />
              </span>
              <div>
                <p className="font-semibold">اقتراح ذكي: انقل «اختبار صفحة الدفع» إلى مكتمل</p>
                <p className="text-sm text-muted-foreground">
                  لم يطرأ تغيير على المهمة منذ 3 أيام بعد آخر مراجعة ناجحة.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setSmartDone(true)}>تجاهل</Button>
              <Button
                size="lg"
                className="cta-glow gap-2"
                onClick={() => {
                  setTasks((p) => p.map((t) => (t.id === "k6" ? { ...t, col: "done" } : t)));
                  setSmartDone(true);
                  toast.success("تم قبول النقل الذكي");
                }}
              >
                <ArrowLeft className="h-4 w-4" />
                قبول النقل الذكي
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {COLS.map((c) => {
          const cards = tasks.filter((t) => t.col === c.key);
          const isOver = overCol === c.key;
          return (
            <div
              key={c.key}
              onDragOver={(e) => {
                e.preventDefault();
                setOverCol(c.key);
              }}
              onDragLeave={() => setOverCol((cur) => (cur === c.key ? null : cur))}
              onDrop={() => onDrop(c.key)}
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
                <button
                  className="grid h-6 w-6 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                  onClick={() => {
                    setAdding(c.key);
                    setNewTitle("");
                  }}
                  aria-label="إضافة مهمة"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              {adding === c.key && (
                <div className="mb-2 rounded-xl border border-primary/40 bg-card p-2">
                  <Input
                    autoFocus
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") addTask(c.key);
                      if (e.key === "Escape") setAdding(null);
                    }}
                    placeholder="عنوان المهمة…"
                    className="mb-2 h-8 text-sm"
                  />
                  <div className="flex justify-end gap-1">
                    <Button size="sm" variant="ghost" onClick={() => setAdding(null)}>إلغاء</Button>
                    <Button size="sm" className="cta-glow" onClick={() => addTask(c.key)}>إضافة</Button>
                  </div>
                </div>
              )}

              <div className="space-y-2.5">
                {cards.map((t) => {
                  const idx = ORDER.indexOf(t.col);
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
                          <button
                            onClick={() => remove(t.id)}
                            className="opacity-0 transition-opacity group-hover:opacity-100"
                            aria-label="حذف"
                          >
                            <X className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                          </button>
                        </div>
                        <div className="mt-3 flex items-center justify-between">
                          <Badge
                            variant="outline"
                            className={
                              t.priority === "عالية"
                                ? "border-destructive/40 bg-destructive/10 text-destructive"
                                : t.priority === "متوسطة"
                                  ? "border-warning/40 bg-warning/15"
                                  : "border-border bg-secondary"
                            }
                          >
                            {t.priority}
                          </Badge>
                          <div className="flex items-center gap-1">
                            <button
                              disabled={idx === 0}
                              onClick={() => shift(t, -1)}
                              className="grid h-6 w-6 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30"
                              aria-label="نقل للعمود السابق"
                            >
                              <ArrowRight className="h-3.5 w-3.5" />
                            </button>
                            <button
                              disabled={idx === ORDER.length - 1}
                              onClick={() => shift(t, 1)}
                              className="grid h-6 w-6 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30"
                              aria-label="نقل للعمود التالي"
                            >
                              <ArrowLeft className="h-3.5 w-3.5" />
                            </button>
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="bg-accent/20 text-[10px]">{t.who}</AvatarFallback>
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
