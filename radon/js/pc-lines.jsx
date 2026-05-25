/* global React, useState, useEffect, useRef, useMemo */
// Parallel coordinates: x | y | m axes.
// Each point (x,y) → line across x→y. Each pair → slope on m-axis.
// Collinear points (negative slope) → crossings land in the x-y corridor AND all hit the same m.

function PCLines() {
  const W = 640, H = 320;
  const PAD_X = 56, PAD_Y = 40;
  const AXIS_X = PAD_X;
  const AXIS_Y = W / 2;
  const AXIS_M = W - PAD_X;
  const XY_MIN = -4, XY_MAX = 4;
  const M_MIN  = -3, M_MAX  =  3;
  const INNER_H = H - 2 * PAD_Y;

  const xyToSVG  = (v) => PAD_Y + ((XY_MAX - v) / (XY_MAX - XY_MIN)) * INNER_H;
  const mToSVG   = (m) => PAD_Y + ((M_MAX - Math.max(M_MIN, Math.min(M_MAX, m))) / (M_MAX - M_MIN)) * INNER_H;
  const svgToXY  = (sy) => XY_MAX - ((sy - PAD_Y) / INNER_H) * (XY_MAX - XY_MIN);

  const PALETTE = ["#a85a3a", "#2b6cb0", "#2d7a46", "#8b5cf6"];

  // Negative-slope initial points so crossings land inside the x-y corridor
  const INITIAL = [
    { id: 0, x: -3,   y:  2.1 },
    { id: 1, x:  0,   y:  0.3 },
    { id: 2, x:  2.5, y: -1.6 },
  ];

  const [pts, setPts] = useState(INITIAL);
  const [drag, setDrag] = useState(null);
  const svgRef = useRef(null);

  useEffect(() => {
    if (drag === null) return;
    const onMove = (e) => {
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const svgY = ((e.clientY - rect.top) / rect.height) * H;
      const val = Math.max(XY_MIN, Math.min(XY_MAX, svgToXY(svgY)));
      setPts(ps => ps.map(p => {
        if (p.id !== drag.id) return p;
        return drag.axis === "x" ? { ...p, x: val } : { ...p, y: val };
      }));
    };
    const onUp = () => setDrag(null);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [drag]);

  // Pairwise: crossing in x-y corridor (if any) + slope on m-axis
  const pairs = useMemo(() => {
    const result = [];
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const a = pts[i], b = pts[j];
        if (Math.abs(b.x - a.x) < 0.001) continue;
        const slope = (b.y - a.y) / (b.x - a.x);
        const aL = xyToSVG(a.x), aR = xyToSVG(a.y);
        const bL = xyToSVG(b.x), bR = xyToSVG(b.y);
        const denom = (aR - aL) - (bR - bL);
        let cross = null;
        if (Math.abs(denom) > 0.5) {
          const t = (bL - aL) / denom;
          if (t > 0 && t < 1) {
            cross = {
              x: AXIS_X + t * (AXIS_Y - AXIS_X),
              y: aL + t * (aR - aL),
            };
          }
        }
        result.push({ i, j, slope, cross, mY: mToSVG(slope) });
      }
    }
    return result;
  }, [pts]);

  const allMatch = pairs.length > 1 &&
    pairs.every(p => Math.abs(p.slope - pairs[0].slope) < 0.08);

  const snap = () => {
    const m = -0.6, b = 0.3;
    setPts([
      { id: 0, x: -3,   y: m * -3   + b },
      { id: 1, x: -0.5, y: m * -0.5 + b },
      { id: 2, x:  1.5, y: m * 1.5  + b },
      { id: 3, x:  3.0, y: m * 3.0  + b },
    ]);
  };

  const reset = () => setPts(INITIAL.map(p => ({ ...p })));

  const XY_TICKS = [-3, -1, 0, 1, 3];
  const M_TICKS  = [-2, -1, 0, 1, 2];

  return (
    <div className="fig">
      <div className="fig-head">
        <span><span className="fig-num">Fig 2.2</span> Parallel coordinates — x | y | m</span>
        <span style={{ fontFamily: "var(--mono)", fontSize: 11 }}>
          {allMatch
            ? `collinear → m ≈ ${pairs[0].slope.toFixed(2)}`
            : pairs.length > 0
              ? `slopes: ${pairs.map(p => p.slope.toFixed(2)).join(", ")}`
              : "drag handles"}
        </span>
      </div>
      <div className="fig-body">
        <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", display: "block" }}>

          {/* Corridor fills */}
          <rect x={AXIS_X} y={PAD_Y} width={AXIS_Y - AXIS_X} height={INNER_H} fill="#f0f4fa" />
          <rect x={AXIS_Y} y={PAD_Y} width={AXIS_M - AXIS_Y} height={INNER_H} fill="#fdf5f0" />

          {/* Corridor labels */}
          <text x={(AXIS_X + AXIS_Y) / 2} y={H - 8} textAnchor="middle"
                fontFamily="var(--mono)" fontSize={9} fill="#aaa">image space</text>
          <text x={(AXIS_Y + AXIS_M) / 2} y={H - 8} textAnchor="middle"
                fontFamily="var(--mono)" fontSize={9} fill="#aaa">parameter</text>

          {/* x-axis */}
          <line x1={AXIS_X} y1={PAD_Y} x2={AXIS_X} y2={H - PAD_Y} stroke="#555" strokeWidth={1.6} />
          {XY_TICKS.map(v => (
            <g key={v}>
              <line x1={AXIS_X - 5} y1={xyToSVG(v)} x2={AXIS_X} y2={xyToSVG(v)} stroke="#aaa" strokeWidth={1} />
              <text x={AXIS_X - 8} y={xyToSVG(v) + 4} textAnchor="end"
                    fontFamily="var(--mono)" fontSize={9} fill="#aaa">{v}</text>
            </g>
          ))}
          <text x={AXIS_X} y={PAD_Y - 14} textAnchor="middle"
                fontFamily="var(--mono)" fontSize={13} fontWeight={700} fill="#2b6cb0">x</text>

          {/* y-axis */}
          <line x1={AXIS_Y} y1={PAD_Y} x2={AXIS_Y} y2={H - PAD_Y} stroke="#555" strokeWidth={1.6} />
          {XY_TICKS.map(v => (
            <g key={v}>
              <line x1={AXIS_Y - 5} y1={xyToSVG(v)} x2={AXIS_Y + 5} y2={xyToSVG(v)} stroke="#aaa" strokeWidth={1} />
              <text x={AXIS_Y - 8} y={xyToSVG(v) + 4} textAnchor="end"
                    fontFamily="var(--mono)" fontSize={9} fill="#aaa">{v}</text>
            </g>
          ))}
          <text x={AXIS_Y} y={PAD_Y - 14} textAnchor="middle"
                fontFamily="var(--mono)" fontSize={13} fontWeight={700} fill="#555">y</text>

          {/* m-axis */}
          <line x1={AXIS_M} y1={PAD_Y} x2={AXIS_M} y2={H - PAD_Y} stroke="#a85a3a" strokeWidth={1.6} />
          {M_TICKS.map(v => (
            <g key={v}>
              <line x1={AXIS_M} y1={mToSVG(v)} x2={AXIS_M + 5} y2={mToSVG(v)} stroke="#aaa" strokeWidth={1} />
              <text x={AXIS_M + 8} y={mToSVG(v) + 4} textAnchor="start"
                    fontFamily="var(--mono)" fontSize={9} fill="#aaa">{v}</text>
            </g>
          ))}
          <text x={AXIS_M} y={PAD_Y - 14} textAnchor="middle"
                fontFamily="var(--mono)" fontSize={13} fontWeight={700} fill="#a85a3a">m</text>

          {/* x → y PC lines */}
          {pts.map((p, i) => (
            <line key={p.id}
                  x1={AXIS_X} y1={xyToSVG(p.x)}
                  x2={AXIS_Y} y2={xyToSVG(p.y)}
                  stroke={PALETTE[i % PALETTE.length]} strokeWidth={2} opacity={0.85} />
          ))}

          {/* Pairwise: crossing marker + dashed line to m-axis */}
          {pairs.map((pr, idx) => {
            const col = allMatch ? "#2d7a46" : "#999";
            const mY = pr.mY;
            const fromX = pr.cross ? pr.cross.x : AXIS_Y;
            const fromY = pr.cross ? pr.cross.y : (xyToSVG(pts[pr.i].y) + xyToSVG(pts[pr.j].y)) / 2;
            return (
              <g key={idx}>
                <line x1={fromX} y1={fromY} x2={AXIS_M} y2={mY}
                      stroke={col} strokeWidth={1.5} strokeDasharray="5 3" opacity={0.9} />
                {pr.cross && (
                  <>
                    <circle cx={pr.cross.x} cy={pr.cross.y} r={5}
                            fill="none" stroke={col} strokeWidth={1.8} />
                    <circle cx={pr.cross.x} cy={pr.cross.y} r={2.5} fill={col} />
                  </>
                )}
                <circle cx={AXIS_M} cy={mY} r={5} fill="none" stroke={col} strokeWidth={1.8} />
                <circle cx={AXIS_M} cy={mY} r={2.5} fill={col} />
              </g>
            );
          })}

          {/* Draggable handles on x and y axes */}
          {pts.map((p, i) => (
            <g key={p.id}>
              <circle cx={AXIS_X} cy={xyToSVG(p.x)} r={8}
                      fill={PALETTE[i % PALETTE.length]}
                      style={{ cursor: "ns-resize" }}
                      onMouseDown={(e) => { e.preventDefault(); setDrag({ id: p.id, axis: "x" }); }} />
              <circle cx={AXIS_Y} cy={xyToSVG(p.y)} r={8}
                      fill={PALETTE[i % PALETTE.length]}
                      style={{ cursor: "ns-resize" }}
                      onMouseDown={(e) => { e.preventDefault(); setDrag({ id: p.id, axis: "y" }); }} />
            </g>
          ))}
        </svg>

        <div className="controls">
          <button className="btn primary" onClick={snap}>Snap to collinear</button>
          <button className="btn" onClick={reset}>Reset</button>
          <span style={{ marginLeft: "auto", color: "var(--ink-3)" }}>
            drag x or y handles · pairwise crossings → m-axis · collinear = same m
          </span>
        </div>
      </div>
      <div className="fig-caption">
        Three axes: <strong>x</strong>, <strong>y</strong>, <strong>m</strong> (slope).
        Each point's x and y values connect as a coloured line. Each <em>pair</em> of points
        produces a crossing in the x–y corridor; a dashed segment traces from that crossing to
        the computed slope on the m-axis. When all points are collinear every crossing lands at
        the same m — the convergence is what the{" "}
        <a href="https://github.com/MissouriMRR/IARC-2019/tree/develop/vision" target="_blank"
           style={{ color: "var(--param)" }}>IARC QR pipeline</a> accumulated in the GPU accumulator.
      </div>
    </div>
  );
}

window.PCLines = PCLines;
