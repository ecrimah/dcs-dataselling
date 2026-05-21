import { Search, MousePointerClick, Wallet, Zap } from "lucide-react";

const STEPS = [
  {
    num: "01",
    icon: Search,
    title: "Open your store link",
    desc: "Paste the link your agent shared — each store is private to that agent.",
  },
  {
    num: "02",
    icon: MousePointerClick,
    title: "Choose a bundle",
    desc: "Open your agent's store and pick the plan that fits you.",
  },
  {
    num: "03",
    icon: Wallet,
    title: "Pay with MoMo",
    desc: "Mobile Money or card — secured by Paystack rails.",
  },
  {
    num: "04",
    icon: Zap,
    title: "Receive in seconds",
    desc: "Track every step from payment to delivery to your phone.",
  },
];

export function HowItWorks() {
  return (
    <section className="bg-white px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-xl">
          <span className="eyebrow text-cyan-600">How it works</span>
          <h2 className="display-2 mt-2 text-foreground">
            From phone unlock to data on your line — under 60 seconds.
          </h2>
          <p className="mt-2 text-sm text-muted">
            No reseller portals, no USSD codes. Just a clean, instant transaction.
          </p>
        </div>

        <ol className="mt-8 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step) => (
            <li
              key={step.num}
              className="card-elevated card-lift relative overflow-hidden p-4"
            >
              <span className="num absolute right-3 top-3 text-3xl font-extrabold tracking-tighter text-slate-100">
                {step.num}
              </span>
              <div className="relative">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-teal-500 text-white shadow shadow-cyan-500/25">
                  <step.icon className="h-4 w-4" />
                </div>
                <h3 className="mt-3 text-sm font-bold text-foreground">{step.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-muted">{step.desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
