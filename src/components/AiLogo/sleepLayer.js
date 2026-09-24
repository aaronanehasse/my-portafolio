/**
 * The SLEEPING state: eyes down to slits, head drooped and tilted to one side,
 * breathing slowly instead of bobbing -- and a trail of Zs drifting up off its
 * top-right corner, each one growing, swaying and fading as it rises.
 *
 * The head part is a focus (where to look), a blink floor and a breathing
 * offset that `AiLogo` blends in by the state's weight. The Zs are their own
 * little particle stream: a new one only starts while the logo is (mostly)
 * asleep, but ones already in the air finish their float after it wakes.
 *
 * The Zs are pixel glyphs in the Minecraft font's style -- `Z_GLYPH`, 5x7,
 * with the font's one-pixel drop shadow -- so they never rotate: tilted
 * pixel art stops reading as pixels. They sway sideways instead.
 *
 * Z positions are in SCREEN units (viewBox, y down) relative to the head's
 * centre, scaled by the head's size; `AiLogo` places them.
 */

export const SLEEP_Z_POOL = 4;

/** The Minecraft-font "Z": 5 pixels wide, 7 tall. */
const Z_GLYPH = [
  '#####',
  '....#',
  '...#.',
  '..#..',
  '.#...',
  '#....',
  '#####',
];

/**
 * `Z_GLYPH` as one path, one rectangle per run of pixels in a row, centred on
 * the origin and scaled so its half-WIDTH is 1 -- the same unit as a Z's `size`.
 * `dx`/`dy` shift it by whole pixels (for the drop shadow).
 */
function glyphPath(dx = 0, dy = 0) {
  const px = 1 / 2.5;
  const w = Z_GLYPH[0].length, h = Z_GLYPH.length;
  let d = '';
  Z_GLYPH.forEach((row, y) => {
    for (let x = 0; x < w; x++) {
      if (row[x] !== '#') continue;
      let end = x;
      while (end + 1 < w && row[end + 1] === '#') end++;
      const left = (x - w / 2 + dx) * px;
      const top = (y - h / 2 + dy) * px;
      d += `M${left.toFixed(3)},${top.toFixed(3)}h${((end - x + 1) * px).toFixed(3)}v${px.toFixed(3)}h${(-(end - x + 1) * px).toFixed(3)}Z`;
      x = end;
    }
  });
  return d;
}

export const Z_PATH = glyphPath();
export const Z_SHADOW_PATH = glyphPath(1, 1);

const EYES = 0.86;            // how closed the eyes rest (1 is shut)
const TILT = 0.3;             // head roll, top leaning left -- leaves the top-right clear for the Zs
const DROOP = -0.14;          // head pitch, a little forward
const BREATH_HZ = 0.22;       // breaths per second
const BREATH_RISE = 1.2;      // viewBox units
const BREATH_SWELL = 0.018;   // of the head's size

const Z_EVERY = 1.0;          // seconds between Zs
const Z_LIFE = 2.8;           // seconds each is visible
const Z_FROM = [20, -25];     // start, relative to the head's centre (screen units, y down)
const Z_TO = [48, -58];       // end
const Z_SIZE = [1.9, 4.6];    // half-width, start and end
const Z_SWAY = 3;             // side-to-side drift, screen units

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const lerp = (a, b, k) => a + (b - a) * k;

export function createSleepLayer() {
  let t = 0;
  let nextZ = 0.4;
  const zs = []; // { born }

  return {
    /**
     * Advance by `dt` at sleep weight `amount`. Returns the head's `focus`, a
     * `blink` floor, `breathe` ({ y, scale }, both to be weighted by `amount`
     * already applied), and up to SLEEP_Z_POOL Zs as { x, y, size, opacity }.
     */
    step(dt, amount) {
      t += dt;

      if (amount > 0.7 && t >= nextZ) {
        zs.push({ born: t, sway: Math.random() * Math.PI * 2 });
        if (zs.length > SLEEP_Z_POOL) zs.shift();
        nextZ = t + Z_EVERY;
      }
      if (amount <= 0.7) nextZ = Math.max(nextZ, t + 0.3); // first Z comes shortly after it drops off

      const out = [];
      for (const z of zs) {
        const k = (t - z.born) / Z_LIFE;
        if (k >= 1) continue;
        // A steady rise: an easing one lets each Z catch the one before and pile up.
        const rise = k;
        out.push({
          x: lerp(Z_FROM[0], Z_TO[0], rise) + Math.sin(k * Math.PI * 2 + z.sway) * Z_SWAY * k,
          y: lerp(Z_FROM[1], Z_TO[1], rise),
          size: lerp(Z_SIZE[0], Z_SIZE[1], rise),
          // Fade in quickly, hold, fade out over the last half.
          opacity: clamp01(k / 0.12) * (1 - clamp01((k - 0.5) / 0.5)),
        });
      }

      const breath = Math.sin(t * BREATH_HZ * Math.PI * 2);
      return {
        focus: { yaw: 0, pitch: DROOP, roll: TILT },
        blink: EYES * amount,
        breathe: { y: breath * BREATH_RISE * amount, scale: 1 + breath * BREATH_SWELL * amount },
        zs: out,
      };
    },
  };
}
