import { ImageResponse } from "next/og";
import { SITE } from "@/lib/constants";

export const alt = `${SITE.name} — ${SITE.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background:
            "radial-gradient(60% 60% at 100% 0%, rgba(212,175,55,0.18) 0%, transparent 60%), radial-gradient(50% 60% at 0% 100%, rgba(13,58,110,0.55) 0%, transparent 60%), linear-gradient(135deg, #061d45 0%, #0a2e5d 60%, #0d3a6e 100%)",
          color: "#fff",
          fontFamily: "system-ui, -apple-system, sans-serif",
          position: "relative",
        }}
      >
        {/* Gold ribbon at top */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 6,
            background:
              "linear-gradient(90deg, transparent 0%, #d4af37 25%, #f4d160 50%, #d4af37 75%, transparent 100%)",
          }}
        />

        {/* Top row — brand mark */}
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 76,
              height: 76,
              borderRadius: 20,
              background: "linear-gradient(135deg, #d4af37 0%, #f4d160 100%)",
              color: "#0a2e5d",
              fontSize: 38,
              fontWeight: 900,
              boxShadow: "0 8px 24px rgba(212,175,55,0.35)",
            }}
          >
            D
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                fontSize: 30,
                fontWeight: 900,
                letterSpacing: "-0.02em",
                lineHeight: 1,
                color: "#fff",
              }}
            >
              {SITE.name}
            </div>
            <div
              style={{
                marginTop: 6,
                fontSize: 16,
                fontWeight: 700,
                letterSpacing: "0.14em",
                color: "#f4d160",
                textTransform: "uppercase",
              }}
            >
              {SITE.domain}
            </div>
          </div>
        </div>

        {/* Headline */}
        <div style={{ display: "flex", flexDirection: "column", maxWidth: 1040 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              alignSelf: "flex-start",
              gap: 10,
              padding: "8px 18px",
              borderRadius: 999,
              background: "rgba(212,175,55,0.14)",
              border: "1px solid rgba(212,175,55,0.45)",
              color: "#f4d160",
              fontSize: 16,
              fontWeight: 800,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              marginBottom: 26,
            }}
          >
            <span style={{ display: "flex", width: 10, height: 10, borderRadius: 999, background: "#10b981" }} />
            Live in Ghana
          </div>

          <div
            style={{
              fontSize: 78,
              fontWeight: 900,
              lineHeight: 1.02,
              letterSpacing: "-0.035em",
              color: "#fff",
              display: "flex",
              flexWrap: "wrap",
            }}
          >
            Ghana's elite
            <span
              style={{
                background:
                  "linear-gradient(120deg, #f4d160 0%, #d4af37 50%, #f4d160 100%)",
                backgroundClip: "text",
                color: "transparent",
                marginLeft: 16,
              }}
            >
              data platform.
            </span>
          </div>

          <div
            style={{
              marginTop: 22,
              fontSize: 26,
              fontWeight: 500,
              lineHeight: 1.35,
              color: "rgba(255,255,255,0.82)",
              maxWidth: 920,
            }}
          >
            Buy MTN, Telecel & AirtelTigo data — or launch your own branded
            storefront with secure MoMo payments and instant fulfilment.
          </div>
        </div>

        {/* Footer row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: 28,
            borderTop: "1px solid rgba(255,255,255,0.12)",
          }}
        >
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <NetworkChip label="MTN" bg="#FFCC00" fg="#1a1a1a" />
            <NetworkChip label="TELECEL" bg="#E4002B" fg="#fff" />
            <NetworkChip label="AIRTELTIGO" bg="#E30613" fg="#fff" />
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              color: "rgba(255,255,255,0.7)",
              fontSize: 18,
              fontWeight: 700,
            }}
          >
            <span style={{ color: "#f4d160" }}>★</span>
            Trusted by vendors across Ghana
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
        padding: "8px 16px",
        borderRadius: 12,
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
