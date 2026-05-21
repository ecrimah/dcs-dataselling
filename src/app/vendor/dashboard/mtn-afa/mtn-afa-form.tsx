"use client";

export function MtnAfaForm() {
  return (
    <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-4">
      <p className="text-sm font-semibold text-yellow-200">Agent registration</p>
      <p className="mt-1 text-xs text-white/55">
        Submit your MTN agent ID to unlock AFA-priced bundles in your catalogue.
      </p>
      <input
        type="text"
        placeholder="MTN Agent ID"
        className="mt-3 w-full rounded-xl border border-white/10 bg-navy-950 px-3 py-2.5 text-sm text-white focus:border-gold/40 focus:outline-none"
      />
      <button type="button" className="mt-2 w-full rounded-xl bg-gold py-2.5 text-sm font-bold text-navy-950">
        Submit for verification
      </button>
    </div>
  );
}
