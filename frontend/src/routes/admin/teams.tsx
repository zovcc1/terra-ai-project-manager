import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Users, Crown, Calendar, FolderKanban } from "lucide-react";

export const Route = createFileRoute("/admin/teams")({
  head: () => ({ meta: [{ title: "إدارة الفرق — تيرّا" }] }),
  component: Page,
});

type Team = {
  id: string;
  name: string;
  members: string[];
  projects: number;
  lead: string;
  desc: string;
  createdAt: string;
};

const ALL_MEMBERS = [
  "نورا الحربي", "خالد المطيري", "ريم الزهراني", "سعد العتيبي",
  "ليلى السبيعي", "عبدالله القرني", "هند الدوسري", "ماجد الشهري",
];

const initial: Team[] = [
  { id: "t1", name: "فريق التصميم", members: ["نورا الحربي", "هند الدوسري", "ريم الزهراني"], projects: 4, lead: "نورا الحربي", desc: "فريق متخصص بتجربة المستخدم وأنظمة التصميم.", createdAt: "2024-01-12" },
  { id: "t2", name: "فريق التطوير", members: ["خالد المطيري", "ماجد الشهري", "سعد العتيبي"], projects: 6, lead: "خالد المطيري", desc: "بناء وصيانة المنصة.", createdAt: "2023-09-04" },
  { id: "t3", name: "فريق التسويق", members: ["ريم الزهراني", "هند الدوسري"], projects: 3, lead: "ريم الزهراني", desc: "حملات إبداعية ومحتوى رقمي.", createdAt: "2024-03-21" },
  { id: "t4", name: "فريق العمليات", members: ["سعد العتيبي", "عبدالله القرني"], projects: 2, lead: "سعد العتيبي", desc: "تحسين العمليات اليومية.", createdAt: "2024-02-08" },
  { id: "t5", name: "فريق المنتج", members: ["ليلى السبيعي", "نورا الحربي"], projects: 5, lead: "ليلى السبيعي", desc: "إدارة المنتج وتطوير الميزات.", createdAt: "2023-11-30" },
  { id: "t6", name: "فريق الدعم", members: ["عبدالله القرني", "ماجد الشهري"], projects: 1, lead: "عبدالله القرني", desc: "دعم العملاء والمستخدمين.", createdAt: "2024-04-15" },
];

