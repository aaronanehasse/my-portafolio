/**
 * Geometry shared by every AI logo animation: turns a pose into one SVG path.
 *
 * The logo is a flat white cube. With no shading, the only thing that says
 * "cube" is its outline, so the drawing is just the SILHOUETTE -- the convex
 * hull of the eight projected corners -- with the eyes cut out of it. Edges
 * inside the silhouette are never drawn; they would be white on white.
 *
 * ## Rounded corners
 *
 * Rounding a projected hull corner by corner falls apart when the cube is
 * nearly face-on: two hull points sit a pixel apart, the edge between them is
 * too short to take a radius, and that corner goes sharp for a frame. Instead
 * the hull is taken of a SMALLER cube, inset by `round`, and grown back out by
 * the same amount as a circle at every corner. The result is the same
 * rounded-box outline from every angle, and a vanishing edge simply becomes a
 * vanishing arc.
 *
 * ## Eyes
 *
 * Two vertical rectangles on the +z face, emitted as extra sub-paths. The path
 * is filled `evenodd`, so they are holes -- whatever is behind the logo shows
 * through them. They are only drawn while that face points at the viewer.
 *
 * Coordinates: x right, y up, z toward the viewer. Output is SVG space (y down)
 * centred on the origin, so the SVG should use a viewBox centred on 0,0.
 */

export const CUBE = {
  half: 26,          // half the edge length, in viewBox units
  round: 7,          // corner radius of the silhouette
  distance: 300,     // camera distance; lower is more perspective
  cameraTilt: -0.2,  // radians; the camera looks down on the cube slightly
  eye: {
    x: 0.34,         // centre of each eye from the face centre, fraction of `half`
    y: -0.1,
    w: 0.16,         // half-width, fraction of `half`
    h: 0.42,         // half-height, fraction of `half`
    round: 0.09,     // corner radius, fraction of `half`
    travelX: 0.17,   // how far the eyes slide when glancing, fraction of `half`
    travelY: 0.13,
  },
  // Eavy's halo: a flat, rounded square floating over the head, in the head's
  // own frame, so it tilts and foreshortens as the head turns.
  halo: {
    y: 1.62,         // height of its plane above the head's centre, fraction of `half`
    half: 0.6,       // half its width, fraction of `half`
    round: 0.16,     // corner radius, fraction of `half`
  },
};

const CORNERS = [];
for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) CORNERS.push([x, y, z]);

/** Rz(roll) then Rx(pitch) then Ry(yaw) then the camera's own tilt. */
function makeRotation({ yaw = 0, pitch = 0, roll = 0 }, cameraTilt) {
  const cy = Math.cos(yaw), sy = Math.sin(yaw);
  const cp = Math.cos(pitch), sp = Math.sin(pitch);
  const cr = Math.cos(roll), sr = Math.sin(roll);
  const ct = Math.cos(cameraTilt), st = Math.sin(cameraTilt);
  return ([x, y, z]) => {
    // roll about z
    let x1 = x * cr - y * sr, y1 = x * sr + y * cr, z1 = z;
    // pitch about x (positive looks up)
    let y2 = y1 * cp + z1 * sp, z2 = -y1 * sp + z1 * cp, x2 = x1;
    // yaw about y (positive looks right)
    let x3 = x2 * cy + z2 * sy, z3 = -x2 * sy + z2 * cy, y3 = y2;
    // camera tilt about x
    return [x3, y3 * ct + z3 * st, -y3 * st + z3 * ct];
  };
}

/**
 * The head's own rotation (no camera tilt, no translation), for placing things
 * in its frame and then drawing them in a neutral one -- see `satellitePath`.
 */
export function headRotation(pose) {
  return makeRotation(pose, 0);
}

function project([x, y, z], { distance }, offsetX, offsetY) {
  const k = distance / (distance - z);
  return [x * k + offsetX, -(y * k) - offsetY];
}

/** Andrew's monotone chain. Returns the hull with positive winding in raw coordinates. */
function convexHull(points) {
  const pts = points.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower = [];
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 1e-9) lower.pop();
    lower.push(p);
  }
  const upper = [];
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 1e-9) upper.pop();
    upper.push(p);
  }
  upper.pop();
  lower.pop();
  return lower.concat(upper);
}

const f = (n) => n.toFixed(2);

/**
 * The outline of `points` grown outward by `r` with round corners: the convex
 * hull of a circle of radius r at every point.
 */
function roundedHullPath(points, r) {
  const hull = convexHull(points);
  const n = hull.length;
  if (n === 0) return '';
  if (n === 1) {
    const [x, y] = hull[0];
    return `M${f(x - r)},${f(y)}a${f(r)},${f(r)} 0 1 0 ${f(2 * r)},0a${f(r)},${f(r)} 0 1 0 ${f(-2 * r)},0Z`;
  }
  // Outward normal of each edge i -> i+1.
  const normals = hull.map((p, i) => {
    const q = hull[(i + 1) % n];
    const dx = q[0] - p[0], dy = q[1] - p[1];
    const len = Math.hypot(dx, dy) || 1;
    return [dy / len, -dx / len];
  });
  let d = '';
  for (let i = 0; i < n; i++) {
    const p = hull[i];
    const nIn = normals[(i - 1 + n) % n];
    const nOut = normals[i];
    const a = [p[0] + nIn[0] * r, p[1] + nIn[1] * r];
    const b = [p[0] + nOut[0] * r, p[1] + nOut[1] * r];
    d += i === 0 ? `M${f(a[0])},${f(a[1])}` : `L${f(a[0])},${f(a[1])}`;
    if (r > 0) d += `A${f(r)},${f(r)} 0 0 1 ${f(b[0])},${f(b[1])}`;
  }
  return d + 'Z';
}

