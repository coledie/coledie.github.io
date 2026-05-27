/* global React, ReactDOM, DuetMB, PCLines, VerticalFail, DuetPolar, VotingAccumulator, CircleHough, PlaneCylinder3D, SinogramDemo, DualityLandscape, VoteInformation, NoiseFloor */

function App() {
  return (
    <div className="paper-bg">
      <header className="masthead">
        <p className="subtitle">
          A visual deep-dive: how voting in parameter space detects lines, circles and planes — and why
          the same idea, taken to its continuous limit, is what makes a CT scanner work.
        </p>
      </header>

      {/* ─── §1 The core reframe ─── */}
      <section className="sec" id="s1">
        <div className="num">§ 01</div>
        <h2><em>Move the problem</em> to a space where the answer is easy to see.</h2>
        <div className="prose">
          <p className="lede">
            In an image, a line <span className="mono">y = mx + b</span> is a single equation satisfied
            by infinitely many points. Detecting lines from edge pixels naively — pick groups, test
            collinearity — is combinatorial and noise-fragile.
          </p>
          <p>
            Hough's insight is to <strong>invert the relationship between points and shapes</strong>. Treat
            the parameters <span className="mono">(m, b)</span> as the coordinates of a new plane. Then a
            <em> single line</em> in the image is a <em>single point</em> in parameter space; a
            <em> single point</em> in the image — which could lie on infinitely many lines — is a whole
            <em> line</em> of <span className="mono">(m, b)</span>s in parameter space.
          </p>
          <p>
            Collinear pixels in the image become parameter-space lines that all <em>pass through one
            point</em>. Detect that intersection and you've detected the underlying line. Section 2
            shows the duality directly — drag the points around and watch.
          </p>
          <div className="math">
            image-space line y = mx + b ⇔ parameter-space point (m, b)<br/>
            point in an image (x₀, y₀) ⇔ parameter-space line b = −x₀·m + y₀
            <div className="annot">— a point–line duality</div>
          </div>
        </div>
      </section>

      {/* ─── §2 m-b duality ─── */}
      <section className="sec" id="s2">
        <div className="num">§ 02</div>
        <h2>Point–line <em>duality</em>, drawn.</h2>
        <div className="prose">
          <p>
            Each <span className="tk-image">point in an image</span> (top) is rewritten as a
            <span className="tk-param"> line</span> (bottom) via{" "}
            <span className="mono">b = −x₀m + y₀</span>. Drag a point and its parameter line tilts and
            shifts in lockstep.
          </p>
          <DuetMB />
          <p>
            A <em>global, spatial</em> property in the image — scattered pixels are collinear — has
            become a <em>local, summable</em> event in parameter space: many lines crossing at one point.
            That swap is what makes the algorithm work, and what makes it GPU-parallelizable.
          </p>
        </div>
      </section>

      {/* ─── §3 Vertical fail ─── */}
      <section className="sec" id="s3">
        <div className="num">§ 03</div>
        <h2>The Cartesian (m, b) plane has a <em>fatal flaw</em>.</h2>
        <div className="prose">
          <p>
            Rotate a line slowly around the origin. Its slope <span className="mono">m = tan θ</span>{" "}
            moves smoothly while θ is small and then m <em>explodes</em> as θ approaches 90°. A uniform
            grid on m wastes resolution near horizontal and starves near vertical; pure verticals can't
            be represented at all.
          </p>
          <VerticalFail />
          <p>
            The fix is to switch parameters. Encode each line by the angle of its normal{" "}
            <span className="mono">θ</span> and its perpendicular distance{" "}
            <span className="mono">ρ</span> from the origin. Both are bounded; every line has a
            well-defined representation, verticals included.
          </p>
          <div className="math">
            ρ = x cos θ + y sin θ
            <div className="annot">
              — θ ∈ [0, π), ρ ∈ [−D, D] where D is the image diagonal
            </div>
          </div>
        </div>
      </section>

      {/* ─── §4 Polar duality ─── */}
      <section className="sec" id="s4">
        <div className="num">§ 04</div>
        <h2>The polar fix: each image point becomes a <em>sinusoid.</em></h2>
        <div className="prose">
          <p>
            For a fixed image point <span className="mono">(x₀, y₀)</span>, sweep θ from 0 to π and the
            corresponding <span className="mono">ρ = x₀ cos θ + y₀ sin θ</span> traces a sinusoid in
            parameter space. The point–line duality is now a <strong>point–sinusoid</strong> duality —
            same logic, bounded space.
          </p>
          <DuetPolar />
          <p>
            Notice how the vertical-line preset (impossible to represent in Fig 2.1) sits comfortably at{" "}
            <span className="mono">θ = 0</span> here — exactly the symmetry the polar parameterisation
            was invented for.
            This example cant handle multiple lines in the same photo, even adding points outside of a well defined
            line confuses the algorithm. We fix this in the next section.
          </p>
        </div>
      </section>

      {/* ─── §5 Voting ─── */}
      <section className="sec" id="s5">
        <div className="num">§ 05</div>
        <h2>Discretise the parameter plane and <em>let the pixels vote.</em></h2>
        <div className="prose">
          <p>
            The continuous picture above doesn't need to stay continuous. Quantise{" "}
            <span className="mono">θ</span> into 1° bins and <span className="mono">ρ</span> into
            1-pixel bins, build a 2-D array <span className="mono">A[θ][ρ]</span>, and have every edge
            pixel add 1 to every cell its sinusoid passes through. Lines in the image appear as
            <strong> peaks</strong> in the accumulator.
          </p>
          <VotingAccumulator />
          <p>
            The figure feeds in a slightly tilted rectangle and gets back four peaks — one per side.
            Read the (θ, ρ) of each peak and you've recovered the rectangle's full geometry: the two
            near-vertical sides sit at θ ≈ 10° but very different ρ (they're at different
            perpendicular distances from origin); the two near-horizontal sides sit at θ ≈ 100°,
            again split by ρ.
          </p>
          <p>
            At <a href="/MMR8" style={{ color: "var(--param)" }}>IARC Mission 8</a>, a drone photographed four separate fragments of a QR code and had to
            recover the complete symbol mid-flight. Each fragment's borders produce thousands of
            collinear edge pixels; their votes pile into the same four{" "}
            <span className="mono">(θ, ρ)</span> cells, giving unambiguous peaks against background
            noise. The key computational fact is that each pixel sweeps its sinusoid and increments
            cells <em>independently</em> — no data dependency between pixels. A CPU running the
            loop serially took ~10 s per frame; rewriting the accumulation in OpenGL and CUDA
            dropped that under 1 s, enough for real-time guidance.
          </p>
          <h3>Practical tweaks that show up everywhere</h3>
          <p>
            <strong>Probabilistic Hough</strong> samples a random subset of edge pixels — much faster,
            almost as accurate (this is OpenCV's <span className="mono">HoughLinesP</span>).{" "}
            <strong>Gradient-direction prior</strong>: at each edge pixel the gradient already tells you
            the line's normal, so only sweep θ in a small window around it. <strong>Kernel-based
            Hough</strong>: deposit a smooth blob, not a hard vote, so peaks are easier to detect on
            noisy data.
          </p>
        </div>
      </section>

      {/* ─── §6 Circles ─── */}
      <section className="sec" id="s6">
        <div className="num">§ 06</div>
        <h2>One more parameter, one more dimension: <em>circles.</em></h2>
        <div className="prose">
          <p>
            A circle is <span className="mono">(x − a)² + (y − b)² = r²</span> — three parameters
            <span className="mono"> (a, b, r)</span>. Each edge pixel's vote-locus is now a 2-D
            <em> cone</em> in 3-D parameter space. Slice that cone at a fixed{" "}
            <span className="mono">r</span> and each edge pixel votes for a <em>circle of radius r</em>{" "}
            around itself. When <span className="mono">r</span> equals the true radius, those
            vote-circles all pass through the true centre.
          </p>
          <CircleHough />
          <p>
            In practice the 3-D accumulator is small enough to enumerate, but using the local{" "}
            <em>gradient direction</em> at each edge pixel narrows each vote from a full circle to a
            single point on it — cheap, accurate, and the basis of OpenCV's <span className="mono">HoughCircles</span>.
          </p>
        </div>
      </section>

      {/* ─── §7 3D ─── */}
      <section className="sec" id="s7">
        <div className="num">§ 07</div>
        <h2>The same idea in 3-D: <em>planes, cylinders, n-dimensional hyperplanes.</em></h2>
        <div className="prose">
          <p>
            For any shape parameterised by <span className="mono">k</span> numbers, the recipe runs
            unchanged: every data point becomes a <span className="mono">(k − 1)</span>-D surface in
            <span className="mono"> k</span>-D parameter space, and you vote in a{" "}
            <span className="mono">k</span>-D accumulator. Plane detection in 3-D point clouds is the
            <strong> workhorse</strong> case — a plane is{" "}
            <span className="mono">ρ = x sin φ cos θ + y sin φ sin θ + z cos φ</span> with three
            parameters <span className="mono">(θ, φ, ρ)</span>.
          </p>
          <PlaneCylinder3D />
          <p>
            <strong>Three parameters is roughly the ceiling</strong> for grid-based Hough. At usable
            resolution the accumulator stays under ~10⁸ cells, which fits in memory and you can scan
            for peaks. Above that, two failure modes appear together. The accumulator{" "}
            <strong>blows up</strong>: a 5-D cylinder grid at the same resolution is ~10¹² cells —
            around a terabyte. And <strong>vote-thinness</strong>: each datum's vote spreads across a
            higher-dimensional surface, so the signal-to-noise at any single cell collapses. You build
            an enormous structure to find nothing.
          </p>
          {/* RANSAC section hidden — preserved for later
          <h3>The pivot at k ≈ 4 — RANSAC</h3>
          <p>
            The standard fix abandons the grid entirely and probes parameter space by{" "}
            <em>sampling</em>: pick the minimum number of points needed to instantiate the shape (2
            for a line, 3 for a plane, 4 for a sphere, 5 for a cylinder), fit the candidate, count
            agreeing data points, repeat. Keep the candidate with the most agreement.
          </p>
          <RANSACDemo />
          <p>
            The conceptual move is the same as Hough — every datum still has a relationship with a
            region of parameter space — but instead of <em>materialising</em> the accumulator and
            voting into it, RANSAC implicitly samples it. This is the dominant method above two
            parameters: PCL, Open3D and COLMAP all fit planes and cylinders via RANSAC, not Hough.
          </p>
          */}
        </div>
      </section>

      {/* ─── §8 Radon ─── */}
      <section className="sec" id="s8">
        <div className="num">§ 08</div>
        <h2>Take the limit and you get the <em>Radon transform.</em></h2>
        <div className="prose">
          <p>
            Replace the discrete edge-pixel sum with a continuous integral and you arrive at one of the
            most important transforms in inverse problems:
          </p>
          <div className="math">
            R(θ, ρ) = ∬ f(x, y) · δ(ρ − x cos θ − y sin θ) dx dy
            <div className="annot">
              — at each (θ, ρ), the line integral of f along the line ρ = x cos θ + y sin θ
            </div>
          </div>
          <p>
            Each value <span className="mono">R(θ, ρ)</span> is the <em>line integral</em> of{" "}
            <span className="mono">f</span> along the line at angle θ and offset ρ. A single bright
            point at <span className="mono">(x₀, y₀)</span> in the source image lights up exactly the
            cells where <span className="mono">ρ = x₀ cos θ + y₀ sin θ</span> — the same sinusoid that
            appeared in §4. An extended object is a <em>sum of these sinusoids</em>, one per source
            point, smeared together — which is why R viewed as a 2-D image is called a{" "}
            <strong>sinogram</strong>.
          </p>
          <SinogramDemo />
          <h3>How CT inverts this</h3>
          <p>
            A CT scanner physically <em>measures</em> the sinogram. An X-ray source–detector pair
            rotates around the patient, and each rotation angle θ records one full row of{" "}
            <span className="mono">R(θ, ρ)</span> as the detector picks up the attenuation along every
            parallel line at that angle. You don't see your body directly — you see the sinogram.
          </p>
          <p>
            Reconstruction is the <em>mirror image</em> of Hough voting: for each measured{" "}
            <span className="mono">(θ, ρ)</span>, smear that value back along the line it came from,
            and sum across all angles. Where many lines overlap, the original density builds back up;
            where few do, contributions cancel. Pre-multiplying each projection by a ramp filter (in
            the frequency domain) undoes the 1/r blur the naive smear creates — this is{" "}
            <strong>filtered backprojection</strong>, the workhorse method of CT. Toggle the ramp
            filter in the demo above and watch the star artefact collapse into a clean reconstruction.
          </p>
        </div>
      </section>

      {/* ─── §9 Duality family ─── */}
      {/* ─── §9 (was §10) For your research — removed ─── */}


      {/* ─── §11 Information channel ─── */}
      <section className="sec" id="s11">
        <div className="num">§ 09</div>
        <h2>How many bits does <em>one vote</em> carry?</h2>
        <div className="prose">
          <p>
            One edge pixel constrains <span className="mono">θ*</span> to
            a <span className="mono">(k−1)</span>-dimensional surface inside the <span className="mono">k</span>-D
            accumulator — the sinusoid for lines, a cone for circles. If that surface touches{" "}
            <span className="mono">M</span> of the <span className="mono">N</span> total cells:
          </p>
          <div className="math">
            I<sub>vote</sub> = log₂(N / M) = log₂ R bits — independent of k
            <div className="annot">
              — where R is the number of cells per axis. Each dimension adds the same haystack,
              removes the same fraction.
            </div>
          </div>
          <p>
            This is the headline result: <strong>every vote always carries <span className="mono">log₂ R</span> bits,
            regardless of how many parameters the shape has.</strong> So why does Hough collapse above{" "}
            <span className="mono">k ≈ 3</span>? Because the prior entropy grows linearly in{" "}
            <span className="mono">k</span> — <span className="mono">H(Θ) = k · log₂ R</span> — while
            the vote-information stays flat. More dimensions means more haystack, same shovel.
          </p>
          <VoteInformation />
          <p>
            The memory penalty compounds that: adding one dimension multiplies the accumulator by{" "}
            <span className="mono">R</span>. Drag the slider above past R = 200 and watch the cylinder
            accumulator cross a terabyte while every bar on the left stays identical.
          </p>
          <NoiseFloor />
          <h3>How many bits does a peak actually carry?</h3>
          <p>
            The noise-floor demo shows <em>when</em> a peak is detectable, but not <em>how confident</em>{" "}
            you should be. The Gaussian/Chernoff approximation gives a clean answer. A Poisson variable
            has variance equal to its mean λ, so a peak of height <span className="mono">n</span> sits{" "}
            <span className="mono">(n − λ)/√λ</span> standard deviations above the background. Converting
            to bits:
          </p>
          <div className="math">
            bits ≈ (n − λ)² / (2λ ln 2)
            <div className="annot">
              — Gaussian/Chernoff approximation: how much evidence a peak of height n carries
              against a Poisson background with mean λ
            </div>
          </div>
          <p>
            To be confident a line exists you need enough bits to (a) overcome the{" "}
            <strong>multiple-testing tax</strong> — log₂ of the number of cells you searched, about 17.5
            bits for a 180 × 1 000 accumulator — and (b) buy your desired confidence level on top of
            that. The table shows required peak heights for two typical background levels:
          </p>
          <table className="tbl">
            <thead>
              <tr>
                <th>Confidence</th>
                <th>Bits needed</th>
                <th>Peak height (λ = 1)</th>
                <th>Peak height (λ = 10)</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['95 %',          '22', '~6',  '~20'],
                ['99.99 %',       '31', '~10', '~32'],
                ['One in a million', '38', '~12', '~38'],
              ].map(([conf, bits, h1, h10]) => (
                <tr key={conf}>
                  <td>{conf}</td>
                  <td className="mono">{bits}</td>
                  <td className="mono">{h1}</td>
                  <td className="mono">{h10}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="callout">
            <div className="callout-label">The punchline</div>
            You need roughly 20–40 bits of evidence to be confident a line exists. About 18 of those bits
            are just the <strong>multiple-testing tax</strong> for scanning all 180 000 possible lines —
            unavoidable overhead that grows with accumulator size. The remaining 5–20 bits buy your actual
            confidence level. This is why a line with only a handful of pixels above background looks
            compelling to the eye but fails a rigorous statistical test: the visual cortex doesn't pay the
            multiple-testing penalty.
          </div>
        </div>
      </section>

      {/* ─── §12 Radon limit ─── */}
      <section className="sec" id="s12">
        <div className="num">§ 10</div>
        <h2>The continuous limit: <em>Radon, Crowther, and the ramp.</em></h2>
        <div className="prose">
          <p>
            Across discrete Hough and the continuous Radon limit, the same trade-off holds: each
            observation carries <span className="mono">log₂ R</span> bits about the shape (or, in
            the continuous case, one radial Fourier slice), and the prior has{" "}
            <span className="mono">k · log₂ R</span> bits of entropy (or D²W² degrees of freedom).
          </p>
          <table className="tbl">
            <thead>
              <tr>
                <th>Shape</th><th>k</th><th>Bits / vote</th><th>H(Θ)</th><th>Min votes</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Line',           '2', 'log₂ R', '2·log₂ R', '2'],
                ['Circle / plane', '3', 'log₂ R', '3·log₂ R', '3'],
                ['3-D line',       '4', 'log₂ R', '4·log₂ R', '4'],
                ['Cylinder',       '5', 'log₂ R', '5·log₂ R', '5'],
              ].map(([sh, k, bpv, h, mv]) => (
                <tr key={sh}>
                  <td>{sh}</td><td className="mono">{k}</td>
                  <td className="mono">{bpv}</td><td className="mono">{h}</td>
                  <td className="mono">{mv}</td>
                </tr>
              ))}
              <tr>
                <td>Continuous Radon</td><td className="mono">—</td>
                <td className="mono">log₂(WD) / proj</td>
                <td className="mono">D²W² total</td>
                <td className="mono">πWD/2 proj</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <footer className="colo">
        <span>Hough → Radon ‧ research notebook</span>
        <span>scroll-through ‧ figures are live ‧ try every demo</span>
      </footer>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
