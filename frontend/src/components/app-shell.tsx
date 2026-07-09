import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { Bell, Search, Leaf, LogOut, Menu } from "lucide-react";
import { ReactNode, useState, useEffect, useRef, createContext, useContext } from "react";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
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
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
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
      { to: "/manager/create-project", label: "إنشاء مشروع" },
      { to: "/manager/analytics", label: "التحليلات" },
      // { to: "/manager/kanban", label: "كانبان" },
    ],
  },
  member: {
    name: "عضو الفريق",
    items: [
      { to: "/member/projects", label: "المشاريع" },
      { to: "/member/kanban", label: "لوحة كانبان" },
    ],
  },
  user: {
    name: "مستخدم فردي",
    items: [{ to: "/user/profile", label: "الملف الشخصي" }],
  },
};

type Persona = "admin" | "manager" | "member" | "user";

/**
 * Header search term for the currently viewed page. Filters that page's primary list.
 * Owned by the root layout (see routes/__root.tsx) so it's a real ancestor of every
 * route component — AppShell is rendered *by* the page, not the other way around, so
 * AppShell can't own this state itself and have page components read it back out.
 */
export const SearchContext = createContext<{ query: string; setQuery: (v: string) => void }>({
  query: "",
  setQuery: () => {},
});

export function useHeaderSearch() {
  return useContext(SearchContext);
}

export function AppShell({
  persona,
  children,
}: {
  persona: Persona;
  children: ReactNode;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { logout, token, user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const config = navByPersona[persona];
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [page, setPage] = useState(0);
  const pageRef = useRef(page);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { query: searchQuery, setQuery: setSearchQuery } = useContext(SearchContext);

  useEffect(() => {
    pageRef.current = page;
  }, [page]);

  const { data: unreadList } = useQuery({
    queryKey: ["unreadNotifications"],
    queryFn: getUnreadNotifications,
    enabled: !!token,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const {
    data: recentPage,
    isPlaceholderData,
  } = useQuery({
    queryKey: ["recentNotifications", page],
    queryFn: () => getRecentNotifications(page, 20),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    enabled: !!token,
  });

  const recentNotifications = recentPage?.content ?? [];

  const markReadMutation = useMutation({
    mutationFn: markNotificationsAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["unreadNotifications"] });
      queryClient.invalidateQueries({ queryKey: ["recentNotifications"] });
    },
  });

  const unsubscribeRef = useRef<(() => void) | null>(null);
  const subscribedRef = useRef(false);

  useEffect(() => {
    if (!token || subscribedRef.current) return;
    let cancelled = false;

    const init = async () => {
      try {
        await wsConnect(token);
        if (cancelled) return;

        unsubscribeRef.current = subscribeNotifications((notification) => {
          console.log("Notification received in AppShell:", notification);
          queryClient.setQueryData(['unreadNotifications'], (old: any[]) => {
            if (!old) return [notification];
            return old.some(n => n.id === notification.id) ? old : [notification, ...old];
          });
          const currentPage = pageRef.current;
          queryClient.setQueryData(['recentNotifications', currentPage], (old: any) => {
            if (!old?.content) return old;
            const exists = old.content.some((n: any) => n.id === notification.id);
            if (exists) return old;
            return {
              ...old,
              content: [notification, ...old.content].slice(0, 20),
            };
          });
        });
        subscribedRef.current = true;
      } catch (err) {
        console.error('STOMP connection error', err);
      }
    };

    init();

    return () => {
      cancelled = true;
      unsubscribeRef.current?.();
      subscribedRef.current = false;
    };
  }, [token, queryClient]);

  const unreadCount = unreadList?.filter((n) => !n.isRead).length ?? 0;

  const handleMarkAllRead = () => {
    const unreadIds = unreadList?.filter((n) => !n.isRead).map((n) => n.id) ?? [];
    if (unreadIds.length) markReadMutation.mutate(unreadIds);
  };

  return (
    <div className="min-h-screen bg-background leaf-bg" dir="rtl">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-4 px-6">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="ghost" size="icon" className="shrink-0">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64 p-0">
              <div className="flex flex-col h-full">
                <div className="p-4 border-b">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">الدور الحالي</p>
                  <p className="mt-1 text-base font-semibold">{config.name}</p>
                </div>
                <nav className="flex-1 p-2">
                  {config.items.map((item) => {
                    const active = pathname === item.to;
                    return (
                      <Link
                        key={item.to}
                        to={item.to}
                        onClick={() => setMobileMenuOpen(false)}
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
                <div className="p-2 border-t">
                  <button
                    onClick={() => {
                      logout();
                      navigate({ to: "/login" });
                      setMobileMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted-foreground hover:text-foreground text-right"
                  >
                    <LogOut className="h-4 w-4" />
                    تسجيل الخروج
                  </button>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <Link to="/" className="flex items-center gap-2 shrink-0">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground">
              <Leaf className="h-5 w-5" />
            </span>
            <span className="text-xl font-bold tracking-tight">تيرّا</span>
          </Link>
          <div className="relative mx-6 hidden flex-1 md:block">
            <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="ابحث عن مشروع، مهمة، أو شخص…"
              className="bg-card pr-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3 mr-auto">
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
                    <div className="p-4 text-center text-sm text-muted-foreground">لا توجد إشعارات</div>
                  ) : (
                    recentNotifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={cn(
                          "p-3 border-b hover:bg-muted/50 transition-colors cursor-pointer",
                          !notif.isRead && "bg-primary/5"
                        )}
                        onClick={() => {
                          if (!notif.isRead) markReadMutation.mutate([notif.id]);
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
                {recentPage && recentPage.totalPages > 1 && (
                  <div className="flex justify-between p-2 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === 0 || isPlaceholderData}
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                    >
                      السابق
                    </Button>
                    <span className="text-xs self-center">
                      {page + 1} / {recentPage.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= recentPage.totalPages - 1 || isPlaceholderData}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      التالي
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

        <main className="min-w-0 flex-1">{children}</main>
      </div>

      {persona != "admin" && <ChatBubble persona={persona} />}
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