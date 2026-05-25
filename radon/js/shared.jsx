/* global React */
// Shared helpers for all Hough/Radon diagrams.

const { useState, useEffect, useRef, useMemo, useCallback } = React;

// Coordinate system helper for SVG: maps math (x,y) → SVG pixels
function makeView({ width, height, xMin, xMax, yMin, yMax, pad = 24 }) {
  const w = width - pad * 2;
  const h = height - pad * 2;
  const sx = w / (xMax - xMin);
  const sy = h / (yMax - yMin);
  const X = (x) => pad + (x - xMin) * sx;
  const Y = (y) => pad + (yMax - y) * sy; // flip y
  const dx = (d) => d * sx;
  const dy = (d) => d * sy;
  return { X, Y, dx, dy, width, height, xMin, xMax, yMin, yMax, pad };
}

// SVG axes / grid component
function Axes({ view, xLabel, yLabel, xTicks, yTicks, xTickLabels, yTickLabels, showZero = true, gridStep, originX, originY }) {
  const { X, Y, xMin, xMax, yMin, yMax, width, height, pad } = view;
  const ox = originX ?? 0;
  const oy = originY ?? 0;
  const ticks = [];
  if (xTicks) {
    for (let i = 0; i < xTicks.length; i++) {
      const t = xTicks[i];
      const label = xTickLabels ? xTickLabels[i] : t;
      ticks.push(
        <g key={`xt${i}`}>
          <line className="axis-tick" x1={X(t)} y1={Y(oy) - 3} x2={X(t)} y2={Y(oy) + 3} />
          <text className="label" x={X(t)} y={Y(oy) + 14} textAnchor="middle">{label}</text>
        </g>
      );
    }
  }
  if (yTicks) {
    for (let i = 0; i < yTicks.length; i++) {
      const t = yTicks[i];
      const label = yTickLabels ? yTickLabels[i] : t;
      ticks.push(
        <g key={`yt${i}`}>
          <line className="axis-tick" x1={X(ox) - 3} y1={Y(t)} x2={X(ox) + 3} y2={Y(t)} />
          <text className="label" x={X(ox) - 6} y={Y(t) + 3} textAnchor="end">{label}</text>
        </g>
      );
    }
  }
  const grid = [];
  if (gridStep) {
    for (let x = Math.ceil(xMin / gridStep) * gridStep; x <= xMax; x += gridStep) {
      grid.push(<line key={`gx${x}`} className="grid" x1={X(x)} y1={Y(yMin)} x2={X(x)} y2={Y(yMax)} />);
    }
    for (let y = Math.ceil(yMin / gridStep) * gridStep; y <= yMax; y += gridStep) {
      grid.push(<line key={`gy${y}`} className="grid" x1={X(xMin)} y1={Y(y)} x2={X(xMax)} y2={Y(y)} />);
    }
  }
  return (
    <g>
      {grid}
      {showZero && (
        <>
          <line className="axis" x1={X(xMin)} y1={Y(oy)} x2={X(xMax)} y2={Y(oy)} />
          <line className="axis" x1={X(ox)} y1={Y(yMin)} x2={X(ox)} y2={Y(yMax)} />
        </>
      )}
      {ticks}
      {xLabel && <text className="label-axis" x={width - pad + 4} y={Y(oy) + 4} textAnchor="start">{xLabel}</text>}
      {yLabel && <text className="label-axis" x={X(ox) + 6} y={pad - 6} textAnchor="start">{yLabel}</text>}
    </g>
  );
}

// Clip a line in math space to the visible window of view.
// Returns {x1,y1,x2,y2} or null.
function clipLine(view, x1, y1, x2, y2) {
  const { xMin, xMax, yMin, yMax } = view;
  // Liang–Barsky
  let t0 = 0, t1 = 1;
  const dx = x2 - x1, dy = y2 - y1;
  const p = [-dx, dx, -dy, dy];
  const q = [x1 - xMin, xMax - x1, y1 - yMin, yMax - y1];
  for (let i = 0; i < 4; i++) {
    if (p[i] === 0) {
      if (q[i] < 0) return null;
    } else {
      const t = q[i] / p[i];
      if (p[i] < 0) { if (t > t1) return null; if (t > t0) t0 = t; }
      else { if (t < t0) return null; if (t < t1) t1 = t; }
    }
  }
  return { x1: x1 + t0 * dx, y1: y1 + t0 * dy, x2: x1 + t1 * dx, y2: y1 + t1 * dy };
}

// Convert a line y = mx + b to two endpoints clipped to view
function mbLineEnds(view, m, b) {
  if (Math.abs(m) > 1e6) return null;
  return clipLine(view, view.xMin, view.xMin * m + b, view.xMax, view.xMax * m + b);
}

// Convert polar line ρ = x cosθ + y sinθ to endpoints in (x,y) clipped to view
function polarLineEnds(view, theta, rho) {
  const c = Math.cos(theta), s = Math.sin(theta);
  // base point closest to origin
  const px = rho * c, py = rho * s;
  // direction along the line is (-s, c)
  const L = 1000;
  return clipLine(view, px - L * s, py + L * c, px + L * s, py - L * c);
}

// Best-fit line via least squares (used for hover/inspection only)
function fitLine(pts) {
  if (pts.length < 2) return null;
  let sx = 0, sy = 0;
  for (const p of pts) { sx += p.x; sy += p.y; }
  const mx = sx / pts.length, my = sy / pts.length;
  let num = 0, den = 0;
  for (const p of pts) { num += (p.x - mx) * (p.y - my); den += (p.x - mx) ** 2; }
  if (den === 0) return null;
  const m = num / den;
  const b = my - m * mx;
  return { m, b };
}

// Hashable interactivity helpers
let __pidCounter = 0;
const __pid = () => `p${++__pidCounter}`;
function useClickablePoints(initial = []) {
  const [pts, setPts] = useState(() => initial.map((p) => ({ ...p, id: p.id || __pid() })));
  const add = (x, y) => setPts((p) => [...p, { x, y, id: __pid() }]);
  const remove = (id) => setPts((p) => p.filter((q) => q.id !== id));
  const reset = (next = []) => setPts(next.map((p) => ({ ...p, id: __pid() })));
  return { pts, add, remove, reset, setPts };
}

// Generate ρ array as θ sweeps 0..π for an image point
function pointSinusoid(x, y, n = 240) {
  const arr = [];
  for (let i = 0; i <= n; i++) {
    const t = (i / n) * Math.PI;
    arr.push({ theta: t, rho: x * Math.cos(t) + y * Math.sin(t) });
  }
  return arr;
}

// Build an SVG path from a list of {x,y} pairs in math space.
function pathFromPoints(view, pts, key = "x", key2 = "y") {
  if (!pts.length) return "";
  let d = `M${view.X(pts[0][key])} ${view.Y(pts[0][key2])}`;
  for (let i = 1; i < pts.length; i++) d += ` L${view.X(pts[i][key])} ${view.Y(pts[i][key2])}`;
  return d;
}

// Discrete colour palette for distinguishing votes / points
const POINT_PALETTE = [
  "oklch(0.42 0.12 250)",   // primary blue (image)
  "oklch(0.50 0.13 200)",
  "oklch(0.48 0.13 290)",
  "oklch(0.46 0.14 230)",
  "oklch(0.45 0.12 270)",
  "oklch(0.50 0.13 215)",
];

Object.assign(window, {
  useState, useEffect, useRef, useMemo, useCallback,
  makeView, Axes, clipLine, mbLineEnds, polarLineEnds, fitLine,
  useClickablePoints, pointSinusoid, pathFromPoints, POINT_PALETTE,
});
