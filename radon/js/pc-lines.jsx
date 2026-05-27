/* global React, useState, useEffect, useRef, useMemo */
// Parallel coordinates: y | x | −y axes.
// T-space (y | x corridor): crossings encode negative-slope lines.
// S-space (x | −y corridor): crossings encode positive-slope lines.

function PCLines() {
  const W = 640, H = 320;
  const PAD_X = 56, PAD_Y = 40;
  const AXIS_Y  = PAD_X;
  const AXIS_X  = W / 2;
  const AXIS_NY = W - PAD_X;
  const VAL_MIN = -4, VAL_MAX = 4;
  const INNER_H = H - 2 * PAD_Y;

  const toSVG  = (v) => PAD_Y + ((VAL_MAX - v) / (VAL_MAX - VAL_MIN)) * INNER_H;
  const fromSVG = (sy) => VAL_MAX - ((sy - PAD_Y) / INNER_H) * (VAL_MAX - VAL_MIN);

  const PALETTE = ["#a85a3a", "#2b6cb0", "#2d7a46", "#8b5cf6"];

  const INITIAL = [
    { id: 0, x: -3,   y: -1.2 },
    { id: 1, x:  0,   y:  0.3 },
    { id: 2, x:  2.5, y:  1.6 },
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
      const val = Math.max(VAL_MIN, Math.min(VAL_MAX, fromSVG(svgY)));
      setPts(ps => ps.map(p => {
        if (p.id !== drag.id) return p;
        return drag.axis === "y" ? { ...p, y: val } : { ...p, x: val };
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

  const pairs = useMemo(() => {
    const result = [];
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const a = pts[i], b = pts[j];

        const ay = toSVG(a.y),  ax = toSVG(a.x),  any = toSVG(-a.y);
        const by = toSVG(b.y),  bx = toSVG(b.x),  bny = toSVG(-b.y);

        // T-space crossing (y | x corridor)
        let crossT = null;
        const denomT = (ax - ay) - (bx - by);
        if (Math.abs(denomT) > 0.5) {
          const t = (by - ay) / denomT;
          if (t > 0 && t < 1) {
            crossT = { x: AXIS_Y + t * (AXIS_X - AXIS_Y), y: ay + t * (ax - ay) };
          }
        }

        // S-space crossing (x | −y corridor)
        let crossS = null;
        const denomS = (any - ax) - (bny - bx);
        if (Math.abs(denomS) > 0.5) {
          const t = (bx - ax) / denomS;
          if (t > 0 && t < 1) {
            crossS = { x: AXIS_X + t * (AXIS_NY - AXIS_X), y: ax + t * (any - ax) };
          }
        }

        const slope = Math.abs(b.x - a.x) > 0.001
          ? (b.y - a.y) / (b.x - a.x)
          : Infinity;

        result.push({ i, j, slope, crossT, crossS });
      }
    }
    return result;
  }, [pts]);

  const allMatch = pairs.length > 1 &&
    pairs.every(p => Math.abs(p.slope - pairs[0].slope) < 0.08);

  const snap = () => {
    const m = 0.6, b = 0.2;
    setPts([
      { id: 0, x: -3,   y: m * -3   + b },
      { id: 1, x: -0.5, y: m * -0.5 + b },
      { id: 2, x:  1.5, y: m * 1.5  + b },
      { id: 3, x:  3.2, y: m * 3.2  + b },
    ]);
  };

  const reset = () => setPts(INITIAL.map(p => ({ ...p })));

  const TICKS = [-3, -1, 0, 1, 3];

  return (
    <div className="fig">
      <div className="fig-head">
        <span><span className="fig-num">Fig 2.2</span> Parallel coordinates — y | x | −y</span>
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
          <rect x={AXIS_Y} y={PAD_Y} width={AXIS_X - AXIS_Y} height={INNER_H} fill="#f0f4fa" />
          <rect x={AXIS_X} y={PAD_Y} width={AXIS_NY - AXIS_X} height={INNER_H} fill="#fdf5f0" />

          {/* Corridor labels */}
          <text x={(AXIS_Y + AXIS_X) / 2} y={H - 8} textAnchor="middle"
                fontFamily="var(--mono)" fontSize={9} fill="#aaa">T-space (neg. slopes)</text>
          <text x={(AXIS_X + AXIS_NY) / 2} y={H - 8} textAnchor="middle"
                fontFamily="var(--mono)" fontSize={9} fill="#aaa">S-space (pos. slopes)</text>

          {/* y-axis (left) */}
          <line x1={AXIS_Y} y1={PAD_Y} x2={AXIS_Y} y2={H - PAD_Y} stroke="#555" strokeWidth={1.6} />
          {TICKS.map(v => (
            <g key={v}>
              <line x1={AXIS_Y - 5} y1={toSVG(v)} x2={AXIS_Y} y2={toSVG(v)} stroke="#aaa" strokeWidth={1} />
              <text x={AXIS_Y - 8} y={toSVG(v) + 4} textAnchor="end"
                    fontFamily="var(--mono)" fontSize={9} fill="#aaa">{v}</text>
            </g>
          ))}
          <text x={AXIS_Y} y={PAD_Y - 14} textAnchor="middle"
                fontFamily="var(--mono)" fontSize={13} fontWeight={700} fill="#555">y</text>

          {/* x-axis (middle) */}
          <line x1={AXIS_X} y1={PAD_Y} x2={AXIS_X} y2={H - PAD_Y} stroke="#555" strokeWidth={1.6} />
          {TICKS.map(v => (
            <g key={v}>
              <line x1={AXIS_X - 5} y1={toSVG(v)} x2={AXIS_X + 5} y2={toSVG(v)} stroke="#aaa" strokeWidth={1} />
              <text x={AXIS_X - 8} y={toSVG(v) + 4} textAnchor="end"
                    fontFamily="var(--mono)" fontSize={9} fill="#aaa">{v}</text>
            </g>
          ))}
          <text x={AXIS_X} y={PAD_Y - 14} textAnchor="middle"
                fontFamily="var(--mono)" fontSize={13} fontWeight={700} fill="#2b6cb0">x</text>

          {/* −y-axis (right) */}
          <line x1={AXIS_NY} y1={PAD_Y} x2={AXIS_NY} y2={H - PAD_Y} stroke="#a85a3a" strokeWidth={1.6} />
          {TICKS.map(v => (
            <g key={v}>
              <line x1={AXIS_NY} y1={toSVG(v)} x2={AXIS_NY + 5} y2={toSVG(v)} stroke="#aaa" strokeWidth={1} />
              <text x={AXIS_NY + 8} y={toSVG(v) + 4} textAnchor="start"
                    fontFamily="var(--mono)" fontSize={9} fill="#aaa">{v}</text>
            </g>
          ))}
          <text x={AXIS_NY} y={PAD_Y - 14} textAnchor="middle"
                fontFamily="var(--mono)" fontSize={13} fontWeight={700} fill="#a85a3a">−y</text>

          {/* PC lines: y → x → −y */}
          {pts.map((p, i) => (
            <g key={p.id}>
              <line x1={AXIS_Y}  y1={toSVG(p.y)}
                    x2={AXIS_X}  y2={toSVG(p.x)}
                    stroke={PALETTE[i % PALETTE.length]} strokeWidth={2} opacity={0.85} />
              <line x1={AXIS_X}  y1={toSVG(p.x)}
                    x2={AXIS_NY} y2={toSVG(-p.y)}
                    stroke={PALETTE[i % PALETTE.length]} strokeWidth={2} opacity={0.85} />
            </g>
          ))}

          {/* Crossings */}
          {pairs.map((pr, idx) => {
            const col = allMatch ? "#2d7a46" : "#999";
            return (
              <g key={idx}>
                {pr.crossT && (
                  <>
                    <circle cx={pr.crossT.x} cy={pr.crossT.y} r={5}
                            fill="none" stroke={col} strokeWidth={1.8} />
                    <circle cx={pr.crossT.x} cy={pr.crossT.y} r={2.5} fill={col} />
                  </>
                )}
                {pr.crossS && (
                  <>
                    <circle cx={pr.crossS.x} cy={pr.crossS.y} r={5}
                            fill="none" stroke={col} strokeWidth={1.8} />
                    <circle cx={pr.crossS.x} cy={pr.crossS.y} r={2.5} fill={col} />
                  </>
                )}
              </g>
            );
          })}

          {/* Draggable handles on y and x axes */}
          {pts.map((p, i) => (
            <g key={p.id}>
              <circle cx={AXIS_Y} cy={toSVG(p.y)} r={8}
                      fill={PALETTE[i % PALETTE.length]}
                      style={{ cursor: "ns-resize" }}
                      onMouseDown={(e) => { e.preventDefault(); setDrag({ id: p.id, axis: "y" }); }} />
              <circle cx={AXIS_X} cy={toSVG(p.x)} r={8}
                      fill={PALETTE[i % PALETTE.length]}
                      style={{ cursor: "ns-resize" }}
                      onMouseDown={(e) => { e.preventDefault(); setDrag({ id: p.id, axis: "x" }); }} />
            </g>
          ))}
        </svg>

        <div className="controls">
          <button className="btn primary" onClick={snap}>Snap to collinear</button>
          <button className="btn" onClick={reset}>Reset</button>
          <span style={{ marginLeft: "auto", color: "var(--ink-3)" }}>
            drag y or x handles · T-space crossings (left) · S-space crossings (right)
          </span>
        </div>
      </div>
      <div className="fig-caption">
        Three axes: <strong>y</strong>, <strong>x</strong>, <strong>−y</strong>.
        Each point (x, y) draws a line from y (left) through x (centre) to −y (right).
        Crossings in the <em>T-space corridor</em> (y | x, blue) encode negative-slope lines;
        crossings in the <em>S-space corridor</em> (x | −y, orange) encode positive slopes.
        When all points are collinear, crossings within each corridor converge — together the
        two spaces cover every slope without the ±∞ singularity of Cartesian (m, b).
      </div>
    </div>
  );
}

window.PCLines = PCLines;
