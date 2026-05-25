/* global React, useState, useEffect, useRef, useMemo */
// §8. The continuous limit: Radon transform / sinogram.
// Computes forward Radon of a small phantom and, optionally, an unfiltered backprojection.

function SinogramDemo() {
  const N = 160;                // phantom resolution
  const NT = 180;               // theta bins
  const NR = Math.ceil(N * Math.SQRT2); // rho bins
  const RHO0 = NR / 2;

  const phantomCanvas = useRef(null);
  const sinoCanvas = useRef(null);
  const reconCanvas = useRef(null);
  const [phase, setPhase] = useState("idle");      // idle | scanning | done
  const [progress, setProgress] = useState(0);     // fraction of theta swept
  const [currentTheta, setCurrentTheta] = useState(0);
  const [showRecon, setShowRecon] = useState(true);
  const [filter, setFilter] = useState(true);

  // Build a small Shepp–Logan-like phantom: a few overlapping ellipses, simplified.
  const phantom = useMemo(() => {
    const arr = new Float32Array(N * N);
    const ellipses = [
      { cx: 0.0, cy: 0.0, a: 0.72, b: 0.88, val: 1.0 },
      { cx: 0.0, cy: -0.02, a: 0.66, b: 0.82, val: -0.78 },
      { cx: -0.22, cy: 0.0, a: 0.11, b: 0.31, val: -0.20 },
      { cx: 0.22, cy: 0.0, a: 0.16, b: 0.41, val: -0.20 },
      { cx: 0.0, cy: 0.35, a: 0.21, b: 0.25, val: 0.10 },
      { cx: 0.0, cy: -0.10, a: 0.05, b: 0.05, val: 0.50 },
      { cx: 0.0, cy: -0.60, a: 0.05, b: 0.10, val: 0.30 },
    ];
    for (let j = 0; j < N; j++) {
      for (let i = 0; i < N; i++) {
        const x = (i - N / 2) / (N / 2);
        const y = (N / 2 - j) / (N / 2);
        let v = 0;
        for (const e of ellipses) {
          const dx = (x - e.cx) / e.a;
          const dy = (y - e.cy) / e.b;
          if (dx * dx + dy * dy <= 1) v += e.val;
        }
        arr[j * N + i] = Math.max(0, v);
      }
    }
    return arr;
  }, []);

  // Draw phantom (grayscale, cream→ink)
  const drawPhantom = (theta = null) => {
    const cv = phantomCanvas.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    const img = ctx.createImageData(N, N);
    for (let i = 0; i < N * N; i++) {
      const v = Math.min(1, phantom[i]);
      const r = Math.round(251 - v * (251 - 27));
      const g = Math.round(248 - v * (248 - 24));
      const b = Math.round(240 - v * (240 - 20));
      img.data[i * 4] = r;
      img.data[i * 4 + 1] = g;
      img.data[i * 4 + 2] = b;
      img.data[i * 4 + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    // Frame
    ctx.strokeStyle = "#cfc7b1";
    ctx.strokeRect(0.5, 0.5, N - 1, N - 1);
    // Draw scanner geometry if scanning
    if (theta !== null) {
      const cx = N / 2, cy = N / 2;
      const c = Math.cos(theta), s = Math.sin(theta);
      const L = N;
      // Rotating ρ-axis (the projection direction, perpendicular to integration lines)
      ctx.strokeStyle = "oklch(0.55 0.16 32 / 0.55)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx - L * c, cy + L * s);
      ctx.lineTo(cx + L * c, cy - L * s);
      ctx.stroke();
      // Show a few parallel integration lines
      ctx.strokeStyle = "oklch(0.55 0.16 32 / 0.35)";
      for (let k = -2; k <= 2; k++) {
        const offset = k * 25;
        ctx.beginPath();
        ctx.moveTo(cx + offset * c - L * s, cy - offset * s - L * c);
        ctx.lineTo(cx + offset * c + L * s, cy - offset * s + L * c);
        ctx.stroke();
      }
      // Source/detector indicators
      ctx.fillStyle = "oklch(0.55 0.16 32)";
      ctx.beginPath();
      ctx.arc(cx + (N * 0.55) * c, cy - (N * 0.55) * s, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx - (N * 0.55) * c, cy + (N * 0.55) * s, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  // Forward Radon via summation
  const sinogram = useRef(null);
  if (!sinogram.current) sinogram.current = new Float32Array(NT * NR);
  const sinoMax = useRef(1);

  const computeColumn = (iT) => {
    const theta = (iT / NT) * Math.PI;
    const c = Math.cos(theta), s = Math.sin(theta);
    const col = new Float32Array(NR);
    for (let j = 0; j < N; j++) {
      const yc = (N / 2 - j);
      for (let i = 0; i < N; i++) {
        const v = phantom[j * N + i];
        if (v === 0) continue;
        const xc = i - N / 2;
        const rho = xc * c + yc * s;
        const iR = Math.round(rho + RHO0);
        if (iR >= 0 && iR < NR) col[iR] += v;
      }
    }
    return col;
  };

  const drawSino = () => {
    const cv = sinoCanvas.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    const w = cv.width, h = cv.height;
    const img = ctx.createImageData(w, h);
    let max = sinoMax.current || 1;
    for (let y = 0; y < h; y++) {
      const iR = Math.floor((y / h) * NR);
      for (let x = 0; x < w; x++) {
        const iT = Math.floor((x / w) * NT);
        const v = sinogram.current[iT * NR + iR];
        const t = v / max;
        const r = Math.round(251 - t * (251 - 168));
        const g = Math.round(248 - t * (248 - 90));
        const b = Math.round(240 - t * (240 - 58));
        const idx = (y * w + x) * 4;
        img.data[idx] = r;
        img.data[idx + 1] = g;
        img.data[idx + 2] = b;
        img.data[idx + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  };

  // Unfiltered / filtered backprojection
  const drawRecon = () => {
    const cv = reconCanvas.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    const recon = new Float32Array(N * N);
    // Optionally apply a ramp filter to each projection column
    const projs = [];
    for (let iT = 0; iT < NT; iT++) {
      const col = new Float32Array(NR);
      for (let iR = 0; iR < NR; iR++) col[iR] = sinogram.current[iT * NR + iR];
      if (filter) applyRampFilter(col);
      projs.push(col);
    }
    let max = 0, min = Infinity;
    for (let j = 0; j < N; j++) {
      const yc = (N / 2 - j);
      for (let i = 0; i < N; i++) {
        const xc = i - N / 2;
        let acc = 0;
        for (let iT = 0; iT < NT; iT++) {
          const theta = (iT / NT) * Math.PI;
          const rho = xc * Math.cos(theta) + yc * Math.sin(theta);
          const iR = Math.round(rho + RHO0);
          if (iR >= 0 && iR < NR) acc += projs[iT][iR];
        }
        recon[j * N + i] = acc;
        if (acc > max) max = acc;
        if (acc < min) min = acc;
      }
    }
    // Normalize
    const range = max - min || 1;
    const img = ctx.createImageData(N, N);
    for (let i = 0; i < N * N; i++) {
      const v = (recon[i] - min) / range;
      const vv = Math.max(0, Math.min(1, v));
      const r = Math.round(251 - vv * (251 - 27));
      const g = Math.round(248 - vv * (248 - 24));
      const b = Math.round(240 - vv * (240 - 20));
      img.data[i * 4] = r;
      img.data[i * 4 + 1] = g;
      img.data[i * 4 + 2] = b;
      img.data[i * 4 + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    ctx.strokeStyle = "#cfc7b1";
    ctx.strokeRect(0.5, 0.5, N - 1, N - 1);
  };

  // Animation
  const animRef = useRef(null);
  const run = () => {
    sinogram.current.fill(0);
    sinoMax.current = 1;
    setPhase("scanning");
    setProgress(0);
    let iT = 0;
    const step = () => {
      const batch = 2;
      for (let k = 0; k < batch && iT < NT; k++) {
        const col = computeColumn(iT);
        for (let iR = 0; iR < NR; iR++) {
          sinogram.current[iT * NR + iR] = col[iR];
          if (col[iR] > sinoMax.current) sinoMax.current = col[iR];
        }
        iT++;
      }
      setProgress(iT / NT);
      const theta = ((iT - 1) / NT) * Math.PI;
      setCurrentTheta(theta);
      drawPhantom(theta);
      drawSino();
      if (iT < NT) {
        animRef.current = requestAnimationFrame(step);
      } else {
        setPhase("done");
        drawPhantom(null);
        drawRecon();
      }
    };
    animRef.current = requestAnimationFrame(step);
  };

  useEffect(() => { drawPhantom(null); drawSino(); run(); }, []);
  useEffect(() => { if (phase === "done") drawRecon(); }, [filter, phase]);
  useEffect(() => () => animRef.current && cancelAnimationFrame(animRef.current), []);

  return (
    <div className="fig">
      <div className="fig-head">
        <span><span className="fig-num">Fig 8.1</span> Radon transform — image ⇄ sinogram</span>
        <span>{phase === "scanning" ? `scanning θ = ${(currentTheta * 180 / Math.PI).toFixed(0)}°` :
              phase === "done" ? "sinogram complete" : "ready"}</span>
      </div>
      <div className="fig-body" style={{ padding: 0 }}>
        <div className={showRecon ? "panels-3" : "panels"}>
          <div className="panel image">
            <div className="panel-label">
              <span className="name">▍ Phantom f(x, y)</span>
              <span className="dim">{N}×{N} test image</span>
            </div>
            <div style={{ display: "flex", justifyContent: "center", padding: "8px 0" }}>
              <canvas ref={phantomCanvas} width={N} height={N}
                      style={{ width: "100%", maxWidth: 260, border: "1px solid var(--rule-soft)" }} />
            </div>
          </div>
          <div className="panel param">
            <div className="panel-label">
              <span className="name">▍ Sinogram R(θ, ρ)</span>
              <span className="dim">{NT} × {NR}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "center", padding: "8px 0" }}>
              <canvas ref={sinoCanvas} width={360} height={300}
                      style={{ width: "100%", maxWidth: 360, border: "1px solid var(--rule-soft)" }} />
            </div>
            <div style={{
              fontFamily: "var(--mono)", fontSize: 10, color: "var(--ink-3)",
              display: "flex", justifyContent: "space-between", padding: "0 8px"
            }}>
              <span>θ = 0</span><span>θ = π/2</span><span>θ = π</span>
            </div>
          </div>
          {showRecon && (
            <div className="panel image">
              <div className="panel-label">
                <span className="name">▍ Reconstruction</span>
                <span className="dim">{filter ? "filtered backprojection" : "naive backprojection"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "center", padding: "8px 0" }}>
                <canvas ref={reconCanvas} width={N} height={N}
                        style={{ width: "100%", maxWidth: 260, border: "1px solid var(--rule-soft)" }} />
              </div>
            </div>
          )}
        </div>
        <div className="controls">
          <span style={{ color: "var(--ink-3)" }}>
            {phase === "scanning" ? `sweeping θ = ${(currentTheta * 180 / Math.PI).toFixed(0)}°…` :
             phase === "done" ? "sinogram complete · backprojection applied" : ""}
          </span>
          <span style={{ marginLeft: "auto" }}>
            <button className={`btn ${filter ? "active" : ""}`} onClick={() => setFilter((v) => !v)}>
              {filter ? "Ramp filter ON" : "Ramp filter OFF"}
            </button>
          </span>
        </div>
      </div>
      <div className="fig-caption">
        Sweep θ from 0 to π and stack each line-integral profile into the sinogram. A point in the phantom
        traces a sinusoid in R — the continuous form of the Hough duality. Toggle Reconstruct to recover f
        via backprojection: without the ramp filter you get the famous blurred ‘star’ artefact; with it
        you get a clean inversion (filtered backprojection, the workhorse of CT).
      </div>
    </div>
  );
}

// Ramp filter via FFT-free direct multiplication in frequency domain (small NR, naive DFT is fine here)
function applyRampFilter(col) {
  const n = col.length;
  // Pad to next power of 2 for cleaner FFT
  let N = 1; while (N < n) N <<= 1;
  const re = new Float32Array(N), im = new Float32Array(N);
  for (let i = 0; i < n; i++) re[i] = col[i];
  fft(re, im);
  for (let k = 0; k < N; k++) {
    const f = k < N / 2 ? k : N - k;
    const w = f / (N / 2);
    re[k] *= w; im[k] *= w;
  }
  ifft(re, im);
  for (let i = 0; i < n; i++) col[i] = re[i];
}

// In-place Cooley-Tukey FFT
function fft(re, im) {
  const n = re.length;
  // Bit-reversal
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len;
    const wre = Math.cos(ang), wim = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let cur_re = 1, cur_im = 0;
      for (let k = 0; k < len / 2; k++) {
        const a_re = re[i + k], a_im = im[i + k];
        const b_re = re[i + k + len / 2] * cur_re - im[i + k + len / 2] * cur_im;
        const b_im = re[i + k + len / 2] * cur_im + im[i + k + len / 2] * cur_re;
        re[i + k] = a_re + b_re; im[i + k] = a_im + b_im;
        re[i + k + len / 2] = a_re - b_re; im[i + k + len / 2] = a_im - b_im;
        const t_re = cur_re * wre - cur_im * wim;
        cur_im = cur_re * wim + cur_im * wre;
        cur_re = t_re;
      }
    }
  }
}
function ifft(re, im) {
  for (let i = 0; i < re.length; i++) im[i] = -im[i];
  fft(re, im);
  for (let i = 0; i < re.length; i++) { re[i] /= re.length; im[i] = -im[i] / re.length; }
}

window.SinogramDemo = SinogramDemo;
