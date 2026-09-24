/**
 * POKE: what the logo does when it is clicked while idle -- a startled shake,
 * eyes squeezed shut for a moment, and then (via `cursorAttention.poke`) a
 * long stare at whoever poked it.
 *
 * This layer is only the shake: offsets `AiLogo` adds straight onto the pose
 * (not through the gaze springs, which would smear a fast shake into a slow
 * sway), plus a blink floor.
 */

export const POKE_SHAKE = 0.55;   // seconds; the stare starts as the shake settles

const HZ = 8;                     // shakes per second
const YAW = 0.32;                 // radians, side to side
const SHIFT = 3;                  // viewBox units, side to side
const ROLL = 0.08;                // radians, a little wobble
const DECAY = 7;                  // how fast it dies down
const SQUEEZE = 0.22;             // seconds the eyes are squeezed shut

export function createPoke() {
  let t = Infinity;

  return {
    trigger() {
      t = 0;
    },

    /** Advance by `dt`. Returns { yaw, x, roll, blink } to add to the pose. */
    step(dt) {
      t += dt;
      if (t >= POKE_SHAKE) return { yaw: 0, x: 0, roll: 0, blink: 0 };
      const wave = Math.sin(t * HZ * Math.PI * 2) * Math.exp(-t * DECAY);
      // Fade the last stretch to exactly zero so it never ends on a snap.
      const tail = Math.min(1, (POKE_SHAKE - t) / 0.12);
      return {
        yaw: YAW * wave * tail,
        x: SHIFT * wave * tail,
        roll: ROLL * wave * tail,
        blink: t < SQUEEZE ? 0.8 : 0,
      };
    },
  };
}
