/** Parse a vendor slug from a store link, URL, or raw slug input. */
export function parseVendorStoreSlug(input: string): string {
  const raw = input.trim().toLowerCase();
  if (!raw) return "";

  const vendorPath = raw.match(/\/vendor\/([a-z0-9-]+)/);
  if (vendorPath?.[1]) return vendorPath[1];

  try {
    const withProtocol = raw.includes("://") ? raw : `https://${raw}`;
    const url = new URL(withProtocol);
    const fromPath = url.pathname.match(/\/vendor\/([a-z0-9-]+)/);
    if (fromPath?.[1]) return fromPath[1];
  } catch {
    /* not a URL — treat as slug */
  }

  return raw.replace(/^@/, "").replace(/[^a-z0-9-]/g, "");
}
