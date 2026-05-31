import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/app-shell";
import { requireRole } from "@/lib/route-guards";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { getTeams, createProject } from "@/lib/api";

export const Route = createFileRoute("/manager/create-project")({
  beforeLoad: () => requireRole("/manager"),
  head: () => ({ meta: [{ title: "إنشاء مشروع — تيرّا" }] }),
  component: Page,
});

function Page() {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [teamId, setTeamId] = useState<number | null>(null);

  const { data: teams, isLoading: teamsLoading } = useQuery({
    queryKey: ["teams"],
    queryFn: getTeams,
  });

  const mutation = useMutation({
    mutationFn: () =>
      createProject({
        name,
        description,
        teamId: teamId ?? undefined,
        dueDate: dueDate || undefined,
        priority,
      }),
    onSuccess: () => {
      toast.success("تم إنشاء المشروع بنجاح");
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      window.location.href = "/manager/dashboard";
    },
    onError: (err: any) => toast.error(err.message),
  });

  return (
    <AppShell persona="manager">
      <PageHeader title="إنشاء مشروع جديد" subtitle="املأ التفاصيل لبدء مشروعك." />

      <Card className="max-w-3xl">
        <CardContent className="space-y-6 p-6">
          <div className="space-y-2">
            <Label htmlFor="name">اسم المشروع</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: إعادة تصميم الموقع"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="desc">الوصف</Label>
            <Textarea
              id="desc"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="صف هدف المشروع، النطاق، والمخرجات المتوقعة…"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="due">الموعد النهائي</Label>
              <Input
                id="due"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority">الأولوية</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الأولوية" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">منخفضة</SelectItem>
                  <SelectItem value="MEDIUM">متوسطة</SelectItem>
                  <SelectItem value="HIGH">عالية</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
  <Label>الفريق</Label>
  {teamsLoading ? (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" />
      جاري تحميل الفرق...
    </div>
  ) : teams && teams.length > 0 ? (
    <Select
      value={teamId?.toString() ?? ""}
      onValueChange={(val) => setTeamId(val ? Number(val) : null)}
    >
      <SelectTrigger>
        <SelectValue placeholder="اختر فريقًا (اختياري)" />
      </SelectTrigger>
      <SelectContent>
        {teams.map((team) => (
          <SelectItem key={team.id} value={team.id.toString()}>
            {team.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  ) : (
    <p className="text-sm text-muted-foreground">
      لا توجد فرق متاحة.
    </p>
  )}
</div>
          <div className="flex items-center justify-end gap-3 border-t border-border pt-6">
            <Button variant="ghost" onClick={() => window.history.back()}>
              إلغاء
            </Button>
            <Button
              size="lg"
              className="cta-glow"
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending || !name.trim()}
            >
              {mutation.isPending ? <Loader2 className="animate-spin ml-2" /> : null}
              إنشاء المشروع
            </Button>
          </div>
        </CardContent>
      </Card>
    </AppShell>
  );
}