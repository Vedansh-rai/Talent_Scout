interface ProgressRingProps {
  radius: number;
  stroke: number;
  progress: number;
  color: string;
}

export function ProgressRing({ radius, stroke, progress, color }: ProgressRingProps) {
  const normalized = radius - stroke * 2;
  const circumference = normalized * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: radius * 2, height: radius * 2 }}
    >
      <svg
        height={radius * 2}
        width={radius * 2}
        className="absolute -rotate-90"
      >
        <circle
          stroke="#1f1f22"
          fill="transparent"
          strokeWidth={stroke}
          r={normalized}
          cx={radius}
          cy={radius}
        />
        <circle
          stroke={color}
          fill="transparent"
          strokeWidth={stroke}
          strokeDasharray={`${circumference} ${circumference}`}
          style={{ strokeDashoffset: offset, transition: "stroke-dashoffset 1s ease-in-out" }}
          r={normalized}
          cx={radius}
          cy={radius}
          strokeLinecap="round"
        />
      </svg>
      <span className="font-mono text-xs font-medium absolute text-white">
        {Math.round(progress)}
      </span>
    </div>
  );
}
