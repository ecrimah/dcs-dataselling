import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
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
          color: "#f4d160",
          fontSize: 22,
          fontWeight: 900,
          fontFamily: "system-ui, -apple-system, sans-serif",
          letterSpacing: "-0.05em",
          borderRadius: 6,
        }}
      >
        D
      </div>
    ),
    { ...size },
  );
}
