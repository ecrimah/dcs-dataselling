import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { isArkeselConfigured } from "@/lib/notifications/arkesel";
import { fetchSmsLogs, fetchSmsLogSummary } from "@/lib/data/sms-logs";
import { SmsTestForm } from "./sms-test-form";
import { SmsLogTable } from "./sms-log-table";

export const dynamic = "force-dynamic";

export default async function SmsDebuggerPage() {
  const profile = await requireRole(["admin", "ops"]);
  if (!profile) redirect("/auth/login");

  const [summary, logs] = await Promise.all([
    fetchSmsLogSummary(),
    fetchSmsLogs(100),
  ]);
  const configured = isArkeselConfigured();

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-foreground">SMS Debugger</h2>
          <p className="mt-1 text-sm text-muted">
            Inspect Arkesel delivery, replay test messages, and triage failures.
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
            configured
              ? "bg-emerald-100 text-emerald-700"
              : "bg-amber-100 text-amber-700"
          }`}
        >
          Arkesel · {configured ? "Connected" : "Not configured"}
        </span>
      </header>

      {!configured && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-semibold">Arkesel is not configured.</p>
          <p className="mt-1 text-xs">
            Set <code className="rounded bg-amber-200/60 px-1">ARKESEL_API_KEY</code> and{" "}
            <code className="rounded bg-amber-200/60 px-1">ARKESEL_SENDER_ID</code> in your
            environment. Test sends will be logged as <strong>skipped</strong>.
          </p>
        </div>
      )}

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Total sent (all time)" value={summary.total.toLocaleString()} />
        <Metric
          label="Sent · 24h"
          value={summary.sentLast24h.toLocaleString()}
          accent="text-emerald-600"
        />
        <Metric
          label="Failed · 24h"
          value={summary.failedLast24h.toLocaleString()}
          accent={summary.failedLast24h > 0 ? "text-red-600" : undefined}
        />
        <Metric
          label="Skipped · 24h"
          value={summary.skippedLast24h.toLocaleString()}
          accent={summary.skippedLast24h > 0 ? "text-amber-600" : undefined}
        />
      </section>

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
        <div className="card-elevated p-5">
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted">
            Send test SMS
          </h3>
          <p className="mt-1 text-xs text-muted">
            Triggers the same Arkesel pipeline used for real orders. Logged with{" "}
            <code className="rounded bg-slate-100 px-1">admin_test</code> template.
          </p>
          <div className="mt-4">
            <SmsTestForm disabled={!configured} />
          </div>
        </div>

        <div className="card-elevated p-5">
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted">
            Last 24h by template
          </h3>
          {summary.byTemplate.length === 0 ? (
            <p className="mt-4 text-sm text-muted">No SMS activity in the last 24 hours.</p>
          ) : (
            <ul className="mt-4 divide-y divide-border">
              {summary.byTemplate.map((t) => (
                <li
                  key={t.template}
                  className="flex items-center justify-between gap-3 py-2.5 text-sm"
                >
                  <span className="font-mono text-xs text-foreground">{t.template}</span>
                  <span className="flex items-center gap-3 text-xs font-semibold">
                    <span className="text-emerald-600">{t.sent} sent</span>
                    <span className={t.failed > 0 ? "text-red-600" : "text-muted"}>
                      {t.failed} failed
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted">
            Recent SMS · last {logs.length}
          </h3>
        </div>
        <SmsLogTable logs={logs} />
      </section>
    </div>
  );
}

function Metric({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="card-elevated p-4">
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted">{label}</p>
      <p className={`num mt-1 text-2xl font-extrabold ${accent ?? "text-foreground"}`}>
        {value}
      </p>
    </div>
  );
}
