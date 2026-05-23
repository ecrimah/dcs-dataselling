import { ImageResponse } from "next/og";
import { fetchVendorBySlug, fetchVendorBundles } from "@/lib/data/queries";
import { resolveThemeBackground } from "@/lib/vendor-theme";
import { SITE } from "@/lib/constants";

export const alt = `Buy data on DCS ELITE`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const vendor = await fetchVendorBySlug(slug);

  // Fallback if vendor not found — branded DCS card with slug as label
  if (!vendor) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background:
              "linear-gradient(135deg, #061d45 0%, #0a2e5d 60%, #0d3a6e 100%)",
            color: "#fff",
            fontFamily: "system-ui, -apple-system, sans-serif",
            fontSize: 56,
            fontWeight: 900,
          }}
        >
          {SITE.name}
        </div>
      ),
      { ...size },
    );
  }

  const bundles = await fetchVendorBundles(vendor.id);
  const lowest = bundles.length ? Math.min(...bundles.map((b) => b.price)) : null;
  const networks = Array.from(new Set(bundles.map((b) => b.network)));
  const heroBg = resolveThemeBackground(vendor.themeColor);
  const initials = vendor.businessName
    .split(/\s+/)
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          background: heroBg,
          color: "#fff",
          fontFamily: "system-ui, -apple-system, sans-serif",
          position: "relative",
        }}
      >
        {/* Brand watermark */}
        <div
          style={{
            position: "absolute",
            top: 28,
            right: 32,
            display: "flex",
            alignItems: "center",
            gap: 8,
            color: "rgba(255,255,255,0.78)",
            fontSize: 18,
            fontWeight: 800,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "linear-gradient(135deg, #d4af37 0%, #f4d160 100%)",
              color: "#0a2e5d",
              fontWeight: 900,
              fontSize: 18,
            }}
          >
            D
          </div>
          {SITE.name}
        </div>

        {/* Mesh overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(60% 60% at 80% 0%, rgba(255,255,255,0.18) 0%, transparent 60%), radial-gradient(50% 60% at 10% 100%, rgba(0,0,0,0.30) 0%, transparent 60%)",
            pointerEvents: "none",
          }}
        />

        {/* Top — store identity */}
        <div style={{ display: "flex", alignItems: "center", gap: 22, position: "relative" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 96,
              height: 96,
              borderRadius: 22,
              background: "rgba(255,255,255,0.15)",
              border: "1px solid rgba(255,255,255,0.25)",
              color: "#fff",
              fontSize: 44,
              fontWeight: 900,
              letterSpacing: "-0.04em",
            }}
          >
            {initials || "D"}
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                fontSize: 20,
                fontWeight: 700,
                letterSpacing: "0.14em",
                color: "rgba(255,255,255,0.75)",
                textTransform: "uppercase",
              }}
            >
              {vendor.verified ? "Verified store" : "DCS storefront"}
            </div>
            <div
              style={{
                marginTop: 6,
                fontSize: 56,
                fontWeight: 900,
                letterSpacing: "-0.02em",
                lineHeight: 1.04,
                color: "#fff",
                maxWidth: 880,
              }}
            >
              {vendor.businessName}
            </div>
          </div>
        </div>

        {/* Middle — pitch */}
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            maxWidth: 1060,
          }}
        >
          {vendor.tagline ? (
            <div
              style={{
                fontSize: 30,
                fontWeight: 600,
                color: "rgba(255,255,255,0.92)",
                lineHeight: 1.32,
              }}
            >
              {vendor.tagline}
            </div>
          ) : (
            <div
              style={{
                fontSize: 30,
                fontWeight: 600,
                color: "rgba(255,255,255,0.92)",
                lineHeight: 1.32,
              }}
            >
              Buy MTN, Telecel & AirtelTigo data. Instant delivery, MoMo payments.
            </div>
          )}

          {lowest != null && (
            <div
              style={{
                marginTop: 22,
                display: "flex",
                alignSelf: "flex-start",
                alignItems: "center",
                gap: 12,
                padding: "12px 22px",
                borderRadius: 999,
                background: "rgba(212,175,55,0.20)",
                border: "1px solid rgba(212,175,55,0.55)",
                color: "#f4d160",
                fontSize: 22,
                fontWeight: 800,
              }}
            >
              From ₵{lowest.toFixed(2)} · {bundles.length} bundles
            </div>
          )}
        </div>

        {/* Bottom — networks + URL */}
        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: 26,
            borderTop: "1px solid rgba(255,255,255,0.18)",
          }}
        >
          <div style={{ display: "flex", gap: 12 }}>
            {networks.includes("mtn") && <NetworkChip label="MTN" bg="#FFCC00" fg="#1a1a1a" />}
            {networks.includes("telecel") && <NetworkChip label="TELECEL" bg="#E4002B" fg="#fff" />}
            {networks.includes("at") && <NetworkChip label="AIRTELTIGO" bg="#E30613" fg="#fff" />}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              color: "rgba(255,255,255,0.85)",
              fontSize: 20,
              fontWeight: 800,
              letterSpacing: "0.04em",
            }}
          >
            {SITE.domain}/vendor/{vendor.slug}
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}

function NetworkChip({
  label,
  bg,
  fg,
}: {
  label: string;
  bg: string;
  fg: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        padding: "8px 14px",
        borderRadius: 10,
        background: bg,
        color: fg,
        fontSize: 16,
        fontWeight: 800,
        letterSpacing: "0.08em",
      }}
    >
      {label}
    </div>
  );
}
