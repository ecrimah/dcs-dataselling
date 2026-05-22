"use client";

import { useMemo, useState } from "react";
import { Check, ChevronRight, Copy, Terminal } from "lucide-react";

type Lang = "curl" | "node" | "python";

interface Endpoint {
  id: string;
  method: "GET" | "POST";
  path: string;
  title: string;
  description: string;
  request?: {
    body?: object;
    note?: string;
  };
  response: object;
}

const ENDPOINTS: Endpoint[] = [
  {
    id: "ping",
    method: "GET",
    path: "/api/v1/ping",
    title: "Health check",
    description: "Verify your API key is valid and the API is reachable.",
    response: {
      ok: true,
      vendor: { id: "uuid", name: "Your Store", slug: "your-store" },
      server_time: "2026-05-21T12:00:00.000Z",
    },
  },
  {
    id: "account",
    method: "GET",
    path: "/api/v1/account",
    title: "Account & wallet",
    description: "Get vendor info, wallet balance, and webhook configuration.",
    response: {
      vendor: {
        id: "uuid",
        name: "Your Store",
        slug: "your-store",
        verified: true,
        status: "active",
        member_since: "2025-11-01T00:00:00Z",
      },
      wallet: { currency: "GHS", balance: 1250.5, pending_balance: 0 },
      webhook: { configured: true, enabled: true },
    },
  },
  {
    id: "bundles",
    method: "GET",
    path: "/api/v1/bundles",
    title: "List bundles",
    description: "Returns every active SKU you can sell, with wholesale & retail prices.",
    response: {
      currency: "GHS",
      bundles: [
        {
          id: "uuid",
          sku: "MTN-1GB",
          network: "mtn",
          name: "MTN 1GB",
          data_mb: 1024,
          validity_days: 30,
          price: 5.5,
          suggested_retail: 7,
          product_line: "voucher",
          popular: true,
        },
      ],
    },
  },
  {
    id: "networks",
    method: "GET",
    path: "/api/v1/networks",
    title: "List networks",
    description: "Supported telco networks for ordering.",
    response: {
      networks: [
        { id: "mtn", name: "MTN" },
        { id: "telecel", name: "Telecel" },
        { id: "at", name: "AirtelTigo" },
      ],
    },
  },
  {
    id: "order-single",
    method: "POST",
    path: "/api/v1/orders",
    title: "Place a single order",
    description:
      "Charges your wallet and queues a delivery to the recipient. Returns 202 Accepted; track progress via webhook or by polling the order endpoint.",
    request: {
      body: {
        sku: "MTN-1GB",
        recipient_phone: "0241234567",
        quantity: 1,
        reference: "my-order-001",
      },
      note: "Provide either `sku` or `bundle_id`. `reference` makes the call idempotent.",
    },
    response: {
      order: {
        id: "uuid",
        reference: "my-order-001",
        status: "queued",
        bundle: { sku: "MTN-1GB", name: "MTN 1GB", network: "mtn", data_mb: 1024 },
        recipient_phone: "0241234567",
        quantity: 1,
        unit_price: 5.5,
        total: 5.5,
        wallet_balance_after: 1245,
      },
    },
  },
  {
    id: "order-bulk",
    method: "POST",
    path: "/api/v1/orders/bulk",
    title: "Place a bulk order",
    description:
      "Submit up to 500 line items at once. Use `dry_run: true` for a price preview without charging.",
    request: {
      body: {
        items: [
          { sku: "MTN-1GB", recipient_phone: "0241234567", quantity: 1 },
          { sku: "TELECEL-2GB", recipient_phone: "0501112222", quantity: 2 },
        ],
        dry_run: false,
        reference: "campaign-abc",
      },
    },
    response: {
      order: {
        id: "uuid",
        reference: "campaign-abc",
        status: "queued",
        item_count: 3,
        line_count: 2,
        total: 23.5,
        wallet_balance_after: 1221.5,
        invalid_lines: [],
      },
    },
  },
  {
    id: "order-get",
    method: "GET",
    path: "/api/v1/orders/{reference}",
    title: "Get order by reference",
    description: "Check the status of a single order and per-recipient line items.",
    response: {
      order: {
        id: "uuid",
        reference: "my-order-001",
        status: "fulfilled",
        supplier: "skanka5",
        supplier_status: "processed",
        total: 5.5,
        fulfilled_at: "2026-05-21T12:05:30Z",
        items: [
          {
            id: "uuid",
            recipient_phone: "0241234567",
            quantity: 1,
            unit_price: 5.5,
            line_total: 5.5,
            status: "fulfilled",
            fulfilled_at: "2026-05-21T12:05:28Z",
            bundle: { sku: "MTN-1GB", name: "MTN 1GB", network: "mtn", data_mb: 1024 },
          },
        ],
      },
    },
  },
  {
    id: "order-list",
    method: "GET",
    path: "/api/v1/orders?limit=25&status=fulfilled",
    title: "List recent orders",
    description: "Paginated list, newest first. Optional `status` filter.",
    response: {
      orders: [
        {
          id: "uuid",
          reference: "my-order-001",
          status: "fulfilled",
          supplier_status: "processed",
          total: 5.5,
          item_count: 1,
          source: "single",
          created_at: "2026-05-21T12:00:00Z",
        },
      ],
      count: 1,
    },
  },
];

