import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Calendar, Flag, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/member/task-detail")({
  head: () => ({ meta: [{ title: "تفاصيل المهمة — تيرّا" }] }),
  component: Page,
});

const statuses = ["للقيام", "قيد التنفيذ", "مراجعة", "مكتمل"];

function Page() {
  const [status, setStatus] = useState("قيد التنفيذ");
  const [open, setOpen] = useState(false);

  return (
    <AppShell persona="member">
      <PageHeader title="تفاصيل المهمة" subtitle="إعادة تصميم الموقع › المهام" />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold">بناء واجهة لوحة التحكم</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                تنفيذ واجهة لوحة التحكم الجديدة بناءً على تصاميم Figma المعتمدة، مع الالتزام بنظام
                التصميم Terra والتأكد من دعم اتجاه الكتابة من اليمين لليسار في جميع المكوّنات.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Badge variant="outline" className="border-border bg-secondary/60">
                  واجهة أمامية
                </Badge>
                <Badge variant="outline" className="border-border bg-secondary/60">
                  أولوية عالية
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold">التعليقات (3)</h3>
              <div className="mt-4 space-y-4">
                {[
                  { who: "نورا الحربي", text: "تم اعتماد التصميم النهائي، يمكنك البدء بالتنفيذ." },
                  { who: "خالد المطيري", text: "سأبدأ ببناء المكوّنات الأساسية اليوم." },
                  { who: "ليلى السبيعي", text: "تذكير: تأكد من اختبار الوضع الليلي." },
                ].map((c, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-accent/20 text-xs">
                        {c.who.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 rounded-xl bg-secondary/50 p-3">
                      <p className="text-xs font-semibold">{c.who}</p>
                      <p className="mt-1 text-sm">{c.text}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex gap-2">
                <Input placeholder="أضف تعليقًا…" />
                <Button variant="outline">إرسال</Button>
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
                    onClick={() => setOpen((o) => !o)}
                    size="lg"
                    className="cta-glow w-full justify-between"
                  >
                    <span className="inline-flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-primary-foreground/80" />
                      تغيير الحالة — {status}
                    </span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                  {open && (
                    <div className="absolute z-10 mt-2 w-full overflow-hidden rounded-xl border border-border bg-popover shadow-lg">
                      {statuses.map((s) => (
                        <button
                          key={s}
                          onClick={() => {
                            setStatus(s);
                            setOpen(false);
                          }}
                          className={cn(
                            "block w-full px-4 py-2.5 text-right text-sm hover:bg-muted",
                            s === status && "bg-primary/10 text-primary"
                          )}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3 border-t border-border pt-4 text-sm">
                <Row icon={<Calendar className="h-4 w-4" />} label="الاستحقاق" value="18 أغسطس" />
                <Row icon={<Flag className="h-4 w-4" />} label="الأولوية" value="عالية" />
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">المسند</span>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="bg-accent/20 text-[10px]">خ</AvatarFallback>
                    </Avatar>
                    <span className="font-medium">خالد المطيري</span>
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
