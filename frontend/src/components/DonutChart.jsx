export default function DonutChart({ segments, size = 120, thickness = 14, centerLabel, emptyLabel = "No data yet" }) {
  const total = segments.reduce((s, d) => s + d.value, 0);
  const r = (size - thickness) / 2;
  const circ = 2 * Math.PI * r;
  const cx = size / 2;
  const cy = size / 2;

  if (total === 0) {
    return (
      <div className="donut-chart-empty" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--border)" strokeWidth={thickness} />
        </svg>
        <span className="donut-chart-empty-label">{emptyLabel}</span>
      </div>
    );
  }

  let offset = 0;
  const arcs = segments
    .filter((d) => d.value > 0)
    .map((d) => {
      const pct = d.value / total;
      const dash = pct * circ;
      const gap = circ - dash;
      const arc = {
        ...d,
        pct,
        dashArray: `${dash} ${gap}`,
        dashOffset: -offset * circ,
      };
      offset += pct;
      return arc;
    });

  return (
    <div className="donut-chart" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {arcs.map((a, i) => (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={a.color}
            strokeWidth={thickness}
            strokeDasharray={a.dashArray}
            strokeDashoffset={a.dashOffset}
            strokeLinecap="butt"
            style={{ transition: "stroke-dasharray var(--dur-transition, 320ms) var(--ease-glide)" }}
          />
        ))}
      </svg>
      {centerLabel ? <span className="donut-chart-center">{centerLabel}</span> : null}
    </div>
  );
}
