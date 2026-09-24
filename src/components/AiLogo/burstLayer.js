import { satellitePath } from './cubeGeometry';

/**
 * A one-shot "pop" for entering a state: the whole logo punches up in scale
 * and settles, while a handful of small cubes burst out of its centre in every
 * direction -- tumbling fast, shrinking and fading the farther they get -- and
 * are gone within about half a second.
 *
 * The debris lives in a NEUTRAL frame (the head's position, none of its
 * rotation), so the explosion does not swing round with wherever the head
 * happens to be looking. Directions are 3D and projected with the same
 * perspective as the head, so pieces flying toward the viewer grow as they
 * come.
 *
 * `AiLogo` draws the debris BEHIND the head and outside the goo filter: behind,
 * so white-on-white pieces appear to burst out of the silhouette; outside the
 * filter, because its alpha threshold would erase every fade.
 */

export const BURST_PIECES = 10;

const LIFE = [0.38, 0.62];     // seconds
const REACH = [1.5, 2.3];      // travel, in head half-edges
const SIZE = [0.12, 0.22];     // starting half-edge, in head half-edges
const SPIN = [9, 16];          // radians per second, per axis

const POP_KICK = 2.4;          // initial scale velocity; peak is roughly KICK / OMEGA
const POP_OMEGA = 15;
const POP_ZETA = 0.35;         // under-damped: a couple of quick wobbles

const rand = (a, b) => a + Math.random() * (b - a);
const easeOut = (k) => 1 - (1 - k) ** 3;

/** A direction spread around the screen, with a random lean toward or away from the viewer. */
function direction(i) {
  const a = (i / BURST_PIECES) * Math.PI * 2 + rand(-0.3, 0.3);
  const z = rand(-0.6, 0.6);
  const r = Math.sqrt(1 - z * z);
  return [Math.cos(a) * r, Math.sin(a) * r, z];
}

export function createBurst() {
  const pop = { x: 0, v: 0 };
  let pieces = [];
  let t = 0;

  return {
    /** Punch the scale without any debris; `strength` 1 is a full burst's pop. */
    kick(strength = 1) {
      pop.v += POP_KICK * strength;
    },

    /** Start a burst now. A new trigger replaces whatever debris is still flying. */
    trigger() {
      pop.v += POP_KICK;
      pieces = Array.from({ length: BURST_PIECES }, (_, i) => ({
        born: t,
        life: rand(...LIFE),
        dir: direction(i),
        reach: rand(...REACH),
        size: rand(...SIZE),
        spin: [rand(...SPIN), rand(...SPIN), rand(...SPIN)].map((s) => (Math.random() < 0.5 ? -s : s)),
        phase: rand(0, Math.PI * 2),
      }));
    },

    /**
     * Advance by `dt`. Returns `pop`, a scale multiplier for the whole logo,
     * and one `{ d, opacity }` per debris slot (empty `d` when unused).
     */
    step(dt, { x = 0, y = 0 } = {}) {
      t += dt;
      const a = -POP_OMEGA * POP_OMEGA * pop.x - 2 * POP_ZETA * POP_OMEGA * pop.v;
      pop.v += a * dt;
      pop.x += pop.v * dt;

      const frame = { x, y, scale: 1 };
      const out = [];
      for (let i = 0; i < BURST_PIECES; i++) {
        const p = pieces[i];
        const k = p ? (t - p.born) / p.life : 1;
        if (k >= 1) {
          out.push({ d: '', opacity: 0 });
          continue;
        }
        const dist = p.reach * easeOut(k);
        const age = t - p.born;
        const { d } = satellitePath(frame, {
          center: p.dir.map((v) => v * dist),
          size: p.size * (1 - k) ** 0.8,
          spin: { yaw: p.phase + p.spin[0] * age, pitch: p.spin[1] * age, roll: p.spin[2] * age },
        });
        out.push({ d, opacity: (1 - k) ** 1.3 });
      }
      return { pop: 1 + pop.x, pieces: out };
    },
  };
}
