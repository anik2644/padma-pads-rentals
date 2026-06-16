interface LogoProps {
  size?: number;
  withWordmark?: boolean;
}

export function HomeBeeLogo({ size = 32, withWordmark = true }: LogoProps) {
  return (
    <div className="inline-flex items-center gap-2">
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        aria-label="HomeBee"
        className="shrink-0"
      >
        <defs>
          <linearGradient id="hb-o" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#FB923C" />
            <stop offset="1" stopColor="#EA580C" />
          </linearGradient>
          <linearGradient id="hb-b" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#60A5FA" />
            <stop offset="1" stopColor="#2563EB" />
          </linearGradient>
        </defs>
        <rect x="2" y="2" width="36" height="36" rx="10" fill="url(#hb-o)" />
        <path
          d="M11 28V14h3v5h6v-5h3v14h-3v-6h-6v6h-3z"
          fill="white"
          fontWeight="bold"
        />
        <circle cx="29" cy="12" r="5" fill="url(#hb-b)" />
        <path
          d="M27.5 11h3M27.5 13h3"
          stroke="white"
          strokeWidth="0.8"
          strokeLinecap="round"
        />
      </svg>
      {withWordmark && (
        <span className="font-display text-lg font-bold tracking-tight">
          Home<span className="text-primary">Bee</span>
          <span className="text-secondary">.</span>
        </span>
      )}
    </div>
  );
}
