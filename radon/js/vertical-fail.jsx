/* global React, makeView, Axes, mbLineEnds */
// §3. Why the (m,b) parameterization breaks: vertical lines.

function VerticalFail() {
  const W = 460, H = 320;
  const v = makeView({ width: W, height: H, xMin: -5, xMax: 5, yMin: -5, yMax: 5 });

  // A family of lines rotating around the origin
  const angles = [0, 10, 30, 50, 70, 85, 89]; // degrees from horizontal
  const tracks = angles.map((deg) => {
    const m = Math.tan((deg * Math.PI) / 180);
    return { deg, m, b: 0 };
  });

  return (
    <div className="fig">
      <div className="fig-head">
        <span><span className="fig-num">Fig 3.1</span> Why the (m, b) accumulator is unbounded</span>
        <span>slopes diverge as θ → 90°</span>
      </div>
      <div className="fig-body" style={{ padding: 0 }}>
        <div className="panels">
          <div className="panel image">
            <div className="panel-label">
              <span className="name">▍ Image space — lines rotating around origin</span>
              <span className="dim">angle θ from horizontal</span>
            </div>
            <svg viewBox={`0 0 ${W} ${H}`} className="diagram-svg">
              <Axes view={v} xLabel="x" yLabel="y" xTicks={[-4, -2, 2, 4]} yTicks={[-4, -2, 2, 4]} gridStep={1} />
              {tracks.map((t, i) => {
                const opacity = 0.35 + (i / tracks.length) * 0.55;
                if (t.deg >= 89) {
                  // Effectively vertical → can't write y = mx + b. Draw it red-dashed.
                  return (
                    <g key={i}>
                      <line x1={v.X(0)} y1={v.Y(-5)} x2={v.X(0)} y2={v.Y(5)}
                            stroke="var(--param)" strokeWidth={2} strokeDasharray="3 3" />
                      <text x={v.X(0) + 6} y={v.Y(4.2)} fill="var(--param)"
                            fontFamily="var(--mono)" fontSize={10}>m = ∞</text>
                    </g>
                  );
                }
                const ends = mbLineEnds(v, t.m, t.b);
                if (!ends) return null;
                return (
                  <g key={i}>
                    <line className="ln-image"
                          x1={v.X(ends.x1)} y1={v.Y(ends.y1)}
                          x2={v.X(ends.x2)} y2={v.Y(ends.y2)}
                          style={{ opacity }} />
                    <text x={v.X(ends.x2) - 24} y={v.Y(ends.y2) - 4}
                          fill="var(--image)" fontFamily="var(--mono)" fontSize={9}>{t.deg}°</text>
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="panel param">
            <div className="panel-label">
              <span className="name">▍ Slope axis m = tan θ</span>
              <span className="dim">log-stretched as θ → 90°</span>
            </div>
            <svg viewBox={`0 0 ${W} ${H}`} className="diagram-svg">
              {/* Number line */}
              <line className="axis" x1={40} y1={H / 2} x2={W - 40} y2={H / 2} />
              {/* Tick marks for the same angles */}
              {tracks.map((t, i) => {
                // Map m via arctan to keep it in [-W/2, W/2]
                const u = Math.atan(t.m) / (Math.PI / 2); // -1..1
                const x = (W / 2) + u * (W / 2 - 40);
                return (
                  <g key={i}>
                    <line x1={x} y1={H / 2 - 10} x2={x} y2={H / 2 + 10}
                          stroke="var(--param)" strokeWidth={1.5} />
                    <text x={x} y={H / 2 - 18} textAnchor="middle"
                          fill="var(--param)" fontFamily="var(--mono)" fontSize={10}>
                      {t.deg === 89 ? "→ ∞" : t.m.toFixed(t.deg > 60 ? 1 : 2)}
                    </text>
                    <text x={x} y={H / 2 + 28} textAnchor="middle"
                          fill="var(--ink-3)" fontFamily="var(--mono)" fontSize={9}>
                      {t.deg}°
                    </text>
                  </g>
                );
              })}
              {/* "m → ∞" arrow */}
              <text x={W - 60} y={H / 2 + 56} fill="var(--ink-3)" fontFamily="var(--mono)" fontSize={11}
                    textAnchor="end" fontStyle="italic">
                cells crowd here ↗
              </text>
              <text x={W / 2} y={H - 18} textAnchor="middle"
                    fill="var(--ink-2)" fontFamily="var(--serif)" fontStyle="italic" fontSize={13}>
                equal angular steps map to unequal m-steps
              </text>
            </svg>
          </div>
        </div>
      </div>
      <div className="fig-caption">
        Sweep a line about the origin at equal angular increments and the corresponding slopes
        m = tan θ explode toward infinity as the line approaches vertical. Any uniform grid over m therefore
        wastes resolution on shallow lines and starves near-vertical ones — and pure verticals cannot be
        represented at all.
      </div>
    </div>
  );
}

window.VerticalFail = VerticalFail;