export function DocsBrowser({ apiBase }: { apiBase: string }) {
  const [selectedId, setSelectedId] = useState(ENDPOINTS[0].id);
  const [lang, setLang] = useState<Lang>("curl");
  const endpoint = ENDPOINTS.find((e) => e.id === selectedId)!;

  const exampleCode = useMemo(
    () => buildExample(lang, endpoint, apiBase),
    [lang, endpoint, apiBase],
  );

  return (
    <div className="grid gap-3 lg:grid-cols-[260px_1fr]">
      {/* Side nav */}
      <nav className="card-elevated max-h-[70vh] overflow-y-auto p-2">
        <p className="px-2 pb-2 pt-1 text-[10px] font-bold uppercase tracking-wider text-white/45">
          Endpoints
        </p>
        <ul className="space-y-0.5">
          {ENDPOINTS.map((e) => {
            const active = e.id === selectedId;
            return (
              <li key={e.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(e.id)}
                  className={`flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-xs transition ${
                    active ? "bg-gold/10 text-white" : "text-white/65 hover:bg-white/5"
                  }`}
                >
                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5">
                      <span
                        className={`rounded px-1 py-0.5 text-[9px] font-bold ${
                          e.method === "GET" ? "bg-sky-500/15 text-sky-300" : "bg-emerald-500/15 text-emerald-300"
                        }`}
                      >
                        {e.method}
                      </span>
                      <span className="truncate font-semibold">{e.title}</span>
                    </p>
                    <code className="mt-0.5 block truncate font-mono text-[10px] text-white/45">
                      {e.path}
                    </code>
                  </div>
                  <ChevronRight className={`h-3 w-3 shrink-0 transition ${active ? "text-gold" : "text-white/30"}`} />
                </button>
              </li>
            );
          })}
        </ul>

        <p className="mt-3 px-2 pb-1 pt-2 text-[10px] font-bold uppercase tracking-wider text-white/45">
          References
        </p>
        <ul className="space-y-0.5 px-2 text-[11px]">
          <li className="rounded-lg bg-white/5 px-2 py-1.5">
            <p className="font-semibold text-white">Auth</p>
            <code className="mt-0.5 block font-mono text-[10px] text-white/55">
              Authorization: Bearer dcs_…
            </code>
          </li>
          <li className="rounded-lg bg-white/5 px-2 py-1.5">
            <p className="font-semibold text-white">Base URL</p>
            <code className="mt-0.5 block break-all font-mono text-[10px] text-white/55">
              {apiBase}
            </code>
          </li>
          <li className="rounded-lg bg-white/5 px-2 py-1.5">
            <p className="font-semibold text-white">Currency</p>
            <span className="text-white/55">GHS (Ghanaian Cedi)</span>
          </li>
        </ul>
      </nav>

      {/* Detail */}
      <div className="space-y-3">
        <div className="card-elevated p-4">
          <div className="flex items-center gap-2">
            <span
              className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                endpoint.method === "GET" ? "bg-sky-500/15 text-sky-300" : "bg-emerald-500/15 text-emerald-300"
              }`}
            >
              {endpoint.method}
            </span>
            <code className="font-mono text-sm text-white">{endpoint.path}</code>
          </div>
          <h3 className="mt-2 text-lg font-bold text-white">{endpoint.title}</h3>
          <p className="mt-1 text-sm text-white/65">{endpoint.description}</p>
        </div>

        {/* Code sample */}
        <div className="card-elevated overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
            <div className="flex items-center gap-2">
              <Terminal className="h-3.5 w-3.5 text-gold" />
              <p className="text-xs font-semibold uppercase tracking-wider text-white/65">
                Request
              </p>
            </div>
            <div className="flex items-center gap-1 rounded-lg bg-white/5 p-0.5">
              {(["curl", "node", "python"] as Lang[]).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLang(l)}
                  className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                    lang === l ? "bg-gold text-navy-950" : "text-white/55 hover:text-white"
                  }`}
                >
                  {langLabel(l)}
                </button>
              ))}
            </div>
          </div>
          <CodeBlock code={exampleCode} />
        </div>

        {endpoint.request?.note && (
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-200">
            {endpoint.request.note}
          </div>
        )}

        {/* Response */}
        <div className="card-elevated overflow-hidden">
          <div className="border-b border-white/10 px-4 py-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-white/65">
              Response
            </p>
          </div>
          <CodeBlock code={JSON.stringify(endpoint.response, null, 2)} language="json" />
        </div>

        {/* Common errors */}
        <div className="card-elevated p-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-white/55">
            Common error codes
          </h4>
          <ul className="mt-2 space-y-1.5 text-xs">
            <ErrorRow status={401} code="missing_key | invalid_key | revoked | expired" desc="API key is missing, malformed, or no longer valid." />
            <ErrorRow status={402} code="insufficient_funds" desc="Wallet balance is below the order total. Top up to retry." />
            <ErrorRow status={404} code="bundle_not_found | not_found" desc="The SKU or reference does not exist or is inactive." />
            <ErrorRow status={400} code="invalid_phone | invalid_body" desc="Recipient phone or request payload did not validate." />
            <ErrorRow status={500} code="internal_error" desc="Unexpected server error. Safe to retry with the same reference." />
          </ul>
        </div>
      </div>
    </div>
  );
}

