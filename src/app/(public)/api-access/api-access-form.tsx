"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Code2, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Props {
  signedInEmail: string | null;
}

export function ApiAccessForm({ signedInEmail }: Props) {
  const router = useRouter();
  const isSignedIn = Boolean(signedInEmail);

  const [appName, setAppName] = useState("");
  const [handle, setHandle] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;

    if (appName.trim().length < 3) {
      toast.error("Enter a name of at least 3 characters.");
      return;
    }

    setSubmitting(true);
    try {
      if (!isSignedIn) {
        const regRes = await fetch("/api/vendor/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: email.trim(),
            password,
            fullName: fullName.trim(),
          }),
        });
        const regData = await regRes.json();
        if (!regRes.ok) {
          toast.error(regData.error ?? "Could not create your account.");
          setSubmitting(false);
          return;
        }
        if (regData.hasVendor) {
          toast.info("You already have an account on DCS. Opening your dashboard.");
          router.push("/vendor/dashboard/developer");
          return;
        }
      }

      const res = await fetch("/api/vendor/api-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessName: appName.trim(), slug: handle.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Could not set up API access.");
        setSubmitting(false);
        return;
      }

      toast.success("API access created. It's pending admin approval.");
      router.push("/vendor/dashboard/developer");
    } catch {
      toast.error("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto max-w-lg rounded-2xl border border-border bg-white p-6 shadow-xl sm:p-8"
    >
      <div className="flex items-center gap-2">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
          <Code2 className="h-4 w-4" />
        </span>
        <div>
          <h2 className="text-lg font-bold text-foreground">Get developer API access</h2>
          <p className="text-xs text-muted">No storefront needed. Connect your own app or website.</p>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <Input
          label="App or business name"
          placeholder="e.g. My Data Bot"
          value={appName}
          onChange={(e) => setAppName(e.target.value)}
          maxLength={60}
          required
        />
        <Input
          label="Account handle (optional)"
          placeholder="auto-generated if blank"
          hint="Used internally to identify your account. Not shown publicly."
          value={handle}
          onChange={(e) => setHandle(e.target.value)}
          maxLength={40}
        />

        {!isSignedIn && (
          <>
            <div className="border-t border-border pt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                Create your login
              </p>
            </div>
            <Input
              label="Full name"
              placeholder="Your name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              maxLength={80}
              required
            />
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              label="Password"
              type="password"
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
            />
          </>
        )}

        {isSignedIn && (
          <p className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-muted">
            Signed in as <span className="font-semibold text-foreground">{signedInEmail}</span>
          </p>
        )}
      </div>

      <Button type="submit" className="mt-6 w-full" disabled={submitting}>
        {submitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Setting up…
          </>
        ) : (
          "Create API access"
        )}
      </Button>

      <p className="mt-4 text-center text-xs text-muted">
        Your account needs admin approval before keys go live. Want a full storefront instead?{" "}
        <Link href="/create-store" className="font-semibold text-amber-600 hover:underline">
          Create a store
        </Link>
      </p>
    </form>
  );
}
