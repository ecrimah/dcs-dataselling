import { createServiceClient, hasSupabaseConfig } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { KycReviewActions } from "./review-actions";
import { formatDistanceToNow } from "date-fns";

export const dynamic = "force-dynamic";

interface VendorKycRow {
  id: string;
  business_name: string;
  slug: string;
  kyc_status: "not_started" | "pending_review" | "verified" | "rejected";
  status: string;
  compliance_notes: string | null;
  momo_number: string | null;
  whatsapp_number: string | null;
  created_at: string;
  updated_at: string;
}

interface KycDocRow {
  vendor_id: string;
  doc_type: string;
  storage_path: string;
}

export default async function AdminKycQueuePage() {
  if (!hasSupabaseConfig()) {
    return <div className="card-elevated p-8 text-center">Database not configured.</div>;
  }

  const service = createServiceClient();
  const { data: vendorsRaw } = await service
    .from("vendors")
    .select(
      "id, business_name, slug, kyc_status, status, compliance_notes, momo_number, whatsapp_number, created_at, updated_at",
    )
    .in("kyc_status", ["pending_review", "rejected"])
    .order("updated_at", { ascending: true });

  const vendors = (vendorsRaw ?? []) as VendorKycRow[];

  const vendorIds = vendors.map((v) => v.id);
  let docs: KycDocRow[] = [];
  if (vendorIds.length > 0) {
    const { data: docsRaw } = await service
      .from("kyc_documents")
      .select("vendor_id, doc_type, storage_path")
      .in("vendor_id", vendorIds);
    docs = (docsRaw ?? []) as KycDocRow[];
  }

  const docMap = new Map<string, KycDocRow[]>();
  docs.forEach((d) => {
    const list = docMap.get(d.vendor_id) ?? [];
    list.push(d);
    docMap.set(d.vendor_id, list);
  });

  // Generate signed URLs for all docs (1h)
  const signedMap = new Map<string, string>();
  for (const d of docs) {
    const { data: signed } = await service.storage
      .from("kyc-documents")
      .createSignedUrl(d.storage_path, 3600);
    if (signed?.signedUrl) signedMap.set(d.storage_path, signed.signedUrl);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">KYC Verification Queue</h2>
        <p className="mt-1 text-sm text-muted">
          {vendors.length} pending {vendors.length === 1 ? "vendor" : "vendors"}.
        </p>
      </div>

      {vendors.length === 0 ? (
        <div className="card-elevated p-8 text-center">
          <p className="text-muted">No pending KYC applications.</p>
        </div>
      ) : (
        <ul className="space-y-4">
          {vendors.map((v) => {
            const vDocs = docMap.get(v.id) ?? [];
            return (
              <li key={v.id} className="card-elevated p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold">{v.business_name}</h3>
                    <p className="text-xs text-muted">/store/{v.slug}</p>
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted">
                      <span>MoMo: {v.momo_number ?? "—"}</span>
                      <span>WhatsApp: {v.whatsapp_number ?? "—"}</span>
                      <span>
                        Submitted{" "}
                        {formatDistanceToNow(new Date(v.updated_at), { addSuffix: true })}
                      </span>
                    </div>
                    {v.compliance_notes && (
                      <p className="mt-2 text-xs text-muted">
                        <span className="font-medium">Notes:</span> {v.compliance_notes}
                      </p>
                    )}
                  </div>
                  <Badge variant={v.kyc_status === "rejected" ? "danger" : "warning"}>
                    {v.kyc_status.replace("_", " ")}
                  </Badge>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {["ghana_card_front", "ghana_card_back", "selfie"].map((type) => {
                    const doc = vDocs.find((d) => d.doc_type === type);
                    const url = doc ? signedMap.get(doc.storage_path) : null;
                    return (
                      <div key={type}>
                        <p className="mb-1 text-xs font-medium capitalize text-muted">
                          {type.replace(/_/g, " ")}
                        </p>
                        {url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <a href={url} target="_blank" rel="noreferrer">
                            <img
                              src={url}
                              alt={type}
                              className="h-32 w-full rounded-lg border border-border object-cover"
                            />
                          </a>
                        ) : (
                          <div className="flex h-32 w-full items-center justify-center rounded-lg border border-dashed border-border bg-slate-50 text-xs text-muted">
                            Missing
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <KycReviewActions vendorId={v.id} />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
