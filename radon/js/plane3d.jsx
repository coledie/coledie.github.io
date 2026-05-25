/* global React, useState, useEffect, useRef */
// §7. 3D Hough: planes and cylinders in a point cloud (schematic).
// Renders a rotating 3D point cloud (room corner + cylinder) with detected planes shaded.

function PlaneCylinder3D() {
  const W = 540, H = 380;
  const cv = useRef(null);
  const [yaw, setYaw] = useState(0.6);
  const [pitch, setPitch] = useState(-0.35);
  const [showPlanes, setShowPlanes] = useState(true);
  const [showCylinder, setShowCylinder] = useState(true);
  const [autoRotate, setAutoRotate] = useState(true);

  // Synthesize a point cloud: floor + two walls + one cylinder
  const cloud = useMemo(() => {
    const pts = [];
    // Floor (z=0), x∈[-2,2], y∈[-2,2]
    for (let i = 0; i < 220; i++) {
      pts.push({ x: (Math.random() - 0.5) * 4, y: (Math.random() - 0.5) * 4, z: 0 + (Math.random() - 0.5) * 0.04, c: 0 });
    }
    // Wall A: y=2
    for (let i = 0; i < 160; i++) {
      pts.push({ x: (Math.random() - 0.5) * 4, y: 2 + (Math.random() - 0.5) * 0.04, z: Math.random() * 2.4, c: 1 });
    }
    // Wall B: x=-2
    for (let i = 0; i < 160; i++) {
      pts.push({ x: -2 + (Math.random() - 0.5) * 0.04, y: (Math.random() - 0.5) * 4, z: Math.random() * 2.4, c: 2 });
    }
    // Cylinder at (1, 0.5), r=0.45, axis z
    for (let i = 0; i < 220; i++) {
      const t = Math.random() * Math.PI * 2;
      const z = Math.random() * 1.6;
      pts.push({ x: 1 + 0.45 * Math.cos(t) + (Math.random() - 0.5) * 0.02,
                 y: 0.5 + 0.45 * Math.sin(t) + (Math.random() - 0.5) * 0.02,
                 z, c: 3 });
    }
    // Noise
    for (let i = 0; i < 50; i++) {
      pts.push({ x: (Math.random() - 0.5) * 4.4, y: (Math.random() - 0.5) * 4.4, z: Math.random() * 2.6, c: -1 });
    }
    return pts;
  }, []);

  // Projection helper
  const project = (p, yaw, pitch) => {
    // Rotate around z by yaw, then around x by pitch
    const cy = Math.cos(yaw), sy = Math.sin(yaw);
    const cp = Math.cos(pitch), sp = Math.sin(pitch);
    const x1 = p.x * cy - p.y * sy;
    const y1 = p.x * sy + p.y * cy;
    const z1 = p.z;
    const y2 = y1 * cp - z1 * sp;
    const z2 = y1 * sp + z1 * cp;
    // Perspective
    const f = 320;
    const d = 6;
    const s = f / (d + z2);
    return { px: x1 * s, py: -y2 * s, depth: z2 };
  };

  // Draw
  const draw = () => {
    const cvas = cv.current;
    if (!cvas) return;
    const ctx = cvas.getContext("2d");
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#fbf8f0";
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "#cfc7b1";
    ctx.strokeRect(0.5, 0.5, W - 1, H - 1);

    const cx = W / 2, cy = H / 2 + 30;

    // Draw shaded plane / cylinder polygons (with transparency)
    if (showPlanes) {
      // Floor quad
      const floorQ = [
        { x: -2, y: -2, z: 0 }, { x: 2, y: -2, z: 0 },
        { x: 2, y: 2, z: 0 }, { x: -2, y: 2, z: 0 },
      ].map((p) => project(p, yaw, pitch));
      ctx.fillStyle = "oklch(0.55 0.16 32 / 0.12)";
      ctx.strokeStyle = "oklch(0.55 0.16 32 / 0.55)";
      ctx.beginPath();
      ctx.moveTo(cx + floorQ[0].px, cy + floorQ[0].py);
      for (let i = 1; i < 4; i++) ctx.lineTo(cx + floorQ[i].px, cy + floorQ[i].py);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // Wall A (y=2)
      const wallA = [
        { x: -2, y: 2, z: 0 }, { x: 2, y: 2, z: 0 },
        { x: 2, y: 2, z: 2.4 }, { x: -2, y: 2, z: 2.4 },
      ].map((p) => project(p, yaw, pitch));
      ctx.fillStyle = "oklch(0.55 0.16 32 / 0.12)";
      ctx.beginPath();
      ctx.moveTo(cx + wallA[0].px, cy + wallA[0].py);
      for (let i = 1; i < 4; i++) ctx.lineTo(cx + wallA[i].px, cy + wallA[i].py);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // Wall B (x=-2)
      const wallB = [
        { x: -2, y: -2, z: 0 }, { x: -2, y: 2, z: 0 },
        { x: -2, y: 2, z: 2.4 }, { x: -2, y: -2, z: 2.4 },
      ].map((p) => project(p, yaw, pitch));
      ctx.beginPath();
      ctx.moveTo(cx + wallB[0].px, cy + wallB[0].py);
      for (let i = 1; i < 4; i++) ctx.lineTo(cx + wallB[i].px, cy + wallB[i].py);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Plane-normal arrows
      const arrows = [
        { p0: { x: 0, y: 0, z: 0 }, p1: { x: 0, y: 0, z: 1.2 }, label: "n̂ floor" },
        { p0: { x: 0, y: 2, z: 1.2 }, p1: { x: 0, y: 1, z: 1.2 }, label: "n̂ wall" },
      ];
      ctx.strokeStyle = "oklch(0.50 0.10 145)";
      ctx.fillStyle = "oklch(0.50 0.10 145)";
      ctx.lineWidth = 1.2;
      ctx.font = "10px 'JetBrains Mono', monospace";
      for (const a of arrows) {
        const p0 = project(a.p0, yaw, pitch);
        const p1 = project(a.p1, yaw, pitch);
        ctx.beginPath();
        ctx.moveTo(cx + p0.px, cy + p0.py);
        ctx.lineTo(cx + p1.px, cy + p1.py);
        ctx.stroke();
        // arrowhead
        const ang = Math.atan2(p1.py - p0.py, p1.px - p0.px);
        ctx.beginPath();
        ctx.moveTo(cx + p1.px, cy + p1.py);
        ctx.lineTo(cx + p1.px - 6 * Math.cos(ang - 0.4), cy + p1.py - 6 * Math.sin(ang - 0.4));
        ctx.lineTo(cx + p1.px - 6 * Math.cos(ang + 0.4), cy + p1.py - 6 * Math.sin(ang + 0.4));
        ctx.closePath();
        ctx.fill();
        ctx.fillText(a.label, cx + p1.px + 4, cy + p1.py - 2);
      }
    }

    if (showCylinder) {
      // Cylinder wireframe at (1, 0.5), r=0.45
      ctx.strokeStyle = "oklch(0.55 0.16 32 / 0.55)";
      ctx.fillStyle = "oklch(0.55 0.16 32 / 0.10)";
      const segs = 24;
      const z0 = 0, z1 = 1.6;
      const ringPts = (z) => {
        const pts = [];
        for (let i = 0; i <= segs; i++) {
          const t = (i / segs) * Math.PI * 2;
          pts.push(project({ x: 1 + 0.45 * Math.cos(t), y: 0.5 + 0.45 * Math.sin(t), z }, yaw, pitch));
        }
        return pts;
      };
      const r0 = ringPts(z0), r1 = ringPts(z1);
      ctx.beginPath();
      ctx.moveTo(cx + r0[0].px, cy + r0[0].py);
      for (const p of r0) ctx.lineTo(cx + p.px, cy + p.py);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx + r1[0].px, cy + r1[0].py);
      for (const p of r1) ctx.lineTo(cx + p.px, cy + p.py);
      ctx.stroke();
      // Side lines
      for (let i = 0; i < segs; i += 4) {
        ctx.beginPath();
        ctx.moveTo(cx + r0[i].px, cy + r0[i].py);
        ctx.lineTo(cx + r1[i].px, cy + r1[i].py);
        ctx.stroke();
      }
    }

    // Sort points back-to-front
    const projected = cloud.map((p) => ({ ...p, ...project(p, yaw, pitch) }));
    projected.sort((a, b) => b.depth - a.depth);

    const colors = {
      0: "#1b1814", // floor
      1: "oklch(0.42 0.12 250)",
      2: "oklch(0.50 0.13 215)",
      3: "oklch(0.55 0.16 32)",
      "-1": "#9d9479",
    };
    for (const p of projected) {
      ctx.fillStyle = colors[p.c];
      ctx.beginPath();
      ctx.arc(cx + p.px, cy + p.py, p.c === -1 ? 1.2 : 1.8, 0, Math.PI * 2);
      ctx.fill();
    }

    // Axes triad bottom-left
    const triadO = { x: -2.5, y: -2.5, z: 0 };
    const triad = [
      { d: { x: 1, y: 0, z: 0 }, l: "x", c: "var(--ink-3)" },
      { d: { x: 0, y: 1, z: 0 }, l: "y", c: "var(--ink-3)" },
      { d: { x: 0, y: 0, z: 1 }, l: "z", c: "var(--ink-3)" },
    ];
    const O = project(triadO, yaw, pitch);
    ctx.strokeStyle = "#6b6354";
    ctx.fillStyle = "#6b6354";
    ctx.lineWidth = 1;
    for (const t of triad) {
      const E = project({ x: triadO.x + t.d.x * 0.6, y: triadO.y + t.d.y * 0.6, z: triadO.z + t.d.z * 0.6 }, yaw, pitch);
      ctx.beginPath();
      ctx.moveTo(cx + O.px, cy + O.py);
      ctx.lineTo(cx + E.px, cy + E.py);
      ctx.stroke();
      ctx.fillText(t.l, cx + E.px + 3, cy + E.py - 2);
    }
  };

  useEffect(() => { draw(); }, [yaw, pitch, showPlanes, showCylinder]);

  useEffect(() => {
    if (!autoRotate) return;
    let raf;
    let last = performance.now();
    const tick = (t) => {
      const dt = (t - last) / 1000;
      last = t;
      setYaw((y) => y + dt * 0.25);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [autoRotate]);

  // Drag rotation
  const drag = useRef(null);
  const onDown = (e) => {
    setAutoRotate(false);
    drag.current = { x: e.clientX, y: e.clientY, yaw, pitch };
  };
  useEffect(() => {
    const move = (e) => {
      if (!drag.current) return;
      setYaw(drag.current.yaw + (e.clientX - drag.current.x) * 0.01);
      setPitch(Math.max(-1.4, Math.min(1.4, drag.current.pitch + (e.clientY - drag.current.y) * 0.01)));
    };
    const up = () => { drag.current = null; };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    return () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); };
  }, []);

  return (
    <div className="fig">
      <div className="fig-head">
        <span><span className="fig-num">Fig 7.1</span> 3D Hough — planes (3 params) and cylinders (5 params)</span>
        <span>schematic point cloud</span>
      </div>
      <div className="fig-body" style={{ padding: 0 }}>
        <div className="panels">
          <div className="panel image">
            <div className="panel-label">
              <span className="name">▍ 3D point cloud</span>
              <span className="dim">drag to rotate</span>
            </div>
            <div style={{ display: "flex", justifyContent: "center", padding: "8px 0" }}>
              <canvas ref={cv} width={W} height={H}
                      style={{ width: "100%", maxWidth: W, cursor: drag.current ? "grabbing" : "grab" }}
                      onMouseDown={onDown} />
            </div>
            <div style={{
              display: "flex", gap: 12, justifyContent: "center", padding: "8px 0",
              fontFamily: "var(--mono)", fontSize: 11
            }}>
              <span className="chip"><span className="sw" style={{ background: "#1b1814" }}></span>floor</span>
              <span className="chip"><span className="sw" style={{ background: "oklch(0.42 0.12 250)" }}></span>wall A</span>
              <span className="chip"><span className="sw" style={{ background: "oklch(0.50 0.13 215)" }}></span>wall B</span>
              <span className="chip"><span className="sw" style={{ background: "oklch(0.55 0.16 32)" }}></span>cylinder</span>
              <span className="chip"><span className="sw" style={{ background: "#9d9479" }}></span>noise</span>
            </div>
          </div>
          <div className="panel param" style={{ display: "flex", flexDirection: "column", padding: 24 }}>
            <div className="panel-label">
              <span className="name">▍ Parameter spaces by primitive</span>
              <span className="dim">k-dim accumulator</span>
            </div>
            <table className="tbl">
              <thead>
                <tr><th>shape</th><th>k</th><th>parameters</th><th>vote locus</th></tr>
              </thead>
              <tbody>
                <tr><td>line in ℝ²</td><td className="mono">2</td><td className="mono">θ, ρ</td><td>1-D sinusoid</td></tr>
                <tr><td>circle in ℝ²</td><td className="mono">3</td><td className="mono">a, b, r</td><td>2-D cone surface</td></tr>
                <tr><td>plane in ℝ³</td><td className="mono">3</td><td className="mono">θ, φ, ρ</td><td>2-D warped sphere patch</td></tr>
                <tr><td>line in ℝ³</td><td className="mono">4</td><td className="mono">direction + offset</td><td>3-D surface</td></tr>
                <tr><td>sphere in ℝ³</td><td className="mono">4</td><td className="mono">a, b, c, r</td><td>3-D hypersurface</td></tr>
                <tr><td>cylinder in ℝ³</td><td className="mono">5</td><td className="mono">axis(2) + (a, b) + r</td><td>4-D hypersurface</td></tr>
                <tr><td>hyperplane in ℝⁿ</td><td className="mono">n</td><td className="mono">n̂, ρ</td><td>(n − 1)-D</td></tr>
              </tbody>
            </table>
            <div style={{ fontSize: 13, color: "var(--ink-3)", marginTop: 12, fontStyle: "italic" }}>
              Above k ≈ 3–4 the accumulator memory and vote-thinness force a switch to RANSAC, randomised
              Hough, or hierarchical Hough. The conceptual recipe — every datum is a surface in the
              parameter space, peaks are the structure — is unchanged.
            </div>
          </div>
        </div>
        <div className="controls">
          <button className={`btn ${autoRotate ? "active" : ""}`} onClick={() => setAutoRotate((v) => !v)}>
            {autoRotate ? "■ Stop" : "▶ Auto-rotate"}
          </button>
          <button className={`btn ${showPlanes ? "active" : ""}`} onClick={() => setShowPlanes((v) => !v)}>
            Show planes
          </button>
          <button className={`btn ${showCylinder ? "active" : ""}`} onClick={() => setShowCylinder((v) => !v)}>
            Show cylinder
          </button>
          <span style={{ marginLeft: "auto", color: "var(--ink-3)" }}>
            each fitted primitive is one peak in its parameter space
          </span>
        </div>
      </div>
      <div className="fig-caption">
        A LiDAR or RGB-D scan looks like the left panel: dense surface samples plus noise. The Hough
        recipe runs unchanged — but now each point votes for a (k − 1)-D surface in k-D parameter
        space, indexed by the primitive’s degrees of freedom (table, right).
      </div>
    </div>
  );
}

window.PlaneCylinder3D = PlaneCylinder3D;
