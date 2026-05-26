/* global React */

function NoiseFloor() {
  const { useState, useMemo } = React;

  // E = noise edge pixels, nLine = true line pixels
  const [logE,   setLogE]   = useState(4);      // 10^logE
  const [nLine,  setNLine]  = useState(100);

  const E = Math.round(Math.pow(10, logE));

  // Accumulator parameters (fixed, matching the line worked example in the text)
  const N_theta = 180;
  const N_rho   = 1000;
  const N_cells = N_theta * N_rho;
  const M       = N_theta;  // one cell per theta-bin per vote

  // Background statistics per cell (Poisson)
  const mu     = (E * M) / N_cells;          // mean votes / cell
  const sigma  = Math.sqrt(mu);
  // Extreme value: E[max over N cells] ≈ mu + sigma * sqrt(2 ln N)
  const falseAlarmPeak = mu + sigma * Math.sqrt(2 * Math.log(N_cells));

  const detected = nLine > falseAlarmPeak;

  // SVG
  const W = 680, H = 200;
  const PAD = { top: 24, right: 24, bot: 40, left: 60 };
  const iW = W - PAD.left - PAD.right;
  const iH = H - PAD.top  - PAD.bot;

  // X axis: "accumulator cell rank" conceptually, 0..1 normalised
  // We show: a shaded noise distribution + threshold line + true peak

  // Y axis: vote count. Range: 0 .. max(falseAlarmPeak * 1.4, nLine * 1.2)
  const yMax  = Math.max(falseAlarmPeak * 1.4, nLine * 1.2, 10);
  const yScale = (v) => iH - Math.min(iH, (v / yMax) * iH);

  // Poisson noise envelope: show sorted accumulator counts for a random image
  // Approximate: cell rank r in [0,N_cells] → count ≈ mu + sigma * Phi^{-1}(r/N)
  // Use a simple approximation: at percentile p, count ≈ mu + sigma * sqrt(2)*erfinv(2p-1)
  // We'll just draw the envelope as a filled area from 0 (min) to falseAlarmPeak (max)
  // and a bell around mu.

  const nPts = 80;
  const noiseProfile = useMemo(() => {
    // Build a smooth "sorted order statistic" envelope
    const pts = [];
    for (let i = 0; i <= nPts; i++) {
      const p   = 0.001 + (i / nPts) * 0.999;
      // Rational approx for erfinv (Abramowitz & Stegun)
      const a   = 0.147;
      const ln  = Math.log(1 - (2*p-1)*(2*p-1));
      const inv = Math.sign(2*p-1) *
                  Math.sqrt(Math.sqrt((2/(Math.PI*a) + ln/2)**2 - ln/a) - (2/(Math.PI*a) + ln/2));
      const cnt = Math.max(0, mu + sigma * Math.SQRT2 * inv);
      pts.push({ x: PAD.left + (i / nPts) * iW, y: PAD.top + yScale(cnt) });
    }
    return pts;
  }, [mu, sigma, yMax]);

  const polyPoints = [
    `${PAD.left},${PAD.top + iH}`,
    ...noiseProfile.map(p => `${p.x},${p.y}`),
    `${PAD.left + iW},${PAD.top + iH}`
  ].join(' ');

  // Y tick values
  const yTicks = [0, 0.25, 0.5, 0.75, 1.0].map(f => Math.round(f * yMax));

  const imgColor  = 'oklch(0.42 0.12 250)';
  const paramColor = 'oklch(0.55 0.16 32)';
  const accentColor = 'oklch(0.50 0.10 145)';

  function fmt(n) {
    if (n >= 1e6) return (n/1e6).toFixed(1) + 'M';
    if (n >= 1e3) return (n/1e3).toFixed(1) + 'k';
    return Math.round(n).toString();
  }

  return (
    <div className="fig">
      <div className="fig-head">
        <span className="fig-num">Fig 11.1</span>
        <span>accumulator noise floor and false-alarm threshold</span>
      </div>
      <div className="fig-body">
        <div className="controls" style={{ borderTop: 'none', borderBottom: '1px solid var(--rule-soft)', marginBottom: 16 }}>
          <span className="lbl">Noise pixels E</span>
          <input className="range" type="range" min="2" max="6" step="0.05" value={logE}
                 onChange={e => setLogE(+e.target.value)} />
          <strong style={{ fontFamily: 'var(--mono)', fontSize: 13, minWidth: 48 }}>{fmt(E)}</strong>
          <span className="lbl" style={{ marginLeft: 16 }}>True line pixels</span>
          <input className="range" type="range" min="10" max="2000" value={nLine}
                 onChange={e => setNLine(+e.target.value)} />
          <strong style={{ fontFamily: 'var(--mono)', fontSize: 13, minWidth: 32 }}>{nLine}</strong>
        </div>

        <svg width={W} height={H} style={{ display: 'block', maxWidth: '100%' }}>
          {/* Noise envelope fill */}
          <polygon points={polyPoints} fill="var(--ink-4)" opacity={0.18} />
          {/* Noise envelope top line */}
          <polyline points={noiseProfile.map(p => `${p.x},${p.y}`).join(' ')}
                    fill="none" stroke="var(--ink-4)" strokeWidth={1} />

          {/* False-alarm threshold line */}
          <line x1={PAD.left} y1={PAD.top + yScale(falseAlarmPeak)}
                x2={PAD.left + iW} y2={PAD.top + yScale(falseAlarmPeak)}
                stroke={paramColor} strokeWidth={1.5} strokeDasharray="6 3" />
          <text x={PAD.left + iW - 4} y={PAD.top + yScale(falseAlarmPeak) - 5}
                textAnchor="end" style={{ fontFamily: 'var(--mono)', fontSize: 10, fill: paramColor }}>
            false-alarm max ≈ {fmt(falseAlarmPeak)}
          </text>

          {/* True line peak — vertical bar at right edge of noise region */}
          {(() => {
            const px = PAD.left + iW * 0.88;
            const py = PAD.top + yScale(nLine);
            return (
              <g>
                <line x1={px} y1={PAD.top + iH} x2={px} y2={py}
                      stroke={imgColor} strokeWidth={3} />
                <circle cx={px} cy={py} r={5} fill={imgColor} />
                <text x={px + 8} y={py + 4}
                      style={{ fontFamily: 'var(--mono)', fontSize: 10, fill: imgColor }}>
                  true peak = {nLine}
                </text>
              </g>
            );
          })()}

          {/* Mean noise line */}
          <line x1={PAD.left} y1={PAD.top + yScale(mu)}
                x2={PAD.left + iW} y2={PAD.top + yScale(mu)}
                stroke="var(--ink-3)" strokeWidth={0.8} strokeDasharray="2 4" />
          <text x={PAD.left + 4} y={PAD.top + yScale(mu) - 4}
                style={{ fontFamily: 'var(--mono)', fontSize: 9, fill: 'var(--ink-3)' }}>
            μ = {mu.toFixed(1)} votes/cell
          </text>

          {/* Y axis */}
          <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={PAD.top + iH}
                stroke="var(--ink-3)" strokeWidth={1} />
          {yTicks.map((v, i) => (
            <g key={i}>
              <line x1={PAD.left - 4} y1={PAD.top + yScale(v)}
                    x2={PAD.left} y2={PAD.top + yScale(v)}
                    stroke="var(--ink-3)" strokeWidth={0.7} />
              <text x={PAD.left - 8} y={PAD.top + yScale(v) + 4} textAnchor="end"
                    style={{ fontFamily: 'var(--mono)', fontSize: 9, fill: 'var(--ink-3)' }}>
                {fmt(v)}
              </text>
            </g>
          ))}
          <text x={PAD.left - 38} y={PAD.top + iH/2} textAnchor="middle"
                transform={`rotate(-90,${PAD.left - 38},${PAD.top + iH/2})`}
                style={{ fontFamily: 'var(--mono)', fontSize: 9, fill: 'var(--ink-3)' }}>
            votes
          </text>

          {/* X axis */}
          <line x1={PAD.left} y1={PAD.top + iH} x2={PAD.left + iW} y2={PAD.top + iH}
                stroke="var(--ink-3)" strokeWidth={1} />
          <text x={PAD.left + iW/2} y={PAD.top + iH + 30} textAnchor="middle"
                style={{ fontFamily: 'var(--mono)', fontSize: 10, fill: 'var(--ink-3)' }}>
            accumulator cells (sorted by count)
          </text>

          {/* Detection verdict */}
          <rect x={PAD.left + iW * 0.02} y={PAD.top + 4}
                width={200} height={22} rx={2}
                fill={detected ? accentColor : paramColor} opacity={0.15} />
          <text x={PAD.left + iW * 0.02 + 8} y={PAD.top + 19}
                style={{ fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 600,
                         fill: detected ? accentColor : paramColor }}>
            {detected ? '✓ line detectable' : '✗ line lost in noise'}
          </text>
        </svg>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1,
                      background: 'var(--rule-soft)', borderTop: '1px solid var(--rule-soft)', marginTop: 1 }}>
          {[
            ['E (noise pixels)',   fmt(E)],
            ['μ (votes/cell)',      mu.toFixed(2)],
            ['false-alarm max',    fmt(falseAlarmPeak)],
            ['SNR',                (nLine / Math.sqrt(mu)).toFixed(1)],
          ].map(([label, val]) => (
            <div key={label} style={{ background: 'var(--paper-deep)', padding: '8px 12px' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--ink-4)',
                            textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>{label}</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 14, color: 'var(--ink)' }}>{val}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="fig-caption">
        Grey area: the sorted noise distribution across all 180 × 1 000 = 180 000 accumulator cells when E random edge
        pixels are present. Dashed red: the expected false-alarm maximum (the best "line" a pure noise image would
        produce). Blue bar: the true line peak. When the blue bar falls below the red line the line is undetectable —
        drag E up to see the phase transition.
      </div>
    </div>
  );
}
