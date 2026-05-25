/* global React, makeView, Axes, useState, useClickablePoints, mbLineEnds, fitLine */
// §2. Point–line duality in Cartesian (m,b) parameter space.

function DuetMB() {
  const W = 460, H = 380;
  const imageView = makeView({ width: W, height: H, xMin: -5, xMax: 5, yMin: -5, yMax: 5 });
  const paramView = makeView({ width: W, height: H, xMin: -3, xMax: 3, yMin: -6, yMax: 6 });

  // Three near-collinear default points so the duality is visible immediately
  const initial = [
    { x: -3, y: -1.2 },
    { x: 0, y: 0.3 },
    { x: 2.5, y: 1.6 },
  ];
  const { pts, add, remove, reset, setPts } = useClickablePoints(initial);
  const [drag, setDrag] = useState(null);

  // Convert click → math coords
  const svgClick = (e, view, onMath) => {
    if (drag) return;
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * view.width;
    const py = ((e.clientY - rect.top) / rect.height) * view.height;
    // invert: X(x) = pad + (x - xMin)*sx, etc.
    const x = view.xMin + (px - view.pad) / (((view.width - view.pad * 2)) / (view.xMax - view.xMin));
    const y = view.yMax - (py - view.pad) / (((view.height - view.pad * 2)) / (view.yMax - view.yMin));
    onMath(x, y);
  };

  // Drag a point
  const onMove = (e) => {
    if (!drag) return;
    const svg = document.getElementById("mb-image-svg");
    const rect = svg.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * imageView.width;
    const py = ((e.clientY - rect.top) / rect.height) * imageView.height;
    const x = imageView.xMin + (px - imageView.pad) / ((imageView.width - imageView.pad * 2) / (imageView.xMax - imageView.xMin));
    const y = imageView.yMax - (py - imageView.pad) / ((imageView.height - imageView.pad * 2) / (imageView.yMax - imageView.yMin));
    setPts((arr) => arr.map((p) => (p.id === drag ? { ...p, x: Math.max(-4.8, Math.min(4.8, x)), y: Math.max(-4.8, Math.min(4.8, y)) } : p)));
  };
  useEffect(() => {
    if (!drag) return;
    const up = () => setDrag(null);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", up);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", up); };
  }, [drag]);

  const fit = fitLine(pts);

  // Snap-collinear preset
  const snap = () => {
    const m = 0.6, b = 0.2;
    reset([
      { x: -3, y: m * -3 + b },
      { x: -0.5, y: m * -0.5 + b },
      { x: 1.5, y: m * 1.5 + b },
      { x: 3.2, y: m * 3.2 + b },
    ]);
  };

  return (
    <div className="fig">
      <div className="fig-head">
        <span><span className="fig-num">Fig 2.1</span> Point–line duality, Cartesian parameterization</span>
        <span>click ‧ drag ‧ remove</span>
      </div>
      <div className="fig-body" style={{ padding: 0 }}>
        <div className="panels">
          <div className="panel image">
            <div className="panel-label">
              <span className="name">▍ Image space</span>
              <span className="dim">(x, y) ∈ ℝ²</span>
            </div>
            <svg id="mb-image-svg" viewBox={`0 0 ${W} ${H}`} className="diagram-svg"
                 onClick={(e) => svgClick(e, imageView, add)} style={{ cursor: "crosshair" }}>
              <Axes view={imageView} xLabel="x" yLabel="y"
                    xTicks={[-4, -2, 2, 4]} yTicks={[-4, -2, 2, 4]} gridStep={1} />
              {/* Best-fit line (the line points "imply") */}
              {fit && (() => {
                const ends = mbLineEnds(imageView, fit.m, fit.b);
                if (!ends) return null;
                return <line className="ln-truth"
                  x1={imageView.X(ends.x1)} y1={imageView.Y(ends.y1)}
                  x2={imageView.X(ends.x2)} y2={imageView.Y(ends.y2)} />;
              })()}
              {pts.map((p) => (
                <g key={p.id}>
                  <circle className="pt-image" cx={imageView.X(p.x)} cy={imageView.Y(p.y)} r={6}
                          onMouseDown={(e) => { e.stopPropagation(); setDrag(p.id); }}
                          onContextMenu={(e) => { e.preventDefault(); remove(p.id); }}
                          style={{ cursor: "grab" }} />
                </g>
              ))}
            </svg>
          </div>

          <div className="panel param">
            <div className="panel-label">
              <span className="name">▍ Parameter space</span>
              <span className="dim">(m, b)</span>
            </div>
            <svg viewBox={`0 0 ${W} ${H}`} className="diagram-svg">
              <Axes view={paramView} xLabel="m" yLabel="b"
                    xTicks={[-2, -1, 1, 2]} yTicks={[-4, -2, 2, 4]} gridStep={1} />
              {/* Each image point (x0,y0) → parameter line b = -x0·m + y0 */}
              {pts.map((p, i) => {
                const ends = mbLineEnds(paramView, -p.x, p.y);
                if (!ends) return null;
                return <line key={p.id} className="ln-param"
                  x1={paramView.X(ends.x1)} y1={paramView.Y(ends.y1)}
                  x2={paramView.X(ends.x2)} y2={paramView.Y(ends.y2)} />;
              })}
              {/* Mark the intersection (m*, b*) if fit succeeded */}
              {fit && Math.abs(fit.m) < 3 && Math.abs(fit.b) < 6 && (
                <g>
                  <circle cx={paramView.X(fit.m)} cy={paramView.Y(fit.b)} r={5}
                          fill="var(--accent)" stroke="var(--paper-elev)" strokeWidth={1.5} />
                  <text x={paramView.X(fit.m) + 8} y={paramView.Y(fit.b) - 8}
                        fill="var(--accent)" fontFamily="var(--mono)" fontSize={11}>
                    (m*={fit.m.toFixed(2)}, b*={fit.b.toFixed(2)})
                  </text>
                </g>
              )}
            </svg>
          </div>
        </div>
        <div className="controls">
          <span className="lbl">⊕</span>
          <button className="btn" onClick={snap}>Snap to collinear</button>
          <button className="btn" onClick={() => reset([{ x: -2, y: 1 }, { x: 1, y: -2 }, { x: 3, y: -1.5 }])}>Spread out</button>
          <button className="btn" onClick={() => reset([])}>Clear</button>
          <span style={{ marginLeft: "auto", color: "var(--ink-3)" }}>
            click left panel to add ‧ drag points to move ‧ right-click to delete
          </span>
        </div>
      </div>
      <div className="fig-caption">
        Each <span className="tk-image">point in image space</span> (left) corresponds to a whole
        <span className="tk-param"> line in parameter space</span> (right). Conversely, the common
        intersection of those parameter-space lines reveals the (m, b) of the line the original points lie on —
        marked in green. Snap-to-collinear to see all lines meet at a single point.
      </div>
    </div>
  );
}

window.DuetMB = DuetMB;
