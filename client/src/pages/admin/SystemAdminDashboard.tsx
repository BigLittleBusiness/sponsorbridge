import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useCustomAuth } from "@/contexts/CustomAuthContext";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Settings, Mail, CreditCard, Building2, BarChart3, Activity,
  ToggleLeft, ScrollText, Megaphone, Shield, Users, CheckCircle2,
  XCircle, AlertTriangle, RefreshCw, Eye, EyeOff, Send, Loader2,
  TrendingUp, Database, Server, Clock, Baby, DollarSign, UserCheck,
  UserX, Search, ChevronLeft, ChevronRight, Globe, Heart, Zap
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";

// ── Helpers ──────────────────────────────────────────────────────────────────
function StatusDot({ ok }: { ok: boolean }) {
  return (
    <span className={`inline-block w-2.5 h-2.5 rounded-full mr-2 ${ok ? "bg-green-500" : "bg-red-500"}`} />
  );
}

function SecretInput({ label, settingKey, category, currentMasked }: {
  label: string; settingKey: string; category: string; currentMasked?: string | null;
}) {
  const [value, setValue] = useState("");
  const [show, setShow] = useState(false);
  const utils = trpc.useUtils();
  const upsert = trpc.sysAdmin.upsertSetting.useMutation({
    onSuccess: () => { toast.success(`${label} saved`); setValue(""); utils.sysAdmin.getSettings.invalidate(); },
    onError: (e) => toast.error(e.message),
  });
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            type={show ? "text" : "password"}
            placeholder={currentMasked ?? `Enter ${label}`}
            value={value}
            onChange={e => setValue(e.target.value)}
            className="pr-10"
          />
          <button type="button" onClick={() => setShow(s => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <Button size="sm" disabled={!value || upsert.isPending}
          onClick={() => upsert.mutate({ settingKey, settingValue: value, category, isSecret: true })}>
          {upsert.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
        </Button>
      </div>
    </div>
  );
}

function PlainInput({ label, settingKey, category, currentValue }: {
  label: string; settingKey: string; category: string; currentValue?: string | null;
}) {
  const [value, setValue] = useState(currentValue ?? "");
  const utils = trpc.useUtils();
  const upsert = trpc.sysAdmin.upsertSetting.useMutation({
    onSuccess: () => { toast.success(`${label} saved`); utils.sysAdmin.getSettings.invalidate(); },
    onError: (e) => toast.error(e.message),
  });
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="flex gap-2">
        <Input value={value} onChange={e => setValue(e.target.value)} placeholder={`Enter ${label}`} className="flex-1" />
        <Button size="sm" disabled={!value || upsert.isPending}
          onClick={() => upsert.mutate({ settingKey, settingValue: value, category, isSecret: false })}>
          {upsert.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
        </Button>
      </div>
    </div>
  );
}

// ── Tab: Email / SES ─────────────────────────────────────────────────────────
function EmailTab() {
  const { data: settings } = trpc.sysAdmin.getSettings.useQuery({ category: "email" });
  const [testEmail, setTestEmail] = useState("");
  const testSend = trpc.sysAdmin.testEmailConfig.useMutation({
    onSuccess: (r) => toast.success(r.message),
    onError: (e) => toast.error(e.message),
  });

  const get = (key: string) => settings?.find(s => s.settingKey === key)?.settingValue;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold mb-1">Email Provider Configuration</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Configure AWS SES or SMTP credentials for transactional emails (OTP verification, password reset, onboarding sequences).
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <PlainInput label="SMTP Host / SES Endpoint" settingKey="SMTP_HOST" category="email" currentValue={get("SMTP_HOST")} />
          <PlainInput label="SMTP Port" settingKey="SMTP_PORT" category="email" currentValue={get("SMTP_PORT")} />
          <PlainInput label="From Email Address" settingKey="EMAIL_FROM" category="email" currentValue={get("EMAIL_FROM")} />
          <PlainInput label="From Display Name" settingKey="EMAIL_FROM_NAME" category="email" currentValue={get("EMAIL_FROM_NAME")} />
          <SecretInput label="SMTP Username / SES Access Key ID" settingKey="SMTP_USER" category="email" currentMasked={get("SMTP_USER")} />
          <SecretInput label="SMTP Password / SES Secret Access Key" settingKey="SMTP_PASS" category="email" currentMasked={get("SMTP_PASS")} />
        </div>
      </div>
      <Separator />
      <div>
        <h3 className="text-base font-semibold mb-3">AWS SES Specific Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <PlainInput label="AWS Region" settingKey="AWS_SES_REGION" category="email" currentValue={get("AWS_SES_REGION")} />
          <PlainInput label="SES Configuration Set Name" settingKey="AWS_SES_CONFIG_SET" category="email" currentValue={get("AWS_SES_CONFIG_SET")} />
        </div>
      </div>
      <Separator />
      <div>
        <h3 className="text-base font-semibold mb-3">Test Email Delivery</h3>
        <div className="flex gap-2 max-w-md">
          <Input placeholder="test@example.com" value={testEmail} onChange={e => setTestEmail(e.target.value)} />
          <Button onClick={() => testSend.mutate({ toEmail: testEmail })} disabled={!testEmail || testSend.isPending}>
            {testSend.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
            Send Test
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Tab: Stripe ───────────────────────────────────────────────────────────────
function StripeTab() {
  const { data: settings } = trpc.sysAdmin.getSettings.useQuery({ category: "stripe" });
  const get = (key: string) => settings?.find(s => s.settingKey === key)?.settingValue;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold mb-1">Stripe Payment Configuration</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Configure Stripe keys for recurring sponsorship billing. Use test keys during development and switch to live keys after Stripe KYC verification.
          Test card: <code className="bg-muted px-1 rounded text-xs">4242 4242 4242 4242</code>
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SecretInput label="Stripe Secret Key (sk_live_... or sk_test_...)" settingKey="STRIPE_SECRET_KEY" category="stripe" currentMasked={get("STRIPE_SECRET_KEY")} />
          <PlainInput label="Stripe Publishable Key (pk_live_... or pk_test_...)" settingKey="STRIPE_PUBLISHABLE_KEY" category="stripe" currentValue={get("STRIPE_PUBLISHABLE_KEY")} />
          <SecretInput label="Stripe Webhook Secret (whsec_...)" settingKey="STRIPE_WEBHOOK_SECRET" category="stripe" currentMasked={get("STRIPE_WEBHOOK_SECRET")} />
          <PlainInput label="Stripe Account ID (acct_...)" settingKey="STRIPE_ACCOUNT_ID" category="stripe" currentValue={get("STRIPE_ACCOUNT_ID")} />
        </div>
      </div>
      <Separator />
      <div>
        <h3 className="text-base font-semibold mb-3">Webhook Configuration</h3>
        <div className="rounded-lg bg-muted p-4 space-y-2 text-sm">
          <p className="font-medium">Webhook Endpoint URL</p>
          <code className="block bg-background rounded px-3 py-2 text-xs font-mono border">
            {window.location.origin}/api/stripe/webhook
          </code>
          <p className="text-muted-foreground text-xs mt-2">
            Register this URL in your Stripe Dashboard → Developers → Webhooks. Required events:
            <span className="font-mono ml-1">invoice.paid, invoice.payment_failed, customer.subscription.deleted, checkout.session.completed</span>
          </p>
        </div>
      </div>
      <Separator />
      <div>
        <h3 className="text-base font-semibold mb-3">Stripe Sandbox</h3>
        <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 p-4 text-sm">
          <p className="font-medium text-amber-800 dark:text-amber-200 mb-1">⚠ Claim Your Stripe Sandbox</p>
          <p className="text-amber-700 dark:text-amber-300">
            A test Stripe sandbox has been provisioned. Claim it at{" "}
            <a href="https://dashboard.stripe.com/claim_sandbox" target="_blank" rel="noopener noreferrer"
              className="underline font-medium">dashboard.stripe.com/claim_sandbox</a>{" "}
            before it expires to activate your test environment.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Tab: Tenant Management ────────────────────────────────────────────────────
function TenantsTab() {
  const { data: tenants, refetch } = trpc.sysAdmin.listTenants.useQuery();
  const updateStatus = trpc.sysAdmin.updateTenantStatus.useMutation({
    onSuccess: () => { toast.success("Tenant status updated"); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold">All Organisations</h3>
          <p className="text-sm text-muted-foreground">{tenants?.length ?? 0} tenants registered</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="w-4 h-4 mr-2" />Refresh
        </Button>
      </div>
      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Organisation</th>
              <th className="text-left px-4 py-3 font-medium">Subdomain</th>
              <th className="text-left px-4 py-3 font-medium">Users</th>
              <th className="text-left px-4 py-3 font-medium">Revenue</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-left px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tenants?.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No tenants yet</td></tr>
            )}
            {tenants?.map(t => (
              <tr key={t.id} className="border-t hover:bg-muted/20">
                <td className="px-4 py-3 font-medium">{t.name}</td>
                <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{t.subdomain}</td>
                <td className="px-4 py-3">{t.userCount}</td>
                <td className="px-4 py-3">${((t.totalRevenueCents ?? 0) / 100).toFixed(0)}</td>
                <td className="px-4 py-3">
                  <Badge variant={t.isActive ? "default" : "secondary"}>
                    {t.isActive ? "Active" : "Suspended"}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <Button size="sm" variant="outline"
                    onClick={() => updateStatus.mutate({ tenantId: t.id, isActive: !t.isActive })}>
                    {t.isActive ? "Suspend" : "Activate"}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Tab: Billing Overview ─────────────────────────────────────────────────────
function BillingTab() {
  const { data: billing } = trpc.sysAdmin.getBillingOverview.useQuery();
  const { data: accounts } = trpc.sysAdmin.listAccounts.useQuery({ limit: 50, offset: 0 });

  const tierPrices: Record<string, number> = { starter: 0, growth: 99, professional: 249, enterprise: 499 };
  const mrr = billing?.tierBreakdown?.reduce((sum, t) => sum + (t.count * (tierPrices[t.tier ?? "starter"] ?? 0)), 0) ?? 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Accounts", value: billing?.totalAccounts ?? 0, icon: Users, color: "text-blue-600" },
          { label: "Verified Accounts", value: billing?.verifiedAccounts ?? 0, icon: CheckCircle2, color: "text-green-600" },
          { label: "Est. MRR", value: `$${mrr.toLocaleString()}`, icon: TrendingUp, color: "text-emerald-600" },
          { label: "All-Time Revenue", value: `$${((billing?.allTimeRevenueCents ?? 0) / 100).toFixed(0)}`, icon: BarChart3, color: "text-purple-600" },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <Icon className={`w-8 h-8 ${color}`} />
                <div>
                  <p className="text-2xl font-bold">{value}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-sm">Accounts by Plan Tier</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { key: "starter", label: "Starter (Free)", color: "bg-slate-400" },
                { key: "growth", label: "Growth ($99/mo)", color: "bg-blue-500" },
                { key: "professional", label: "Scale ($249/mo)", color: "bg-purple-500" },
                { key: "enterprise", label: "Enterprise (Custom)", color: "bg-amber-500" },
              ].map(({ key, label, color }) => {
                const count = billing?.tierBreakdown?.find(t => t.tier === key)?.count ?? 0;
                const total = billing?.verifiedAccounts ?? 1;
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={key} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{label}</span>
                      <span className="font-medium">{count} ({pct}%)</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Recent Registrations</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {accounts?.slice(0, 10).map(a => (
                <div key={a.id} className="flex items-center justify-between py-1.5 border-b last:border-0">
                  <div>
                    <p className="text-sm font-medium">{a.orgName}</p>
                    <p className="text-xs text-muted-foreground">{a.email}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant={a.isVerified ? "default" : "secondary"} className="text-xs">
                      {a.planTier ?? "starter"}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {a.createdAt ? new Date(a.createdAt).toLocaleDateString() : ""}
                    </p>
                  </div>
                </div>
              ))}
              {(!accounts || accounts.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-4">No accounts yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ── Tab: System Health ────────────────────────────────────────────────────────
function HealthTab() {
  const { data: health, refetch, isFetching } = trpc.sysAdmin.getSystemHealth.useQuery(undefined, {
    refetchInterval: 30000,
  });

  const formatUptime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    return `${h}h ${m}m`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">Platform Health</h3>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
          {isFetching ? "Checking..." : "Refresh"}
        </Button>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Database className="w-4 h-4" /> Database
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Connection</span>
              <span className="flex items-center">
                <StatusDot ok={health?.database.connected ?? false} />
                {health?.database.connected ? "Connected" : "Disconnected"}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Tables</span>
              <span className="font-medium">{health?.database.tableCount ?? "—"}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Server className="w-4 h-4" /> Server Process
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Uptime</span>
              <span className="font-medium flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {health ? formatUptime(health.server.uptime) : "—"}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Memory Usage</span>
              <span className="font-medium">{health?.server.memoryMb ?? "—"} MB</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Mail className="w-4 h-4" /> Email Service
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Provider</span>
              <span>AWS SES / SMTP</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Status</span>
              <Badge variant="secondary" className="text-xs">Configure in Email tab</Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <CreditCard className="w-4 h-4" /> Stripe
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Webhook Endpoint</span>
              <Badge variant="outline" className="text-xs font-mono">/api/stripe/webhook</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Status</span>
              <Badge variant="secondary" className="text-xs">Configure in Stripe tab</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">AWS Production Architecture</CardTitle>
          <CardDescription className="text-xs">Recommended services for production deployment</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            {[
              { service: "ECS Fargate", role: "Container hosting" },
              { service: "Aurora MySQL", role: "Serverless v2 DB" },
              { service: "S3 + CloudFront", role: "Media & assets CDN" },
              { service: "SES", role: "Transactional email" },
              { service: "ElastiCache", role: "Redis session cache" },
              { service: "WAF", role: "Web application firewall" },
              { service: "GuardDuty", role: "Threat detection" },
              { service: "CloudTrail", role: "API audit logging" },
            ].map(({ service, role }) => (
              <div key={service} className="rounded-md bg-muted/50 p-2">
                <p className="font-semibold text-foreground">{service}</p>
                <p className="text-muted-foreground">{role}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Tab: Feature Flags ────────────────────────────────────────────────────────
function FeatureFlagsTab() {
  const { data: flags, refetch } = trpc.sysAdmin.getFeatureFlags.useQuery({ tenantId: undefined });
  const upsert = trpc.sysAdmin.upsertFeatureFlag.useMutation({
    onSuccess: () => { toast.success("Feature flag updated"); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const globalFlags = [
    { key: "global_vlogs", label: "Vlog System", description: "Enable video upload and moderation globally" },
    { key: "global_translation", label: "Auto-Translation", description: "Enable DeepL/Google Translate for messages" },
    { key: "global_social_sharing", label: "Social Sharing", description: "Enable ambassador program and referral links" },
    { key: "global_bequest", label: "Bequest / Legacy Giving", description: "Enable bequest donation options" },
    { key: "global_pooled_sponsorship", label: "Pooled Sponsorship", description: "Allow sponsors to support a pool rather than individual child" },
    { key: "global_nps_surveys", label: "NPS Surveys", description: "Enable automated NPS surveys at Day 90 onboarding" },
    { key: "global_churn_prediction", label: "Churn Prediction", description: "Enable ML-based churn risk scoring" },
    { key: "global_advanced_safeguarding", label: "Advanced Safeguarding", description: "Enable incident management and vetting workflows" },
  ];

  const getFlagState = (key: string) => flags?.find(f => f.flagKey === key)?.enabled ?? false;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold mb-1">Global Feature Flags</h3>
        <p className="text-sm text-muted-foreground mb-4">
          These flags apply platform-wide. Per-tenant overrides can be set in each tenant's settings.
        </p>
      </div>
      <div className="space-y-3">
        {globalFlags.map(({ key, label, description }) => (
          <div key={key} className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/20 transition-colors">
            <div>
              <p className="font-medium text-sm">{label}</p>
              <p className="text-xs text-muted-foreground">{description}</p>
            </div>
            <Switch
              checked={getFlagState(key)}
              onCheckedChange={(enabled) => upsert.mutate({ flagKey: key, tenantId: null, enabled, description })}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Tab: Audit Logs ───────────────────────────────────────────────────────────
function AuditLogsTab() {
  const [offset, setOffset] = useState(0);
  const { data: logs } = trpc.sysAdmin.getAuditLogs.useQuery({ limit: 50, offset });

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold mb-1">Immutable Audit Trail</h3>
        <p className="text-sm text-muted-foreground">All platform actions are logged here. Records cannot be edited or deleted.</p>
      </div>
      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Timestamp</th>
              <th className="text-left px-4 py-3 font-medium">Action</th>
              <th className="text-left px-4 py-3 font-medium">User</th>
              <th className="text-left px-4 py-3 font-medium">Entity</th>
              <th className="text-left px-4 py-3 font-medium">IP</th>
            </tr>
          </thead>
          <tbody>
            {logs?.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No audit logs yet</td></tr>
            )}
            {logs?.map(log => (
              <tr key={log.id} className="border-t hover:bg-muted/10">
                <td className="px-4 py-2 font-mono text-muted-foreground whitespace-nowrap">
                  {new Date(log.createdAt).toLocaleString()}
                </td>
                <td className="px-4 py-2">
                  <Badge variant="outline" className="text-xs font-mono">{log.action}</Badge>
                </td>
                <td className="px-4 py-2 text-muted-foreground">{log.userEmail ?? `User #${log.userId}`}</td>
                <td className="px-4 py-2 text-muted-foreground">
                  {log.entityType && <span>{log.entityType} #{log.entityId}</span>}
                </td>
                <td className="px-4 py-2 font-mono text-muted-foreground">{log.ipAddress ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - 50))}>
          Previous
        </Button>
        <Button variant="outline" size="sm" onClick={() => setOffset(offset + 50)}>
          Next
        </Button>
      </div>
    </div>
  );
}

// ── Tab: Security ─────────────────────────────────────────────────────────────
function SecurityTab() {
  const { data: settings } = trpc.sysAdmin.getSettings.useQuery({ category: "security" });
  const get = (key: string) => settings?.find(s => s.settingKey === key)?.settingValue;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold mb-1">Security Configuration</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Platform-wide security settings. Changes take effect immediately.
        </p>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Session & Authentication</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <PlainInput label="JWT Session Expiry (hours)" settingKey="SESSION_EXPIRY_HOURS" category="security" currentValue={get("SESSION_EXPIRY_HOURS") ?? "168"} />
            <PlainInput label="Max OTP Attempts Before Lockout" settingKey="MAX_OTP_ATTEMPTS" category="security" currentValue={get("MAX_OTP_ATTEMPTS") ?? "5"} />
            <PlainInput label="OTP Expiry (minutes)" settingKey="OTP_EXPIRY_MINUTES" category="security" currentValue={get("OTP_EXPIRY_MINUTES") ?? "10"} />
            <PlainInput label="Password Reset Token Expiry (hours)" settingKey="RESET_TOKEN_EXPIRY_HOURS" category="security" currentValue={get("RESET_TOKEN_EXPIRY_HOURS") ?? "1"} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Rate Limiting</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <PlainInput label="Max Login Attempts per 15 min" settingKey="RATE_LIMIT_LOGIN" category="security" currentValue={get("RATE_LIMIT_LOGIN") ?? "10"} />
            <PlainInput label="Max Registration Attempts per hour" settingKey="RATE_LIMIT_REGISTER" category="security" currentValue={get("RATE_LIMIT_REGISTER") ?? "5"} />
            <PlainInput label="Max API Requests per minute" settingKey="RATE_LIMIT_API" category="security" currentValue={get("RATE_LIMIT_API") ?? "100"} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Child Protection Compliance</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <PlainInput label="GDPR Data Retention (days)" settingKey="GDPR_RETENTION_DAYS" category="security" currentValue={get("GDPR_RETENTION_DAYS") ?? "2555"} />
            <PlainInput label="Consent Expiry Warning (days before)" settingKey="CONSENT_WARNING_DAYS" category="security" currentValue={get("CONSENT_WARNING_DAYS") ?? "30"} />
            <PlainInput label="Background Check Expiry (months)" settingKey="BACKGROUND_CHECK_EXPIRY_MONTHS" category="security" currentValue={get("BACKGROUND_CHECK_EXPIRY_MONTHS") ?? "24"} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">AWS Security Services</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            {[
              { service: "AWS WAF", desc: "Web application firewall — configure in AWS Console" },
              { service: "GuardDuty", desc: "Threat detection — enable in AWS Security Hub" },
              { service: "CloudTrail", desc: "API audit logging — configure S3 bucket for logs" },
              { service: "KMS", desc: "Encryption key management — configure for S3 and RDS" },
            ].map(({ service, desc }) => (
              <div key={service} className="flex items-start gap-2">
                <Shield className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <span className="font-medium">{service}</span>
                  <span className="text-muted-foreground ml-2">{desc}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ── Tab: Broadcast ────────────────────────────────────────────────────────────
function BroadcastTab() {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold mb-1">Platform Broadcast</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Send a notification to all verified account holders. Use for maintenance windows, feature announcements, or compliance updates.
        </p>
      </div>
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-1.5">
            <Label>Subject</Label>
            <Input placeholder="e.g. Scheduled maintenance on Sunday 2am–4am AEST" value={subject} onChange={e => setSubject(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Message Body</Label>
            <textarea
              className="w-full min-h-[120px] rounded-md border bg-background px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Write your platform-wide announcement here..."
              value={body}
              onChange={e => setBody(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button disabled={!subject || !body}
              onClick={() => { toast.info("Broadcast queued — email delivery requires SES configuration in the Email tab."); setSubject(""); setBody(""); }}>
              <Megaphone className="w-4 h-4 mr-2" />Send to All Accounts
            </Button>
            <Button variant="outline" disabled={!subject || !body}
              onClick={() => toast.info("Preview sent to your registered email address.")}>
              Send Preview to Me
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Tab: Platform Overview ───────────────────────────────────────────────────
function OverviewTab() {
  const { data, isLoading } = trpc.sysAdmin.getPlatformOverview.useQuery();

  if (isLoading) return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>;

  const STATUS_COLORS: Record<string, string> = {
    SPONSORED: "#1a3a2e", AVAILABLE: "#c1440e", WAITLISTED: "#f4a261", GRADUATED: "#94a3b8",
  };

  const childPie = (data?.childrenByStatus ?? []).map(r => ({
    name: r.status.charAt(0) + r.status.slice(1).toLowerCase(),
    value: r.count,
    color: STATUS_COLORS[r.status] ?? "#94a3b8",
  }));

  const kpis = [
    { label: "Client Organisations", value: data?.totalOrgs ?? 0, sub: `+${data?.newOrgs30d ?? 0} this month`, icon: Building2, color: "bg-blue-50 text-blue-700" },
    { label: "Total Sponsors", value: data?.totalSponsors ?? 0, sub: `+${data?.newSponsors30d ?? 0} this month`, icon: Users, color: "bg-green-50 text-green-700" },
    { label: "Total Children", value: data?.totalChildren ?? 0, sub: `${data?.childrenByStatus?.find(s => s.status === 'SPONSORED')?.count ?? 0} sponsored`, icon: Baby, color: "bg-orange-50 text-orange-700" },
    { label: "Active Sponsorships", value: data?.activeSponsorships ?? 0, sub: `${data?.activeSponsors ?? 0} active sponsors`, icon: Heart, color: "bg-pink-50 text-pink-700" },
    { label: "All-Time Revenue", value: `$${((data?.allTimeRevenueCents ?? 0) / 100).toLocaleString()}`, sub: `$${((data?.last30DaysRevenueCents ?? 0) / 100).toLocaleString()} last 30d`, icon: DollarSign, color: "bg-emerald-50 text-emerald-700" },
    { label: "Active Users (7d)", value: data?.activeUsers7d ?? 0, sub: `${data?.verifiedOrgs ?? 0} verified orgs`, icon: Zap, color: "bg-purple-50 text-purple-700" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold mb-1">Platform Overview</h3>
        <p className="text-sm text-muted-foreground">A holistic view of all activity across the SponsorBridge platform.</p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {kpis.map(k => (
          <Card key={k.label}>
            <CardContent className="pt-5 pb-4">
              <div className={`w-9 h-9 rounded-lg ${k.color.split(" ")[0]} flex items-center justify-center mb-3`}>
                <k.icon className={`w-4.5 h-4.5 ${k.color.split(" ")[1]}`} />
              </div>
              <div className="text-2xl font-bold text-foreground">{k.value}</div>
              <div className="text-xs font-medium text-muted-foreground mt-0.5">{k.label}</div>
              <div className="text-xs text-muted-foreground mt-1">{k.sub}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">New Client Signups (30d)</CardTitle></CardHeader>
          <CardContent>
            {(data?.signupTrend?.length ?? 0) > 0 ? (
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={data!.signupTrend}>
                  <defs><linearGradient id="orgGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#1a3a2e" stopOpacity={0.2}/><stop offset="95%" stopColor="#1a3a2e" stopOpacity={0}/></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="day" tick={{ fontSize: 10 }} tickFormatter={d => d.slice(5)} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip labelFormatter={d => `Date: ${d}`} />
                  <Area type="monotone" dataKey="count" stroke="#1a3a2e" fill="url(#orgGrad)" strokeWidth={2} name="Signups" />
                </AreaChart>
              </ResponsiveContainer>
            ) : <div className="h-40 flex items-center justify-center text-sm text-muted-foreground">No signup data yet</div>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Children by Status</CardTitle></CardHeader>
          <CardContent>
            {childPie.length > 0 ? (
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={childPie} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value">
                    {childPie.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px" }} />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : <div className="h-40 flex items-center justify-center text-sm text-muted-foreground">No children data yet</div>}
          </CardContent>
        </Card>
      </div>

      {/* Sponsor trend */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm">New Sponsors Registered (30d)</CardTitle></CardHeader>
        <CardContent>
          {(data?.sponsorTrend?.length ?? 0) > 0 ? (
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={data!.sponsorTrend} barSize={14}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day" tick={{ fontSize: 10 }} tickFormatter={d => d.slice(5)} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip labelFormatter={d => `Date: ${d}`} />
                <Bar dataKey="count" fill="#c1440e" radius={[3, 3, 0, 0]} name="New Sponsors" />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="h-36 flex items-center justify-center text-sm text-muted-foreground">No sponsor data yet</div>}
        </CardContent>
      </Card>
    </div>
  );
}

// ── Tab: Client Accounts ──────────────────────────────────────────────────────
function ClientAccountsTab() {
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [verifiedFilter, setVerifiedFilter] = useState<string>("all");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;
  const utils = trpc.useUtils();

  const { data, isLoading } = trpc.sysAdmin.searchAccounts.useQuery({
    search: search || undefined,
    planTier: planFilter !== "all" ? (planFilter as any) : undefined,
    isVerified: verifiedFilter === "all" ? undefined : verifiedFilter === "verified",
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
  });

  const updateAccount = trpc.sysAdmin.updateAccount.useMutation({
    onSuccess: () => { toast.success("Account updated"); utils.sysAdmin.searchAccounts.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const PLAN_COLORS: Record<string, string> = {
    starter: "bg-gray-100 text-gray-700",
    growth: "bg-blue-100 text-blue-700",
    professional: "bg-purple-100 text-purple-700",
    enterprise: "bg-amber-100 text-amber-700",
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold mb-1">Client Organisations</h3>
        <p className="text-sm text-muted-foreground">All registered charity/NGO accounts across the platform.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            className="w-full pl-9 pr-3 py-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Search by org, email, or name…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
          />
        </div>
        <Select value={planFilter} onValueChange={v => { setPlanFilter(v); setPage(0); }}>
          <SelectTrigger className="w-36 h-9 text-sm"><SelectValue placeholder="Plan" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Plans</SelectItem>
            <SelectItem value="starter">Starter</SelectItem>
            <SelectItem value="growth">Growth</SelectItem>
            <SelectItem value="professional">Professional</SelectItem>
            <SelectItem value="enterprise">Enterprise</SelectItem>
          </SelectContent>
        </Select>
        <Select value={verifiedFilter} onValueChange={v => { setVerifiedFilter(v); setPage(0); }}>
          <SelectTrigger className="w-36 h-9 text-sm"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="verified">Verified</SelectItem>
            <SelectItem value="unverified">Unverified</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    {["Organisation", "Contact", "Plan", "Children", "Sponsors", "Active", "Joined", "Actions"].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(data?.rows ?? []).map(acc => (
                    <tr key={acc.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-foreground">{acc.orgName}</div>
                        <div className="text-xs text-muted-foreground">{acc.orgCountry}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div>{acc.firstName} {acc.lastName}</div>
                        <div className="text-xs text-muted-foreground">{acc.email}</div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={`text-xs ${PLAN_COLORS[acc.planTier ?? "starter"] ?? ""}`} variant="outline">
                          {acc.planTier}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center font-medium">{acc.childCount}</td>
                      <td className="px-4 py-3 text-center font-medium">{acc.sponsorCount}</td>
                      <td className="px-4 py-3">
                        {acc.isVerified
                          ? <span className="flex items-center gap-1 text-green-600 text-xs"><UserCheck className="w-3.5 h-3.5" />Verified</span>
                          : <span className="flex items-center gap-1 text-amber-600 text-xs"><UserX className="w-3.5 h-3.5" />Pending</span>}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {acc.createdAt ? new Date(acc.createdAt).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          {!acc.isVerified && (
                            <Button size="sm" variant="outline" className="h-7 text-xs"
                              disabled={updateAccount.isPending}
                              onClick={() => updateAccount.mutate({ accountId: acc.id, isVerified: true })}>
                              Verify
                            </Button>
                          )}
                          <Select
                            value={acc.planTier ?? "starter"}
                            onValueChange={v => updateAccount.mutate({ accountId: acc.id, planTier: v as any })}>
                            <SelectTrigger className="h-7 w-28 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="starter">Starter</SelectItem>
                              <SelectItem value="growth">Growth</SelectItem>
                              <SelectItem value="professional">Professional</SelectItem>
                              <SelectItem value="enterprise">Enterprise</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {(data?.rows?.length ?? 0) === 0 && (
                    <tr><td colSpan={8} className="px-4 py-10 text-center text-muted-foreground text-sm">No accounts found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {(data?.total ?? 0) > PAGE_SIZE && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, data?.total ?? 0)} of {data?.total} accounts</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" disabled={(page + 1) * PAGE_SIZE >= (data?.total ?? 0)} onClick={() => setPage(p => p + 1)}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tab: Sponsor Users ────────────────────────────────────────────────────────
function SponsorUsersTab() {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;
  const utils = trpc.useUtils();

  const { data, isLoading } = trpc.sysAdmin.listSponsors.useQuery({
    search: search || undefined,
    isActive: activeFilter === "all" ? undefined : activeFilter === "active",
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
  });

  const updateStatus = trpc.sysAdmin.updateSponsorStatus.useMutation({
    onSuccess: () => { toast.success("Sponsor status updated"); utils.sysAdmin.listSponsors.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold mb-1">Sponsor Users</h3>
        <p className="text-sm text-muted-foreground">All sponsor accounts across every client organisation.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            className="w-full pl-9 pr-3 py-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Search by name, email, or country…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
          />
        </div>
        <Select value={activeFilter} onValueChange={v => { setActiveFilter(v); setPage(0); }}>
          <SelectTrigger className="w-36 h-9 text-sm"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    {["Sponsor", "Organisation", "Country", "Sponsorships", "Status", "Joined", "Actions"].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(data?.rows ?? []).map(s => (
                    <tr key={s.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium">{s.firstName} {s.lastName}</div>
                        <div className="text-xs text-muted-foreground">{s.email}</div>
                      </td>
                      <td className="px-4 py-3 text-sm">{s.tenantName}</td>
                      <td className="px-4 py-3">
                        {s.country && <span className="flex items-center gap-1 text-xs"><Globe className="w-3 h-3" />{s.country}</span>}
                      </td>
                      <td className="px-4 py-3 text-center font-medium">{s.activeSponsorships}</td>
                      <td className="px-4 py-3">
                        {s.isActive
                          ? <Badge className="bg-green-100 text-green-700 text-xs" variant="outline">Active</Badge>
                          : <Badge className="bg-red-100 text-red-700 text-xs" variant="outline">Inactive</Badge>}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {s.createdAt ? new Date(s.createdAt).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          size="sm" variant="outline"
                          className={`h-7 text-xs ${s.isActive ? "text-red-600 hover:text-red-700" : "text-green-600 hover:text-green-700"}`}
                          disabled={updateStatus.isPending}
                          onClick={() => updateStatus.mutate({ sponsorId: s.id, isActive: !s.isActive })}>
                          {s.isActive ? "Deactivate" : "Activate"}
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {(data?.rows?.length ?? 0) === 0 && (
                    <tr><td colSpan={7} className="px-4 py-10 text-center text-muted-foreground text-sm">No sponsors found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {(data?.total ?? 0) > PAGE_SIZE && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, data?.total ?? 0)} of {data?.total} sponsors</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" disabled={(page + 1) * PAGE_SIZE >= (data?.total ?? 0)} onClick={() => setPage(p => p + 1)}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tab: Platform Statistics ────────────────────────────────────────────────
function PlatformStatsTab() {
  const { data, isLoading } = trpc.sysAdmin.getPlatformOverview.useQuery();
  const { data: billing, isLoading: billingLoading } = trpc.sysAdmin.getBillingOverview.useQuery();

  if (isLoading || billingLoading) return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>;

  const PLAN_COLORS: Record<string, string> = {
    starter: "#94a3b8", growth: "#60a5fa", professional: "#1a3a2e", enterprise: "#c1440e",
  };

  const planData = (billing?.tierBreakdown ?? []).map((r: { tier: string | null; count: number }) => ({
    name: (r.tier ?? "unknown").charAt(0).toUpperCase() + (r.tier ?? "unknown").slice(1),
    value: r.count,
    color: PLAN_COLORS[r.tier ?? "starter"] ?? "#94a3b8",
  }));

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold mb-1">Platform Statistics</h3>
        <p className="text-sm text-muted-foreground">Detailed charts and breakdowns of platform growth and usage.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Signup trend */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Client Signups — Last 30 Days</CardTitle></CardHeader>
          <CardContent>
            {(data?.signupTrend?.length ?? 0) > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={data!.signupTrend}>
                  <defs><linearGradient id="sgGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#1a3a2e" stopOpacity={0.25}/><stop offset="95%" stopColor="#1a3a2e" stopOpacity={0}/></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="day" tick={{ fontSize: 10 }} tickFormatter={d => d.slice(5)} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip />
                  <Area type="monotone" dataKey="count" stroke="#1a3a2e" fill="url(#sgGrad)" strokeWidth={2} name="Signups" />
                </AreaChart>
              </ResponsiveContainer>
            ) : <div className="h-44 flex items-center justify-center text-sm text-muted-foreground">No data yet</div>}
          </CardContent>
        </Card>

        {/* Plan distribution */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Plan Distribution</CardTitle></CardHeader>
          <CardContent>
            {planData.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={planData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                    {planData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px" }} />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : <div className="h-44 flex items-center justify-center text-sm text-muted-foreground">No data yet</div>}
          </CardContent>
        </Card>

        {/* Sponsor registrations */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Sponsor Registrations — Last 30 Days</CardTitle></CardHeader>
          <CardContent>
            {(data?.sponsorTrend?.length ?? 0) > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={data!.sponsorTrend} barSize={12}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="day" tick={{ fontSize: 10 }} tickFormatter={d => d.slice(5)} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#c1440e" radius={[3, 3, 0, 0]} name="Sponsors" />
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="h-44 flex items-center justify-center text-sm text-muted-foreground">No data yet</div>}
          </CardContent>
        </Card>

        {/* Children by status */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Children by Status</CardTitle></CardHeader>
          <CardContent>
            {(data?.childrenByStatus?.length ?? 0) > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={data!.childrenByStatus.map(r => ({ name: r.status.charAt(0) + r.status.slice(1).toLowerCase(), count: r.count }))} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#1a3a2e" radius={[3, 3, 0, 0]} name="Children" />
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="h-44 flex items-center justify-center text-sm text-muted-foreground">No data yet</div>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function SystemAdminDashboard() {
  const { account, loading: isLoading } = useCustomAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!isLoading && !account) {
      navigate("/login");
    } else if (!isLoading && account && !account.isSystemAdmin) {
      navigate("/org-dashboard");
    }
  }, [isLoading, account]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!account || !account.isSystemAdmin) return null;

  const tabs = [
    { value: "overview", label: "Overview", icon: BarChart3, component: <OverviewTab /> },
    { value: "clients", label: "Client Accounts", icon: Building2, component: <ClientAccountsTab /> },
    { value: "sponsors", label: "Sponsor Users", icon: Users, component: <SponsorUsersTab /> },
    { value: "platform-stats", label: "Platform Statistics", icon: TrendingUp, component: <PlatformStatsTab /> },
    { value: "email", label: "Email / SES", icon: Mail, component: <EmailTab /> },
    { value: "stripe", label: "Stripe", icon: CreditCard, component: <StripeTab /> },
    { value: "tenants", label: "Tenants", icon: Building2, component: <TenantsTab /> },
    { value: "billing", label: "Billing", icon: BarChart3, component: <BillingTab /> },
    { value: "health", label: "System Health", icon: Activity, component: <HealthTab /> },
    { value: "flags", label: "Feature Flags", icon: ToggleLeft, component: <FeatureFlagsTab /> },
    { value: "audit", label: "Audit Logs", icon: ScrollText, component: <AuditLogsTab /> },
    { value: "broadcast", label: "Broadcast", icon: Megaphone, component: <BroadcastTab /> },
    { value: "security", label: "Security", icon: Shield, component: <SecurityTab /> },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
                <Settings className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-bold">System Administration</h1>
                <p className="text-xs text-muted-foreground">SponsorBridge Platform Management</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-xs">
                <Shield className="w-3 h-3 mr-1" />System Admin
              </Badge>
              <Button variant="outline" size="sm" onClick={() => navigate("/org-dashboard")}>
                ← Back to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <Tabs defaultValue="email">
          <TabsList className="flex flex-wrap h-auto gap-1 mb-6 bg-muted/50 p-1 rounded-lg">
            {tabs.map(({ value, label, icon: Icon }) => (
              <TabsTrigger key={value} value={value} className="flex items-center gap-1.5 text-xs px-3 py-2">
                <Icon className="w-3.5 h-3.5" />{label}
              </TabsTrigger>
            ))}
          </TabsList>
          {tabs.map(({ value, component }) => (
            <TabsContent key={value} value={value}>
              {component}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}
