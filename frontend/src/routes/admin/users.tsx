import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plus, Search, MoreHorizontal, Pencil, Trash2,
  Ban, CheckCircle2, Loader2, AlertCircle,
} from "lucide-react";
import { requireRole } from "@/lib/route-guards";
import {
  getUsers, register, updateUser, setUserStatus, deleteUser,
  type AdminUser, type AdminUpdateUserRequest,
} from "@/lib/api";

export const Route = createFileRoute("/admin/users")({
  beforeLoad: () => requireRole("/admin"),
  head: () => ({ meta: [{ title: "إدارة المستخدمين — تيرّا" }] }),
  component: Page,
});

const ROLES = ["ADMIN", "MANAGER", "MEMBER", "USER"];

const EMPTY_NEW_USER = {
  fullName: "", username: "", email: "", password: "", role: "MEMBER",
};

function Page() {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [deleting, setDeleting] = useState<AdminUser | null>(null);
  const [newUser, setNewUser] = useState({ ...EMPTY_NEW_USER });
  const [editForm, setEditForm] = useState<AdminUpdateUserRequest>({});

  const { data: usersRaw, isLoading, isError } = useQuery({
    queryKey: ["adminUsers"],
    queryFn: getUsers,
  });

  // Normalize API response: could be array or paginated object { content: [] }
  const users = useMemo(() => {
    if (!usersRaw) return [];
    if (Array.isArray(usersRaw)) return usersRaw;
    if (usersRaw.content && Array.isArray(usersRaw.content)) return usersRaw.content;
    console.warn("Unexpected users format from API", usersRaw);
    return [];
  }, [usersRaw]);

  const addUserMutation = useMutation({
    mutationFn: (data: typeof newUser) =>
      register({
        username: data.username,
        email: data.email,
        password: data.password,
        fullName: data.fullName,
      }),
    onSuccess: () => {
      toast.success("تم إنشاء المستخدم بنجاح");
      setAddOpen(false);
      setNewUser({ ...EMPTY_NEW_USER });
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "فشل إنشاء المستخدم");
    },
  });

  const editUserMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: AdminUpdateUserRequest }) =>
      updateUser(id, data),
    onSuccess: () => {
      toast.success("تم تحديث المستخدم");
      setEditing(null);
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "فشل التحديث");
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: "ACTIVE" | "SUSPENDED" | "PENDING" }) =>
      setUserStatus(id, status),
    onSuccess: (updated) => {
      toast.success(updated.status === "ACTIVE" ? "تم تفعيل الحساب" : "تم تعطيل الحساب");
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "فشل تغيير الحالة");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteUser(id),
    onSuccess: () => {
      toast.success("تم حذف المستخدم");
      setDeleting(null);
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "فشل الحذف");
    },
  });

  const openEdit = (u: AdminUser) => {
    setEditing(u);
    setEditForm({
      fullName: u.fullName,
      username: u.username,
      email: u.email,
      role: u.role,
      status: u.status,
      avatarUrl: u.avatarUrl ?? "",
      bio: u.bio ?? "",
    });
  };

  const handleToggleStatus = (u: AdminUser) => {
    const next = u.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    statusMutation.mutate({ id: u.id, status: next });
  };

  const filtered = useMemo(() => {
    if (!users.length) return [];
    return users.filter(
      (u) =>
        u.fullName.includes(query) ||
        u.email.toLowerCase().includes(query.toLowerCase()) ||
        u.username.toLowerCase().includes(query.toLowerCase())
    );
  }, [users, query]);

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

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
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

        {isLoading ? (
          <div className="p-8 space-y-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
          </div>
        ) : isError ? (
          <div className="p-12 text-center text-destructive flex flex-col items-center">
            <AlertCircle className="h-10 w-10 mb-2" />
            <p>فشل تحميل المستخدمين.</p>
            <Button
              variant="link"
              onClick={() => queryClient.invalidateQueries({ queryKey: ["adminUsers"] })}
            >
              إعادة المحاولة
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">الاسم</TableHead>
                  <TableHead className="text-right">البريد الإلكتروني</TableHead>
                  <TableHead className="text-right">الدور</TableHead>
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
                          <AvatarFallback className="bg-secondary text-xs">
                            {u.fullName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{u.fullName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{u.email}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-normal">{u.role}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          u.status === "ACTIVE"
                            ? "border-success/40 bg-success/10 text-success"
                            : "border-destructive/40 bg-destructive/10 text-destructive"
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
                          <DropdownMenuItem onClick={() => openEdit(u)} className="gap-2">
                            <Pencil className="h-4 w-4" /> تعديل المعلومات
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleToggleStatus(u)}
                            disabled={statusMutation.isPending}
                            className="gap-2"
                          >
                            {u.status === "SUSPENDED" ? (
                              <><CheckCircle2 className="h-4 w-4" /> تفعيل الحساب</>
                            ) : (
                              <><Ban className="h-4 w-4" /> تعطيل الحساب</>
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
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                      لا يوجد مستخدمين يطابقون البحث.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Add User Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-[425px]" dir="rtl">
          <DialogHeader>
            <DialogTitle>إضافة مستخدم جديد</DialogTitle>
            <DialogDescription>
              سيتم إرسال بريد إلكتروني لتفعيل الحساب.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {[
              { id: "fullName", label: "الاسم الكامل", placeholder: "أحمد محمد", type: "text" },
              { id: "username", label: "اسم المستخدم", placeholder: "ahmed_m", type: "text" },
              { id: "email", label: "البريد الإلكتروني", placeholder: "ahmed@example.com", type: "email" },
              { id: "password", label: "كلمة المرور", placeholder: "", type: "password" },
            ].map(({ id, label, placeholder, type }) => (
              <div key={id} className="grid gap-2">
                <Label htmlFor={id}>{label}</Label>
                <Input
                  id={id}
                  type={type}
                  placeholder={placeholder}
                  value={newUser[id as keyof typeof newUser]}
                  onChange={(e) => setNewUser({ ...newUser, [id]: e.target.value })}
                />
              </div>
            ))}
            <div className="grid gap-2">
              <Label>الدور</Label>
              <Select
                value={newUser.role}
                onValueChange={(val) => setNewUser({ ...newUser, role: val })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>إلغاء</Button>
            <Button
              onClick={() => addUserMutation.mutate(newUser)}
              disabled={addUserMutation.isPending}
              className="gap-2"
            >
              {addUserMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              إنشاء المستخدم
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="sm:max-w-[425px]" dir="rtl">
          <DialogHeader>
            <DialogTitle>تعديل المستخدم</DialogTitle>
            <DialogDescription>{editing?.email}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {[
              { id: "fullName", label: "الاسم الكامل", type: "text" },
              { id: "username", label: "اسم المستخدم", type: "text" },
              { id: "email", label: "البريد الإلكتروني", type: "email" },
              { id: "password", label: "كلمة مرور جديدة (اختياري)", type: "password" },
            ].map(({ id, label, type }) => (
              <div key={id} className="grid gap-2">
                <Label>{label}</Label>
                <Input
                  type={type}
                  value={(editForm as any)[id] ?? ""}
                  onChange={(e) => setEditForm({ ...editForm, [id]: e.target.value })}
                  placeholder={type === "password" ? "اتركه فارغاً للإبقاء على الحالي" : undefined}
                />
              </div>
            ))}
            <div className="grid gap-2">
              <Label>الدور</Label>
              <Select
                value={editForm.role ?? ""}
                onValueChange={(val) => setEditForm({ ...editForm, role: val })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>الحالة</Label>
              <Select
                value={editForm.status ?? ""}
                onValueChange={(val) =>
                  setEditForm({ ...editForm, status: val as AdminUpdateUserRequest["status"] })
                }
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["ACTIVE", "SUSPENDED", "PENDING"].map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>إلغاء</Button>
            <Button
              onClick={() => {
                if (!editing) return;
                const payload: AdminUpdateUserRequest = { ...editForm };
                if (!payload.password) delete payload.password;
                editUserMutation.mutate({ id: editing.id, data: payload });
              }}
              disabled={editUserMutation.isPending}
              className="gap-2"
            >
              {editUserMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              حفظ التعديلات
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>حذف المستخدم</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف «{deleting?.fullName}»؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-2"
              disabled={deleteMutation.isPending}
              onClick={() => deleting && deleteMutation.mutate(deleting.id)}
            >
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}