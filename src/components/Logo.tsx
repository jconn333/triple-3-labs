"use client";

interface LogoProps {
  size?: number;
  className?: string;
  variant?: "icon" | "full";
}

export function LogoIcon({ size = 36, className = "" }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7c3aed" />
          <stop offset="50%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#f472b6" />
        </linearGradient>
        <linearGradient id="logo-grad-2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
      </defs>

      {/* Rounded square background */}
      <rect
        x="2"
        y="2"
        width="96"
        height="96"
        rx="22"
        fill="#0a0a1a"
        stroke="url(#logo-grad)"
        strokeWidth="2"
      />

      {/* Three stylized 3s — cascading with depth */}
      {/* Back 3 (left, faded) */}
      <text
        x="12"
        y="74"
        fontFamily="ui-rounded, system-ui, sans-serif"
        fontSize="62"
        fontWeight="800"
        fill="#7c3aed"
        opacity="0.3"
      >
        3
      </text>

      {/* Middle 3 */}
      <text
        x="28"
        y="74"
        fontFamily="ui-rounded, system-ui, sans-serif"
        fontSize="62"
        fontWeight="800"
        fill="url(#logo-grad-2)"
        opacity="0.6"
      >
        3
      </text>

      {/* Front 3 (right, full) */}
      <text
        x="44"
        y="74"
        fontFamily="ui-rounded, system-ui, sans-serif"
        fontSize="62"
        fontWeight="800"
        fill="url(#logo-grad)"
      >
        3
      </text>
    </svg>
  );
}

export function LogoIconAlt({ size = 36, className = "" }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient
          id="logo-alt-grad"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop offset="0%" stopColor="#7c3aed" />
          <stop offset="50%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#f472b6" />
        </linearGradient>
      </defs>

      {/* Rounded square background */}
      <rect x="0" y="0" width="100" height="100" rx="22" fill="#0a0a1a" />

      {/* Geometric 333 — three curved strokes forming abstract 3s */}
      {/* First 3 — top arc */}
      <path
        d="M30 22 C52 22, 62 30, 62 40 C62 48, 54 54, 40 54"
        stroke="#7c3aed"
        strokeWidth="6"
        strokeLinecap="round"
        fill="none"
        opacity="0.5"
      />
      {/* Second 3 — middle connection */}
      <path
        d="M40 54 C58 54, 68 42, 68 32 C68 24, 62 18, 50 18"
        stroke="#06b6d4"
        strokeWidth="6"
        strokeLinecap="round"
        fill="none"
        opacity="0.7"
      />
      {/* Third 3 — bottom arc */}
      <path
        d="M40 54 C58 54, 70 62, 70 72 C70 82, 58 88, 36 88"
        stroke="url(#logo-alt-grad)"
        strokeWidth="6"
        strokeLinecap="round"
        fill="none"
      />
      {/* Connecting strokes */}
      <path
        d="M30 22 L30 22"
        stroke="#7c3aed"
        strokeWidth="6"
        strokeLinecap="round"
        fill="none"
      />

      {/* Accent dot */}
      <circle cx="36" cy="88" r="4" fill="#f472b6" />
    </svg>
  );
}

export function LogoIconMinimal({ size = 36, className = "" }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient
          id="logo-min-grad"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop offset="0%" stopColor="#7c3aed" />
          <stop offset="50%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#f472b6" />
        </linearGradient>
      </defs>

      {/* Rounded square with gradient border */}
      <rect
        x="2"
        y="2"
        width="96"
        height="96"
        rx="22"
        fill="#0a0a1a"
        stroke="url(#logo-min-grad)"
        strokeWidth="2.5"
      />

      {/* Bold "333" as a single unit */}
      <text
        x="50"
        y="68"
        textAnchor="middle"
        fontFamily="ui-rounded, system-ui, sans-serif"
        fontSize="42"
        fontWeight="900"
        letterSpacing="-3"
        fill="url(#logo-min-grad)"
      >
        333
      </text>
    </svg>
  );
}

export default function Logo({
  size = 36,
  className = "",
  variant = "icon",
}: LogoProps) {
  if (variant === "icon") {
    return <LogoIcon size={size} className={className} />;
  }
  return <LogoIcon size={size} className={className} />;
}