function Page() {
  const [teams, setTeams] = useState<Team[]>(initial);
  const [createOpen, setCreateOpen] = useState(false);
  const [viewing, setViewing] = useState<Team | null>(null);

  return (
    <AppShell persona="admin">
      <PageHeader
        title="الفرق"
        subtitle="إدارة الفرق وأعضائها داخل المنصة."
        action={
          <Button size="lg" className="cta-glow gap-2" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            إنشاء فريق
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {teams.map((t) => (
          <Card
            key={t.id}
            className="cursor-pointer border-border transition-shadow hover:shadow-md"
            onClick={() => setViewing(t)}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Users className="h-5 w-5" />
                </span>
                <Badge variant="outline" className="border-border bg-secondary/60">
                  {t.projects} مشاريع
                </Badge>
              </div>
              <CardTitle className="mt-3 text-lg">{t.name}</CardTitle>
              <p className="text-xs text-muted-foreground">قائد الفريق: {t.lead}</p>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex -space-x-2 space-x-reverse">
                  {t.members.slice(0, 4).map((m) => (
                    <Avatar key={m} className="h-7 w-7 border-2 border-card">
                      <AvatarFallback className="bg-secondary text-[10px]">{m.charAt(0)}</AvatarFallback>
                    </Avatar>
                  ))}
                  {t.members.length > 4 && (
                    <span className="grid h-7 w-7 place-items-center rounded-full border-2 border-card bg-muted text-[10px] font-medium">
                      +{t.members.length - 4}
                    </span>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setViewing(t);
                  }}
                >
                  عرض
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <CreateTeamDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreate={(data) => {
          setTeams((p) => [
            ...p,
            {
              id: `t${Date.now()}`,
              projects: 0,
              members: [data.lead],
              createdAt: new Date().toISOString().slice(0, 10),
              ...data,
            },
          ]);
          toast.success("تم إنشاء الفريق");
          setCreateOpen(false);
        }}
      />

      <TeamDetailsDialog
        team={viewing}
        onOpenChange={(o) => !o && setViewing(null)}
        onChangeLead={(teamId, newLead) => {
          setTeams((p) =>
            p.map((t) =>
              t.id === teamId
                ? {
                    ...t,
                    lead: newLead,
                    members: t.members.includes(newLead) ? t.members : [...t.members, newLead],
                  }
                : t,
            ),
          );
          setViewing((v) => (v ? { ...v, lead: newLead } : v));
          toast.success("تم تغيير قائد الفريق");
        }}
      />
    </AppShell>
  );
}

function CreateTeamDialog({
  open,
  onOpenChange,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onCreate: (d: { name: string; desc: string; lead: string }) => void;
}) {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [lead, setLead] = useState(ALL_MEMBERS[0]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl">
        <DialogHeader>
          <DialogTitle>إنشاء فريق جديد</DialogTitle>
          <DialogDescription>أدخل اسم الفريق ووصفه واختر قائد الفريق.</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim()) {
              toast.error("اسم الفريق مطلوب");
              return;
            }
            onCreate({ name, desc, lead });
            setName("");
            setDesc("");
          }}
        >
          <div className="space-y-2">
            <Label>اسم الفريق</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="مثال: فريق البحث" />
          </div>
          <div className="space-y-2">
            <Label>الوصف</Label>
            <Textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={3} placeholder="نبذة قصيرة عن مهام الفريق…" />
          </div>
          <div className="space-y-2">
            <Label>قائد الفريق</Label>
            <Select value={lead} onValueChange={setLead}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ALL_MEMBERS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
            <Button type="submit" className="cta-glow">إنشاء</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function TeamDetailsDialog({
  team,
  onOpenChange,
  onChangeLead,
}: {
  team: Team | null;
  onOpenChange: (o: boolean) => void;
  onChangeLead: (teamId: string, newLead: string) => void;
}) {
  const [changingLead, setChangingLead] = useState(false);
  const [newLead, setNewLead] = useState("");

  if (!team) return null;

  return (
    <Dialog open={!!team} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
              <Users className="h-4 w-4" />
            </span>
            {team.name}
          </DialogTitle>
          <DialogDescription>{team.desc}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <InfoRow icon={<Crown className="h-4 w-4" />} label="القائد" value={team.lead} />
            <InfoRow icon={<FolderKanban className="h-4 w-4" />} label="المشاريع" value={`${team.projects}`} />
            <InfoRow icon={<Users className="h-4 w-4" />} label="الأعضاء" value={`${team.members.length}`} />
            <InfoRow icon={<Calendar className="h-4 w-4" />} label="تاريخ الإنشاء" value={team.createdAt} />
          </div>

          <div className="rounded-xl border border-border bg-secondary/30 p-4">
            <p className="mb-2 text-sm font-semibold">أعضاء الفريق</p>
            <div className="flex flex-wrap gap-2">
              {team.members.map((m) => (
                <div key={m} className="flex items-center gap-2 rounded-full bg-card px-3 py-1.5 text-xs">
                  <Avatar className="h-5 w-5">
                    <AvatarFallback className="bg-secondary text-[9px]">{m.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span>{m}</span>
                  {m === team.lead && <Crown className="h-3 w-3 text-warning" />}
                </div>
              ))}
            </div>
          </div>

          {changingLead ? (
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
              <Label>اختر القائد الجديد</Label>
              <Select value={newLead} onValueChange={setNewLead}>
                <SelectTrigger><SelectValue placeholder="اختر عضوًا…" /></SelectTrigger>
                <SelectContent>
                  {ALL_MEMBERS.filter((m) => m !== team.lead).map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setChangingLead(false)}>إلغاء</Button>
                <Button
                  size="sm"
                  className="cta-glow"
                  onClick={() => {
                    if (!newLead) return;
                    onChangeLead(team.id, newLead);
                    setChangingLead(false);
                    setNewLead("");
                  }}
                >
                  تأكيد
                </Button>
              </div>
            </div>
          ) : (
            <Button variant="outline" className="w-full gap-2" onClick={() => setChangingLead(true)}>
              <Crown className="h-4 w-4" />
              تعديل قائد الفريق
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="text-primary">{icon}</span>
        {label}
      </div>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}
