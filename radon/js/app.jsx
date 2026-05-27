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

      <nav className="toc">
        <div className="toc-label">Contents</div>
        <ol>
          <li><span className="num">01</span><a href="#s1">The core reframe</a></li>
          <li><span className="num">02</span><a href="#s2">Point–line duality in (m, b)</a></li>
          <li><span className="num">03</span><a href="#s3">Why Cartesian breaks: vertical lines</a></li>
          <li><span className="num">04</span><a href="#s4">The polar fix: point → sinusoid</a></li>
          <li><span className="num">05</span><a href="#s5">The voting accumulator</a></li>
          <li><span className="num">06</span><a href="#s6">Circles — a 3-parameter Hough</a></li>
          <li><span className="num">07</span><a href="#s7">3-D Hough: planes, cylinders, n-D</a></li>
          <li><span className="num">08</span><a href="#s8">Continuous limit: the Radon transform</a></li>
          <li><span className="num">09</span><a href="#s11">Entropy of the Hough transform</a></li>
          <li><span className="num">10</span><a href="#s12">Generalizing Entropy to the Limit</a></li>
        </ol>
      </nav>

      {/* ─── §1 The core reframe ─── */}
      <section className="sec" id="s1">
        <div className="sec-head">
          <div className="num">§ 01</div>
          <h2><em>Move the problem</em> to a space where the answer is easy to see.</h2>
        </div>
        <div className="sec-body">
          <aside className="sidenote">
            <span className="label">Premise</span>
            “Find a line through these pixels” is hard. “Find a cell that accumulated many votes” is just
            histogram-hunting. The whole framework is a way to turn the former into the latter.
          </aside>
          <div className="prose">
            <p className="lede">
              In an image, a line <span className="mono">y = mx + b</span> is a single equation satisfied
              by infinitely many points. Detecting lines from edge pixels naively — pick groups, test
              collinearity — is combinatorial and noise-fragile.
            </p>
            <p>
              Hough’s insight is to <strong>invert the relationship between points and shapes</strong>. Treat
              the parameters <span className="mono">(m, b)</span> as the coordinates of a new plane. Then a
              <em> single line</em> in the image is a <em>single point</em> in parameter space; a
              <em> single point</em> in the image — which could lie on infinitely many lines — is a whole
              <em> line</em> of <span className="mono">(m, b)</span>s in parameter space.
            </p>
            <p>
              Collinear pixels in the image become parameter-space lines that all <em>pass through one
              point</em>. Detect that intersection and you’ve detected the underlying line. Section 2
              shows the duality directly — drag the points around and watch.
            </p>
            <div className="math">
              image-space line y = mx + b ⇔ parameter-space point (m, b)<br/>
              point in an image (x₀, y₀) ⇔ parameter-space line b = −x₀·m + y₀
              <div className="annot">— a point–line duality</div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── §2 m-b duality ─── */}
      <section className="sec" id="s2">
        <div className="sec-head">
          <div className="num">§ 02</div>
          <h2>Point–line <em>duality</em>, drawn.</h2>
        </div>
        <div className="sec-body">
          <aside className="sidenote">
            <span className="label">Read it twice</span>
            Top: an image. Bottom: their parameter-space duals. The (m, b) where the
            duals concentrate is the line the original pixels nearly lie on.
          </aside>
          <div className="prose">
            <p>
              Each <span className="tk-image">point in an image</span> (top) is rewritten as a
              <span className="tk-param"> line</span> (bottom) via{" "}
              <span className="mono">b = −x₀m + y₀</span>. Drag a point and its parameter line tilts and
              shifts in lockstep. Press <em>snap to collinear</em> and the parameter lines all converge on
              a single (m*, b*).
            </p>
            <DuetMB />
            {/* PC Lines section hidden — preserved for later
            <p>
              The same duality lives inside <strong>parallel coordinates</strong>. Plot three axes —
              <span className="mono"> y | x | −y</span> — and draw each point as a line connecting
              its y value (left), its x value (centre), and its −y value (right). The left corridor
              (<em>T-space</em>, y | x) captures crossings for negative slopes; the right corridor
              (<em>S-space</em>, x | −y) captures crossings for positive slopes. Together they cover
              all slopes without the ±∞ singularity of Cartesian (m, b). This is exactly how the{" "}
              <a href="/MMR8" target="_blank" style={{ color: "var(--param)" }}>IARC QR pipeline</a> ran:
              accumulate crossings in a discretised corridor, find the peak, recover the border.
            </p>
            <PCLines />
            */}
            <p>
              The trick is now visible in two coordinate dresses: a <em>global, spatial</em> property
              in the image (scattered pixels are collinear) has become a <em>local, summable</em> event
              in parameter space (many lines crossing at one point). That swap is what makes the algorithm
              work - gpu parallelizable as well.
            </p>
          </div>
        </div>
      </section>

      {/* ─── §3 Vertical fail ─── */}
      <section className="sec" id="s3">
        <div className="sec-head">
          <div className="num">§ 03</div>
          <h2>The Cartesian (m, b) plane has a <em>fatal flaw</em>.</h2>
        </div>
        <div className="sec-body">
          <aside className="sidenote">
            <span className="label">Failure mode</span>
            Vertical lines have slope ∞. Lines near vertical have huge slopes. An accumulator over (m, b)
            cannot be both finite and uniform.
          </aside>
          <div className="prose">
            <p>
              Rotate a line slowly around the origin. Its slope <span className="mono">m = tan θ</span>{" "}
              moves smoothly while θ is small and then m <em>explodes</em> as θ approaches 90°. A uniform
              grid on m wastes resolution near horizontal and starves near vertical; pure verticals can’t
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
        </div>
      </section>

      {/* ─── §4 Polar duality ─── */}
      <section className="sec" id="s4">
        <div className="sec-head">
          <div className="num">§ 04</div>
          <h2>The polar fix: each image point becomes a <em>sinusoid.</em></h2>
        </div>
        <div className="sec-body">
          <aside className="sidenote">
            <span className="label">New duality</span>
            point ↔ sinusoid. Collinear points produce sinusoids that share a common intersection
            (θ*, ρ*) — the parameters of their line.
          </aside>
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
              line confuses the algorithm. We fix this in the next section
            </p>
          </div>
        </div>
      </section>

      {/* ─── §5 Voting ─── */}
      <section className="sec" id="s5">
        <div className="sec-head">
          <div className="num">§ 05</div>
          <h2>Discretise the parameter plane and <em>let the pixels vote.</em></h2>
        </div>
        <div className="sec-body">
          <aside className="sidenote">
            <span className="label">Algorithm</span>
            <ol style={{ paddingLeft: 16, margin: 0 }}>
              <li>Edge-detect the image.</li>
              <li>Quantise (θ, ρ) into a 2-D accumulator A[θ][ρ].</li>
              <li>For each edge pixel, increment A at every cell its sinusoid passes through.</li>
              <li>Find peaks. Each peak is a detected line.</li>
            </ol>
          </aside>
          <div className="prose">
            <p>
              The continuous picture above doesn’t need to stay continuous. Quantise{" "}
              <span className="mono">θ</span> into 1° bins and <span className="mono">ρ</span> into
              1-pixel bins, build a 2-D array <span className="mono">A[θ][ρ]</span>, and have every edge
              pixel add 1 to every cell its sinusoid passes through. Lines in the image appear as
              <strong> peaks</strong> in the accumulator.
            </p>
            <VotingAccumulator />
            <p>
              The figure feeds in a slightly tilted rectangle and gets back four peaks — one per side.
              Read the (θ, ρ) of each peak and you’ve recovered the rectangle’s full geometry: the two
              near-vertical sides sit at θ ≈ 10° but very different ρ (they’re at different
              perpendicular distances from origin); the two near-horizontal sides sit at θ ≈ 100°,
              again split by ρ.
            </p>
            <div className="callout">
              <div className="callout-label">Why it’s robust</div>
              Occluded lines just lose a few votes (lower peak — still a peak). Noise pixels vote
              <em> diffusely</em> across the accumulator, so their contribution never piles up in any one
              cell. This is why a 1962 idea is still in OpenCV.
            </div>
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
              almost as accurate (this is OpenCV’s <span className="mono">HoughLinesP</span>).{" "}
              <strong>Gradient-direction prior</strong>: at each edge pixel the gradient already tells you
              the line’s normal, so only sweep θ in a small window around it. <strong>Kernel-based
              Hough</strong>: deposit a smooth blob, not a hard vote, so peaks are easier to detect on
              noisy data.
            </p>
          </div>
        </div>
      </section>

      {/* ─── §6 Circles ─── */}
      <section className="sec" id="s6">
        <div className="sec-head">
          <div className="num">§ 06</div>
          <h2>One more parameter, one more dimension: <em>circles.</em></h2>
        </div>
        <div className="sec-body">
          <aside className="sidenote">
            <span className="label">Recipe</span>
            Pick a shape family. Write down its parameters. Each datum becomes a (k−1)-D locus in k-D
            parameter space. Vote. Find peaks.
          </aside>
          <div className="prose">
            <p>
              A circle is <span className="mono">(x − a)² + (y − b)² = r²</span> — three parameters
              <span className="mono"> (a, b, r)</span>. Each edge pixel’s vote-locus is now a 2-D
              <em> cone</em> in 3-D parameter space. Slice that cone at a fixed{" "}
              <span className="mono">r</span> and each edge pixel votes for a <em>circle of radius r</em>{" "}
              around itself. When <span className="mono">r</span> equals the true radius, those
              vote-circles all pass through the true centre.
            </p>
            <CircleHough />
            <p>
              In practice the 3-D accumulator is small enough to enumerate, but using the local{" "}
              <em>gradient direction</em> at each edge pixel narrows each vote from a full circle to a
              single point on it — cheap, accurate, and the basis of OpenCV’s
              <span className="mono"> HoughCircles</span>.
            </p>
          </div>
        </div>
      </section>

      {/* ─── §7 3D ─── */}
      <section className="sec" id="s7">
        <div className="sec-head">
          <div className="num">§ 07</div>
          <h2>The same idea in 3-D: <em>planes, cylinders, n-dimensional hyperplanes.</em></h2>
        </div>
        <div className="sec-body">
          <aside className="sidenote">
            <span className="label">Scaling</span>
            Memory and vote-thinness make k &gt; 4 impractical for grid-based Hough. RANSAC and
            randomised Hough take over above that.
          </aside>
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
              around a terabyte. And <strong>vote-thinness</strong>: each datum’s vote spreads across a
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
        </div>
      </section>

      {/* ─── §8 Radon ─── */}
      <section className="sec" id="s8">
        <div className="sec-head">
          <div className="num">§ 08</div>
          <h2>Take the limit and you get the <em>Radon transform.</em></h2>
        </div>
        <div className="sec-body">
          <aside className="sidenote">
            <span className="label">Continuous Hough</span>
            Let the image be continuous, let the accumulator be continuous, let a vote be a Dirac. The
            sum becomes an integral. The accumulator becomes the sinogram.
          </aside>
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
              parallel line at that angle. You don’t see your body directly — you see the sinogram.
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
            <div className="callout">
              <div className="callout-label">Where this generalises</div>
              In <span className="mono">n</span> dimensions you integrate over{" "}
              <span className="mono">(n − 1)</span>-D hyperplanes. In 3-D this gives either the
              <strong> X-ray transform</strong> (line integrals through a volume — a CT geometry) or the
              <strong> full 3-D Radon transform</strong> (plane integrals — the natural form for some
              tomography problems). <strong>PET, SPECT</strong>, certain MRI sequences,
              ground-penetrating radar, and electron tomography all use variants. Cryo-EM is the 3-D X-ray
              transform with noise and unknown orientations.
            </div>
          </div>
        </div>
      </section>

      {/* ─── §9 Duality family ─── */}
      {/* ─── §9 (was §10) For your research — removed ─── */}


      {/* ─── §11 Information channel ─── */}
      <section className="sec" id="s11">
        <div className="sec-head">
          <div className="num">§ 09</div>
          <h2>How many bits does <em>one vote</em> carry?</h2>
        </div>
        <div className="sec-body">
          <aside className="sidenote">
            <span className="label">Shannon framing</span>
            The accumulator is a posterior estimator. Each edge pixel is a noisy observation. The
            question is how many bits about θ* one pixel carries — and how many you need to beat
            the noise floor.
          </aside>
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
        </div>
      </section>

      {/* ─── §12 Radon limit ─── */}
      <section className="sec" id="s12">
        <div className="sec-head">
          <div className="num">§ 10</div>
          <h2>The continuous limit: <em>Radon, Crowther, and the ramp.</em></h2>
        </div>
        <div className="sec-body">
          <aside className="sidenote">
            <span className="label">CT connection</span>
            The Crowther criterion tells you the minimum number of CT projections needed to reconstruct
            an object at resolution W. It is the same information bottleneck as §11, taken to the
            continuous limit.
          </aside>
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
            <div className="callout">
              <div className="callout-label">Everything else is engineering around this budget</div>
              Randomised Hough samples the vote-surface instead of filling it. Hierarchical Hough coarsens
              the accumulator to survive high k. Probabilistic Hough subsamples pixels to trade recall for
              speed. Filtered backprojection applies the ramp to undo the inversion's conditioning.
              All of them are managing the same information budget that the Shannon-Hough analysis
              lays bare — the Crowther criterion is just where that budget becomes a hard wall.
            </div>
          </div>
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