/**
 * @param {object} pose
 * @param {number} [pose.yaw]    radians, positive turns to look right
 * @param {number} [pose.pitch]  radians, positive looks up
 * @param {number} [pose.roll]   radians, positive tilts counter-clockwise
 * @param {number} [pose.x]      translation in viewBox units
 * @param {number} [pose.y]      translation, positive is up
 * @param {number} [pose.scale]  uniform scale of the whole cube
 * @param {number} [pose.eyeX]   -1..1, where the eyes sit on the face (glance)
 * @param {number} [pose.eyeY]   -1..1
 * @param {number} [pose.blink]  0 open .. 1 shut
 * @returns {{ body: string, eyes: string }} SVG path data for the silhouette
 *          and for the two eyes (empty while the face is turned away)
 */
export function cubeParts(pose, cfg = CUBE) {
  const {
    x = 0, y = 0, scale = 1,
    eyeX = 0, eyeY = 0, blink = 0,
  } = pose;
  const rotate = makeRotation(pose, cfg.cameraTilt);
  const h = cfg.half * scale;
  const r = Math.min(cfg.round * scale, h * 0.9);

  // Silhouette: hull of an inset cube, grown back out by r.
  const inner = h - r;
  const corners = CORNERS.map((c) => project(rotate(c.map((v) => v * inner)), cfg, x, y));
  const body = roundedHullPath(corners, r);

  // Eyes: only while the front face is turned toward the camera.
  let eyes = '';
  const normal = rotate([0, 0, 1]);
  if (normal[2] > 0.02) {
    const e = cfg.eye;
    const open = 1 - Math.min(1, Math.max(0, blink));
    const hw = e.w * h;
    const hh = Math.max(e.h * h * open, hw * 0.12);
    const er = Math.min(e.round * h, hw * 0.95, hh * 0.95);
    const cx = (eyeX * e.travelX) * h;
    // A blink closes toward the lower lid rather than the middle.
    const cy = (e.y + eyeY * e.travelY) * h - (e.h * h - hh) * 0.35;
    // Screen-space radius, measured at the face so perspective keeps it honest.
    // Squeezed by how edge-on the face is, or a steep angle would leave a
    // circle's width of eye behind when the face itself is a sliver.
    const k = cfg.distance / (cfg.distance - rotate([0, 0, h])[2]) * Math.min(1, normal[2] * 1.3);
    for (const side of [-1, 1]) {
      const ex = cx + side * e.x * h;
      const quad = [
        [ex - hw + er, cy - hh + er], [ex + hw - er, cy - hh + er],
        [ex + hw - er, cy + hh - er], [ex - hw + er, cy + hh - er],
      ].map(([px, py]) => project(rotate([px, py, h]), cfg, x, y));
      eyes += roundedHullPath(quad, er * k);
    }
  }
  return { body, eyes };
}

/** The whole cube as one path; fill it with `fill-rule="evenodd"` so the eyes are holes. */
export function cubePath(pose, cfg = CUBE) {
  const { body, eyes } = cubeParts(pose, cfg);
  return body + eyes;
}

/**
 * A small cube that lives in the HEAD's frame: `center` is in the head's local
 * coordinates, so when the head turns, everything around it turns with it.
 *
 * @param {object} head   the main cube's pose (rotation, translation, scale)
 * @param {object} sat
 * @param {number[]} sat.center  [x, y, z] local to the head, in units of its half-edge
 * @param {number} sat.size      half-edge, in units of the head's half-edge
 * @param {object} [sat.spin]    { yaw, pitch, roll } of the small cube itself
 * @returns {{ d: string, front: boolean }} its outline, and whether it is
 *          nearer the camera than the head's face (so it should cover the eyes)
 */
export function satellitePath(head, sat, cfg = CUBE) {
  const { x = 0, y = 0, scale = 1 } = head;
  const rotate = makeRotation(head, cfg.cameraTilt);
  const spin = makeRotation(sat.spin || {}, 0);
  const h = cfg.half * scale;
  const s = sat.size * h;
  const r = s * (cfg.round / cfg.half) * 1.3;
  const c = sat.center.map((v) => v * h);
  const corners = CORNERS.map((corner) => {
    const [px, py, pz] = spin(corner.map((v) => v * (s - r)));
    return project(rotate([px + c[0], py + c[1], pz + c[2]]), cfg, x, y);
  });
  const front = rotate(c)[2] > rotate([0, 0, h])[2];
  return { d: roundedHullPath(corners, r), front };
}

/**
 * Eavy's halo, for the same pose as the head: a rounded square lying flat above
 * it. Drawn as an outline, so it is one closed path.
 */
export function haloPath(pose, cfg = CUBE) {
  const { x = 0, y = 0, scale = 1 } = pose;
  // It turns and tilts with the head, but takes only a third of a nod: a halo
  // that tipped fully forward whenever the head looked down would swing into
  // it, and would look bolted on rather than hovering.
  const rotate = makeRotation({ ...pose, pitch: (pose.pitch ?? 0) * 0.35 }, cfg.cameraTilt);
  const h = cfg.half * scale;
  const { y: lift, half, round } = cfg.halo;
  const r = round * h;
  const inner = half * h - r;
  const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sz]) =>
    project(rotate([sx * inner, lift * h, sz * inner]), cfg, x, y)
  );
  return roundedHullPath(corners, r);
}
