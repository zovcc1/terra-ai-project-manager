import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Plus, Search, MoreHorizontal, Pencil, Trash2, Ban, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/admin/users")({
  head: () => ({ meta: [{ title: "إدارة المستخدمين — تيرّا" }] }),
  component: Page,
});

type Status = "نشط" | "موقوف" | "في الانتظار";
type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: Status;
  team?: string;
};

const initial: User[] = [
  { id: "u1", name: "نورا الحربي", email: "nora@terra.app", role: "مدير مشروع", status: "نشط", team: "فريق التصميم" },
  { id: "u2", name: "خالد المطيري", email: "khaled@terra.app", role: "عضو فريق", status: "نشط", team: "فريق التطوير" },
  { id: "u3", name: "ليلى السبيعي", email: "layla@terra.app", role: "مدير نظام", status: "نشط" },
  { id: "u4", name: "عبدالله القرني", email: "abdullah@terra.app", role: "عضو فريق", status: "موقوف", team: "فريق الدعم" },
  { id: "u5", name: "ريم الزهراني", email: "reem@terra.app", role: "مستخدم فردي", status: "نشط" },
  { id: "u6", name: "سعد العتيبي", email: "saad@terra.app", role: "عضو فريق", status: "في الانتظار", team: "فريق العمليات" },
];

const ROLES = ["مدير نظام", "مدير مشروع", "عضو فريق", "مستخدم فردي"];
const TEAMS = ["—", "فريق التصميم", "فريق التطوير", "فريق التسويق", "فريق العمليات", "فريق المنتج", "فريق الدعم"];

function Page() {
  const [users, setUsers] = useState<User[]>(initial);
  const [query, setQuery] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [deleting, setDeleting] = useState<User | null>(null);

  const filtered = users.filter(
    (u) => u.name.includes(query) || u.email.toLowerCase().includes(query.toLowerCase()),
  );

  const toggleStatus = (id: string) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === id ? { ...u, status: u.status === "موقوف" ? "نشط" : "موقوف" } : u,
      ),
    );
    const u = users.find((x) => x.id === id);
    toast.success(u?.status === "موقوف" ? "تم تفعيل الحساب" : "تم تعطيل الحساب");
  };

  const removeUser = (id: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== id));
    toast.success("تم حذف المستخدم");
    setDeleting(null);
  };

  return (
    <AppShell persona="admin">
      <PageHeader
        title="المستخدمون"
        subtitle="عرض وإدارة جميع المستخدمين في المنصة."
        action={
          <Button size="lg" className="cta-glow gap-2" onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4" />
            إضافة مستخدم
          </Button>
        }
      />

      <div className="rounded-2xl border border-border bg-card">
        <div className="flex items-center gap-3 border-b border-border p-4">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="ابحث بالاسم أو البريد…"
              className="pr-10"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <Button variant="outline">تصفية</Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">الاسم</TableHead>
              <TableHead className="text-right">البريد الإلكتروني</TableHead>
              <TableHead className="text-right">الدور</TableHead>
              <TableHead className="text-right">الفريق</TableHead>
              <TableHead className="text-right">الحالة</TableHead>
              <TableHead className="text-right">إجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((u) => (
              <TableRow key={u.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-secondary text-xs">{u.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{u.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{u.email}</TableCell>
                <TableCell>{u.role}</TableCell>
                <TableCell className="text-muted-foreground">{u.team ?? "—"}</TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={
                      u.status === "نشط"
                        ? "border-success/40 bg-success/10 text-success"
                        : u.status === "موقوف"
                          ? "border-destructive/40 bg-destructive/10 text-destructive"
                          : "border-warning/40 bg-warning/15 text-warning-foreground"
                    }
                  >
                    {u.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => setEditing(u)} className="gap-2">
                        <Pencil className="h-4 w-4" /> تعديل المعلومات
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => toggleStatus(u.id)} className="gap-2">
                        {u.status === "موقوف" ? (
                          <>
                            <CheckCircle2 className="h-4 w-4" /> تفعيل الحساب
                          </>
                        ) : (
                          <>
                            <Ban className="h-4 w-4" /> تعطيل الحساب
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setDeleting(u)}
                        className="gap-2 text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" /> حذف المستخدم
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Add user */}
      <UserDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        title="إضافة مستخدم جديد"
        onSubmit={(data) => {
          setUsers((p) => [
            ...p,
            { id: `u${Date.now()}`, status: "في الانتظار", ...data },
          ]);
          toast.success("تم إضافة المستخدم");
          setAddOpen(false);
        }}
      />

      {/* Edit user */}
      <UserDialog
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        title="تعديل معلومات المستخدم"
        initial={editing ?? undefined}
        onSubmit={(data) => {
          if (!editing) return;
          setUsers((p) => p.map((u) => (u.id === editing.id ? { ...u, ...data } : u)));
          toast.success("تم تحديث المعلومات");
          setEditing(null);
        }}
      />

      {/* Delete confirm */}
      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>حذف المستخدم</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف «{deleting?.name}»؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleting && removeUser(deleting.id)}
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}

function UserDialog({
  open,
  onOpenChange,
  title,
  initial,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  initial?: Partial<User>;
  onSubmit: (data: { name: string; email: string; role: string; team?: string }) => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [role, setRole] = useState(initial?.role ?? "عضو فريق");
  const [team, setTeam] = useState(initial?.team ?? "—");

  // reset when reopening
  const key = `${open}-${initial?.id ?? "new"}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" key={key}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>أدخل بيانات المستخدم وعيّن الدور والفريق.</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim() || !email.trim()) {
              toast.error("الاسم والبريد مطلوبان");
              return;
            }
            onSubmit({ name, email, role, team: team === "—" ? undefined : team });
          }}
        >
          <div className="space-y-2">
            <Label>الاسم الكامل</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="مثال: نورا الحربي" />
          </div>
          <div className="space-y-2">
            <Label>البريد الإلكتروني</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@terra.app" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>الدور</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>الفريق</Label>
              <Select value={team} onValueChange={setTeam}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TEAMS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
            <Button type="submit" className="cta-glow">حفظ</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
