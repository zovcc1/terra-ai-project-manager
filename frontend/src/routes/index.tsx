import { createFileRoute, Link } from "@tanstack/react-router";
import { Leaf, ShieldCheck, Briefcase, Users, User } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "تيرّا — اختر دورك" },
      { name: "description", content: "منصة إدارة المشاريع بتصميم عضوي دافئ. اختر دورك للبدء." },
    ],
  }),
  component: Index,
});

const personas = [
  {
    to: "/admin/users",
    name: "مدير النظام",
    desc: "إدارة المستخدمين، الفرق، ومراقبة صحة المنصة.",
    icon: ShieldCheck,
  },
  {
    to: "/manager/dashboard",
    name: "مدير المشروع",
    desc: "تخطيط المشاريع، تعيين المهام، وتتبع الأداء.",
    icon: Briefcase,
  },
  {
    to: "/member/kanban",
    name: "عضو الفريق",
    desc: "تنظيم مهامك اليومية على لوحة كانبان.",
    icon: Users,
  },
  {
    to: "/user/profile",
    name: "مستخدم فردي",
    desc: "إدارة ملفك الشخصي ومتابعة نشاطك.",
    icon: User,
  },
  
];

function Index() {
  return (
    <div className="min-h-screen bg-background leaf-bg" dir="rtl">
      <div className="mx-auto max-w-5xl px-6 py-16">
        <div className="flex flex-col items-center text-center">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground">
            <Leaf className="h-7 w-7" />
          </span>
          <h1 className="mt-5 text-4xl font-bold tracking-tight md:text-5xl">تيرّا</h1>
          <p className="mt-3 max-w-xl text-base text-muted-foreground">
            منصة دافئة وهادئة لإدارة مشاريعك وفرقك. اختر دورك لاستعراض الواجهات المخصصة.
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2">
          {personas.map((p) => (
            <Link
              key={p.to}
              to={p.to}
              className="group rounded-3xl border border-border bg-card p-6 transition-all hover:border-primary/50 hover:shadow-lg"
            >
              <div className="flex items-start gap-4">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <p.icon className="h-6 w-6" />
                </span>
                <div className="flex-1">
                  <h2 className="text-lg font-semibold">{p.name}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{p.desc}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
