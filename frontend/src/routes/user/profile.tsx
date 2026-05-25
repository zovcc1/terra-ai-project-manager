import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Pencil, Mail, MapPin, Briefcase } from "lucide-react";

export const Route = createFileRoute("/user/profile")({
  head: () => ({ meta: [{ title: "الملف الشخصي — تيرّا" }] }),
  component: Page,
});

function Page() {
  return (
    <AppShell persona="user">
      <PageHeader
        title="الملف الشخصي"
        subtitle="معلوماتك الشخصية وتفضيلات الحساب."
        action={
          <Button size="lg" className="cta-glow gap-2">
            <Pencil className="h-4 w-4" />
            تعديل الملف الشخصي
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardContent className="flex flex-col items-center p-6 text-center">
            <Avatar className="h-24 w-24 border-4 border-card shadow-md">
              <AvatarFallback className="bg-accent/30 text-2xl font-semibold">س.ع</AvatarFallback>
            </Avatar>
            <h2 className="mt-4 text-xl font-bold">سارة العتيبي</h2>
            <p className="text-sm text-muted-foreground">مستخدم فردي</p>
            <div className="mt-6 w-full space-y-3 text-right text-sm">
              <Row icon={<Mail className="h-4 w-4" />} value="sara@terra.app" />
              <Row icon={<MapPin className="h-4 w-4" />} value="الرياض، المملكة العربية السعودية" />
              <Row icon={<Briefcase className="h-4 w-4" />} value="مصممة منتجات مستقلة" />
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardContent className="p-6">
            <h3 className="font-semibold">نبذة عني</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              مصممة منتجات بخبرة سبع سنوات في بناء تجارب رقمية بسيطة وإنسانية. أعمل حاليًا على
              مشاريع متعددة كمستقلة، وأبحث عن الانضمام لفرق تشاركني نفس القيم.
            </p>

            <h3 className="mt-6 font-semibold">المهارات</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {["تصميم تجربة المستخدم", "Figma", "أبحاث المستخدم", "أنظمة تصميم", "بروتوتايب"].map(
                (s) => (
                  <span
                    key={s}
                    className="rounded-full border border-border bg-secondary/60 px-3 py-1 text-xs"
                  >
                    {s}
                  </span>
                )
              )}
            </div>

            <h3 className="mt-6 font-semibold">إحصاءات النشاط</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <Stat label="مهام مكتملة" v="124" />
              <Stat label="مشاريع شاركت بها" v="18" />
              <Stat label="فرق سابقة" v="5" />
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

function Row({ icon, value }: { icon: React.ReactNode; value: string }) {
  return (
    <div className="flex items-center gap-2 text-muted-foreground">
      <span className="text-primary">{icon}</span>
      <span>{value}</span>
    </div>
  );
}

function Stat({ label, v }: { label: string; v: string }) {
  return (
    <div className="rounded-xl bg-secondary/50 p-4 text-center">
      <p className="text-2xl font-bold">{v}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
