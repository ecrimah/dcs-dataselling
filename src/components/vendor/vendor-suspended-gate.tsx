import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export function VendorSuspendedGate() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-600">
        <ShieldAlert className="h-7 w-7" />
      </div>
      <h1 className="mt-4 text-xl font-bold">Account suspended</h1>
      <p className="mt-2 text-sm text-muted">
        Your agent account has been frozen by an administrator. Contact support if you believe this is a mistake.
      </p>
      <Button asChild className="mt-6">
        <Link href="/support">Contact support</Link>
      </Button>
    </div>
  );
}
