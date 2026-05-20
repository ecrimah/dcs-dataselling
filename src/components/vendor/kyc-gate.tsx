import Link from "next/link";
import { Clock, Shield, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Vendor } from "@/types";

export function KycGate({ vendor }: { vendor: Vendor }) {
  const status = vendor.kycStatus ?? "not_started";

  if (status === "pending_review") {
    return (
      <div className="card-elevated mx-auto max-w-xl p-8 text-center">
        <Clock className="mx-auto h-12 w-12 text-cyan-500" />
        <h2 className="mt-4 text-xl font-bold">KYC under review</h2>
        <p className="mt-2 text-sm text-muted">
          Our compliance team is verifying your documents. Most reviews complete within 24
          hours. We&apos;ll WhatsApp you the moment you&apos;re live.
        </p>
        <Badge variant="warning" className="mt-4">
          Verification in progress
        </Badge>
      </div>
    );
  }

  if (status === "rejected") {
    return (
      <div className="card-elevated mx-auto max-w-xl p-8 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-danger" />
        <h2 className="mt-4 text-xl font-bold">Verification rejected</h2>
        <p className="mt-2 text-sm text-muted">
          Your documents couldn&apos;t be verified. Please re-upload clear photos of your Ghana
          Card and a fresh selfie.
        </p>
        <Button className="mt-6" asChild>
          <Link href="/create-store?retry=1">Re-submit KYC</Link>
        </Button>
      </div>
    );
  }

  if (status === "verified") {
    return (
      <div className="card-elevated p-6 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-success" />
        <p className="mt-2 font-medium">You&apos;re verified.</p>
      </div>
    );
  }

  return (
    <div className="card-elevated mx-auto max-w-xl p-8 text-center">
      <Shield className="mx-auto h-12 w-12 text-cyan-500" />
      <h2 className="mt-4 text-xl font-bold">Complete your verification</h2>
      <p className="mt-2 text-sm text-muted">
        Upload your Ghana Card and a selfie to start selling on DCS.
      </p>
      <Button className="mt-6" asChild>
        <Link href="/create-store">Start KYC</Link>
      </Button>
    </div>
  );
}
