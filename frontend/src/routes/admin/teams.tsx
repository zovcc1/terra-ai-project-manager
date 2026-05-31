import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
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
import { Plus, Users, Loader2, AlertCircle } from "lucide-react";
import { requireRole } from "@/lib/route-guards";
import {
  getTeams,
  Team,
  createTeam,
  updateTeam,
  deleteTeam,
  getAdminUsers,
  TeamPayload,
} from "@/lib/api";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/admin/teams")({
  beforeLoad: () => requireRole("/admin"),
  head: () => ({ meta: [{ title: "إدارة الفرق — تيرّا" }] }),
  component: Page,
});

function Page() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Team | null>(null);
  const [deleting, setDeleting] = useState<Team | null>(null);

  const { data: teams, isLoading, isError } = useQuery({
    queryKey: ["adminTeams"],
    queryFn: getTeams,
  });

  const { data: users } = useQuery({
    queryKey: ["adminUsers"],
    queryFn: getAdminUsers,
  });

  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    leadId: number | null;
    memberIds: number[];
  }>({ name: "", description: "", leadId: null, memberIds: [] });

  const openCreateDialog = () => {
    setFormData({ name: "", description: "", leadId: null, memberIds: [] });
    setCreateOpen(true);
  };

  const openEditDialog = (team: Team) => {
    setEditing(team);
    setFormData({
      name: team.name,
      description: team.description || "",
      leadId: team.leadId,
      memberIds: team.memberIds || [],
    });
  };

  const toggleMember = (userId: number) => {
    setFormData(prev => ({
      ...prev,
      memberIds: prev.memberIds.includes(userId)
        ? prev.memberIds.filter(id => id !== userId)
        : [...prev.memberIds, userId],
    }));
  };

  const createMutation = useMutation({
    mutationFn: (payload: TeamPayload) => createTeam(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminTeams"] });
      setCreateOpen(false);
      toast.success("تم إنشاء الفريق بنجاح");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: (args: { id: number; data: TeamPayload }) =>
      updateTeam(args.id, args.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminTeams"] });
      setEditing(null);
      toast.success("تم تحديث الفريق بنجاح");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTeam,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminTeams"] });
      setDeleting(null);
      toast.success("تم حذف الفريق بنجاح");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const handleSave = () => {
    const payload: TeamPayload = {
      name: formData.name,
      description: formData.description,
      leadId: formData.leadId,
      memberIds: formData.memberIds,
    };

    if (editing) {
      updateMutation.mutate({ id: editing.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <AppShell persona="admin">
      <PageHeader
        title="الفرق"
        subtitle="إدارة الفرق وأعضائها داخل المنصة."
        action={
          <Button size="lg" className="cta-glow gap-2" onClick={openCreateDialog}>
            <Plus className="h-4 w-4" />
            إنشاء فريق
          </Button>
        }
      />

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
        </div>
      ) : isError ? (
        <div className="p-12 text-center text-destructive flex flex-col items-center border border-dashed rounded-2xl bg-destructive/5">
          <AlertCircle className="h-10 w-10 mb-2" />
          <p>فشل تحميل الفرق.</p>
          <Button variant="link" onClick={() => queryClient.invalidateQueries({ queryKey: ["adminTeams"] })}>إعادة المحاولة</Button>
        </div>
      ) : teams && teams.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map((t) => (
            <Card
              key={t.id}
              className="cursor-pointer border-border transition-shadow hover:shadow-md"
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                    <Users className="h-5 w-5" />
                  </span>
                  <Badge variant="outline" className="border-border bg-secondary/60 font-normal">
                    {t.memberCount} أعضاء
                  </Badge>
                </div>
                <CardTitle className="mt-3 text-lg">{t.name}</CardTitle>
                <p className="text-xs text-muted-foreground">قائد الفريق: {t.leadName}</p>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <div className="flex -space-x-2 space-x-reverse">
                  {[...Array(Math.min(t.memberCount, 3))].map((_, i) => (
                    <Avatar key={i} className="h-7 w-7 border-2 border-card">
                      <AvatarFallback className="bg-secondary text-[10px]">
                        {t.name.charAt(i)}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => openEditDialog(t)}>تعديل</Button>
                  <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setDeleting(t)}>حذف</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center p-12 border border-dashed rounded-2xl text-muted-foreground bg-muted/10">
          لا توجد فرق حالياً. ابدأ بإنشاء فريق جديد.
        </div>
      )}

      <Dialog open={createOpen || !!editing} onOpenChange={(o) => { if (!o) { setCreateOpen(false); setEditing(null); } }}>
        <DialogContent dir="rtl" className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "تعديل الفريق" : "إنشاء فريق جديد"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>اسم الفريق</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>الوصف</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>قائد الفريق</Label>
              <Select
                value={formData.leadId?.toString() ?? ""}
                onValueChange={(val) => setFormData(p => ({ ...p, leadId: val ? Number(val) : null }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر قائد الفريق" />
                </SelectTrigger>
                <SelectContent>
                  {users?.map(user => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.fullName} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>أعضاء الفريق</Label>
              <div className="max-h-40 overflow-y-auto border rounded-md p-2 space-y-1">
                {users?.map(user => (
                  <label key={user.id} className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-1 rounded">
                    <input
                      type="checkbox"
                      checked={formData.memberIds.includes(user.id)}
                      onChange={() => toggleMember(user.id)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <span className="text-sm">{user.fullName} ({user.email})</span>
                  </label>
                ))}
                {users?.length === 0 && <p className="text-xs text-muted-foreground">لا يوجد مستخدمين</p>}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => { setCreateOpen(false); setEditing(null); }}>إلغاء</Button>
            <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending}>
              {createMutation.isPending || updateMutation.isPending ? <Loader2 className="animate-spin" /> : "حفظ"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>حذف الفريق</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف فريق «{deleting?.name}»؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleting && deleteMutation.mutate(deleting.id)}
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}