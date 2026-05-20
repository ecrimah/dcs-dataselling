import Link from "next/link";
import { Home, ArrowRight } from "lucide-react";

export function CreateStoreCta() {
  return (
    <Link
      href="/create-store"
      className="group flex items-center justify-between gap-3 rounded-2xl bg-navy-900 p-4 text-white transition-all hover:bg-navy-800"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
          <Home className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-bold">Create Store</p>
          <p className="text-xs text-slate-400">Launch your storefront</p>
        </div>
      </div>
      <ArrowRight className="h-4 w-4 text-cyan-400 transition-transform group-hover:translate-x-1" />
    </Link>
  );
}
