/**
 * The TYPING state: the three cubes line up in a row beneath the head and run
 * a wave through it -- each one rising, growing and brightening in turn, like
 * a chat app's typing dots -- while the head looks down in front of itself at
 * what it is writing, glancing from side to side.
 *
 * Like the thinking layer this only says where things want to be; `AiLogo`
 * blends it with the other states and draws it. The row sits in a NEUTRAL
 * frame (the logo's, not the head's) so it stays level while the head bobs
 * and glances above it, and it fades, so it is drawn outside the goo filter.
 */

export const TYPING_HEAD_SCALE = 0.74;
export const TYPING_HEAD_LIFT = 7;          // viewBox units; the head rises to make room below
// Each cube's slow turn while it waits in the row, radians per second.
export const TYPING_SPIN = [0.7, 0, 0];

const ROW_Y = -1.28;         // in head-sized units (CUBE.half), below the centre
const ROW_Z = 0.3;           // a little in front, so the row reads as under the chin
const GAP = 0.62;            // between cube centres
const SIZE = 0.17;           // half-edge
const WAVE_SPEED = 7;        // radians per second
const WAVE_LAG = 0.9;        // radians between one cube and the next
const RISE = 0.2;            // how far a cube rises at the crest
const SIZE_SWING = [0.75, 1.15];   // size multiplier, trough to crest
const OPACITY_SWING = [0.35, 0.98]; // below 1, so it never flips back into the goo layer

const FOCUS_PITCH = -0.3;    // looks down in front
const GLANCE_YAW = 0.2;      // how far it glances either side
const GLANCE_HOLD = [0.55, 1.1];

const rand = (a, b) => a + Math.random() * (b - a);
const lerp = (a, b, k) => a + (b - a) * k;

export function createTypingLayer() {
  let t = 0;
  let side = Math.random() < 0.5 ? -1 : 1;
  let nextGlance = rand(...GLANCE_HOLD);

  return {
    /**
     * Advance by `dt`. Returns `focus`, where the head should look, and per
     * cube `{ center, size, opacity }` in the neutral frame, in CUBE.half units.
     */
    step(dt) {
      t += dt;
      if (t >= nextGlance) {
        side = -side;
        nextGlance = t + rand(...GLANCE_HOLD);
      }

      const cubes = [0, 1, 2].map((i) => {
        // 0 at the trough, 1 at the crest; the wave travels left to right.
        const w = 0.5 + 0.5 * Math.sin(t * WAVE_SPEED - i * WAVE_LAG);
        return {
          center: [(i - 1) * GAP, ROW_Y + RISE * w, ROW_Z],
          size: SIZE * lerp(...SIZE_SWING, w),
          opacity: lerp(...OPACITY_SWING, w),
        };
      });

      return { focus: { yaw: side * GLANCE_YAW, pitch: FOCUS_PITCH, roll: 0 }, cubes };
    },
  };
}
