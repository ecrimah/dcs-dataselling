import { redirect } from "next/navigation";
import { MessageSquare, Send, SkipForward, XCircle } from "lucide-react";
import {
  AdminAlert,
  AdminEmptyState,
  AdminPageIntro,
  AdminPageRoot,
  AdminSection,
  AdminStatGrid,
  AdminStatTile,
  AdminStatusBadge,
  AdminTemplateRow,
} from "@/components/admin";
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
    <AdminPageRoot>
      <AdminPageIntro
        badge="Arkesel delivery"
        description="Inspect SMS delivery, replay test messages, and triage failures from the order pipeline."
        meta={`${summary.total.toLocaleString()} total sent · ${summary.sentLast24h} in last 24h`}
        actions={<AdminStatusBadge ok={configured} label="Arkesel" />}
      />

      {!configured && (
        <AdminAlert tone="warning" title="Arkesel is not configured">
          Set <code>ARKESEL_API_KEY</code> and <code>ARKESEL_SENDER_ID</code> in your environment.
          Test sends will be logged as <strong>skipped</strong>.
        </AdminAlert>
      )}

      <AdminStatGrid>
        <AdminStatTile
          icon={<MessageSquare className="h-4 w-4" />}
          tone="sky"
          label="Total sent"
          value={summary.total.toLocaleString()}
          hint="All time"
        />
        <AdminStatTile
          icon={<Send className="h-4 w-4" />}
          tone="emerald"
          label="Sent · 24h"
          value={summary.sentLast24h.toLocaleString()}
          valueAccent="emerald"
        />
        <AdminStatTile
          icon={<XCircle className="h-4 w-4" />}
          tone="rose"
          label="Failed · 24h"
          value={summary.failedLast24h.toLocaleString()}
          valueAccent={summary.failedLast24h > 0 ? "rose" : undefined}
        />
        <AdminStatTile
          icon={<SkipForward className="h-4 w-4" />}
          tone="amber"
          label="Skipped · 24h"
          value={summary.skippedLast24h.toLocaleString()}
        />
      </AdminStatGrid>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)]">
        <AdminSection
          title="Send test SMS"
          description="Uses the same Arkesel pipeline as real orders. Logged as admin_test."
          icon={Send}
        >
          <SmsTestForm disabled={!configured} />
        </AdminSection>

        <AdminSection
          title="Last 24h by template"
          description="Delivery breakdown by message template."
          icon={MessageSquare}
        >
          {summary.byTemplate.length === 0 ? (
            <AdminEmptyState
              icon={MessageSquare}
              title="No SMS activity"
              description="No messages sent in the last 24 hours."
            />
          ) : (
            <ul className="admin-template-list">
              {summary.byTemplate.map((t) => (
                <AdminTemplateRow
                  key={t.template}
                  template={t.template}
                  sent={t.sent}
                  failed={t.failed}
                />
              ))}
            </ul>
          )}
        </AdminSection>
      </div>

      <AdminSection
        title={`Recent SMS · last ${logs.length}`}
        description="Search and expand rows to inspect full message payloads."
        icon={MessageSquare}
      >
        <SmsLogTable logs={logs} />
      </AdminSection>
    </AdminPageRoot>
  );
}
