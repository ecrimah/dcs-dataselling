"use client";

import { useState } from "react";
import { Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function VendorApplyPage() {
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    toast.success("Application received! Our team will review within 48 hours.");
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-xl">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl gradient-accent">
          <Store className="h-7 w-7 text-white" />
        </div>
        <h1 className="mt-6 text-3xl font-bold">Become a DCS Vendor</h1>
        <p className="mt-2 text-muted">
          Join Ghana&apos;s premium data marketplace. Get your storefront, dashboard, and payouts.
        </p>

        <form onSubmit={handleSubmit} className="card-elevated mt-8 space-y-4 p-6">
          <Input label="Business name" name="businessName" required />
          <Input label="Contact email" name="email" type="email" required />
          <Input label="Phone / WhatsApp" name="phone" required />
          <Input label="Preferred store URL slug" name="slug" hint="e.g. my-data-shop" required />
          <div>
            <label className="text-sm font-medium">Tell us about your business</label>
            <textarea
              name="about"
              rows={4}
              className="mt-1.5 w-full rounded-xl border border-border px-4 py-3 text-sm focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
              required
            />
          </div>
          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? "Submitting..." : "Submit Application"}
          </Button>
        </form>
      </div>
    </div>
  );
}
