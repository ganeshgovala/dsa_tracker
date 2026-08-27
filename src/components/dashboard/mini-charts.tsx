import { cn } from "@/lib/utils";

/** Compact vertical bar chart used inside stat cards. */
export function BarSpark({
  data,
  className,
  width = 96,
  height = 40,
  gap = 3,
}: {
  data: number[];
  className?: string;
  width?: number;
  height?: number;
  gap?: number;
}) {
  const max = Math.max(...data, 1);
  const barWidth = (width - gap * (data.length - 1)) / data.length;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn("overflow-visible text-brand", className)}
      role="img"
      aria-hidden
    >
      {data.map((v, i) => {
        const h = Math.max((v / max) * height, 2);
        const x = i * (barWidth + gap);
        const y = height - h;
        const isLast = i === data.length - 1;
        return (
          <rect
            key={i}
            x={x}
            y={y}
            width={barWidth}
            height={h}
            rx={Math.min(barWidth / 2, 2)}
            fill="currentColor"
            opacity={isLast ? 1 : 0.35 + (i / data.length) * 0.4}
          />
        );
      })}
    </svg>
  );
}

function smoothPath(points: [number, number][]) {
  if (points.length < 2) return "";
  const d = [`M ${points[0][0]},${points[0][1]}`];
  for (let i = 0; i < points.length - 1; i++) {
    const [x0, y0] = points[i];
    const [x1, y1] = points[i + 1];
    const mx = (x0 + x1) / 2;
    d.push(`C ${mx},${y0} ${mx},${y1} ${x1},${y1}`);
  }
  return d.join(" ");
}

/** Small donut showing a fraction — used for "topics covered". */
export function RingSpark({
  value,
  max,
  className,
  size = 52,
  stroke = 6,
}: {
  value: number;
  max: number;
  className?: string;
  size?: number;
  stroke?: number;
}) {
  const pct = max > 0 ? Math.min(value / max, 1) : 0;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const center = size / 2;

  return (
    <div
      className={cn("relative shrink-0 text-brand", className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle
          cx={center}
          cy={center}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          opacity={0.14}
        />
        <circle
          cx={center}
          cy={center}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${c * pct} ${c}`}
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center text-[0.6875rem] font-semibold tabular-nums text-foreground">
        {Math.round(pct * 100)}%
      </span>
    </div>
  );
}

/** Smooth sparkline used inside stat cards. */
export function LineSpark({
  data,
  className,
  width = 120,
  height = 44,
}: {
  data: number[];
  className?: string;
  width?: number;
  height?: number;
}) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pad = 4;

  const points: [number, number][] = data.map((v, i) => {
    const x = (i / (data.length - 1)) * (width - pad * 2) + pad;
    const y = height - pad - ((v - min) / range) * (height - pad * 2);
    return [x, y];
  });

  const line = smoothPath(points);
  const area = `${line} L ${points[points.length - 1][0]},${height} L ${points[0][0]},${height} Z`;
  const gradientId = `spark-${data.join("-").slice(0, 24)}`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn("overflow-visible text-brand", className)}
      role="img"
      aria-hidden
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity={0.28} />
          <stop offset="100%" stopColor="currentColor" stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradientId})`} stroke="none" />
      <path
        d={line}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={points[points.length - 1][0]}
        cy={points[points.length - 1][1]}
        r={2.5}
        fill="currentColor"
      />
    </svg>
  );
}
