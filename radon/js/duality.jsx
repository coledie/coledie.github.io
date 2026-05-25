/* global React */
// §9. The wider duality family — visual summary.

function DualityLandscape() {
  const W = 880, H = 420;

  const nodes = [
    { id: "hough", x: 130, y: 90, label: "Hough", sub: "lines / shapes", domain: "image", domainTo: "shape parameters" },
    { id: "radon", x: 130, y: 230, label: "Radon / X-ray", sub: "density f(x,y)", domain: "image", domainTo: "line integrals" },
    { id: "fourier", x: 440, y: 90, label: "Fourier", sub: "signal x(t)", domain: "time", domainTo: "frequency" },
    { id: "legendre", x: 440, y: 230, label: "Legendre", sub: "L(q, q̇)", domain: "position-velocity", domainTo: "position-momentum" },
    { id: "lifting", x: 750, y: 90, label: "Lifting", sub: "points ⊂ ℝⁿ", domain: "ℝⁿ", domainTo: "ℝⁿ⁺¹ convex hull" },
    { id: "projdual", x: 750, y: 230, label: "Projective duality", sub: "points ↔ lines", domain: "ℝ²", domainTo: "ℝ² (swapped)" },
    { id: "center", x: 440, y: 350, label: "data ⇄ dual representation", sub: "the unifying claim", center: true },
  ];

  const link = (a, b) => {
    const A = nodes.find((n) => n.id === a);
    const B = nodes.find((n) => n.id === b);
    return <line x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke="var(--rule)" strokeWidth={1} strokeDasharray="3 3" />;
  };

  return (
    <div className="fig">
      <div className="fig-head">
        <span><span className="fig-num">Fig 9.1</span> The dual-representation family</span>
        <span>same idea, different kernel</span>
      </div>
      <div className="fig-body">
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto" }} className="diagram-svg">
          {/* Links to centre */}
          {nodes.filter((n) => !n.center).map((n) => (
            <line key={n.id} x1={n.x} y1={n.y} x2={440} y2={350}
                  stroke="var(--rule)" strokeWidth={1} strokeDasharray="2 3" />
          ))}
          {/* Inter-links */}
          {link("hough", "radon")}
          {link("fourier", "legendre")}
          {link("lifting", "projdual")}

          {/* Nodes */}
          {nodes.map((n) => (
            <g key={n.id}>
              {n.center ? (
                <g>
                  <ellipse cx={n.x} cy={n.y} rx={200} ry={32}
                           fill="var(--paper-deep)" stroke="var(--ink-2)" strokeWidth={1.2} />
                  <text x={n.x} y={n.y - 3} textAnchor="middle"
                        fill="var(--ink)" fontFamily="var(--serif)" fontStyle="italic" fontSize={17}>
                    {n.label}
                  </text>
                  <text x={n.x} y={n.y + 14} textAnchor="middle"
                        fill="var(--ink-3)" fontFamily="var(--mono)" fontSize={10} letterSpacing="0.1em">
                    {n.sub.toUpperCase()}
                  </text>
                </g>
              ) : (
                <g>
                  <rect x={n.x - 80} y={n.y - 28} width={160} height={64}
                        fill="var(--paper-elev)" stroke="var(--ink-2)" strokeWidth={1} />
                  <text x={n.x} y={n.y - 10} textAnchor="middle"
                        fill="var(--ink)" fontFamily="var(--serif)" fontWeight="500" fontSize={15}>
                    {n.label}
                  </text>
                  <text x={n.x} y={n.y + 6} textAnchor="middle"
                        fill="var(--ink-3)" fontFamily="var(--mono)" fontSize={10}>
                    {n.domain}
                  </text>
                  <text x={n.x} y={n.y + 22} textAnchor="middle"
                        fill="var(--param)" fontFamily="var(--mono)" fontSize={10}>
                    ↓ {n.domainTo}
                  </text>
                </g>
              )}
            </g>
          ))}

          {/* Labels for the three rows */}
          <text x={40} y={50} fill="var(--ink-3)" fontFamily="var(--mono)" fontSize={10} letterSpacing="0.14em">
            GEOMETRIC INVERSE
          </text>
          <text x={350} y={50} fill="var(--ink-3)" fontFamily="var(--mono)" fontSize={10} letterSpacing="0.14em">
            ANALYTICAL DUALITY
          </text>
          <text x={680} y={50} fill="var(--ink-3)" fontFamily="var(--mono)" fontSize={10} letterSpacing="0.14em">
            COMBINATORIAL DUALITY
          </text>

          {/* Dividers */}
          <line x1={290} y1={20} x2={290} y2={300} stroke="var(--rule)" strokeDasharray="2 4" />
          <line x1={590} y1={20} x2={590} y2={300} stroke="var(--rule)" strokeDasharray="2 4" />
        </svg>
      </div>
      <div className="fig-caption">
        All seven items above implement the same move: data has multiple equally-valid representations, and
        the right operation is often easy in one and hard in the other. Hough and Radon parameterise shapes;
        Fourier parameterises frequency; Legendre parameterises slope; lifting parameterises an extra
        dimension; projective duality swaps points and lines outright. Most are integral transforms — inner
        products of the data against a parametric kernel — and most are invertible.
      </div>
    </div>
  );
}

window.DualityLandscape = DualityLandscape;
