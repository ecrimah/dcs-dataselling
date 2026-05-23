import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
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
            "radial-gradient(60% 60% at 100% 0%, rgba(212,175,55,0.20) 0%, transparent 60%), linear-gradient(135deg, #061d45 0%, #0a2e5d 60%, #0d3a6e 100%)",
          color: "#fff",
          fontSize: 120,
          fontWeight: 900,
          fontFamily: "system-ui, -apple-system, sans-serif",
          letterSpacing: "-0.06em",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background:
              "linear-gradient(90deg, transparent 0%, #d4af37 50%, transparent 100%)",
          }}
        />
        <span
          style={{
            background:
              "linear-gradient(120deg, #f4d160 0%, #d4af37 50%, #f4d160 100%)",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          D
        </span>
      </div>
    ),
    { ...size },
  );
}
