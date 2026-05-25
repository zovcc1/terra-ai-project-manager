import { Link, useRouterState } from "@tanstack/react-router";
import { Bell, Search, Leaf, LogOut } from "lucide-react";
import { ReactNode, useEffect } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ChatBubble } from "@/components/chat-bubble";
import { useAuth } from "@/lib/auth";

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

export function AppShell({ persona, children }: { persona: Persona; children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { logout, isAuthenticated } = useAuth();
  const config = navByPersona[persona];

  useEffect(() => {
    if (!isAuthenticated) {
      window.location.href = "/login";
    }
  }, [isAuthenticated]);

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
            <button className="relative grid h-9 w-9 place-items-center rounded-full bg-card hover:bg-muted">
              <Bell className="h-4 w-4" />
              <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-destructive" />
            </button>
            <Avatar className="h-9 w-9 border border-border">
              <AvatarFallback className="bg-accent text-accent-foreground">س.ع</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1400px] gap-6 px-6 py-6">
        {/* Sidebar */}
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
                        : "text-foreground/80 hover:bg-muted hover:text-foreground"
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
                window.location.href = "/login";
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

      <ChatBubble persona={persona} />
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
