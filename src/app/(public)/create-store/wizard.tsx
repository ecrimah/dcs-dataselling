"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { StepIdentity } from "./steps/identity";
import { StepBranding } from "./steps/branding";
import { StepPayout } from "./steps/payout";
import { StepSetupFee } from "./steps/setup-fee";
import { StepReview } from "./steps/review";

export interface StoreFormState {
  fullName: string;
  accountEmail: string;
  accountPhone: string;
  accountPassword: string;
  accountPasswordConfirm: string;
  businessName: string;
  slug: string;
  emoji: string;
  themeColor: string;
  whatsapp: string;
  momoNumber: string;
  momoNetwork: "mtn" | "telecel" | "at";
  referralCode: string;
  setupFeePaid: boolean;
  setupFeeReference: string;
  agreedToTerms: boolean;
}

const STEPS = [
  { id: "identity", label: "Account", desc: "Login & store name" },
  { id: "branding", label: "Branding", desc: "Theme & avatar" },
  { id: "payout", label: "Payout", desc: "MoMo for earnings" },
  { id: "fee", label: "Store fee", desc: "Activation payment" },
  { id: "review", label: "Submit", desc: "Final review" },
] as const;

const SETUP_FEE_STEP = 3;
const REVIEW_STEP = 4;

type WizardProps = {
  signedInEmail?: string | null;
};

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function CreateStoreWizard({ signedInEmail = null }: WizardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(Boolean(signedInEmail));
  const [sessionEmail, setSessionEmail] = useState(signedInEmail ?? "");
  const paymentCallbackHandled = useRef(false);
  const [form, setForm] = useState<StoreFormState>({
    fullName: "",
    accountEmail: signedInEmail ?? "",
    accountPhone: "",
    accountPassword: "",
    accountPasswordConfirm: "",
    businessName: "",
    slug: "",
    emoji: "store",
    themeColor: "#06b6d4",
    whatsapp: "",
    momoNumber: "",
    momoNetwork: "mtn",
    referralCode: "",
    setupFeePaid: false,
    setupFeeReference: "",
    agreedToTerms: false,
  });

  const update = <K extends keyof StoreFormState>(k: K, v: StoreFormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const verifySetupPayment = useCallback(
    async (reference: string, slug: string) => {
      setVerifyingPayment(true);
      try {
        const res = await fetch("/api/vendor/setup-fee/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reference, slug }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Payment not verified");

        setForm((f) => ({
          ...f,
          setupFeePaid: true,
          setupFeeReference: data.reference ?? reference,
        }));
        setStep(SETUP_FEE_STEP);
        toast.success("Store setup fee paid. You can submit your application.");
        router.replace("/create-store");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Could not verify payment");
      } finally {
        setVerifyingPayment(false);
      }
    },
    [router],
  );

  useEffect(() => {
    const mode = searchParams.get("setup_fee");
    const ref = searchParams.get("ref");
    if (mode !== "callback" || !ref || paymentCallbackHandled.current) return;

    const slug = form.slug.trim().toLowerCase();
    if (slug.length < 3) {
      toast.error("Enter your store handle on step 1, then return from payment.");
      router.replace("/create-store");
      return;
    }

    paymentCallbackHandled.current = true;
    void verifySetupPayment(ref, slug);
  }, [searchParams, form.slug, verifySetupPayment, router]);

  const progress = ((step + 1) / STEPS.length) * 100;

  function accountStepValid(): boolean {
    const storeOk =
      form.businessName.trim().length >= 3 && form.slug.trim().length >= 3;
    if (isSignedIn) return storeOk;
    return (
      storeOk &&
      form.fullName.trim().length >= 2 &&
      isValidEmail(form.accountEmail) &&
      form.accountPassword.length >= 8 &&
      form.accountPassword === form.accountPasswordConfirm
    );
  }

  function canProceed(): boolean {
    switch (step) {
      case 0:
        return accountStepValid();
      case 1:
        return Boolean(form.themeColor) && Boolean(form.emoji);
      case 2:
        return form.momoNumber.trim().length >= 10;
      case SETUP_FEE_STEP:
        return form.setupFeePaid && form.setupFeeReference.length > 0;
      case REVIEW_STEP:
        return form.agreedToTerms && form.setupFeePaid;
      default:
        return false;
    }
  }

  async function registerAccountIfNeeded(): Promise<boolean> {
    if (isSignedIn) return true;

    setRegistering(true);
    try {
      const res = await fetch("/api/vendor/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.accountEmail.trim(),
          password: form.accountPassword,
          fullName: form.fullName.trim(),
          phone: form.accountPhone.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not create account");

      if (data.hasVendor) {
        toast.info("You already have a store on DCS.");
        router.push("/vendor/dashboard");
        return false;
      }

      setIsSignedIn(true);
      setSessionEmail(data.email ?? form.accountEmail);
      toast.success("Account created — continue setting up your store.");
      return true;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Registration failed");
      return false;
    } finally {
      setRegistering(false);
    }
  }

  async function handleContinue() {
    if (!canProceed() || verifyingPayment) return;

    if (step === 0) {
      const ok = await registerAccountIfNeeded();
      if (!ok) return;
    }

    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  async function handleSubmit() {
    if (!canProceed()) return;

    if (!isSignedIn) {
      const ok = await registerAccountIfNeeded();
      if (!ok) return;
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("businessName", form.businessName);
      fd.append("slug", form.slug);
      fd.append("emoji", form.emoji);
      fd.append("themeColor", form.themeColor);
      fd.append("whatsapp", form.whatsapp);
      fd.append("momoNumber", form.momoNumber);
      fd.append("momoNetwork", form.momoNetwork);
      fd.append("referralCode", form.referralCode);
      fd.append("setupFeeReference", form.setupFeeReference);

      const res = await fetch("/api/vendor/create-store", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not create store");
      toast.success("Your store is live! Open your dashboard to add bundles.");
      router.push(`/vendor/dashboard?welcome=1`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-[0_20px_60px_rgba(6,9,20,0.12)]">
        <div className="border-b border-border bg-slate-50/80 px-5 py-4 sm:px-6">
          <div className="mb-3 flex items-center justify-between text-xs">
            <span className="font-semibold text-foreground">
              Step {step + 1} of {STEPS.length}
            </span>
            <span className="text-muted">{STEPS[step].desc}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          <ol className="mt-4 hidden gap-1 sm:flex">
            {STEPS.map((s, i) => {
              const done = i < step;
              const active = i === step;
              return (
                <li key={s.id} className="flex flex-1 flex-col items-center">
                  <div className="flex w-full items-center">
                    {i > 0 && (
                      <div
                        className={cn(
                          "h-0.5 flex-1",
                          done || active ? "bg-cyan-500" : "bg-slate-200",
                        )}
                      />
                    )}
                    <div
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition-colors",
                        done
                          ? "bg-cyan-500 text-white"
                          : active
                            ? "bg-navy-900 text-white ring-2 ring-cyan-400/40 ring-offset-2"
                            : "bg-slate-200 text-muted",
                      )}
                    >
                      {done ? <Check className="h-4 w-4" strokeWidth={3} /> : i + 1}
                    </div>
                    {i < STEPS.length - 1 && (
                      <div
                        className={cn(
                          "h-0.5 flex-1",
                          i < step ? "bg-cyan-500" : "bg-slate-200",
                        )}
                      />
                    )}
                  </div>
                  <p
                    className={cn(
                      "mt-2 hidden text-center text-[10px] font-semibold lg:block",
                      active ? "text-foreground" : "text-muted",
                    )}
                  >
                    {s.label}
                  </p>
                </li>
              );
            })}
          </ol>
        </div>

        <div className="p-5 sm:p-8">
          {verifyingPayment && (
            <p className="mb-4 text-center text-sm text-muted">Confirming your payment…</p>
          )}
          {step === 0 && (
            <StepIdentity
              form={form}
              update={update}
              isSignedIn={isSignedIn}
              sessionEmail={sessionEmail}
            />
          )}
          {step === 1 && <StepBranding form={form} update={update} />}
          {step === 2 && <StepPayout form={form} update={update} />}
          {step === SETUP_FEE_STEP && <StepSetupFee form={form} update={update} />}
          {step === REVIEW_STEP && (
            <StepReview
              form={form}
              update={update}
              sessionEmail={sessionEmail || form.accountEmail}
            />
          )}

          <div className="mt-8 flex items-center justify-between gap-3 border-t border-border pt-6">
            <Button
              variant="ghost"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0 || submitting || verifyingPayment || registering}
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>
            {step < STEPS.length - 1 ? (
              <Button
                onClick={handleContinue}
                disabled={!canProceed() || verifyingPayment || registering}
              >
                {registering
                  ? "Creating account…"
                  : step === 0 && !isSignedIn
                    ? "Create account & continue"
                    : "Continue"}
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={!canProceed() || submitting || verifyingPayment}>
                {submitting ? "Submitting…" : "Submit application"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
