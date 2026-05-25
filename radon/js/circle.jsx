/* global React, useState, useMemo, makeView, Axes */
// §6. Circle Hough: a 3-parameter (a, b, r) example.
// Show the (a, b) slice at a chosen r: each edge pixel votes for a circle of radius r around itself.

function CircleHough() {
  const W = 460, H = 380;
  const v = makeView({ width: W, height: H, xMin: -5, xMax: 5, yMin: -5, yMax: 5 });

  // True circles in the image
  const trueCircles = [
    { a: -1.2, b: 0.4, r: 2.0 },
    { a: 2.0, b: -1.6, r: 1.2 },
  ];

  const [r, setR] = useState(2.0); // tested radius for the parameter-space slice
  const [n, setN] = useState(8);   // how many edge points to show casting votes

  const edges = useMemo(() => {
    const out = [];
    for (const C of trueCircles) {
      const count = Math.round((C.r / 2.0) * 12);
      for (let i = 0; i < count; i++) {
        const t = (i / count) * Math.PI * 2 + Math.random() * 0.1;
        out.push({ x: C.a + C.r * Math.cos(t) + (Math.random() - 0.5) * 0.05,
                   y: C.b + C.r * Math.sin(t) + (Math.random() - 0.5) * 0.05 });
      }
    }
    return out;
  }, []);

  const shown = edges.slice(0, n);

  return (
    <div className="fig">
      <div className="fig-head">
        <span><span className="fig-num">Fig 6.1</span> Circle Hough — each edge pixel votes for a circle of centres</span>
        <span>3D accumulator (a, b, r); slice at r = {r.toFixed(2)}</span>
      </div>
      <div className="fig-body" style={{ padding: 0 }}>
        <div className="panels">
          <div className="panel image">
            <div className="panel-label">
              <span className="name">▍ Image space</span>
              <span className="dim">edge pixels on circles</span>
            </div>
            <svg viewBox={`0 0 ${W} ${H}`} className="diagram-svg">
              <Axes view={v} xLabel="x" yLabel="y" xTicks={[-4, -2, 2, 4]} yTicks={[-4, -2, 2, 4]} gridStep={1} />
              {/* True circles, dashed */}
              {trueCircles.map((C, i) => (
                <circle key={i} cx={v.X(C.a)} cy={v.Y(C.b)} r={v.dx(C.r)}
                        stroke="var(--accent)" strokeDasharray="3 3" strokeWidth={1.2} fill="none" opacity={0.5} />
              ))}
              {edges.map((p, i) => (
                <circle key={i} className={i < n ? "pt-image" : ""}
                        cx={v.X(p.x)} cy={v.Y(p.y)} r={i < n ? 4 : 2.5}
                        fill={i < n ? "var(--image)" : "var(--ink-4)"} />
              ))}
            </svg>
          </div>
          <div className="panel param">
            <div className="panel-label">
              <span className="name">▍ Parameter slice (a, b) at fixed r</span>
              <span className="dim">each edge pixel ⇒ circle of radius r</span>
            </div>
            <svg viewBox={`0 0 ${W} ${H}`} className="diagram-svg">
              <Axes view={v} xLabel="a" yLabel="b" xTicks={[-4, -2, 2, 4]} yTicks={[-4, -2, 2, 4]} gridStep={1} />
              {/* For each shown edge pixel, draw circle of radius r at (a,b) = (x,y) */}
              {shown.map((p, i) => (
                <circle key={i} cx={v.X(p.x)} cy={v.Y(p.y)} r={v.dx(r)}
                        stroke="var(--param)" strokeWidth={1} fill="none" opacity={0.45} />
              ))}
              {/* If r matches a true circle radius, the centre lights up */}
              {trueCircles.map((C, i) => {
                if (Math.abs(C.r - r) < 0.12) {
                  return (
                    <g key={i}>
                      <circle cx={v.X(C.a)} cy={v.Y(C.b)} r={6} fill="var(--accent)" />
                      <text x={v.X(C.a) + 9} y={v.Y(C.b) - 8} fontFamily="var(--mono)" fontSize={11} fill="var(--accent)">
                        peak (a*, b*)
                      </text>
                    </g>
                  );
                }
                return null;
              })}
            </svg>
          </div>
        </div>
        <div className="controls">
          <span className="lbl">radius r</span>
          <input className="range" type="range" min={0.5} max={3.2} step={0.05}
                 value={r} onChange={(e) => setR(parseFloat(e.target.value))} />
          <span className="chip" style={{ color: "var(--ink-2)" }}>r = {r.toFixed(2)}</span>
          <span className="lbl" style={{ marginLeft: 20 }}>edge pixels shown</span>
          <input className="range" type="range" min={2} max={edges.length} step={1}
                 value={n} onChange={(e) => setN(parseInt(e.target.value, 10))} />
          <span className="chip">{n} / {edges.length}</span>
          <span style={{ marginLeft: "auto", color: "var(--ink-3)" }}>
            try r ≈ 2.0 and r ≈ 1.2 — peaks light up
          </span>
        </div>
      </div>
      <div className="fig-caption">
        For circle detection the parameter space is 3-D: (a, b, r). The figure shows a single 2-D slice
        at a chosen r. Each edge pixel’s vote is a circle of radius r around its position. When r
        equals a true circle’s radius, those vote-circles all pass through the same centre — and the
        accumulator peaks light up in green. Sweeping r builds the full 3-D accumulator; using the local
        gradient direction at each edge pixel collapses each vote from a circle to a single point on it,
        making the whole thing cheap.
      </div>
    </div>
  );
}

window.CircleHough = CircleHough;
