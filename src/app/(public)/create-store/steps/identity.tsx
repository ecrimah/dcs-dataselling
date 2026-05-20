"use client";

import { useEffect } from "react";
import Link from "next/link";
import { CheckCircle2, Link2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { SITE } from "@/lib/constants";
import type { StoreFormState } from "../wizard";

interface Props {
  form: StoreFormState;
  update: <K extends keyof StoreFormState>(k: K, v: StoreFormState[K]) => void;
  isSignedIn: boolean;
  sessionEmail?: string;
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 30);
}

export function StepIdentity({ form, update, isSignedIn, sessionEmail }: Props) {
  useEffect(() => {
    if (form.businessName && !form.slug) {
      update("slug", slugify(form.businessName));
    }
  }, [form.businessName, form.slug, update]);

  const storeUrl = `${SITE.url.replace(/\/$/, "")}/vendor/${form.slug || "your-handle"}`;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-foreground sm:text-xl">
          Account &amp; store identity
        </h2>
        <p className="mt-1 text-sm text-muted">
          Create your login and storefront details in one step — you&apos;ll use this email to
          access your vendor dashboard later.
        </p>
      </div>

      {isSignedIn ? (
        <div className="flex items-start gap-3 rounded-xl border border-emerald-500/25 bg-emerald-500/5 px-4 py-3">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
          <div className="text-sm">
            <p className="font-semibold text-emerald-800">Signed in</p>
            <p className="text-muted">{sessionEmail ?? form.accountEmail}</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4 rounded-xl border border-border bg-slate-50/80 p-4">
          <p className="text-sm font-semibold">Your login</p>
          <Input
            label="Full name"
            placeholder="e.g. Kwame Mensah"
            value={form.fullName}
            onChange={(e) => update("fullName", e.target.value)}
            autoComplete="name"
          />
          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            value={form.accountEmail}
            onChange={(e) => update("accountEmail", e.target.value)}
            autoComplete="email"
          />
          <Input
            label="Phone (optional)"
            type="tel"
            placeholder="0241234567"
            value={form.accountPhone}
            onChange={(e) => update("accountPhone", e.target.value)}
            autoComplete="tel"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Password"
              type="password"
              placeholder="Min. 8 characters"
              value={form.accountPassword}
              onChange={(e) => update("accountPassword", e.target.value)}
              autoComplete="new-password"
            />
            <Input
              label="Confirm password"
              type="password"
              placeholder="Repeat password"
              value={form.accountPasswordConfirm}
              onChange={(e) => update("accountPasswordConfirm", e.target.value)}
              autoComplete="new-password"
            />
          </div>
          {form.accountPassword &&
            form.accountPasswordConfirm &&
            form.accountPassword !== form.accountPasswordConfirm && (
              <p className="text-xs font-medium text-red-600">Passwords do not match.</p>
            )}
          <p className="text-xs text-muted">
            Already have an account?{" "}
            <Link href="/auth/login" className="font-semibold text-cyan-700 hover:underline">
              Sign in
            </Link>{" "}
            first, then return here to finish your store.
          </p>
        </div>
      )}

      <div className="space-y-4">
        <p className="text-sm font-semibold">Your store</p>
        <Input
          label="Store name"
          placeholder="e.g. Kwame's Data Hub"
          value={form.businessName}
          onChange={(e) => {
            update("businessName", e.target.value);
            update("slug", slugify(e.target.value));
          }}
        />

        <Input
          label="Store handle"
          placeholder="kwame-data-hub"
          value={form.slug}
          onChange={(e) => update("slug", slugify(e.target.value))}
        />

        <div className="flex items-start gap-2 rounded-xl border border-cyan-500/15 bg-cyan-500/5 px-3 py-2.5">
          <Link2 className="mt-0.5 h-4 w-4 shrink-0 text-cyan-600" />
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted">
              Your store link
            </p>
            <p className="num mt-0.5 truncate text-sm font-semibold text-foreground">
              {storeUrl}
            </p>
          </div>
        </div>

        <Input
          label="Referral code (optional)"
          placeholder="Friend's code"
          value={form.referralCode}
          onChange={(e) => update("referralCode", e.target.value.toUpperCase())}
          hint="Bonus credits after your first sale."
        />
      </div>
    </div>
  );
}
