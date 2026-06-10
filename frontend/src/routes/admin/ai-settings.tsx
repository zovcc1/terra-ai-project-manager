import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppShell, PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sparkles,
  Eye,
  EyeOff,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Save,
  Loader2,
  ExternalLink,
  Info,
} from "lucide-react";
import { requireRole } from "@/lib/route-guards";
import { getAiSettings, updateAiSettings, AiSettings } from "@/lib/api";

export const Route = createFileRoute("/admin/ai-settings")({
  beforeLoad: () => requireRole("/admin"),
  head: () => ({ meta: [{ title: "إعدادات الذكاء الاصطناعي — تيرّا" }] }),
  component: Page,
});

function Page() {
  const queryClient = useQueryClient();
  const [apiKey, setApiKey] = useState("");
  const [show, setShow] = useState(false);

  const {
    data: settings,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["aiSettings"],
    queryFn: getAiSettings,
  });

  const [localSettings, setLocalSettings] = useState<Partial<AiSettings>>({});

  useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
    }
  }, [settings]);

  const mutation = useMutation({
    mutationFn: updateAiSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["aiSettings"] });
      toast.success("تم حفظ إعدادات الذكاء الاصطناعي بنجاح");
      setApiKey("");
    },
    onError: (error: any) => {
      toast.error(error.message || "حدث خطأ أثناء حفظ الإعدادات");
    },
  });

  if (isLoading) {
    return (
      <AppShell persona="admin">
        <PageHeader title="إعدادات الذكاء الاصطناعي" subtitle="جاري تحميل الإعدادات..." />
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-[300px] rounded-xl" />
          <Skeleton className="lg:col-span-2 h-[450px] rounded-xl" />
        </div>
      </AppShell>
    );
  }

  if (isError) {
    return (
      <AppShell persona="admin">
        <PageHeader title="إعدادات الذكاء الاصطناعي" subtitle="فشل تحميل الإعدادات." />
        <Card className="border-destructive/40 bg-destructive/10">
          <CardContent className="p-6 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
            <p className="text-lg font-semibold">عذراً، حدث خطأ أثناء جلب البيانات</p>
            <Button
              className="mt-4"
              onClick={() => queryClient.invalidateQueries({ queryKey: ["aiSettings"] })}
            >
              إعادة المحاولة
            </Button>
          </CardContent>
        </Card>
      </AppShell>
    );
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = { ...localSettings };
    if (apiKey.trim()) {
      payload.apiKey = apiKey.trim();
    }
    mutation.mutate(payload);
  };

  const isProviderOpenRouter = localSettings.provider === "openrouter";

  return (
    <AppShell persona="admin">
      <PageHeader
        title="إعدادات الذكاء الاصطناعي"
        subtitle="فعّل ميزات الذكاء الاصطناعي عبر إضافة مفتاح API الخاص بمزوّد النموذج."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Status card */}
        <Card className="lg:col-span-1">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                <Sparkles className="h-5 w-5" />
              </span>
              <Badge
                variant="outline"
                className={
                  settings?.enabled
                    ? "border-success/40 bg-success/10 text-success"
                    : "border-warning/40 bg-warning/15 text-warning-foreground"
                }
              >
                {settings?.enabled ? "مُفعّل" : "غير مُفعّل"}
              </Badge>
            </div>
            <h3 className="mt-4 font-semibold">حالة الخدمة</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              يتم استخدام المفتاح لتشغيل الاقتراحات الذكية، تحليل المهام، وردود المساعد.
            </p>
            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">المزوّد</dt>
                <dd className="font-medium">{providerLabel(settings?.provider || "none")}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">الموديل</dt>
                <dd className="font-mono text-xs" dir="ltr">
                  {(settings as any)?.model || "—"}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">المفتاح</dt>
                <dd className="font-mono text-xs" dir="ltr">
                  {settings?.apiKeyMasked || "غير مُعدّ"}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">الميزات</dt>
                <dd className="font-medium">
                  {settings?.enabled ? (
                    <span className="inline-flex items-center gap-1 text-success">
                      <CheckCircle2 className="h-3.5 w-3.5" /> مُمكّنة
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-warning-foreground">
                      <AlertCircle className="h-3.5 w-3.5" /> معطّلة
                    </span>
                  )}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        {/* Settings form */}
        <Card className="lg:col-span-2">
          <CardContent className="p-6">
            <h3 className="font-semibold">مفتاح API والإعدادات</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              يُخز المفتاح بشكل مشفّر في قاعدة البيانات ويُستخدم لجميع المستخدمين.
            </p>

            <form className="mt-5 space-y-5" onSubmit={handleSave}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>المزوّد</Label>
                  <Select
                    value={localSettings.provider || ""}
                    onValueChange={(v) => {
                      setLocalSettings((p) => ({ ...p, provider: v }));
                      if (v === "openrouter") {
                        setLocalSettings((p) => ({
                          ...p,
                          provider: v,
                          model: "openai/gpt-oss-120b:free",
                          defaultModel: "openai/gpt-oss-120b:free",
                        }));
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر مزوّد الخدمة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="openrouter">OpenRouter (مُوصى به)</SelectItem>
                      <SelectItem value="openai">OpenAI (GPT)</SelectItem>
                      <SelectItem value="anthropic">Anthropic (Claude)</SelectItem>
                      <SelectItem value="google">Google (Gemini)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>الموديل</Label>
                  <Input
                    value={localSettings.model || ""}
                    onChange={(e) => setLocalSettings((p) => ({ ...p, model: e.target.value }))}
                    placeholder="مثال: openai/gpt-oss-120b:free"
                    dir="ltr"
                    className="font-mono text-sm"
                  />
                </div>
              </div>

              {isProviderOpenRouter && (
                <div className="flex items-start gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4">
                  <Info className="h-5 w-5 shrink-0 text-primary mt-0.5" />
                  <div className="space-y-2 text-sm">
                    <p className="font-medium text-primary">إعداد OpenRouter السريع</p>
                    <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                      <li>أنشئ حساب في <a href="https://openrouter.ai" target="_blank" rel="noopener noreferrer" className="text-primary underline inline-flex items-center gap-1">openrouter.ai <ExternalLink className="h-3 w-3" /></a></li>
                      <li>اذهب إلى <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="text-primary underline inline-flex items-center gap-1">صفحة المفاتيح <ExternalLink className="h-3 w-3" /></a> وأنشئ مفتاح API جديد</li>
                      <li>الصق المفتاح أدناه واضغط حفظ</li>
                    </ol>
                    <p className="text-xs text-muted-foreground">
                      المفتاح يبدأ بـ <code className="bg-secondary px-1 py-0.5 rounded font-mono">sk-or-v1-...</code>
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <KeyRound className="h-4 w-4 text-primary" />
                  مفتاح API الجديد
                </Label>
                <div className="relative">
                  <Input
                    type={show ? "text" : "password"}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="اتركه فارغاً للحفاظ على المفتاح الحالي"
                    className="pr-10 font-mono"
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={() => setShow((s) => !s)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground hover:bg-muted"
                    aria-label="إظهار/إخفاء المفتاح"
                  >
                    {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  لن يتم تغيير المفتاح المخزن إذا تركت هذا الحقل فارغاً.
                </p>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-border bg-secondary/30 p-4">
                <div>
                  <p className="font-medium">تفعيل ميزات الذكاء الاصطناعي</p>
                  <p className="text-xs text-muted-foreground">
                    التحكم بإيقاف/تشغيل الميزات دون حذف المفتاح. عند التفعيل، جميع المستخدمين يمكنهم استخدام المساعد الذكي.
                  </p>
                </div>
                <Switch
                  checked={localSettings.enabled}
                  onCheckedChange={(v) => setLocalSettings((p) => ({ ...p, enabled: v }))}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setApiKey("");
                    setLocalSettings(settings || {});
                  }}
                  disabled={mutation.isPending}
                >
                  إعادة تعيين
                </Button>
                <Button type="submit" className="cta-glow gap-2" disabled={mutation.isPending}>
                  {mutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  حفظ الإعدادات
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

function providerLabel(v: string) {
  return (
    {
      openrouter: "OpenRouter",
      openai: "OpenAI (GPT)",
      anthropic: "Anthropic (Claude)",
      google: "Google (Gemini)",
      none: "غير محدد",
    }[v] ?? v
  );
}
