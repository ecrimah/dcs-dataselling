"use client";

import { Check, Copy, Link2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface Props {
  referralCode: string;
  inviteLink: string;
  rewardAmount: number;
}

async function copyText(value: string, label: string) {
  try {
    await navigator.clipboard.writeText(value);
    toast.success(`${label} copied`);
    return true;
  } catch {
    toast.error("Could not copy — try selecting the text manually");
    return false;
  }
}

export function ReferralShareCard({ referralCode, inviteLink, rewardAmount }: Props) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  async function handleCopyCode() {
    const ok = await copyText(referralCode, "Referral code");
    if (ok) {
      setCopiedCode(true);
      window.setTimeout(() => setCopiedCode(false), 2000);
    }
  }

  async function handleCopyLink() {
    const ok = await copyText(inviteLink, "Invite link");
    if (ok) {
      setCopiedLink(true);
      window.setTimeout(() => setCopiedLink(false), 2000);
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Share your code or link. You earn ₵{rewardAmount.toFixed(0)} when someone joins and completes
        their first sale.
      </p>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <code className="admin-promo-code flex-1 rounded-lg border border-border bg-slate-50 px-3 py-2.5">
          {referralCode}
        </code>
        <Button size="sm" variant="secondary" type="button" onClick={handleCopyCode}>
          {copiedCode ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copiedCode ? "Copied" : "Copy code"}
        </Button>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-border bg-slate-50 px-3 py-2.5 text-xs text-muted-foreground">
          <Link2 className="h-4 w-4 shrink-0" />
          <span className="truncate">{inviteLink.replace(/^https?:\/\//, "")}</span>
        </div>
        <Button size="sm" variant="outline" type="button" onClick={handleCopyLink}>
          {copiedLink ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copiedLink ? "Copied" : "Copy link"}
        </Button>
      </div>
    </div>
  );
}
