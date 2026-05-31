import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { Bell, Search, Leaf, LogOut } from "lucide-react";
import { ReactNode, useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale/ar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Popover,
PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { ChatBubble } from "@/components/chat-bubble";
import { useAuth } from "@/lib/auth";
import {
  getUnreadNotifications,
  getRecentNotifications,
  markNotificationsAsRead,
  type NotificationResponse,
} from "@/lib/api";
import { subscribeNotifications, wsConnect } from "@/lib/websocket";

type NavItem = { to: string; label: string };

const navByPersona: Record<string, { name: string; items: NavItem[] }> = {
  admin: {
    name: "مدير النظام",
    items: [
      { to: "/admin/users", label: "المستخدمون" },
      { to: "/admin/teams", label: "الفرق" },
      { to: "/admin/system-stats", label: "إحصاءات النظام" },
      { to: "/admin/ai-settings", label: "إعدادات الذكاء الاصطناعي" },
    ],
  },
  manager: {
    name: "مدير المشروع",
    items: [
      { to: "/manager/dashboard", label: "لوحة التحكم" },
      { to: "/manager/project-detail", label: "تفاصيل المشروع" },
      { to: "/manager/create-project", label: "إنشاء مشروع" },
      { to: "/manager/analytics", label: "التحليلات" },
      { to: "/manager/kanban", label: "كانبان" },
    ],
  },
  member: {
    name: "عضو الفريق",
    items: [
      { to: "/member/kanban", label: "لوحة كانبان" },
      { to: "/member/my-tasks", label: "مهامي" },
      { to: "/member/task-detail", label: "تفاصيل المهمة" },
    ],
  },
  user: {
    name: "مستخدم فردي",
    items: [{ to: "/user/profile", label: "الملف الشخصي" }],
  },
};

type Persona = "admin" | "manager" | "member" | "user";

export function AppShell({
  persona,
  children,
  projectId,
}: {
  persona: Persona;
  children: ReactNode;
  projectId?: number;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { logout, token, user } = useAuth(); // token and user must be exposed from useAuth
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const config = navByPersona[persona];
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Queries
  const { data: unreadList } = useQuery({
    queryKey: ["unreadNotifications"],
    queryFn: getUnreadNotifications,
    enabled: !!token,
  });

  const { data: recentNotifications } = useQuery({
    queryKey: ["recentNotifications"],
    queryFn: getRecentNotifications,
    enabled: !!token,
  });

  const markReadMutation = useMutation({
    mutationFn: markNotificationsAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["unreadNotifications"] });
      queryClient.invalidateQueries({ queryKey: ["recentNotifications"] });
    },
  });

  // WebSocket subscription for real‑time notifications
const socketRef = useRef<WebSocket | null>(null);

