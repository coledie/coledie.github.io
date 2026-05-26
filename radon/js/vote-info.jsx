/* global React, makeView, Axes */

function VoteInformation() {
  const { useState } = React;
  const [R, setR] = useState(100);

  const shapes = [
    { name: 'Line',      k: 2, abbr: 'k=2' },
    { name: 'Circle',    k: 3, abbr: 'k=3' },
    { name: 'Plane',     k: 3, abbr: 'k=3' },
    { name: '3-D line',  k: 4, abbr: 'k=4' },
    { name: 'Cylinder',  k: 5, abbr: 'k=5' },
  ];

  const bitsPerVote = Math.log2(R);
  const maxLogMem   = 5 * Math.log10(R) + Math.log10(1); // k=5

  // SVG dims
  const W = 340, H = 220, PAD = { top: 20, right: 16, bot: 50, left: 56 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top  - PAD.bot;

  const barW = innerW / shapes.length;

  // Each bar: memory (bytes) = R^k, shown on log10 scale
  const imgColor   = 'oklch(0.42 0.12 250)';
  const paramColor = 'oklch(0.55 0.16 32)';
  const accentColor = 'oklch(0.50 0.10 145)';

  // Y scale: 0 .. maxLogMem (bytes)
  const yScaleMem = (logBytes) => innerH - (logBytes / maxLogMem) * innerH;
  // bits per vote is always the same, so all bars reach 100%
  const bitsBarH = innerH; // constant

  function memLabel(k) {
    const exp = k * Math.log10(R);
    if (exp >= 12) return (Math.pow(10, exp - 12)).toFixed(0) + ' TB';
    if (exp >=  9) return (Math.pow(10, exp -  9)).toFixed(0) + ' GB';
    if (exp >=  6) return (Math.pow(10, exp -  6)).toFixed(0) + ' MB';
    return (Math.pow(10, exp - 3)).toFixed(0) + ' KB';
  }

  return (
    <div className="fig">
      <div className="fig-head">
        <span className="fig-num">Fig 10.1</span>
        <span>vote information vs accumulator cost as k grows</span>
      </div>
      <div className="fig-body">

        {/* Slider */}
        <div className="controls" style={{ borderTop: 'none', borderBottom: '1px solid var(--rule-soft)', marginBottom: 16 }}>
          <span className="lbl">Resolution R (cells / axis)</span>
          <input className="range" type="range" min="10" max="500" value={R}
                 onChange={e => setR(+e.target.value)} />
          <strong style={{ fontFamily: 'var(--mono)', fontSize: 13 }}>{R}</strong>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: 'var(--rule-soft)' }}>
          {/* LEFT: bits per vote — flat */}
          <div style={{ background: 'var(--paper-elev)', padding: '12px 16px' }}>
            <div className="panel-label">
              <span className="name" style={{ color: accentColor }}>Bits per vote = log₂ R</span>
              <span className="dim">{bitsPerVote.toFixed(1)} bits — constant</span>
            </div>
            <svg width={W} height={H} style={{ display: 'block', maxWidth: '100%' }}>
              <g transform={`translate(${PAD.left},${PAD.top})`}>
                {/* Y axis */}
                <line x1={0} y1={0} x2={0} y2={innerH} stroke="var(--ink-3)" strokeWidth={1} />
                {[0,25,50,75,100].map(pct => (
                  <g key={pct}>
                    <line x1={-4} y1={innerH*(1-pct/100)} x2={0} y2={innerH*(1-pct/100)} stroke="var(--ink-3)" strokeWidth={0.7} />
                    {pct % 50 === 0 && (
                      <text x={-8} y={innerH*(1-pct/100)+4} textAnchor="end"
                            style={{ fontFamily: 'var(--mono)', fontSize: 9, fill: 'var(--ink-3)' }}>
                        {(bitsPerVote * pct / 100).toFixed(1)}
                      </text>
                    )}
                  </g>
                ))}
                <text x={-34} y={innerH/2} textAnchor="middle" transform={`rotate(-90,-34,${innerH/2})`}
                      style={{ fontFamily: 'var(--mono)', fontSize: 9, fill: 'var(--ink-3)' }}>bits</text>

                {/* X axis */}
                <line x1={0} y1={innerH} x2={innerW} y2={innerH} stroke="var(--ink-3)" strokeWidth={1} />

                {shapes.map((s, i) => {
                  const x = i * barW + barW * 0.15;
                  const bw = barW * 0.7;
                  return (
                    <g key={i}>
                      <rect x={x} y={0} width={bw} height={innerH}
                            fill={accentColor} opacity={0.75} rx={2} />
                      <text x={x + bw/2} y={innerH + 14} textAnchor="middle"
                            style={{ fontFamily: 'var(--mono)', fontSize: 9, fill: 'var(--ink-3)' }}>{s.name}</text>
                      <text x={x + bw/2} y={innerH + 24} textAnchor="middle"
                            style={{ fontFamily: 'var(--mono)', fontSize: 9, fill: 'var(--ink-4)' }}>{s.abbr}</text>
                      <text x={x + bw/2} y={12} textAnchor="middle"
                            style={{ fontFamily: 'var(--mono)', fontSize: 9, fill: 'var(--paper-elev)' }}>
                        {bitsPerVote.toFixed(1)}
                      </text>
                    </g>
                  );
                })}

                {/* Flat line annotation */}
                <line x1={0} y1={2} x2={innerW} y2={2} stroke={accentColor} strokeWidth={1.5} strokeDasharray="6 3" />
              </g>
            </svg>
          </div>

          {/* RIGHT: memory — exploding */}
          <div style={{ background: 'var(--paper-elev)', padding: '12px 16px' }}>
            <div className="panel-label">
              <span className="name" style={{ color: paramColor }}>Accumulator memory = R^k bytes</span>
              <span className="dim">exponential</span>
            </div>
            <svg width={W} height={H} style={{ display: 'block', maxWidth: '100%' }}>
              <g transform={`translate(${PAD.left},${PAD.top})`}>
                {/* Y axis */}
                <line x1={0} y1={0} x2={0} y2={innerH} stroke="var(--ink-3)" strokeWidth={1} />
                {/* Y ticks: log scale labels */}
                {[0, 0.25, 0.5, 0.75, 1.0].map(frac => {
                  const logVal = frac * maxLogMem;
                  let label = '';
                  if (logVal < 3)  label = Math.round(Math.pow(10, logVal)) + ' B';
                  else if (logVal < 6) label = Math.round(Math.pow(10, logVal-3)) + ' KB';
                  else if (logVal < 9) label = Math.round(Math.pow(10, logVal-6)) + ' MB';
                  else if (logVal < 12) label = Math.round(Math.pow(10, logVal-9)) + ' GB';
                  else label = Math.round(Math.pow(10, logVal-12)) + ' TB';
                  return (
                    <g key={frac}>
                      <line x1={-4} y1={innerH*(1-frac)} x2={0} y2={innerH*(1-frac)} stroke="var(--ink-3)" strokeWidth={0.7} />
                      <text x={-8} y={innerH*(1-frac)+4} textAnchor="end"
                            style={{ fontFamily: 'var(--mono)', fontSize: 9, fill: 'var(--ink-3)' }}>{label}</text>
                    </g>
                  );
                })}

                {/* X axis */}
                <line x1={0} y1={innerH} x2={innerW} y2={innerH} stroke="var(--ink-3)" strokeWidth={1} />

                {shapes.map((s, i) => {
                  const logBytes = s.k * Math.log10(R);
                  const frac     = logBytes / maxLogMem;
                  const bh       = Math.max(2, frac * innerH);
                  const x        = i * barW + barW * 0.15;
                  const bw       = barW * 0.7;
                  // color gradient: blue → red as memory grows
                  const hue      = 250 - (s.k - 2) / 3 * 218; // 250=blue, 32=red
                  const fill     = `oklch(0.50 0.14 ${hue})`;
                  return (
                    <g key={i}>
                      <rect x={x} y={innerH - bh} width={bw} height={bh}
                            fill={fill} opacity={0.8} rx={2} />
                      <text x={x + bw/2} y={innerH + 14} textAnchor="middle"
                            style={{ fontFamily: 'var(--mono)', fontSize: 9, fill: 'var(--ink-3)' }}>{s.name}</text>
                      <text x={x + bw/2} y={innerH + 24} textAnchor="middle"
                            style={{ fontFamily: 'var(--mono)', fontSize: 9, fill: 'var(--ink-4)' }}>{s.abbr}</text>
                      <text x={x + bw/2} y={Math.max(12, innerH - bh - 4)} textAnchor="middle"
                            style={{ fontFamily: 'var(--mono)', fontSize: 8, fill: 'var(--ink-2)' }}>
                        {memLabel(s.k)}
                      </text>
                    </g>
                  );
                })}
              </g>
            </svg>
          </div>
        </div>

        {/* Insight row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: 'var(--rule-soft)', borderTop: '1px solid var(--rule-soft)' }}>
          <div style={{ background: 'var(--paper-deep)', padding: '10px 16px', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)' }}>
            ↑ every bar is the same height: <strong style={{ color: 'var(--ink-2)' }}>log₂ R = {bitsPerVote.toFixed(1)} bits</strong>, regardless of k
          </div>
          <div style={{ background: 'var(--paper-deep)', padding: '10px 16px', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)' }}>
            ↑ each extra dimension multiplies memory by R = <strong style={{ color: 'var(--ink-2)' }}>{R}×</strong>
          </div>
        </div>
      </div>
      <div className="fig-caption">
        Both charts use the same R. Drag the slider. Bits per vote (left) never changes — it is always log₂ R.
        Accumulator memory (right) grows as R^k: adding one dimension multiplies cost by R.
        At R = 100, k = 5 already requires 10 GB just to store the empty grid.
      </div>
    </div>
  );
}
