import { useEffect, useId, useRef } from 'react';
import { CUBE, cubeParts, haloPath, headRotation, satellitePath } from './cubeGeometry';
import { createIdleMotion, prefersReducedMotion } from './idleMotion';
import { createThinkingLayer, THINKING_HEAD_SCALE, THINKING_PITCH_BIAS, THINKING_SPIN } from './thinkingLayer';
import { createTypingLayer, TYPING_HEAD_LIFT, TYPING_HEAD_SCALE, TYPING_SPIN } from './typingLayer';
import { createBurst, BURST_PIECES } from './burstLayer';
import { createFinishLayer } from './finishLayer';
import { createGreetingLayer, GREETING_LOOK_UP } from './greetingLayer';
import { createSleepLayer, SLEEP_Z_POOL, Z_PATH, Z_SHADOW_PATH } from './sleepLayer';
import { createCursorAttention } from './cursorAttention';
import { createPoke, POKE_SHAKE } from './pokeLayer';

/**
 * The AI logo, in whichever state it is asked for -- and every change between
 * states animated rather than cut.
 *
 * There is ONE head for the component's whole life. The idle behaviour
 * (`idleMotion.js`: looking around, bobbing, blinking) never stops or resets;
 * each other state has a weight that springs toward 1 when it is entered and
 * back to 0 when it is left, and everything -- head size, where it looks, where
 * the three cubes are -- is a blend by those weights. So a change of state
 * never makes anything jump.
 *
 * ## The three cubes
 *
 * Thinking and typing share the same three cubes. Each state's layer only says
 * where each cube wants to be (`thinkingLayer.js`: orbiting the head;
 * `typingLayer.js`: a waving row beneath it) and this component blends between
 * them, so going from one to the other flies the cubes across rather than
 * swapping them. Coming out of idle they bud out of the head one after
 * another; going back they sink in and are absorbed.
 *
 * Their tumble is integrated from a blended spin RATE rather than blended as
 * angles, so a transition never has to unwind whatever angle a cube has
 * reached.
 *
 * ## Rendering
 *
 * Everything white is drawn into one group behind a blur-then-threshold filter
 * ("goo"). Where two outlines come within a blur-width of each other their
 * blurs add up past the threshold, so they grow a rounded neck instead of
 * meeting at a hard seam. The filter would also soften the eyes, so they are
 * cut out AFTER it, by a mask. Fully idle, the filter is switched off -- it has
 * nothing to merge and costs a blur every frame.
 *
 * The threshold also makes fading impossible inside it (a fade just erodes the
 * shape), so a cube that needs opacity -- the typing wave -- is drawn in a
 * plain layer behind the head instead. The switch happens where a cube is
 * clear of the head and has nothing to merge with: halfway between thinking
 * and typing, and halfway through budding out of or sinking back into the
 * head. A cube being absorbed is always opaque, and so always in the goo, by
 * the time it arrives.
 *
 * Going from idle INTO thinking also fires a one-shot burst (`burstLayer.js`):
 * the whole logo pops in scale and a spray of small cubes explodes out of it.
 *
 * `finished` is a one-shot (`finishLayer.js`): the three cubes shatter and the
 * shards are absorbed back into the head. Internally it is idle from its first
 * frame -- the head grows back and carries on -- and `onFinished` fires when
 * the last shard lands, so the parent can set `state` back to `'idle'`.
 * Setting `finished` again after that plays it again.
 *
 * `greeting` is the other one-shot (`greetingLayer.js`): the logo pops into
 * existence, grows a hand out of its side, waves, absorbs the hand, and fires
 * `onFinished` the same way. Mounting straight into `greeting` plays it.
 *
 * `sleeping` (`sleepLayer.js`) droops and tilts the head, narrows the eyes to
 * slits, swaps the bob for slow breathing and floats Zs off its top-right.
 * The Zs fade, so they are drawn outside the goo, in front of everything.
 *
 * `followCursor` is a MODE, not a state (`cursorAttention.js`): now and then
 * the logo notices the moving pointer and watches it for 10-30 s before
 * getting bored; a change of state breaks it off. States that hold the head
 * somewhere -- typing, sleeping, greeting -- win over it; idle and thinking
 * follow.
 *
 * Clicking the logo while it is idle POKES it (`pokeLayer.js`): a startled
 * shake, then it stares at the pointer for `POKE_STARE` seconds -- whether or
 * not `followCursor` is on. A change of state breaks the stare off.
 *
 * To add a state: write its layer next to the others, add it to
 * `AI_LOGO_STATES` (`states.js`), and blend it in the frame loop below.
 * `/components` has a playground that picks the list up automatically.
 *
 * ## Two looks: `variant`
 *
 *   echo  solid white, the eyes cut out of it so the page shows through.
 *   eavy  a 2px gold OUTLINE of the same shapes, the eyes filled rather than
 *         cut, and a square halo floating over the head.
 *
 * Only the drawing differs - every animation, state and transition is the same
 * code. Eavy's outline is traced from the goo, not stroked per shape: the goo
 * filter gains an erode-and-subtract step that keeps just a rim of the merged
 * silhouette, so a cube melting into the head shows ONE continuous outline
 * rather than two strokes crossing. The goo is therefore always on for Eavy.
 * The pieces outside the goo (fading typing cubes, burst debris) carry both a
 * fill and a stroke, and fade between them.
 *
 * CHANGING look is a morph, not a cut. BOTH looks are drawn from the same
 * geometry every frame and a spring fades one into the other, so the head
 * keeps bobbing, the cubes keep orbiting and a half-finished greeting carries
 * on while the surface turns from solid white into a gold outline. Nothing
 * remounts: a switch mid-sentence is a change of clothes, not a new logo.
 *
 * With `prefers-reduced-motion` the head holds still and only blinks, the
 * orbit slows, and there is no burst.
 *
 * @param {'idle'|'thinking'|'typing'|'finished'|'greeting'|'sleeping'} [state]
 * @param {() => void} [onFinished]  called when a one-shot (`finished`, `greeting`) completes
 * @param {boolean} [followCursor]  look at the pointer while it moves nearby
 * @param {number} [size]       rendered px, width and height
 * @param {'echo'|'eavy'} [variant]  which look (see above); animations are identical
 * @param {string} [color]      echo: the fill, eyes always holes. eavy: the outline,
 *                              eyes and halo. Defaults to each variant's own.
 * @param {string} [className]
 * @param {string} [title]      accessible name; omit to mark it decorative
 */