function langLabel(l: Lang): string {
  return l === "node" ? "Node.js" : l === "python" ? "Python" : "cURL";
}

function ErrorRow({ status, code, desc }: { status: number; code: string; desc: string }) {
  return (
    <li className="flex flex-wrap items-start gap-2 text-white/65">
      <span className="rounded bg-red-500/15 px-1.5 py-0.5 text-[10px] font-bold text-red-300">
        {status}
      </span>
      <code className="font-mono text-[11px] text-white">{code}</code>
      <span className="text-[11px] text-white/55">— {desc}</span>
    </li>
  );
}

function CodeBlock({ code, language }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="relative">
      <pre className="overflow-x-auto bg-navy-950 p-4 font-mono text-[11px] leading-relaxed text-emerald-200">
        <code>{code}</code>
      </pre>
      <button
        type="button"
        onClick={() => {
          void navigator.clipboard.writeText(code);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
        className="absolute right-2 top-2 flex items-center gap-1 rounded-lg bg-navy-900/90 px-2 py-1 text-[10px] font-bold text-white/65 hover:text-white"
        aria-label={`Copy ${language ?? "code"}`}
      >
        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

function buildExample(lang: Lang, endpoint: Endpoint, apiBase: string): string {
  const fullUrl = `${apiBase}${endpoint.path}`;
  const hasBody = endpoint.method === "POST" && endpoint.request?.body;
  const body = endpoint.request?.body;

  if (lang === "curl") {
    const lines = [`curl -X ${endpoint.method} "${fullUrl}" \\`];
    lines.push(`  -H "Authorization: Bearer YOUR_API_KEY" \\`);
    if (hasBody) {
      lines.push(`  -H "Content-Type: application/json" \\`);
      const jsonStr = JSON.stringify(body, null, 2)
        .split("\n")
        .map((line, i) => (i === 0 ? `  -d '${line}` : `     ${line}`))
        .join("\n");
      lines.push(`${jsonStr}'`);
    } else {
      // Remove trailing backslash from last line
      lines[lines.length - 1] = lines[lines.length - 1].replace(/ \\$/, "");
    }
    return lines.join("\n");
  }

  if (lang === "node") {
    return `const res = await fetch("${fullUrl}", {
  method: "${endpoint.method}",
  headers: {
    "Authorization": "Bearer YOUR_API_KEY",${hasBody ? `\n    "Content-Type": "application/json",` : ""}
  },${
    hasBody
      ? `\n  body: JSON.stringify(${JSON.stringify(body, null, 2).replace(/\n/g, "\n  ")}),`
      : ""
  }
});
const data = await res.json();
console.log(data);`;
  }

  // Python
  return `import requests

${
  hasBody
    ? `payload = ${JSON.stringify(body, null, 4)}

res = requests.${endpoint.method.toLowerCase()}(
    "${fullUrl}",
    headers={"Authorization": "Bearer YOUR_API_KEY"},
    json=payload,
)`
    : `res = requests.${endpoint.method.toLowerCase()}(
    "${fullUrl}",
    headers={"Authorization": "Bearer YOUR_API_KEY"},
)`
}
print(res.json())`;
}
