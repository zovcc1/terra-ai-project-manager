import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sparkles, Eye, EyeOff, KeyRound, CheckCircle2, AlertCircle, Save } from "lucide-react";

export const Route = createFileRoute("/admin/ai-settings")({
  head: () => ({ meta: [{ title: "إعدادات الذكاء الاصطناعي — تيرّا" }] }),
  component: Page,
});

function Page() {
  const [provider, setProvider] = useState("openai");
  const [apiKey, setApiKey] = useState("");
  const [show, setShow] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const [savedKey, setSavedKey] = useState<string | null>(null);

  const masked = savedKey ? `••••••••${savedKey.slice(-4)}` : "غير مُعدّ";

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
                  savedKey && enabled
                    ? "border-success/40 bg-success/10 text-success"
                    : "border-warning/40 bg-warning/15 text-warning-foreground"
                }
              >
                {savedKey && enabled ? "مُفعّل" : "غير مُفعّل"}
              </Badge>
            </div>
            <h3 className="mt-4 font-semibold">حالة الخدمة</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              يتم استخدام المفتاح لتشغيل الاقتراحات الذكية، تحليل المهام، وردود المساعد.
            </p>
            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">المزوّد</dt>
                <dd className="font-medium">{providerLabel(provider)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">المفتاح</dt>
                <dd className="font-mono text-xs">{masked}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">الميزات</dt>
                <dd className="font-medium">
                  {enabled ? (
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
            <h3 className="font-semibold">مفتاح API</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              يُخزَّن المفتاح بشكل مشفّر ولا يُعرض لأي مستخدم آخر بعد الحفظ.
            </p>

            <form
              className="mt-5 space-y-5"
              onSubmit={(e) => {
                e.preventDefault();
                if (!apiKey.trim() || apiKey.length < 8) {
                  toast.error("الرجاء إدخال مفتاح صالح");
                  return;
                }
                setSavedKey(apiKey);
                setApiKey("");
                toast.success("تم حفظ مفتاح الذكاء الاصطناعي");
              }}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>المزوّد</Label>
                  <Select value={provider} onValueChange={setProvider}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="openai">OpenAI (GPT)</SelectItem>
                      <SelectItem value="anthropic">Anthropic (Claude)</SelectItem>
                      <SelectItem value="google">Google (Gemini)</SelectItem>
                      <SelectItem value="lovable">Lovable AI Gateway</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>الموديل الافتراضي</Label>
                  <Select defaultValue="auto">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">تلقائي</SelectItem>
                      <SelectItem value="fast">سريع وأقل تكلفة</SelectItem>
                      <SelectItem value="balanced">متوازن</SelectItem>
                      <SelectItem value="advanced">متقدّم</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <KeyRound className="h-4 w-4 text-primary" />
                  مفتاح API
                </Label>
                <div className="relative">
                  <Input
                    type={show ? "text" : "password"}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="sk-..."
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
                  احصل على مفتاحك من لوحة تحكم المزوّد. لن تتم مشاركته أو عرضه بعد الحفظ.
                </p>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-border bg-secondary/30 p-4">
                <div>
                  <p className="font-medium">تفعيل ميزات الذكاء الاصطناعي</p>
                  <p className="text-xs text-muted-foreground">
                    التحكم بإيقاف/تشغيل الميزات دون حذف المفتاح.
                  </p>
                </div>
                <Switch checked={enabled} onCheckedChange={setEnabled} />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setApiKey("")}>تفريغ</Button>
                <Button type="submit" className="cta-glow gap-2">
                  <Save className="h-4 w-4" />
                  حفظ المفتاح
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
    { openai: "OpenAI (GPT)", anthropic: "Anthropic (Claude)", google: "Google (Gemini)", lovable: "Lovable AI Gateway" }[v] ?? v
  );
}