const GOO_BLUR = 1.2;        // viewBox units; how far apart two shapes can be and still bridge
const EAVY_GOLD = '#f5c542';
const OUTLINE_PX = 2;        // Eavy's line, in screen pixels at any `size`
const BLEND_OMEGA = 5;       // how fast a state blends in or out (critically damped spring)
const LOOK_OMEGA = 3.4;      // and how fast one LOOK turns into the other
const CUBES = 3;
const STAGGER = 0.18;        // of the blend, between one cube budding out of the head and the next
const NEUTRAL = { x: 0, y: 0, scale: 1 };
const POKE_STARE = 20;       // seconds it watches the pointer after being poked

const lerp = (a, b, k) => a + (b - a) * k;

/** #rrggbb (or #rgb) to [r, g, b]. */
function readInk(hex) {
  const value = String(hex).replace('#', '');
  const full = value.length === 3 ? value.split('').map(c => c + c).join('') : value;
  const n = parseInt(full, 16);
  return Number.isNaN(n) ? [255, 255, 255] : [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** One ink turning into the other: for the parts that are a colour, not a shape. */
function mixInk(from, to, k) {
  if (k <= 0.001) return from;
  if (k >= 0.999) return to;
  const a = readInk(from);
  const b = readInk(to);
  const channel = i => Math.round(lerp(a[i], b[i], k));
  return `rgb(${channel(0)}, ${channel(1)}, ${channel(2)})`;
}
const lerp3 = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
const smooth = (k) => k * k * (3 - 2 * k);
const clamp01 = (v) => Math.min(1, Math.max(0, v));

/** Critically damped spring toward `target`, clamped to 0..1. */
function blendStep(s, target, dt, omega = BLEND_OMEGA) {
  const a = omega * omega * (target - s.x) - 2 * omega * s.v;
  s.v += a * dt;
  s.x += s.v * dt;
  if (s.x <= 0 || s.x >= 1) {
    s.x = clamp01(s.x);
    s.v = 0;
  }
  return s.x;
}

export default function AiLogo({
  state = 'idle', onFinished, followCursor = false, variant = 'echo', size = 96, color, className, title,
}) {
  const outline = variant === 'eavy';
  const solidInk = color || '#fff';
  const lineInk = color || EAVY_GOLD;
  // The erode radius is in viewBox units, so a fixed on-screen line width
  // needs converting at this size.
  const lineUnits = (OUTLINE_PX * 100) / size;
  const svgRef = useRef(null);
  // One set of elements per look; the frame loop writes the same geometry to
  // both and fades between them.
  const haloRef = useRef(null);
  const outGroupRef = useRef(null);
  const outBodyRef = useRef(null);
  const outSatsRef = useRef(null);
  const outEyesRef = useRef(null);
  const zGroupRef = useRef(null);
  const groupRef = useRef(null);
  const bodyRef = useRef(null);
  const satsRef = useRef(null);
  const eyesRef = useRef(null);
  const plainRefs = useRef([]);
  const debrisRefs = useRef([]);
  const zRefs = useRef([]);
  const stateRef = useRef(state);
  stateRef.current = state;
  const onFinishedRef = useRef(onFinished);
  onFinishedRef.current = onFinished;
  // Set by a click, consumed by the next frame, which owns all the animation state.
  const pokeRef = useRef(false);
  const followRef = useRef(followCursor);
  followRef.current = followCursor;
  const outlineRef = useRef(outline);
  outlineRef.current = outline;
  const plainStyleRef = useRef(null);

  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const gooId = `ai-goo-${id}`;
  const maskId = `ai-eyes-${id}`;
  const rimId = `ai-rim-${id}`;

  useEffect(() => {
    const group = groupRef.current, body = bodyRef.current, sats = satsRef.current, eyes = eyesRef.current;
    if (!group || !body || !sats || !eyes) return undefined;
    const plain = plainRefs.current;
    const debris = debrisRefs.current;

    // 0 = Echo's solid white, 1 = Eavy's gold outline. It starts where it is
    // asked to be, so a logo mounted as Eavy is Eavy - only a CHANGE morphs.
    const look = { x: outlineRef.current ? 1 : 0, v: 0 };

    const reduced = prefersReducedMotion();
    const motion = createIdleMotion({ still: reduced });
    const thinking = createThinkingLayer({ slow: reduced });
    const typing = createTypingLayer();
    const burst = createBurst();
    const finish = createFinishLayer();
    const greeting = createGreetingLayer();
    const sleep = createSleepLayer();
    const cursor = createCursorAttention(svgRef.current);
    const poke = createPoke();
    const zEls = zRefs.current;
    // Where the three cubes are, kept so `finished` can shatter them from there.
    let lastCubes = [];
    // Set while finishing: the three cubes are shards now, so none are drawn
    // even as the thinking/typing weights spring back down.
    let cubesGone = false;

    // Start already in the requested state, rather than blending into it on mount.
    const weights = {
      thinking: { x: stateRef.current === 'thinking' ? 1 : 0, v: 0 },
      typing: { x: stateRef.current === 'typing' ? 1 : 0, v: 0 },
      sleeping: { x: stateRef.current === 'sleeping' ? 1 : 0, v: 0 },
    };
    const spins = Array.from({ length: CUBES }, (_, i) => ({ yaw: i * 0.7, pitch: i * 1.3, roll: 0 }));
    // A mount straight into `greeting` should play it, so it must look like a change.
    let prevState = stateRef.current === 'greeting' ? null : stateRef.current;
    let gooOn = null;
    let raf = 0;
    let last = performance.now();

    const frame = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      const current = stateRef.current;
      if (pokeRef.current) {
        pokeRef.current = false;
        if (current === 'idle') {
          poke.trigger();
          burst.kick(0.35);
          cursor.poke(POKE_SHAKE * 0.7, POKE_STARE);
        }
      }
      const wasResting = prevState === 'idle' || prevState === 'finished' || prevState === 'greeting';
      if (current === 'greeting' && prevState !== 'greeting') greeting.trigger();
      if (current === 'thinking' && wasResting && !reduced) burst.trigger();
      if (current === 'finished' && prevState !== 'finished') {
        finish.trigger(lastCubes);
        cubesGone = true;
        burst.kick(0.5);
      }
      if (current === 'thinking' || current === 'typing') cubesGone = false;
      prevState = current;

      const wThink = blendStep(weights.thinking, current === 'thinking' ? 1 : 0, dt);
      const wType = blendStep(weights.typing, current === 'typing' ? 1 : 0, dt);
      const wSleep = blendStep(weights.sleeping, current === 'sleeping' ? 1 : 0, dt);
      const active = Math.min(1, wThink + wType);
      // Between thinking (0) and typing (1); only meaningful while `active` > 0.
      const mix = wThink + wType > 1e-4 ? wType / (wThink + wType) : current === 'typing' ? 1 : 0;
      const mixS = smooth(mix);

      const typed = typing.step(dt);
      const greet = greeting.step(dt);
      const slept = sleep.step(dt, wSleep);
      const greetLooks = greet.active && greet.focusAmount > 0;
      // Typing and sleeping both hold the head somewhere; mid-way between them,
      // aim between the two.
      const held = wType + wSleep;
      const heldFocus = held > 1e-4
        ? {
          yaw: (typed.focus.yaw * wType + slept.focus.yaw * wSleep) / held,
          pitch: (typed.focus.pitch * wType + slept.focus.pitch * wSleep) / held,
          roll: (typed.focus.roll * wType + slept.focus.roll * wSleep) / held,
        }
        : typed.focus;
      // The cursor gets whatever attention the held states leave free.
      const watched = cursor.step(dt, followRef.current, current);
      const holdAmount = Math.min(1, held);
      const cursorAmount = greetLooks ? 0 : watched.amount * (1 - holdAmount);
      const freeFocus = cursorAmount + holdAmount > 1e-4
        ? {
          yaw: (heldFocus.yaw * holdAmount + watched.focus.yaw * cursorAmount) / (holdAmount + cursorAmount),
          pitch: (heldFocus.pitch * holdAmount + watched.focus.pitch * cursorAmount) / (holdAmount + cursorAmount),
          roll: (heldFocus.roll * holdAmount + watched.focus.roll * cursorAmount) / (holdAmount + cursorAmount),
        }
        : heldFocus;
      const pose = motion.step(dt, {
        pitchBias: THINKING_PITCH_BIAS * wThink,
        focus: greetLooks ? greet.focus : freeFocus,
        focusAmount: greetLooks ? greet.focusAmount : holdAmount + cursorAmount,
      });
      pose.blink = Math.max(pose.blink, slept.blink);
      // The poke's shake goes straight onto the pose: through the gaze springs a
      // fast shake would smear into a slow sway.
      const shake = poke.step(dt);
      pose.yaw = (pose.yaw ?? 0) + shake.yaw;
      pose.roll = (pose.roll ?? 0) + shake.roll;
      pose.x = (pose.x ?? 0) + shake.x;
      pose.blink = Math.max(pose.blink, shake.blink);
      if (greet.active) {
        pose.blink = Math.max(pose.blink, greet.blink);
        pose.pitch = (pose.pitch ?? 0) + GREETING_LOOK_UP * greet.lookUp;
        pose.eyeY = lerp(pose.eyeY ?? 0, 1, greet.lookUp);
      }
      const { pop, pieces } = burst.step(dt, pose);
      const scale = ((1 - active) + THINKING_HEAD_SCALE * wThink + TYPING_HEAD_SCALE * wType)
        * pop * greet.scale * slept.breathe.scale;
      const head = {
        ...pose,
        x: (pose.x ?? 0) + (greet.shiftX ?? 0),
        // Asleep, the lively bob gives way to slow breathing.
        y: (pose.y ?? 0) * (1 - 0.85 * wSleep) + slept.breathe.y + TYPING_HEAD_LIFT * wType,
        scale,
      };
      const parts = cubeParts(head);

      // ── The three cubes ──
      const orbit = thinking.step(dt);
      const rotate = headRotation(head);
      const headCenter = [head.x / CUBE.half, head.y / CUBE.half, 0];
      const span = 1 - STAGGER * (CUBES - 1);
      let gooD = '';
      const cubesNow = [];
      for (let i = 0; i < CUBES; i++) {
        const rate = lerp3(THINKING_SPIN, TYPING_SPIN, mixS);
        const spin = spins[i];
        spin.yaw += rate[0] * dt;
        spin.pitch += rate[1] * dt;
        spin.roll += rate[2] * dt;

        const grown = smooth(clamp01((active - i * STAGGER) / span));
        const el = plain[i];

        // Thinking target: the orbit, carried from the head's frame into the neutral one.
        const local = orbit[i].center.map((v) => v * scale);
        const r = rotate(local);
        const thinkCenter = [r[0] + headCenter[0], r[1] + headCenter[1], r[2]];
        const thinkSize = orbit[i].size * scale;

        const row = typed.cubes[i];
        const target = lerp3(thinkCenter, row.center, mixS);
        // Budding: rises out from inside the head as it grows.
        const center = lerp3(headCenter, target, 0.3 + 0.7 * grown);
        const cubeSize = lerp(thinkSize, row.size, mixS) * grown;
        cubesNow.push({ center, size: cubeSize });
        if (grown < 0.02 || cubesGone) {
          el?.setAttribute('d', '');
          continue;
        }
        const { d } = satellitePath(NEUTRAL, { center, size: cubeSize, spin });

        // Only a cube that is fully out may fade. One budding out or sinking back
        // in (grown < 1) firms up to opaque by the time it reaches the head, so
        // it is back inside the goo and MELTS in -- otherwise it would slide in
        // behind the head, unmerged, and show through the eye holes.
        const fade = clamp01((mix - 0.5) * 2) * smooth(clamp01((grown - 0.5) / 0.5));
        const opacity = lerp(1, row.opacity, fade);
        if (opacity >= 1) {
          gooD += d;
          el?.setAttribute('d', '');
        } else if (el) {
          el.setAttribute('d', d);
          el.setAttribute('opacity', opacity.toFixed(3));
        }
      }

      if (!cubesGone) lastCubes = cubesNow;

      // ── Finished: shards flying out and being absorbed ──
      const fin = finish.step(dt, headCenter);
      for (const shard of fin.shards) gooD += satellitePath(NEUTRAL, shard).d;
      if (fin.arrived) burst.kick(0.09 * fin.arrived);
      if (fin.done) {
        cubesGone = false;
        onFinishedRef.current?.();
      }

      // ── Greeting: the waving hand ──
      if (greet.hand) {
        const { center, size: handSize, spin } = greet.hand;
        gooD += satellitePath(NEUTRAL, {
          center: center.map((v, j) => headCenter[j] + v * scale),
          size: handSize * scale,
          spin,
        }).d;
      }
      if (greet.arrived) burst.kick(0.3);
      if (greet.done) onFinishedRef.current?.();

      // ── the two looks ──
      const shown = blendStep(look, outlineRef.current ? 1 : 0, dt, LOOK_OMEGA);
      const solid = 1 - shown;

      const wantGoo = shown > 0.001 || active > 0.001 || fin.shards.length > 0 || !!greet.hand;
      if (wantGoo !== gooOn) {
        gooOn = wantGoo;
        if (wantGoo) group.setAttribute('filter', `url(#${gooId})`);
        else group.removeAttribute('filter');
      }

      group.setAttribute('opacity', solid.toFixed(3));
      outGroupRef.current?.setAttribute('opacity', shown.toFixed(3));
      outEyesRef.current?.setAttribute('opacity', shown.toFixed(3));
      haloRef.current?.setAttribute('opacity', shown.toFixed(3));
      // The loose pieces are one element wearing both: a fill that fades out as
      // a stroke fades in.
      plainStyleRef.current?.setAttribute('fill-opacity', solid.toFixed(3));
      plainStyleRef.current?.setAttribute('stroke-opacity', shown.toFixed(3));
      zGroupRef.current?.setAttribute('fill', mixInk(solidInk, lineInk, shown));

      if (solid > 0.001) {
        body.setAttribute('d', parts.body);
        sats.setAttribute('d', gooD);
        eyes.setAttribute('d', parts.eyes);
      }
      if (shown > 0.001) {
        outBodyRef.current?.setAttribute('d', parts.body);
        outSatsRef.current?.setAttribute('d', gooD);
        outEyesRef.current?.setAttribute('d', parts.eyes);
        haloRef.current?.setAttribute('d', haloPath(head));
      }
      for (let i = 0; i < SLEEP_Z_POOL; i++) {
        const el = zEls[i];
        if (!el) continue;
        const z = slept.zs[i];
        if (!z) {
          el.setAttribute('opacity', '0');
          continue;
        }
        const zx = head.x + z.x * scale;
        const zy = -head.y + z.y * scale;
        el.setAttribute('transform', `translate(${zx.toFixed(2)} ${zy.toFixed(2)}) scale(${(z.size * scale).toFixed(3)})`);
        el.setAttribute('opacity', z.opacity.toFixed(3));
      }
      pieces.forEach((piece, i) => {
        const el = debris[i];
        if (!el) return;
        el.setAttribute('d', piece.d);
        el.setAttribute('opacity', piece.opacity.toFixed(3));
      });
      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      cursor.dispose();
    };
    // Not `outline`: a change of look is morphed inside the loop (read through
    // `outlineRef`), never by rebinding - that would restart the animation.
  }, [gooId, lineInk, solidInk]);

  return (
    <svg
      ref={svgRef}
      className={['ai-logo', `ai-logo--${state}`, className].filter(Boolean).join(' ')}
      width={size}
      height={size}
      viewBox="-50 -50 100 100"
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      style={{ overflow: 'visible', display: 'block', cursor: state === 'idle' ? 'pointer' : undefined }}
      onClick={() => { pokeRef.current = true; }}
    >
      <defs>
        <filter
          id={gooId}
          filterUnits="userSpaceOnUse"
          x="-70" y="-70" width="140" height="140"
          colorInterpolationFilters="sRGB"
        >
          <feGaussianBlur in="SourceGraphic" stdDeviation={GOO_BLUR} result="blur" />
          <feColorMatrix
            in="blur"
            mode="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -9.5"
            result="goo"
          />
        </filter>
        {/* The same goo, kept as a rim: the shape, minus the shape shrunk by
            the line width. Eavy's look is this filter, not a stroke per shape. */}
        <filter
          id={rimId}
          filterUnits="userSpaceOnUse"
          x="-70" y="-70" width="140" height="140"
          colorInterpolationFilters="sRGB"
        >
          <feGaussianBlur in="SourceGraphic" stdDeviation={GOO_BLUR} result="blur" />
          <feColorMatrix
            in="blur"
            mode="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -9.5"
            result="goo"
          />
          <feMorphology in="goo" operator="erode" radius={lineUnits} result="inner" />
          <feComposite in="goo" in2="inner" operator="out" />
        </filter>
        <mask id={maskId} maskUnits="userSpaceOnUse" x="-70" y="-70" width="140" height="140">
          <rect x="-70" y="-70" width="140" height="140" fill="#fff" />
          <path ref={eyesRef} fill="#000" />
        </mask>
      </defs>
      {/* Behind the head, outside the goo so each piece can fade: burst debris
          and fading cubes. They wear both inks at once - the fill fades out as
          the stroke fades in, which is the morph for the loose pieces. */}
      <g
        ref={plainStyleRef}
        fill={solidInk}
        stroke={lineInk}
        strokeWidth={OUTLINE_PX}
        strokeLinejoin="round"
        fillOpacity={outline ? 0 : 1}
        strokeOpacity={outline ? 1 : 0}
      >
        {Array.from({ length: BURST_PIECES }, (_, i) => (
          <path key={`d${i}`} ref={(el) => { debrisRefs.current[i] = el; }} vectorEffect="non-scaling-stroke" />
        ))}
        {Array.from({ length: CUBES }, (_, i) => (
          <path key={`c${i}`} ref={(el) => { plainRefs.current[i] = el; }} vectorEffect="non-scaling-stroke" />
        ))}
      </g>

      {/* Echo: solid, with the eyes cut out of it. */}
      <g mask={`url(#${maskId})`}>
        <g ref={groupRef} fill={solidInk} opacity={outline ? 0 : 1}>
          <path ref={bodyRef} />
          <path ref={satsRef} />
        </g>
      </g>

      {/* Eavy: the same shapes as a rim, its eyes filled rather than cut, and
          the halo. Drawn from the same geometry, so the two can cross-fade. */}
      <g ref={outGroupRef} fill={lineInk} filter={`url(#${rimId})`} opacity={outline ? 1 : 0}>
        <path ref={outBodyRef} />
        <path ref={outSatsRef} />
      </g>
      <path ref={outEyesRef} fill={lineInk} opacity={outline ? 1 : 0} />
      <path
        ref={haloRef}
        fill="none"
        stroke={lineInk}
        strokeWidth={OUTLINE_PX}
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        opacity={outline ? 1 : 0}
      />
      {/* Sleep Zs: pixel glyphs with the Minecraft font's drop shadow. In front,
          and faded, so outside both the goo and the eye mask. */}
      <g shapeRendering="crispEdges" ref={zGroupRef} fill={outline ? lineInk : solidInk}>
        {Array.from({ length: SLEEP_Z_POOL }, (_, i) => (
          <g key={i} ref={(el) => { zRefs.current[i] = el; }} opacity={0}>
            <path d={Z_SHADOW_PATH} fill="#000" fillOpacity={0.25} />
            <path d={Z_PATH} />
          </g>
        ))}
      </g>
    </svg>
  );
}
