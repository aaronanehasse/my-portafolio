/**
 * FOLLOW THE CURSOR: while the pointer moves near the logo, the head turns to
 * look at it -- eyes first, head after, like any other glance -- and when the
 * pointer goes still or leaves, it loses interest and goes back to looking
 * around on its own.
 *
 * It is not fixated, though. Interest comes and goes on its own: after a
 * while of looking around by itself (`BORED`) it MAY notice a moving pointer
 * (`NOTICE_CHANCE`; otherwise it stays bored for another spell), and
 * then commits -- it keeps watching for `INTERESTED` (10-30 s), even while the
 * pointer rests, before getting bored again. Both spans are random, so two
 * logos on a page never watch in lockstep.
 *
 * A change of animation state ends the interest at once: the new state gets
 * the logo's attention, and the pointer has to be noticed afresh.
 *
 * `poke()` skips the waiting: after a delay (so the poke's shake plays first)
 * it watches the pointer for a set time, even if following is switched off.
 *
 * This is a mode, not a state: it only produces a gaze `focus` and an `amount`
 * (0..1) for `AiLogo` to feed the idle motion. `AiLogo` lets states that hold
 * the head somewhere (typing, sleeping, greeting) win over it.
 *
 * ## The angle
 *
 * The logo is treated as looking out of the screen from `DEPTH` logo-widths
 * behind it, so the angle to the pointer is `atan(offset / depth)`: a pointer
 * right over the logo is looked at almost head-on, one far across the page
 * gets the full turn. Clamped to the same limits the idle look-around uses.
 */

const DEPTH = 1.6;            // in logo widths; lower turns harder for the same offset
const RANGE = 8;              // logo widths; farther than this, the pointer is ignored
const MIN_RANGE = 520;        // px, so a small logo still notices a pointer nearby
const ATTENTION_MS = 2500;    // a pointer counts as "moving" for this long after it moves
const MAX_YAW = 0.85;
const MAX_PITCH = 0.38;
const ON_OMEGA = 9;           // how quickly it takes notice
const OFF_OMEGA = 3;          // and how slowly it lets go
const INTERESTED = [10, 30];  // seconds it keeps watching once it has noticed the pointer
const BORED = [15, 45];       // seconds of looking around by itself before it might notice again
const NOTICE_CHANCE = 0.5;    // at the end of a bored spell; otherwise it stays bored for another

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const rand = (a, b) => a + Math.random() * (b - a);

/** @param {Element} el the element to measure from -- the logo's <svg> */
export function createCursorAttention(el) {
  const pointer = { x: 0, y: 0, at: -Infinity, inside: false };
  const amount = { x: 0, v: 0 };
  let focus = { yaw: 0, pitch: 0, roll: 0 };
  let t = 0;
  let interested = false;
  let switchAt = rand(2, BORED[0]); // the first chance to notice comes a little sooner
  let lastState;
  let forced = false;           // watching because it was poked, `followCursor` or not
  let poked = null;             // { at, seconds }: a stare waiting for its shake to finish

  const onMove = (e) => {
    pointer.x = e.clientX;
    pointer.y = e.clientY;
    pointer.at = performance.now();
    pointer.inside = true;
  };
  // `mouseout` with no related target is the pointer leaving the window.
  const onOut = (e) => { if (!e.relatedTarget) pointer.inside = false; };
  const onBlur = () => { pointer.inside = false; };

  window.addEventListener('pointermove', onMove, { passive: true });
  document.addEventListener('mouseout', onOut);
  window.addEventListener('blur', onBlur);

  return {
    /**
     * Advance by `dt`. `state` is the logo's animation state; a change to it
     * ends any interest. Returns where to look and how much (0 when disabled).
     */
    step(dt, enabled, state) {
      t += dt;
      const bored = () => {
        interested = false;
        forced = false;
        switchAt = t + rand(...BORED);
      };
      if (state !== lastState) {
        if (interested) bored();
        poked = null;
        lastState = state;
      }
      if (poked && t >= poked.at) {
        interested = true;
        forced = true;
        switchAt = t + poked.seconds;
        poked = null;
      }

      const present = (enabled || forced) && pointer.inside;
      const moving = present && performance.now() - pointer.at < ATTENTION_MS;
      if (interested) {
        // Committed: watch until the time is up, still or not -- unless it leaves.
        if (!present || t >= switchAt) bored();
      } else if (t >= switchAt && moving) {
        if (Math.random() < NOTICE_CHANCE) {
          interested = true;
          switchAt = t + rand(...INTERESTED);
        } else {
          bored();
        }
      }

      let want = 0;
      if (present && interested) {
        const rect = el.getBoundingClientRect();
        const dx = pointer.x - (rect.left + rect.width / 2);
        const dy = pointer.y - (rect.top + rect.height / 2);
        if (Math.hypot(dx, dy) < Math.max(MIN_RANGE, rect.width * RANGE)) {
          const depth = rect.width * DEPTH;
          focus = {
            yaw: clamp(Math.atan2(dx, depth), -MAX_YAW, MAX_YAW),
            pitch: clamp(Math.atan2(-dy, depth), -MAX_PITCH, MAX_PITCH),
            roll: 0,
          };
          want = 1;
        }
      }

      const omega = want > amount.x ? ON_OMEGA : OFF_OMEGA;
      const a = omega * omega * (want - amount.x) - 2 * omega * amount.v;
      amount.v += a * dt;
      amount.x = clamp(amount.x + amount.v * dt, 0, 1);
      if (amount.x === 0 || amount.x === 1) amount.v = 0;

      return { focus, amount: amount.x };
    },

    /** Stare at the pointer for `seconds`, starting `delay` seconds from now. */
    poke(delay, seconds) {
      poked = { at: t + delay, seconds };
    },

    dispose() {
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('mouseout', onOut);
      window.removeEventListener('blur', onBlur);
    },
  };
}
