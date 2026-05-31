import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
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
import { Plus, Search, MoreHorizontal, Pencil, Trash2, Ban, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { requireRole } from "@/lib/route-guards";
import { getUsers, AdminUser } from "@/lib/api";

export const Route = createFileRoute("/admin/users")({
  beforeLoad: () => requireRole("/admin"),
  head: () => ({ meta: [{ title: "إدارة المستخدمين — تيرّا" }] }),
  component: Page,
});

const ROLES = ["ADMIN", "MANAGER", "MEMBER", "USER"];

function Page() {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [deleting, setDeleting] = useState<AdminUser | null>(null);

  const { data: users, isLoading, isError } = useQuery({
    queryKey: ["adminUsers"],
    queryFn: getUsers,
  });

  const filtered = useMemo(() => {
    if (!users) return [];
    return users.filter(
      (u) => 
        u.fullName.includes(query) || 
        u.email.toLowerCase().includes(query.toLowerCase()) ||
        u.username.toLowerCase().includes(query.toLowerCase())
    );
  }, [users, query]);

  const toggleStatus = (id: number) => {
    // Logic for toggling status via API
    toast.success("تم تغيير حالة الحساب (محاكاة)");
  };

  const removeUser = (id: number) => {
    // Logic for deleting via API
    toast.success("تم حذف المستخدم (محاكاة)");
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
             <Skeleton className="h-8 w-full" />
             <Skeleton className="h-8 w-full" />
             <Skeleton className="h-8 w-full" />
             <Skeleton className="h-8 w-full" />
           </div>
        ) : isError ? (
           <div className="p-12 text-center text-destructive flex flex-col items-center">
             <AlertCircle className="h-10 w-10 mb-2" />
             <p>فشل تحميل المستخدمين.</p>
             <Button variant="link" onClick={() => queryClient.invalidateQueries({ queryKey: ["adminUsers"] })}>إعادة المحاولة</Button>
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
                    <TableCell>                      <DropdownMenu>
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
                {filtered.length === 0 && (
                   <TableRow>
                     <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">لا يوجد مستخدمين يطابقون البحث.</TableCell>
                   </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Add/Edit logic placeholder as implemented before but with proper AdminUser typing */}
      {/* Delete confirm */}
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
