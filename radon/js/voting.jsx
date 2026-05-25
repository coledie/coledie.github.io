/* global React, useState, useEffect, useRef */
// §5. The voting algorithm: build an accumulator from edge pixels and find peaks.

function VotingAccumulator() {
  // Synthetic "edge map": three lines + scattered noise.
  const IMG_W = 240, IMG_H = 240;
  const NUM_THETA = 180; // 1° steps
  const D = Math.ceil(Math.sqrt(IMG_W * IMG_W + IMG_H * IMG_H));
  const NUM_RHO = 2 * D + 1;

  const edgeImg = useMemo(() => {
    const pts = [];
    // Synthetic edge pixels along the four sides of a slightly tilted rectangle.
    // Each side will produce its own peak in (θ, ρ).
    const rotDeg = 10;
    const a = (rotDeg * Math.PI) / 180;
    const W2 = 75, H2 = 45; // half-width, half-height
    // Sides expressed in the rectangle's local frame, then rotated.
    const local = [
      // bottom side: y = -H2, x ∈ [-W2, W2]
      { from: [-W2, -H2], to: [W2, -H2] },
      // top side: y = H2
      { from: [-W2, H2], to: [W2, H2] },
      // left side: x = -W2
      { from: [-W2, -H2], to: [-W2, H2] },
      // right side: x = W2
      { from: [W2, -H2], to: [W2, H2] },
    ];
    const ca = Math.cos(a), sa = Math.sin(a);
    const rot = (p) => [p[0] * ca - p[1] * sa, p[0] * sa + p[1] * ca];
    for (const side of local) {
      const [ax, ay] = rot(side.from);
      const [bx, by] = rot(side.to);
      const len = Math.hypot(bx - ax, by - ay);
      const steps = Math.round(len / 1.5);
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const x = ax + t * (bx - ax) + (Math.random() - 0.5) * 1.2;
        const y = ay + t * (by - ay) + (Math.random() - 0.5) * 1.2;
        if (Math.random() > 0.15) pts.push({ x, y });
      }
    }
    // Salt-and-pepper noise pixels — they will not concentrate anywhere.
    for (let i = 0; i < 90; i++) {
      pts.push({
        x: (Math.random() - 0.5) * IMG_W * 0.92,
        y: (Math.random() - 0.5) * IMG_H * 0.92,
        noise: true,
      });
    }
    return pts;
  }, []);

  const [phase, setPhase] = useState("idle"); // idle → voting → done
  const [progress, setProgress] = useState(0); // 0..1 of edge points voted

  const acc = useRef(null);
  if (!acc.current) acc.current = new Uint32Array(NUM_THETA * NUM_RHO);

  const imgCanvas = useRef(null);
  const accCanvas = useRef(null);

  // Pre-compute sin/cos
  const trig = useMemo(() => {
    const c = new Float32Array(NUM_THETA), s = new Float32Array(NUM_THETA);
    for (let i = 0; i < NUM_THETA; i++) {
      const t = (i / NUM_THETA) * Math.PI;
      c[i] = Math.cos(t); s[i] = Math.sin(t);
    }
    return { c, s };
  }, []);

  // Draw the edge image
  const drawImage = (highlightIdx = -1) => {
    const cv = imgCanvas.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    ctx.fillStyle = "#fbf8f0";
    ctx.fillRect(0, 0, IMG_W, IMG_H);
    // Frame
    ctx.strokeStyle = "#cfc7b1";
    ctx.strokeRect(0.5, 0.5, IMG_W - 1, IMG_H - 1);
    // Edge pixels
    for (let i = 0; i < edgeImg.length; i++) {
      const p = edgeImg[i];
      ctx.fillStyle = p.noise ? "#9d9479" : "#1b1814";
      const px = p.x + IMG_W / 2, py = IMG_H / 2 - p.y;
      ctx.fillRect(Math.round(px), Math.round(py), 2, 2);
      if (i === highlightIdx) {
        ctx.strokeStyle = "#a85a3a";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(px, py, 6, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    // If done, draw recovered lines (and connect to accumulator peaks via labels)
    if (phase === "done") {
      const peaks = findPeaks(acc.current, NUM_THETA, NUM_RHO, 4);
      ctx.strokeStyle = "#a85a3a";
      ctx.lineWidth = 1.4;
      ctx.setLineDash([4, 3]);
      for (const pk of peaks) {
        const theta = (pk.iT / NUM_THETA) * Math.PI;
        const rho = pk.iR - D;
        const c0 = Math.cos(theta), s0 = Math.sin(theta);
        // Parametric line: (rho*c, rho*s) + t * (-s, c)
        const x0 = rho * c0, y0 = rho * s0;
        const ends = [];
        const L = 400;
        ends.push([x0 - L * s0, y0 + L * c0]);
        ends.push([x0 + L * s0, y0 - L * c0]);
        ctx.beginPath();
        ctx.moveTo(ends[0][0] + IMG_W / 2, IMG_H / 2 - ends[0][1]);
        ctx.lineTo(ends[1][0] + IMG_W / 2, IMG_H / 2 - ends[1][1]);
        ctx.stroke();
      }
      ctx.setLineDash([]);
    }
  };

  // Draw accumulator with logarithmic scaling
  const drawAcc = () => {
    const cv = accCanvas.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    const w = cv.width, h = cv.height;
    const img = ctx.createImageData(w, h);
    let max = 0;
    for (let i = 0; i < acc.current.length; i++) if (acc.current[i] > max) max = acc.current[i];
    if (max === 0) max = 1;
    // Map accumulator (NUM_THETA × NUM_RHO) to canvas (w × h)
    for (let y = 0; y < h; y++) {
      const iR = Math.floor((y / h) * NUM_RHO);
      for (let x = 0; x < w; x++) {
        const iT = Math.floor((x / w) * NUM_THETA);
        const v = acc.current[iT * NUM_RHO + iR];
        const t = v === 0 ? 0 : Math.log(1 + v) / Math.log(1 + max);
        // Cream → vermillion
        const r = Math.round(251 - t * (251 - 168));
        const g = Math.round(248 - t * (248 - 90));
        const b = Math.round(240 - t * (240 - 58));
        const idx = (y * w + x) * 4;
        img.data[idx] = r; img.data[idx + 1] = g; img.data[idx + 2] = b; img.data[idx + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    // Mark peaks and label them with their (θ, ρ) values
    if (phase === "done") {
      const peaks = findPeaks(acc.current, NUM_THETA, NUM_RHO, 4);
      ctx.strokeStyle = "#1b1814";
      ctx.lineWidth = 1.2;
      ctx.font = "10px 'JetBrains Mono', monospace";
      ctx.fillStyle = "#1b1814";
      for (const pk of peaks) {
        const cx = ((pk.iT + 0.5) / NUM_THETA) * w;
        const cy = ((pk.iR + 0.5) / NUM_RHO) * h;
        ctx.beginPath();
        ctx.arc(cx, cy, 7, 0, Math.PI * 2);
        ctx.stroke();
        const theta = Math.round((pk.iT / NUM_THETA) * 180);
        const rho = pk.iR - D;
        const label = `${theta}°, ${rho > 0 ? "+" : ""}${rho}`;
        const tx = cx + 11;
        const ty = cy < 18 ? cy + 14 : cy - 10;
        // Background pill so text is legible over the heat map
        const tw = ctx.measureText(label).width;
        ctx.fillStyle = "rgba(251, 248, 240, 0.92)";
        ctx.fillRect(tx - 2, ty - 9, tw + 4, 12);
        ctx.fillStyle = "#1b1814";
        ctx.fillText(label, tx, ty);
      }
    }
  };

  // Vote casting animation
  const animRef = useRef(null);
  const voteIdxRef = useRef(0);
  const runVote = () => {
    acc.current.fill(0);
    voteIdxRef.current = 0;
    setPhase("voting");
    setProgress(0);
    const step = () => {
      const startIdx = voteIdxRef.current;
      const batch = Math.max(2, Math.floor(edgeImg.length / 90));
      const endIdx = Math.min(edgeImg.length, startIdx + batch);
      for (let i = startIdx; i < endIdx; i++) {
        const p = edgeImg[i];
        for (let iT = 0; iT < NUM_THETA; iT++) {
          const r = p.x * trig.c[iT] + p.y * trig.s[iT];
          const iR = Math.round(r) + D;
          if (iR >= 0 && iR < NUM_RHO) acc.current[iT * NUM_RHO + iR]++;
        }
      }
      voteIdxRef.current = endIdx;
      setProgress(endIdx / edgeImg.length);
      drawImage(endIdx - 1);
      drawAcc();
      if (endIdx < edgeImg.length) {
        animRef.current = requestAnimationFrame(step);
      } else {
        setPhase("done");
      }
    };
    animRef.current = requestAnimationFrame(step);
  };

  const reset = () => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    acc.current.fill(0);
    setPhase("idle");
    setProgress(0);
  };

  useEffect(() => () => { if (animRef.current) cancelAnimationFrame(animRef.current); }, []);
  useEffect(() => { drawImage(); drawAcc(); }, [phase]);
  useEffect(() => { runVote(); }, []);

  return (
    <div className="fig">
      <div className="fig-head">
        <span><span className="fig-num">Fig 5.1</span> Voting algorithm — image → accumulator → peaks</span>
        <span>{phase === "done" ? "peaks recovered" : phase === "voting" ? `voting ${(progress * 100).toFixed(0)}%` : "ready"}</span>
      </div>
      <div className="fig-body" style={{ padding: 0 }}>
        <div className="panels">
          <div className="panel image">
            <div className="panel-label">
              <span className="name">▍ Edge map (synthetic)</span>
              <span className="dim">{edgeImg.length} pixels — rectangle (4 sides) + noise</span>
            </div>
            <div style={{ display: "flex", justifyContent: "center", padding: "8px 0" }}>
              <canvas ref={imgCanvas} width={IMG_W} height={IMG_H}
                      style={{ width: "100%", maxWidth: 320, border: "1px solid var(--rule-soft)" }} />
            </div>
          </div>
          <div className="panel param">
            <div className="panel-label">
              <span className="name">▍ Accumulator A[θ][ρ]</span>
              <span className="dim">{NUM_THETA} × {NUM_RHO} cells, log-scaled</span>
            </div>
            <div style={{ display: "flex", justifyContent: "center", padding: "8px 0" }}>
              <canvas ref={accCanvas} width={360} height={320}
                      style={{ width: "100%", maxWidth: 360, border: "1px solid var(--rule-soft)" }} />
            </div>
            <div style={{
              fontFamily: "var(--mono)", fontSize: 10, color: "var(--ink-3)",
              display: "flex", justifyContent: "space-between", padding: "0 8px", marginTop: 4
            }}>
              <span>θ = 0</span>
              <span>θ = π/2</span>
              <span>θ = π</span>
            </div>
          </div>
        </div>
        <div className="controls">
          <span style={{ color: "var(--ink-3)" }}>
            {phase === "done" ? "peaks recovered — each edge pixel wrote a sinusoid into the accumulator" : phase === "voting" ? `voting… ${(progress * 100).toFixed(0)}%` : ""}
          </span>
        </div>
      </div>
      <div className="fig-caption">
        A slightly tilted rectangle produces <strong>four distinct peaks</strong> in the accumulator —
        one per side. The two near-vertical sides sit at θ ≈ 10° but at very different ρ values (their
        perpendicular distances from origin differ); the two near-horizontal sides sit at θ ≈ 100°,
        again split by ρ. The four (θ, ρ) labels recover the rectangle’s full geometry. Noise pixels
        smear diffusely and never pile up anywhere — this is why voting is robust.
      </div>
    </div>
  );
}

// Local non-maximum suppression: find top-K peaks
function findPeaks(acc, nT, nR, K) {
  const peaks = [];
  const minDistT = 6, minDistR = 8;
  const idx = [];
  for (let iT = 0; iT < nT; iT++) {
    for (let iR = 0; iR < nR; iR++) {
      const v = acc[iT * nR + iR];
      if (v < 12) continue;
      idx.push({ iT, iR, v });
    }
  }
  idx.sort((a, b) => b.v - a.v);
  for (const c of idx) {
    let ok = true;
    for (const p of peaks) {
      if (Math.abs(p.iT - c.iT) < minDistT && Math.abs(p.iR - c.iR) < minDistR) { ok = false; break; }
    }
    if (ok) peaks.push(c);
    if (peaks.length >= K) break;
  }
  return peaks;
}

window.VotingAccumulator = VotingAccumulator;