useEffect(() => {
  if (!token) return;

  // إذا كان هناك اتصال سابق ما زال مفتوحاً، لا تنشئ غيره
  if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
    console.log('🔁 اتصال موجود مسبقاً، تخطي');
    return;
  }

  // أغلق أي اتصال سابق ليس مفتوحاً
  if (socketRef.current) {
    socketRef.current.close();
  }

  const wsUrl = `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/ws?token=${token}`;
  const socket = new WebSocket(wsUrl);
  socketRef.current = socket;

  socket.onopen = () => {
    console.log('✅ WebSocket مفتوح', socket.readyState);
    // أرسل رسالة اشتراك إن احتاج الخادم
    // socket.send(JSON.stringify({ type: 'subscribe', channel: 'notifications' }));
  };

  socket.onmessage = (event) => {
    try {
      const notification = JSON.parse(event.data);
      console.log('📩 إشعار:', notification);
      // تحديث الكاش
      queryClient.setQueryData(['unreadNotifications'], (old: any) => {
        if (!old) return [notification];
        return old.some(n => n.id === notification.id) ? old : [notification, ...old];
      });
      queryClient.setQueryData(['recentNotifications'], (old: any) => {
        if (!old) return [notification];
        return old.some(n => n.id === notification.id) ? old : [notification, ...old];
      });
    } catch (e) {
      console.error('خطأ في تحليل رسالة WebSocket', e);
    }
  };

  socket.onerror = (e) => console.error('WebSocket error', e);
  socket.onclose = (e) => console.log('WebSocket closed', e.code, e.reason);

  // cleanup: لا يُستدعى إلا عند تغيير التوكن أو إلغاء تحميل المكون
  return () => {
    console.log('Cleaning up WebSocket');
    socket.close();
    socketRef.current = null;
  };
}, [token]); // تبعية واحدة فقط

  const unreadCount = unreadList?.filter((n) => !n.isRead).length ?? 0;

  const handleMarkAllRead = () => {
    const unreadIds = unreadList?.filter((n) => !n.isRead).map((n) => n.id) ?? [];
    if (unreadIds.length) markReadMutation.mutate(unreadIds);
  };

  return (
    <div className="min-h-screen bg-background leaf-bg" dir="rtl">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-4 px-6">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground">
              <Leaf className="h-5 w-5" />
            </span>
            <span className="text-xl font-bold tracking-tight">تيرّا</span>
          </Link>
          <div className="relative mx-6 hidden flex-1 md:block">
            <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="ابحث عن مشروع، مهمة، أو شخص…" className="bg-card pr-10" />
          </div>
          <div className="flex items-center gap-3">
            <Popover open={notificationsOpen} onOpenChange={setNotificationsOpen}>
              <PopoverTrigger asChild>
                <button className="relative grid h-9 w-9 place-items-center rounded-full bg-card hover:bg-muted">
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-destructive" />
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="end">
                <div className="p-3 border-b">
                  <h4 className="font-medium">الإشعارات</h4>
                </div>
                <ScrollArea className="h-80">
                  {!recentNotifications || recentNotifications.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      لا توجد إشعارات
                    </div>
                  ) : (
                    recentNotifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={cn(
                          "p-3 border-b hover:bg-muted/50 transition-colors cursor-pointer",
                          !notif.isRead && "bg-primary/5"
                        )}
                        onClick={() => {
                          if (!notif.isRead) {
                            markReadMutation.mutate([notif.id]);
                          }
                          // Optional: navigate to notif.targetId (e.g., task or project)
                        }}
                      >
                        <p className="text-sm">{notif.content}</p>
                        <div className="flex justify-between mt-1">
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                          </span>
                          {!notif.isRead && <span className="text-xs text-primary">جديد</span>}
                        </div>
                      </div>
                    ))
                  )}
                </ScrollArea>
                {unreadCount > 0 && (
                  <div className="p-2 border-t">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-xs"
                      onClick={handleMarkAllRead}
                      disabled={markReadMutation.isPending}
                    >
                      تعليم الكل كمقروء
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>
            <Avatar className="h-9 w-9 border border-border">
              <AvatarFallback className="bg-accent text-accent-foreground">
                {user?.fullName?.charAt(0) || "ع"}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1400px] gap-6 px-6 py-6">
        {/* Sidebar (unchanged) */}
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-24 space-y-4">
            <div className="rounded-2xl border border-border bg-card p-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">الدور الحالي</p>
              <p className="mt-1 text-base font-semibold">{config.name}</p>
            </div>
            <nav className="rounded-2xl border border-border bg-card p-2">
              {config.items.map((item) => {
                const active = pathname === item.to;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={cn(
                      "flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                      active
                        ? "bg-primary/10 text-primary"
                        : "text-foreground/80 hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <span>{item.label}</span>
                    {active && <span className="h-2 w-2 rounded-full bg-primary" />}
                  </Link>
                );
              })}
            </nav>
            <button
              onClick={() => {
                logout();
                navigate({ to: "/login" });
              }}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted-foreground hover:text-foreground text-right"
            >
              <LogOut className="h-4 w-4" />
              تسجيل الخروج
            </button>
          </div>
        </aside>

        {/* Main */}
        <main className="min-w-0 flex-1">{children}</main>
      </div>

      <ChatBubble persona={persona} projectId={projectId} />
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}