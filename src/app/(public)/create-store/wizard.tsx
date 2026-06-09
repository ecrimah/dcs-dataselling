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
import type { SetupPaymentResume } from "@/lib/vendor/onboarding-types";

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
  setupFeeGhs: number;
  resumePayment?: SetupPaymentResume | null;
};

const WIZARD_STORAGE_KEY = "dcs:create-store:wizard";

type PersistedSlice = Pick<
  StoreFormState,
  | "fullName"
  | "businessName"
  | "slug"
  | "emoji"
  | "themeColor"
  | "whatsapp"
  | "momoNumber"
  | "momoNetwork"
  | "referralCode"
  | "setupFeeReference"
>;

function loadPersisted(): Partial<PersistedSlice> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.sessionStorage.getItem(WIZARD_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Partial<PersistedSlice>) : {};
  } catch {
    return {};
  }
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function isValidGhanaPhone(raw: string) {
  const digits = raw.replace(/\D/g, "");
  return (
    (digits.length === 10 && digits.startsWith("0")) ||
    (digits.length === 12 && digits.startsWith("233")) ||
    digits.length === 9
  );
}

export function CreateStoreWizard({
  signedInEmail = null,
  setupFeeGhs,
  resumePayment = null,
}: WizardProps) {
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
    themeColor: "#0A2E5D",
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

  // When the admin turns the setup fee off (effective fee 0), the payment step
  // becomes a no-op and store creation is free.
  const feeRequired = setupFeeGhs > 0;

  // Re-hydrate non-secret wizard fields on mount so a Paystack redirect
  // (which kills in-memory React state) doesn't break the setup-fee verify
  // step. Also restores paid setup when the user returns via ?resume=1.
  useEffect(() => {
    const persisted = loadPersisted();
    const hasPersisted = Object.keys(persisted).length > 0;

    if (resumePayment) {
      setForm((f) => ({
        ...f,
        ...persisted,
        businessName: persisted.businessName || resumePayment.businessName || f.businessName,
        slug: persisted.slug || resumePayment.slug || f.slug,
        setupFeePaid: true,
        setupFeeReference: resumePayment.reference,
      }));
      setStep(REVIEW_STEP);
      setIsSignedIn(true);
      if (signedInEmail) setSessionEmail(signedInEmail);
      return;
    }

    if (!hasPersisted) return;
    setForm((f) => ({ ...f, ...persisted }));
    if (persisted.setupFeeReference) {
      setStep(SETUP_FEE_STEP);
    }
  }, [resumePayment, signedInEmail]);

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (!ref) return;
    setForm((f) => {
      if (f.referralCode.trim()) return f;
      return { ...f, referralCode: ref.trim().toUpperCase() };
    });
  }, [searchParams]);

  // Persist a safe slice of the wizard to sessionStorage whenever it changes.
  // Passwords and account credentials are intentionally excluded.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const slice: PersistedSlice = {
      fullName: form.fullName,
      businessName: form.businessName,
      slug: form.slug,
      emoji: form.emoji,
      themeColor: form.themeColor,
      whatsapp: form.whatsapp,
      momoNumber: form.momoNumber,
      momoNetwork: form.momoNetwork,
      referralCode: form.referralCode,
      setupFeeReference: form.setupFeeReference,
    };
    try {
      window.sessionStorage.setItem(WIZARD_STORAGE_KEY, JSON.stringify(slice));
    } catch {
      // sessionStorage may be unavailable (Safari private). Silent fallback.
    }
  }, [
    form.fullName,
    form.businessName,
    form.slug,
    form.emoji,
    form.themeColor,
    form.whatsapp,
    form.momoNumber,
    form.momoNetwork,
    form.referralCode,
    form.setupFeeReference,
  ]);

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
        setStep(REVIEW_STEP);
        toast.success("Store setup fee paid. Review your details and submit.");
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

    // Prefer the in-memory slug, fall back to sessionStorage in case the
    // Paystack redirect wiped React state.
    let slug = form.slug.trim().toLowerCase();
    if (slug.length < 3) {
      const persisted = loadPersisted();
      slug = (persisted.slug ?? "").trim().toLowerCase();
    }
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
      isValidGhanaPhone(form.accountPhone) &&
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
        return !feeRequired || (form.setupFeePaid && form.setupFeeReference.length > 0);
      case REVIEW_STEP:
        return form.agreedToTerms && (!feeRequired || form.setupFeePaid);
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
          phone: form.accountPhone.trim(),
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
      try {
        window.sessionStorage.removeItem(WIZARD_STORAGE_KEY);
      } catch {
        /* ignore */
      }
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
              className="h-full rounded-full bg-gradient-to-r from-gold to-gold-glow transition-all duration-300 ease-out"
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
                          done || active ? "bg-gold" : "bg-slate-200",
                        )}
                      />
                    )}
                    <div
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition-colors",
                        done
                          ? "bg-gold text-white"
                          : active
                            ? "bg-royal text-white ring-2 ring-gold/40 ring-offset-2"
                            : "bg-slate-200 text-muted",
                      )}
                    >
                      {done ? <Check className="h-4 w-4" strokeWidth={3} /> : i + 1}
                    </div>
                    {i < STEPS.length - 1 && (
                      <div
                        className={cn(
                          "h-0.5 flex-1",
                          i < step ? "bg-gold" : "bg-slate-200",
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
          {step === SETUP_FEE_STEP && (
            <StepSetupFee form={form} update={update} setupFeeGhs={setupFeeGhs} />
          )}
          {step === REVIEW_STEP && (
            <StepReview
              form={form}
              update={update}
              sessionEmail={sessionEmail || form.accountEmail}
              setupFeeGhs={setupFeeGhs}
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
