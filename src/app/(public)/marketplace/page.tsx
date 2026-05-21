import { redirect } from "next/navigation";

/** Legacy route — public catalog comparison removed per vendor isolation policy. */
export default function MarketplacePage() {
  redirect("/");
}
