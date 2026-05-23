interface CircleProgressProps {
  /** 0–100 */
  value: number;
  /** outer dimension in px */
  size?: number;
  /** stroke width in px */
  stroke?: number;
  /** centre label, e.g. "83%" */
  label?: string;
  /** caption under label, e.g. "SAVED" */
  caption?: string;
  /** Track color (the unfilled ring) */
  trackColor?: string;
  /** Gradient start */
  gradientFrom?: string;
  /** Gradient end */
  gradientTo?: string;
  className?: string;
}

/**
 * Circular progress ring — used in the "vault" hero card.
 * SSR-safe pure SVG, no external deps.
 */
export function CircleProgress({
  value,
  size = 160,
  stroke = 14,
  label,
  caption,
  trackColor = "rgba(255, 255, 255, 0.10)",
  gradientFrom = "#d4af37",
  gradientTo = "#f4d160",
  className,
}: CircleProgressProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = (clamped / 100) * circumference;
  const id = `cp-${gradientFrom.replace(/[^a-zA-Z0-9]/g, "")}-${gradientTo.replace(/[^a-zA-Z0-9]/g, "")}`;

  return (
    <div
      className={className}
      style={{
        position: "relative",
        width: size,
        height: size,
        flexShrink: 0,
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: "rotate(-90deg)" }}
        aria-hidden
      >
        <defs>
          <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={gradientFrom} />
            <stop offset="100%" stopColor={gradientTo} />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={`url(#${id})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${dash} ${circumference - dash}`}
          style={{ transition: "stroke-dasharray 0.6s cubic-bezier(0.16, 1, 0.3, 1)" }}
        />
      </svg>
      {(label || caption) && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            color: "#fff",
            lineHeight: 1,
          }}
        >
          {label && (
            <span
              style={{
                fontSize: size > 140 ? "1.75rem" : "1.375rem",
                fontWeight: 800,
                letterSpacing: "-0.01em",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {label}
            </span>
          )}
          {caption && (
            <span
              style={{
                marginTop: "0.35rem",
                fontSize: "0.65rem",
                fontWeight: 700,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.6)",
              }}
            >
              {caption}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
