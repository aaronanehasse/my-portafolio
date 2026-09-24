/**
 * The THINKING state: a few small cubes orbiting the living head that drift
 * out, sink back in, and melt into the head -- and each other -- where they
 * touch. This layer only says WHERE each cube wants to be; `AiLogo` blends that
 * with the other states' targets, handles budding in and out, and draws (the
 * melting is its goo filter).
 *
 * ## The orbit hugs the head
 *
 * The path is not a circle but a superellipse -- the rounded-square outline of
 * the head -- in the plane of the face, so the satellites trace the silhouette
 * like a halo and keep an even distance from it as they round a corner. The
 * ring lives in the HEAD's frame: when the head turns or looks up, it turns
 * with it and foreshortens in the same perspective.
 *
 * It deliberately never crosses the face. White on white, a satellite in front
 * of the face is invisible except for the bite it takes out of an eye, which
 * reads as a rendering glitch rather than as something passing in front.
 */

export const THINKING_HEAD_SCALE = 0.72; // the head shrinks to leave room for the orbit
export const THINKING_PITCH_BIAS = 0.1;  // it looks up a little while it thinks
// Tumble of each cube, radians per second about its own yaw / pitch / roll.
export const THINKING_SPIN = [0.9, 1.1, 1.9];

const RING_DEPTH = -0.15;    // ring plane, in head half-edges from the centre; a little behind
const SQUARENESS = 6;        // superellipse exponent; 2 is a circle
const ORBIT_SPEED = 0.2;     // laps per second

// size: half-edge relative to the head's. phase: where on the ring it starts, in laps.
const SATELLITES = [
  { size: 0.38, phase: 0, breathe: 0 },
  { size: 0.3, phase: 0.37, breathe: 2.1 },
  { size: 0.34, phase: 0.65, breathe: 4.4 },
];

/**
 * The rounded-square ring, unit "radius", sampled by ARC LENGTH.
 *
 * The superellipse's natural angle parameter bunches its points into the
 * corners, so stepping the angle evenly makes a satellite crawl round each
 * corner and then flick along the flat. Instead the ring is sampled once, its
 * length measured, and `ring(u)` returns the point a fraction `u` of the way
 * round by distance -- constant speed all the way.
 */
const RING = (() => {
  const N = 720;
  const e = 2 / SQUARENESS;
  const pts = [];
  for (let i = 0; i <= N; i++) {
    const a = (i / N) * Math.PI * 2;
    const c = Math.cos(a), s = Math.sin(a);
    pts.push([Math.sign(c) * Math.abs(c) ** e, Math.sign(s) * Math.abs(s) ** e]);
  }
  const len = [0];
  for (let i = 1; i <= N; i++) {
    len.push(len[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  }
  return { pts, len, total: len[N] };
})();

function ring(u) {
  const target = (((u % 1) + 1) % 1) * RING.total;
  const { pts, len } = RING;
  let lo = 0, hi = len.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (len[mid] <= target) lo = mid; else hi = mid;
  }
  const k = (target - len[lo]) / (len[hi] - len[lo] || 1);
  return [pts[lo][0] + (pts[hi][0] - pts[lo][0]) * k, pts[lo][1] + (pts[hi][1] - pts[lo][1]) * k];
}

const smooth = (k) => k * k * (3 - 2 * k);

/** @param {object} [opts] @param {boolean} [opts.slow] orbit at 30% (reduced motion) */
export function createThinkingLayer({ slow = false } = {}) {
  const speed = slow ? ORBIT_SPEED * 0.3 : ORBIT_SPEED;
  let t = 0;

  return {
    /**
     * Advance by `dt`. Returns, per cube, `{ center, size }` in the HEAD's frame
     * and in units of its half-edge. The orbit keeps running while the state is
     * not shown, so re-entering it does not always start from the same spot.
     */
    step(dt) {
      t += dt;
      return SATELLITES.map((sat, i) => {
        const lap = t * speed + sat.phase;
        // Breathe between sunk into the head (merged) and floating clear of it.
        const b = smooth(0.5 + 0.5 * Math.sin(t * 1.6 + sat.breathe));
        const dist = 1 + sat.size * (0.15 + 1.7 * b);
        const [rx, ry] = ring(lap);
        // A little in-and-out of the plane so it reads as depth, not a flat track.
        const drift = Math.sin(lap * Math.PI * 4 + i) * 0.25;
        return { center: [rx * dist, ry * dist, RING_DEPTH + drift], size: sat.size };
      });
    },
  };
}
