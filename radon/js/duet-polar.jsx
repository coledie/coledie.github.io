/* global React, makeView, Axes, useState, useEffect, useClickablePoints, polarLineEnds, fitLine, pointSinusoid, pathFromPoints */
// §4. Polar (θ, ρ) parameterization. Each image point traces a sinusoid.

function DuetPolar() {
  const W = 460, H = 380;
  const imageView = makeView({ width: W, height: H, xMin: -5, xMax: 5, yMin: -5, yMax: 5 });
  const paramView = makeView({ width: W, height: H, xMin: 0, xMax: Math.PI, yMin: -7.5, yMax: 7.5 });

  const initial = [
    { x: -3, y: -1.2 },
    { x: 0, y: 0.3 },
    { x: 2.5, y: 1.6 },
  ];
  const { pts, add, remove, reset, setPts } = useClickablePoints(initial);
  const [drag, setDrag] = useState(null);
  const [hoverTheta, setHoverTheta] = useState(null);

  const svgClick = (e, view) => {
    if (drag) return;
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * view.width;
    const py = ((e.clientY - rect.top) / rect.height) * view.height;
    const x = view.xMin + (px - view.pad) / ((view.width - view.pad * 2) / (view.xMax - view.xMin));
    const y = view.yMax - (py - view.pad) / ((view.height - view.pad * 2) / (view.yMax - view.yMin));
    add(x, y);
  };

  useEffect(() => {
    if (!drag) return;
    const move = (e) => {
      const svg = document.getElementById("polar-image-svg");
      const rect = svg.getBoundingClientRect();
      const px = ((e.clientX - rect.left) / rect.width) * imageView.width;
      const py = ((e.clientY - rect.top) / rect.height) * imageView.height;
      const x = imageView.xMin + (px - imageView.pad) / ((imageView.width - imageView.pad * 2) / (imageView.xMax - imageView.xMin));
      const y = imageView.yMax - (py - imageView.pad) / ((imageView.height - imageView.pad * 2) / (imageView.yMax - imageView.yMin));
      setPts((arr) => arr.map((p) => (p.id === drag ? { ...p, x: Math.max(-4.8, Math.min(4.8, x)), y: Math.max(-4.8, Math.min(4.8, y)) } : p)));
    };
    const up = () => setDrag(null);
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    return () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); };
  }, [drag]);

  // Find approximate intersection point: minimise sum of squared distance of sinusoids to a candidate (θ, ρ).
  // For perfectly collinear points the sinusoids meet exactly. We sample θ and choose the θ where ρ's spread is minimised.
  const intersection = useMemo(() => {
    if (pts.length < 2) return null;
    let best = null;
    for (let i = 0; i <= 200; i++) {
      const t = (i / 200) * Math.PI;
      const rhos = pts.map((p) => p.x * Math.cos(t) + p.y * Math.sin(t));
      const m = rhos.reduce((a, b) => a + b, 0) / rhos.length;
      const v = rhos.reduce((a, b) => a + (b - m) ** 2, 0) / rhos.length;
      if (!best || v < best.v) best = { v, theta: t, rho: m };
    }
    return best;
  }, [pts]);

  const snap = () => {
    const theta = Math.PI * 0.35, rho = 1.2;
    const c = Math.cos(theta), s = Math.sin(theta);
    // points along the line, parameterised by t along direction (-s, c)
    reset([-3.2, -1, 1.5, 3.2].map((t) => ({ x: rho * c - t * s, y: rho * s + t * c })));
  };

  return (
    <div className="fig">
      <div className="fig-head">
        <span><span className="fig-num">Fig 4.1</span> Polar parameterization (θ, ρ): point → sinusoid</span>
        <span>ρ = x cos θ + y sin θ</span>
      </div>
      <div className="fig-body" style={{ padding: 0 }}>
        <div className="panels">
          <div className="panel image">
            <div className="panel-label">
              <span className="name">▍ Image space</span>
              <span className="dim">(x, y)</span>
            </div>
            <svg id="polar-image-svg" viewBox={`0 0 ${W} ${H}`} className="diagram-svg"
                 onClick={(e) => svgClick(e, imageView)} style={{ cursor: "crosshair" }}>
              <Axes view={imageView} xLabel="x" yLabel="y"
                    xTicks={[-4, -2, 2, 4]} yTicks={[-4, -2, 2, 4]} gridStep={1} />
              {/* Truth line at the best intersection (θ*, ρ*) */}
              {intersection && (() => {
                const ends = polarLineEnds(imageView, intersection.theta, intersection.rho);
                if (!ends) return null;
                return (
                  <g>
                    <line className="ln-truth"
                          x1={imageView.X(ends.x1)} y1={imageView.Y(ends.y1)}
                          x2={imageView.X(ends.x2)} y2={imageView.Y(ends.y2)} />
                    {/* Normal vector from origin to line */}
                    <line stroke="var(--accent)" strokeWidth={1.5} opacity={0.6}
                          x1={imageView.X(0)} y1={imageView.Y(0)}
                          x2={imageView.X(intersection.rho * Math.cos(intersection.theta))}
                          y2={imageView.Y(intersection.rho * Math.sin(intersection.theta))} />
                    <circle cx={imageView.X(intersection.rho * Math.cos(intersection.theta))}
                            cy={imageView.Y(intersection.rho * Math.sin(intersection.theta))}
                            r={3} fill="var(--accent)" />
                  </g>
                );
              })()}
              {/* Hover theta: show the line for the currently hovered theta column */}
              {hoverTheta !== null && pts.length > 0 && pts.map((p, i) => {
                const rho = p.x * Math.cos(hoverTheta) + p.y * Math.sin(hoverTheta);
                const ends = polarLineEnds(imageView, hoverTheta, rho);
                if (!ends) return null;
                return <line key={`hl${p.id}`} className="ln-param" strokeOpacity={0.3}
                  x1={imageView.X(ends.x1)} y1={imageView.Y(ends.y1)}
                  x2={imageView.X(ends.x2)} y2={imageView.Y(ends.y2)} />;
              })}
              {pts.map((p) => (
                <circle key={p.id} className="pt-image"
                        cx={imageView.X(p.x)} cy={imageView.Y(p.y)} r={6}
                        onMouseDown={(e) => { e.stopPropagation(); setDrag(p.id); }}
                        onContextMenu={(e) => { e.preventDefault(); remove(p.id); }}
                        style={{ cursor: "grab" }} />
              ))}
            </svg>
          </div>

          <div className="panel param">
            <div className="panel-label">
              <span className="name">▍ Parameter space</span>
              <span className="dim">θ ∈ [0, π) ‧ ρ bounded</span>
            </div>
            <svg viewBox={`0 0 ${W} ${H}`} className="diagram-svg"
                 onMouseMove={(e) => {
                   const svg = e.currentTarget;
                   const rect = svg.getBoundingClientRect();
                   const px = ((e.clientX - rect.left) / rect.width) * paramView.width;
                   const t = paramView.xMin + (px - paramView.pad) / ((paramView.width - paramView.pad * 2) / (paramView.xMax - paramView.xMin));
                   if (t >= 0 && t <= Math.PI) setHoverTheta(t);
                 }}
                 onMouseLeave={() => setHoverTheta(null)}>
              <Axes view={paramView} xLabel="θ" yLabel="ρ"
                    xTicks={[Math.PI / 4, Math.PI / 2, (3 * Math.PI) / 4]}
                    xTickLabels={["π/4", "π/2", "3π/4"]}
                    yTicks={[-6, -3, 3, 6]}
                    gridStep={1}
                    originY={-7.5} />
              {/* Hover guideline */}
              {hoverTheta !== null && (
                <line x1={paramView.X(hoverTheta)} y1={paramView.Y(paramView.yMin)}
                      x2={paramView.X(hoverTheta)} y2={paramView.Y(paramView.yMax)}
                      stroke="var(--ink-3)" strokeWidth={0.5} strokeDasharray="2 2" />
              )}
              {pts.map((p) => {
                const series = pointSinusoid(p.x, p.y, 160);
                const d = pathFromPoints(paramView, series, "theta", "rho");
                return <path key={p.id} className="ln-param" d={d} />;
              })}
              {/* Mark intersection */}
              {intersection && (
                <g>
                  <circle cx={paramView.X(intersection.theta)} cy={paramView.Y(intersection.rho)}
                          r={5} fill="var(--accent)" stroke="var(--paper-elev)" strokeWidth={1.5} />
                  <text x={paramView.X(intersection.theta) + 8} y={paramView.Y(intersection.rho) - 8}
                        fill="var(--accent)" fontFamily="var(--mono)" fontSize={11}>
                    (θ*={(intersection.theta * 180 / Math.PI).toFixed(0)}°,
                    {" "}ρ*={intersection.rho.toFixed(2)})
                  </text>
                </g>
              )}
            </svg>
          </div>
        </div>
        <div className="controls">
          <button className="btn" onClick={snap}>Snap to collinear</button>
          <button className="btn" onClick={() => {
            // A vertical line through x = 2 — easy for polar, impossible for (m,b).
            reset([{ x: 2, y: -3 }, { x: 2, y: -1 }, { x: 2, y: 1.5 }, { x: 2, y: 3 }]);
          }}>Vertical line (impossible in m,b)</button>
          <button className="btn" onClick={() => reset([])}>Clear</button>
          <span style={{ marginLeft: "auto", color: "var(--ink-3)" }}>
            sinusoids that meet at one (θ, ρ) ⇔ collinear pixels
          </span>
        </div>
      </div>
      <div className="fig-caption">
        Each <span className="tk-image">image-space point</span> traces a
        <span className="tk-param"> sinusoid</span> in (θ, ρ). Collinear points produce sinusoids
        with a common intersection (θ*, ρ*) — the parameters of the underlying line. Vertical lines
        — which would require m = ∞ in Fig 2.1 — sit calmly at θ = 0 here.
      </div>
    </div>
  );
}

window.DuetPolar = DuetPolar;
