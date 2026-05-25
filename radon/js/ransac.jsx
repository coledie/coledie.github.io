/* global React, useState, useEffect, useRef, useMemo */
// §7b. RANSAC — implicit sampling of parameter space.
// 2D line example for clarity; the algorithm is identical for cylinders in 5D.

function RANSACDemo() {
  const W = 460, H = 380;
  const pad = 24;

  // Synthetic data: a strong line plus heavy outliers
  const data = useMemo(() => {
    const pts = [];
    // Inliers along y = 0.35x + 0.8 with Gaussian noise
    const m = 0.35, b = 0.8;
    for (let i = 0; i < 70; i++) {
      const x = -4.5 + Math.random() * 9;
      const y = m * x + b + (Math.random() - 0.5) * 0.4;
      pts.push({ x, y, inlier: true });
    }
    // Outliers: uniform random in the box
    for (let i = 0; i < 55; i++) {
      pts.push({
        x: -4.8 + Math.random() * 9.6,
        y: -3.5 + Math.random() * 7,
        inlier: false,
      });
    }
    return pts;
  }, []);

  // Map (x, y) math coords → SVG pixels
  const xMin = -5, xMax = 5, yMin = -3.6, yMax = 3.6;
  const sx = (W - pad * 2) / (xMax - xMin);
  const sy = (H - pad * 2) / (yMax - yMin);
  const X = (x) => pad + (x - xMin) * sx;
  const Y = (y) => pad + (yMax - y) * sy;

  const EPS = 0.35; // inlier threshold in math units

  // Iteration state
  const [iter, setIter] = useState(0);
  const [bestModel, setBestModel] = useState(null); // {m, b, count}
  const [current, setCurrent] = useState(null);     // {p1, p2, m, b, inliers}
  const [running, setRunning] = useState(false);
  const [allInliers, setAllInliers] = useState(null);

  const fitModel = (p1, p2) => {
    if (Math.abs(p2.x - p1.x) < 1e-6) return null;
    const m = (p2.y - p1.y) / (p2.x - p1.x);
    const b = p1.y - m * p1.x;
    let inliers = 0;
    const insideFlags = new Array(data.length);
    // perpendicular distance: |y - mx - b| / sqrt(1 + m^2)
    const denom = Math.sqrt(1 + m * m);
    for (let i = 0; i < data.length; i++) {
      const d = Math.abs(data[i].y - m * data[i].x - b) / denom;
      insideFlags[i] = d < EPS;
      if (insideFlags[i]) inliers++;
    }
    return { m, b, inliers, insideFlags };
  };

  const oneStep = () => {
    let p1 = data[Math.floor(Math.random() * data.length)];
    let p2 = data[Math.floor(Math.random() * data.length)];
    if (p1 === p2) return;
    const mdl = fitModel(p1, p2);
    if (!mdl) return;
    setCurrent({ p1, p2, m: mdl.m, b: mdl.b, flags: mdl.insideFlags, count: mdl.inliers });
    setIter((k) => k + 1);
    setBestModel((prev) => {
      if (!prev || mdl.inliers > prev.count) {
        return { m: mdl.m, b: mdl.b, count: mdl.inliers, flags: mdl.insideFlags };
      }
      return prev;
    });
  };

  const raf = useRef(null);
  useEffect(() => {
    if (!running) return;
    let cancelled = false;
    let n = 0;
    const tick = () => {
      if (cancelled) return;
      oneStep();
      n++;
      if (n < 40) {
        raf.current = setTimeout(tick, 320);
      } else {
        setRunning(false);
        // Final pass: lock the best model and freeze inliers
        setAllInliers(true);
      }
    };
    tick();
    return () => { cancelled = true; if (raf.current) clearTimeout(raf.current); };
  }, [running]);

  const reset = () => {
    if (raf.current) clearTimeout(raf.current);
    setRunning(false);
    setIter(0);
    setBestModel(null);
    setCurrent(null);
    setAllInliers(null);
  };

  // For drawing a model line, clip to view
  const lineEnds = (m, b) => {
    const y1 = m * xMin + b, y2 = m * xMax + b;
    return [{ x: xMin, y: y1 }, { x: xMax, y: y2 }];
  };

  return (
    <div className="fig">
      <div className="fig-head">
        <span><span className="fig-num">Fig 7.2</span> RANSAC — sample, count, keep the best</span>
        <span>iter {iter} ‧ {bestModel ? `best: ${bestModel.count} inliers` : "no model yet"}</span>
      </div>
      <div className="fig-body" style={{ padding: 0 }}>
        <div className="panels">
          <div className="panel image">
            <div className="panel-label">
              <span className="name">▍ Data + current hypothesis</span>
              <span className="dim">{data.length} points, ε = {EPS.toFixed(2)}</span>
            </div>
            <svg viewBox={`0 0 ${W} ${H}`} className="diagram-svg">
              {/* Box */}
              <rect x={pad} y={pad} width={W - 2 * pad} height={H - 2 * pad}
                    fill="none" stroke="var(--rule-soft)" />
              {/* Grid */}
              {[-4, -2, 0, 2, 4].map((x) => (
                <line key={`gx${x}`} className="grid" x1={X(x)} y1={Y(yMin)} x2={X(x)} y2={Y(yMax)} />
              ))}
              {[-2, 0, 2].map((y) => (
                <line key={`gy${y}`} className="grid" x1={X(xMin)} y1={Y(y)} x2={X(xMax)} y2={Y(y)} />
              ))}

              {/* Best model so far — thin, sage */}
              {bestModel && !allInliers && (() => {
                const [e1, e2] = lineEnds(bestModel.m, bestModel.b);
                return (
                  <g>
                    <line x1={X(e1.x)} y1={Y(e1.y)} x2={X(e2.x)} y2={Y(e2.y)}
                          stroke="var(--accent)" strokeWidth={1.5} opacity={0.55} />
                  </g>
                );
              })()}

              {/* Current trial inlier band */}
              {current && (() => {
                const [e1, e2] = lineEnds(current.m, current.b);
                // Offset by EPS perpendicularly
                const dx = e2.x - e1.x, dy = e2.y - e1.y;
                const L = Math.hypot(dx, dy);
                const nx = -dy / L * EPS, ny = dx / L * EPS;
                return (
                  <g>
                    <polygon
                      points={`${X(e1.x + nx)},${Y(e1.y + ny)} ${X(e2.x + nx)},${Y(e2.y + ny)} ${X(e2.x - nx)},${Y(e2.y - ny)} ${X(e1.x - nx)},${Y(e1.y - ny)}`}
                      fill="oklch(0.55 0.16 32 / 0.10)" stroke="none" />
                    <line x1={X(e1.x)} y1={Y(e1.y)} x2={X(e2.x)} y2={Y(e2.y)}
                          stroke="var(--param)" strokeWidth={1.4} />
                    {/* Sample point markers */}
                    <circle cx={X(current.p1.x)} cy={Y(current.p1.y)} r={7}
                            fill="none" stroke="var(--param)" strokeWidth={1.5} />
                    <circle cx={X(current.p2.x)} cy={Y(current.p2.y)} r={7}
                            fill="none" stroke="var(--param)" strokeWidth={1.5} />
                  </g>
                );
              })()}

              {/* Data points */}
              {data.map((p, i) => {
                let fill = "var(--ink-4)";
                if (allInliers && bestModel && bestModel.flags[i]) fill = "var(--image)";
                else if (current && current.flags[i]) fill = "var(--param)";
                return <circle key={i} cx={X(p.x)} cy={Y(p.y)} r={2.6} fill={fill} />;
              })}

              {/* Final best model: bold */}
              {allInliers && bestModel && (() => {
                const [e1, e2] = lineEnds(bestModel.m, bestModel.b);
                return (
                  <line x1={X(e1.x)} y1={Y(e1.y)} x2={X(e2.x)} y2={Y(e2.y)}
                        stroke="var(--accent)" strokeWidth={2.2} />
                );
              })()}
            </svg>
          </div>
          <div className="panel param" style={{ padding: 24 }}>
            <div className="panel-label">
              <span className="name">▍ Algorithm state</span>
              <span className="dim">{running ? "running…" : (allInliers ? "converged" : "ready")}</span>
            </div>
            <div style={{ fontFamily: "var(--mono)", fontSize: 12, lineHeight: 1.9, color: "var(--ink-2)" }}>
              <div style={{ marginTop: 8 }}>
                <span style={{ color: "var(--ink-4)" }}>iteration ‧ </span>
                <span style={{ color: "var(--ink)", fontSize: 14, fontWeight: 600 }}>{iter}</span>
              </div>
              <div>
                <span style={{ color: "var(--ink-4)" }}>current ‧ </span>
                <span style={{ color: "var(--param)" }}>
                  {current ? `${current.count} inliers` : "—"}
                </span>
              </div>
              <div>
                <span style={{ color: "var(--ink-4)" }}>best so far ‧ </span>
                <span style={{ color: "var(--accent)", fontWeight: 600 }}>
                  {bestModel ? `${bestModel.count} inliers` : "—"}
                </span>
                {bestModel && (
                  <span style={{ color: "var(--ink-3)", marginLeft: 8 }}>
                    (m ≈ {bestModel.m.toFixed(2)}, b ≈ {bestModel.b.toFixed(2)})
                  </span>
                )}
              </div>
            </div>
            <div style={{
              marginTop: 18, padding: 14, background: "var(--paper-deep)",
              borderLeft: "2px solid var(--ink-2)", fontFamily: "var(--mono)", fontSize: 12,
              lineHeight: 1.7, color: "var(--ink)"
            }}>
              <div style={{ color: "var(--ink-4)", letterSpacing: "0.1em", fontSize: 10, textTransform: "uppercase", marginBottom: 6 }}>pseudocode</div>
              repeat K times:<br/>
              &nbsp;&nbsp;S ← <span style={{ color: "var(--param)" }}>sample minimum k points</span><br/>
              &nbsp;&nbsp;M ← fit primitive to S<br/>
              &nbsp;&nbsp;n ← count points with dist(·, M) &lt; ε<br/>
              &nbsp;&nbsp;if n &gt; best: best ← (M, n)<br/>
              return best
            </div>
            <div style={{ marginTop: 14, fontSize: 13, color: "var(--ink-3)", fontStyle: "italic", lineHeight: 1.55 }}>
              <strong style={{ color: "var(--ink-2)", fontStyle: "normal" }}>k</strong> is the minimum
              points the shape needs: 2 for a line, 3 for a plane, 4 for a sphere, 5 for a cylinder.
              Each trial is one implicit “probe” of parameter space — no grid required.
            </div>
          </div>
        </div>
        <div className="controls">
          <button className="btn primary" onClick={() => { reset(); setTimeout(() => setRunning(true), 0); }}
                  disabled={running}>
            ▶ Run 40 iterations
          </button>
          <button className="btn" onClick={oneStep} disabled={running}>Single step</button>
          <button className="btn" onClick={reset} disabled={iter === 0}>Reset</button>
          <span className="chip"><span className="sw" style={{ background: "var(--param)" }}></span>current trial inliers</span>
          <span className="chip"><span className="sw" style={{ background: "var(--image)" }}></span>final inliers</span>
          <span className="chip"><span className="sw" style={{ background: "var(--accent)" }}></span>best line</span>
          <span style={{ marginLeft: "auto", color: "var(--ink-3)" }}>
            no accumulator — parameter space is probed by sampling
          </span>
        </div>
      </div>
      <div className="fig-caption">
        Each iteration: sample <span className="tk-param">two points</span>, instantiate the line they
        define, count agreeing points within an ε-band, keep the best. With 50%+ outliers a grid Hough
        struggles; RANSAC routinely finds the right line in &lt; 50 trials. The same loop with{" "}
        <em>k = 5</em> points per sample fits cylinders in 3-D point clouds — which is exactly why all
        modern point-cloud libraries (PCL, Open3D, COLMAP) use RANSAC, not Hough, for cylinder, sphere
        and multi-plane fitting.
      </div>
    </div>
  );
}

window.RANSACDemo = RANSACDemo;
