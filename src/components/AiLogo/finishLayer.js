/**
 * The FINISHED state, a one-shot: the three cubes shatter into shards that fly
 * apart, hang for a beat, and are then pulled back into the head and absorbed
 * one by one. `AiLogo` treats the state as idle the moment it starts (the head
 * grows back and goes on looking around), so when the last shard lands it is
 * simply idle again and reports it through `onFinished`.
 *
 * Shards are fully opaque and drawn INSIDE the goo filter: at the start they
 * peel apart out of one blob, and at the end each one melts into the head with
 * a neck instead of vanishing at its edge. `arrived` counts the shards that
 * landed this frame, so the head can give a little gulp for each.
 *
 * Positions are in the neutral frame, CUBE.half units -- the same space
 * `AiLogo` keeps the three cubes in, so a shard starts exactly where its cube
 * was.
 */

const PER_CUBE = 6;
const REACH = [0.55, 1.1];     // how far a shard flies out, from its cube
const OUT_TIME = [0.26, 0.4]; // seconds flying out
const HANG = [0.08, 0.36];     // seconds before it is pulled back; the spread staggers the gulps
const IN_TIME = [0.38, 0.55];  // seconds to be pulled into the head
const SHARD = [0.5, 0.72];    // of its cube's size
const MIN_SIZE = 0.11;         // so shards from a cube that was barely out still show
const SPIN = [8, 14];          // radians per second while flying out; slows on the way back

const rand = (a, b) => a + Math.random() * (b - a);
const easeOut = (k) => 1 - (1 - k) ** 3;
const easeIn = (k) => k * k * k;

function randomDirection() {
  const z = rand(-0.5, 0.5);
  const a = rand(0, Math.PI * 2);
  const r = Math.sqrt(1 - z * z);
  return [Math.cos(a) * r, Math.sin(a) * r, z];
}

export function createFinishLayer() {
  let shards = [];
  let running = false;

  return {
    /** @param {{ center: number[], size: number }[]} cubes where the three cubes are now */
    trigger(cubes) {
      shards = cubes.flatMap((cube) => Array.from({ length: PER_CUBE }, () => {
        const dir = randomDirection();
        const reach = rand(...REACH);
        const out = rand(...OUT_TIME);
        const hang = rand(...HANG);
        return {
          age: 0,
          from: cube.center,
          peak: cube.center.map((v, j) => v + dir[j] * reach),
          size: Math.max(MIN_SIZE, cube.size * rand(...SHARD)),
          out,
          pullAt: out + hang,
          end: out + hang + rand(...IN_TIME),
          spinRate: [rand(...SPIN), rand(...SPIN), rand(...SPIN)].map((s) => (Math.random() < 0.5 ? -s : s)),
          spin: { yaw: rand(0, 6), pitch: rand(0, 6), roll: rand(0, 6) },
          landed: false,
        };
      }));
      running = shards.length > 0;
    },

    /**
     * Advance by `dt` toward `headCenter`. Returns the shards still in flight
     * as `{ center, size, spin }`, how many `arrived` this frame, and `done`
     * on the one frame the last of them lands.
     */
    step(dt, headCenter) {
      if (!running) return { shards: [], arrived: 0, done: false };
      let arrived = 0;
      const live = [];
      for (const s of shards) {
        if (s.landed) continue;
        s.age += dt;
        if (s.age >= s.end) {
          s.landed = true;
          arrived++;
          continue;
        }
        let center;
        let size = s.size;
        let slow = 1;
        if (s.age < s.out) {
          center = s.from.map((v, j) => v + (s.peak[j] - v) * easeOut(s.age / s.out));
        } else if (s.age < s.pullAt) {
          center = s.peak;
        } else {
          const k = easeIn((s.age - s.pullAt) / (s.end - s.pullAt));
          center = s.peak.map((v, j) => v + (headCenter[j] - v) * k);
          size = s.size * (1 - 0.6 * k);
          slow = 0.35;
        }
        s.spin.yaw += s.spinRate[0] * slow * dt;
        s.spin.pitch += s.spinRate[1] * slow * dt;
        s.spin.roll += s.spinRate[2] * slow * dt;
        live.push({ center, size, spin: s.spin });
      }
      const done = live.length === 0;
      if (done) running = false;
      return { shards: live, arrived, done };
    },
  };
}
