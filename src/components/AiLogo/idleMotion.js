/**
 * The "alive" behaviour every AI logo animation shares: it bobs, looks around,
 * tilts its head at things, comes back to face you, and blinks. Call `step(dt)`
 * once a frame and draw the pose it returns.
 *
 * ## How it moves
 *
 * A "gaze" picks a target every second or two: somewhere off to the side, a
 * curious head-tilt, or straight back at the viewer. Two springs chase it:
 *
 *  - the EYES, stiff and fast, so they dart to the target first, the way a
 *    creature glances before it turns;
 *  - the HEAD, softer and a little under-damped, so it follows and overshoots
 *    just slightly before settling.
 *
 * The body leans into a turn (roll from yaw velocity) and bobs on a slow sine,
 * which together read as floating rather than rotating on a spindle.
 *
 * With `still` (for `prefers-reduced-motion`) it holds still facing forward and
 * only blinks.
 *
 * @param {object} [opts]
 * @param {boolean} [opts.still]      blink only
 * @param {number}  [opts.pitchBias]  radians added to every look; positive
 *        looks up more, as something does while it is thinking. `step()` can
 *        override it per frame, so a state change can ease it in.
 *
 * `step()` also takes a FOCUS: a { yaw, pitch, roll } the head is pulled
 * toward by `focusAmount` (0..1), overriding wherever it would otherwise be
 * looking. A state that needs the head somewhere specific -- typing looks down
 * at what it is writing -- sets it, and blending the amount makes the head
 * drift there instead of snapping. Blinking and bobbing carry on regardless.
 */

const MAX_YAW = 0.85;    // radians either side
const MAX_PITCH = 0.38;
const MAX_ROLL = 0.22;

const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

/** One step of a damped spring; mutates `s` = { v, x }. */
function spring(s, target, omega, zeta, dt) {
  const a = omega * omega * (target - s.x) - 2 * zeta * omega * s.v;
  s.v += a * dt;
  s.x += s.v * dt;
}

function pickGaze(prev) {
  const r = Math.random();
  // Coming back to the viewer is the most common single move, and it lingers.
  if (r < 0.32 && prev.kind !== 'forward') {
    return { kind: 'forward', yaw: 0, pitch: 0, roll: 0, hold: rand(1.6, 3.4) };
  }
  // A curious head-tilt, mostly in place.
  if (r < 0.5) {
    return {
      kind: 'tilt',
      yaw: rand(-0.25, 0.25),
      pitch: rand(0, 0.15),
      roll: (Math.random() < 0.5 ? -1 : 1) * rand(0.12, MAX_ROLL),
      hold: rand(0.9, 1.8),
    };
  }
  // A look off somewhere; favour the opposite side from last time.
  const side = prev.yaw > 0.1 ? -1 : prev.yaw < -0.1 ? 1 : Math.random() < 0.5 ? -1 : 1;
  return {
    kind: 'look',
    yaw: side * rand(0.3, MAX_YAW),
    pitch: rand(-MAX_PITCH * 0.7, MAX_PITCH),
    roll: rand(-0.06, 0.06),
    hold: Math.random() < 0.3 ? rand(0.35, 0.7) : rand(0.9, 2.2), // quick glance or a stare
  };
}

export function createIdleMotion({ still = false, pitchBias = 0 } = {}) {
  const head = { yaw: { x: 0, v: 0 }, pitch: { x: 0, v: 0 }, roll: { x: 0, v: 0 } };
  const eyes = { x: { x: 0, v: 0 }, y: { x: 0, v: 0 } };
  let gaze = { kind: 'forward', yaw: 0, pitch: 0, roll: 0, hold: rand(0.8, 1.6) };
  let gazeAt = 0;
  let nextBlink = rand(1.2, 3);
  let blinkStart = -1;
  let doubleBlink = false;
  const phase = Math.random() * 10;
  let t = 0;

  const blinkAmount = () => {
    if (blinkStart < 0) return 0;
    const BLINK = 0.16;
    const k = (t - blinkStart) / BLINK;
    if (k >= 1) {
      blinkStart = -1;
      if (doubleBlink) {
        doubleBlink = false;
        nextBlink = t + 0.12;
      } else {
        nextBlink = t + rand(2, 5.5);
      }
      return 0;
    }
    return Math.sin(Math.PI * k) ** 0.6; // snaps shut, holds a beat, opens
  };

  return {
    /** Advance by `dt` seconds and return the pose to draw. */
    step(dt, { pitchBias: bias = pitchBias, focus = null, focusAmount = 0 } = {}) {
      t += dt;

      if (t >= nextBlink && blinkStart < 0) {
        blinkStart = t;
        doubleBlink = Math.random() < 0.2 && !doubleBlink;
      }
      const blink = blinkAmount();
      if (still) return { blink };

      if (t - gazeAt > gaze.hold) {
        gaze = pickGaze(gaze);
        gazeAt = t;
        // A big turn often comes with a blink, like it re-focuses.
        if (gaze.kind === 'look' && Math.random() < 0.3 && blinkStart < 0) nextBlink = t + 0.05;
      }
      const f = focus ? clamp(focusAmount, 0, 1) : 0;
      const yawTarget = gaze.yaw + ((focus?.yaw ?? 0) - gaze.yaw) * f;
      const free = clamp(gaze.pitch + bias, -MAX_PITCH, MAX_PITCH);
      const pitchTarget = free + ((focus?.pitch ?? 0) - free) * f;
      const rollTarget = gaze.roll + ((focus?.roll ?? 0) - gaze.roll) * f;

      // Eyes lead, head follows.
      spring(eyes.x, yawTarget / MAX_YAW, 26, 0.85, dt);
      spring(eyes.y, pitchTarget / MAX_PITCH, 26, 0.85, dt);
      spring(head.yaw, yawTarget, 6.5, 0.55, dt);
      spring(head.pitch, pitchTarget, 6.5, 0.6, dt);
      spring(head.roll, rollTarget, 5, 0.5, dt);

      // Lean into the turn, and drift a little even when still.
      const lean = clamp(-head.yaw.v * 0.07, -0.14, 0.14);
      const sway = Math.sin((t + phase) * 1.3) * 0.03;
      const bob = Math.sin((t + phase) * 2.1) * 2.4 + Math.sin((t + phase) * 3.7) * 0.5;

      return {
        yaw: head.yaw.x,
        pitch: head.pitch.x + Math.sin((t + phase) * 2.1 - 0.8) * 0.03, // nods with the bob
        roll: head.roll.x + lean + sway,
        y: bob,
        eyeX: clamp(eyes.x.x, -1, 1),
        eyeY: clamp(eyes.y.x, -1, 1),
        blink,
      };
    },
  };
}

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
