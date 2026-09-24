/**
 * The GREETING state, a one-shot: the logo pops into existence, grows a hand
 * out of its side -- one of the three cubes -- waves hello with it while
 * leaning the other way, then absorbs the hand and rests as idle.
 *
 * Timeline (seconds from the trigger):
 *
 *   0          head springs up from nothing, looking UP as it grows
 *   LOOK_DOWN  it brings its face down to look straight at you
 *   HAND_AT    the hand buds out of the head and rises to its place
 *   WAVE_AT    it waves, swinging around a pivot beside the head
 *   ABSORB_AT  it is pulled back in and melts into the head
 *   DONE_AT    settled; `AiLogo` reports `onFinished`
 *
 * The hand is opaque and drawn inside the goo, so it peels out of the head on
 * the way out and melts back into it on the way in. Positions are in the
 * neutral frame, in units of the head's half-edge, RELATIVE to the head's
 * centre -- `AiLogo` scales and places them.
 */

const LOOK_DOWN = [0.26, 0.62]; // start and end of bringing its face down to the viewer
const HAND_AT = 0.5;
const WAVE_AT = 0.88;
const ABSORB_AT = 2.2;
const ARRIVE_AT = 2.62;
const DONE_AT = 2.8;

const HAND_SIZE = 0.3;           // half-edge
const PIVOT = [1.2, -0.15, 0.2]; // the "elbow", beside the head on the viewer's right
const ARM = 0.62;                // pivot to hand centre
const RAISED = 1.2;              // radians from horizontal: the hand held up and out
const SWING = 0.42;              // radians either side of RAISED
const WAVE_HZ = 2.3;

const LEAN = 0.22;               // head roll, away from the hand
const SHIFT_X = -6;              // viewBox units; the head makes room for the hand
const SQUINT = 0.28;             // eyes narrowed into a smile while it waves
// How far it looks up while popping in. Applied straight to the pose, not
// through the gaze springs: those take longer to arrive than the pop-in lasts.
export const GREETING_LOOK_UP = 0.5;

const APPEAR_OMEGA = 11;
const APPEAR_ZETA = 0.42;        // under-damped: it overshoots a little as it pops in

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const smooth = (k) => k * k * (3 - 2 * k);
const easeOut = (k) => 1 - (1 - k) ** 3;
const easeIn = (k) => k * k * k;
const lerp = (a, b, k) => a + (b - a) * k;

/** Where the waving hand is at time `t` (relative to the head), and its tilt. */
function handAt(t, amplitude) {
  const angle = RAISED + Math.sin((t - WAVE_AT) * WAVE_HZ * Math.PI * 2) * SWING * amplitude;
  return {
    center: [PIVOT[0] + Math.cos(angle) * ARM, PIVOT[1] + Math.sin(angle) * ARM, PIVOT[2]],
    roll: angle - Math.PI / 2,
  };
}

export function createGreetingLayer() {
  const appear = { x: 1, v: 0 };
  let t = 0;
  let running = false;

  return {
    trigger() {
      t = 0;
      running = true;
      appear.x = 0;
      appear.v = 0;
    },

    /**
     * Advance by `dt`. While running, returns what `AiLogo` layers onto the
     * idle head: `scale` (the pop-in), `lookUp` (0..1, of GREETING_LOOK_UP),
     * `shiftX`, a `focus` with its `amount`, a `blink` floor, the `hand` if one
     * is out, `arrived` on the frame the hand lands back in the head, and
     * `done` on the frame it all ends.
     */
    step(dt) {
      // The pop-in spring runs even when idle so it always rests at exactly 1.
      const a = APPEAR_OMEGA * APPEAR_OMEGA * (1 - appear.x) - 2 * APPEAR_ZETA * APPEAR_OMEGA * appear.v;
      appear.v += a * dt;
      appear.x += appear.v * dt;
      if (!running) return { active: false, scale: 1 };

      const before = t;
      t += dt;

      // Leaning in and out, eased at both ends.
      const pose = smooth(clamp01((t - HAND_AT) / 0.35)) * (1 - smooth(clamp01((t - ABSORB_AT) / 0.4)));
      // Facing the viewer from the start (under the look-up) until the hand is gone.
      const facing = 1 - smooth(clamp01((t - ABSORB_AT) / 0.4));
      const lookUp = 1 - smooth(clamp01((t - LOOK_DOWN[0]) / (LOOK_DOWN[1] - LOOK_DOWN[0])));
      // Eyes open almost at once, so the upward look shows; a smiling squint while it waves.
      const blink = Math.max(1 - clamp01((t - 0.04) / 0.14), SQUINT * pose);

      let hand = null;
      if (t >= HAND_AT && t < ARRIVE_AT) {
        const amplitude = smooth(clamp01((t - WAVE_AT) / 0.25)) * (1 - smooth(clamp01((t - ABSORB_AT + 0.2) / 0.2)));
        const wave = handAt(Math.max(t, WAVE_AT), amplitude);
        let k = 1;
        let grow = 1;
        if (t < WAVE_AT) {
          k = easeOut((t - HAND_AT) / (WAVE_AT - HAND_AT));
          grow = k;
        } else if (t >= ABSORB_AT) {
          k = 1 - easeIn((t - ABSORB_AT) / (ARRIVE_AT - ABSORB_AT));
          grow = lerp(0.4, 1, k);
        }
        hand = {
          center: wave.center.map((v) => v * k),
          size: HAND_SIZE * grow,
          spin: { yaw: 0, pitch: 0, roll: wave.roll * k },
        };
      }

      const arrived = before < ARRIVE_AT && t >= ARRIVE_AT;
      const done = before < DONE_AT && t >= DONE_AT;
      if (done) running = false;

      return {
        active: true,
        scale: Math.max(0, appear.x),
        lookUp,
        shiftX: SHIFT_X * pose,
        focus: { yaw: 0, pitch: 0.05, roll: LEAN * pose },
        focusAmount: facing,
        blink,
        hand,
        arrived,
        done,
      };
    },
  };
}
