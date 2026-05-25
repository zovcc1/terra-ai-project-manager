import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export const Route = createFileRoute("/manager/create-project")({
  head: () => ({ meta: [{ title: "إنشاء مشروع — تيرّا" }] }),
  component: Page,
});

function Page() {
  return (
    <AppShell persona="manager">
      <PageHeader title="إنشاء مشروع جديد" subtitle="املأ التفاصيل لبدء مشروعك." />

      <Card className="max-w-3xl">
        <CardContent className="space-y-6 p-6">
          <div className="space-y-2">
            <Label htmlFor="name">اسم المشروع</Label>
            <Input id="name" placeholder="مثال: إعادة تصميم الموقع" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="desc">الوصف</Label>
            <Textarea
              id="desc"
              rows={4}
              placeholder="صف هدف المشروع، النطاق، والمخرجات المتوقعة…"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="due">الموعد النهائي</Label>
              <Input id="due" type="date" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority">الأولوية</Label>
              <select
                id="priority"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm"
                defaultValue="medium"
              >
                <option value="low">منخفضة</option>
                <option value="medium">متوسطة</option>
                <option value="high">عالية</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>الفريق</Label>
            <div className="rounded-xl border border-dashed border-border bg-secondary/40 p-4">
              <p className="text-xs text-muted-foreground">الأعضاء المختارون</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {["نورا الحربي", "خالد المطيري", "ريم الزهراني"].map((m) => (
                  <span
                    key={m}
                    className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs"
                  >
                    <Avatar className="h-5 w-5">
                      <AvatarFallback className="bg-accent/20 text-[10px]">
                        {m.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    {m}
                  </span>
                ))}
                <button className="rounded-full border border-dashed border-border px-3 py-1 text-xs text-muted-foreground hover:bg-muted">
                  + إضافة عضو
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-border pt-6">
            <Button variant="ghost">إلغاء</Button>
            <Button size="lg" className="cta-glow">
              إنشاء المشروع
            </Button>
          </div>
        </CardContent>
      </Card>
    </AppShell>
  );
}
