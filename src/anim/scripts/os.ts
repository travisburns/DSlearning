import type { AnimScript } from '../engine';
import { Stage } from '../engine';
import { distinctInts, randInt, shuffle } from '../../engine/random';
import { H, STEP, W, onSlot, slotRow } from '../kit';

// =====================================================================
// Processes & threads
// =====================================================================

const processesThreads: AnimScript = () => {
  const s = new Stage();
  const [a, b] = distinctInts(2, 10, 99);
  s.box('pA', { x: 0, y: 0, w: 300, h: 210, shape: 'frame', label: 'Process A (its own memory)' });
  s.box('heapA', { x: 20, y: 20, w: 260, h: 60, shape: 'frame', label: 'heap (shared by A’s threads)', tone: 'accent' });
  s.box('xA', { x: 120, y: 30, w: 60, h: H, label: `x=${a}`, tone: 'plain', mono: true });
  s.box('st1', { x: 20, y: 120, w: 110, h: 70, shape: 'frame', label: 'thread 1 stack' });
  s.box('loc1', { x: 35, y: 135, w: 80, h: 34, label: 'main()', mono: false });
  s.say(`A process is a running program with its own private memory. It starts with one thread. The heap holds shared data, like x = ${a}.`);
  s.box('st2', { x: 170, y: 120, w: 110, h: 70, shape: 'frame', label: 'thread 2 stack', tone: 'ok' });
  s.box('loc2', { x: 185, y: 135, w: 80, h: 34, label: 'download()', mono: false, tone: 'ok' });
  s.say('The program starts a second thread. It gets its own stack (its own function calls and local variables) but lives in the same process.');
  s.arrow('r1', 'loc1', 'xA', { tone: 'ptr' });
  s.arrow('r2', 'loc2', 'xA', { tone: 'ptr' });
  s.say('Both threads point at the same heap: they read and write the very same x.');
  s.box('pB', { x: 340, y: 0, w: 220, h: 210, shape: 'frame', label: 'Process B (separate memory)' });
  s.box('heapB', { x: 360, y: 20, w: 180, h: 60, shape: 'frame', label: 'B’s own heap' });
  s.box('xB', { x: 420, y: 30, w: 60, h: H, label: `x=${a}`, mono: true });
  s.box('st3', { x: 380, y: 120, w: 140, h: 70, shape: 'frame', label: 'B’s thread stack' });
  s.say(`A second process is launched from the same program. It gets a completely separate copy of memory, including its own x = ${a}.`);
  s.set('xA', { label: `x=${b}`, tone: 'hl' });
  s.tone('loc2', 'hl');
  s.say(`Thread 2 sets x = ${b}. Thread 1 sees ${b} immediately: same heap. Process B still sees ${a}: its memory is untouched.`);
  s.tone('xA', 'plain');
  s.tone('loc2', 'ok');
  s.box('cpu', { x: 160, y: 250, w: 100, h: H, label: 'CPU core', tone: 'warn', mono: false });
  s.arrow('run', 'cpu', 'loc1', { tone: 'warn' });
  s.say('One CPU core runs one thread at a time. Right now it runs thread 1…');
  s.arrow('run', 'cpu', 'loc2', { tone: 'warn' });
  s.say('…a timer fires, the OS saves thread 1’s registers and loads thread 2’s: a context switch. Done thousands of times a second, it looks like everything runs at once.');
  return s.build('Processes and threads');
};

// =====================================================================
// CPU scheduling (round robin)
// =====================================================================

const scheduling: AnimScript = () => {
  const s = new Stage();
  const names = ['A', 'B', 'C', 'D'].slice(0, randInt(3, 4));
  const need = new Map(names.map((n) => [n, randInt(2, 6)]));
  const q = 2;
  const queue = [...names];
  const qx = 0;
  const qy = 100;
  s.box('qf', { x: qx - 8, y: qy - 8, w: 4 * STEP + 70, h: H + 16, shape: 'frame', label: 'ready queue (front on the left)' });
  s.box('cpu', { x: 4 * STEP + 120, y: qy - 6, w: 110, h: H + 12, shape: 'frame', label: 'CPU', tone: 'warn' });
  const draw = () => queue.forEach((n, i) => s.box(`j${n}`, { x: qx + i * (STEP + 10), y: qy, w: W + 10, h: H, label: `${n}:${need.get(n)}`, tone: 'plain', mono: true }));
  draw();
  let clock = 0;
  s.text('clock', 0, 30, 'time 0 ms', { bold: true, size: 'lg' });
  s.say(`Round robin with a ${q} ms time slice. Each job shows how many ms of work it still needs: ${names.map((n) => `${n} needs ${need.get(n)}`).join(', ')}.`);
  const done: string[] = [];
  let slices = 0;
  while (queue.length) {
    const n = queue.shift()!;
    draw();
    s.box(`j${n}`, { x: 4 * STEP + 140, y: qy, w: W + 10, h: H, label: `${n}:${need.get(n)}`, tone: 'hl', mono: true });
    const run = Math.min(q, need.get(n)!);
    clock += run;
    need.set(n, need.get(n)! - run);
    slices++;
    s.set(`j${n}`, { label: `${n}:${need.get(n)}` });
    s.text('clock', 0, 30, `time ${clock} ms`, { bold: true, size: 'lg' });
    if (slices <= 3 || need.get(n) === 0)
      s.say(need.get(n)! > 0 ? `${n} runs for ${run} ms. Its slice is up, but it still needs ${need.get(n)} ms: back of the queue.` : `${n} runs for ${run} ms and finishes at ${clock} ms.`);
    if (need.get(n)! > 0) {
      queue.push(n);
      draw();
    } else {
      done.push(n);
      s.box(`j${n}`, { x: (done.length - 1) * (STEP + 10), y: qy + 90, w: W + 10, h: H, label: `${n} ✓`, tone: 'ok', mono: true });
      s.text('dl', 0, qy + 80, 'finished', { size: 'sm', bold: true, tone: 'dim' });
    }
  }
  s.say(`All done after ${slices} slices. Every job made progress from the start, so short jobs finished early and nothing waited forever. The cost: ${slices - names.length} extra context switches compared with running each job to the end.`);
  return s.build('Round-robin scheduling');
};

// =====================================================================
// Race conditions & locks
// =====================================================================

const locks: AnimScript = () => {
  const s = new Stage();
  const c = randInt(10, 60);
  const k = randInt(2, 9);
  s.box('bal', { x: 200, y: 0, w: 120, h: H, label: `balance = ${c}`, tone: 'accent', mono: true });
  s.box('tA', { x: 0, y: 110, w: 150, h: 70, shape: 'frame', label: 'Thread A' });
  s.box('tB', { x: 370, y: 110, w: 150, h: 70, shape: 'frame', label: 'Thread B' });
  s.say(`A shared balance of ${c}. Both threads run balance = balance + ${k}. That one line is really three steps: read, add, write.`);
  s.box('rA', { x: 15, y: 130, w: 120, h: 34, label: `read ${c}`, tone: 'hl', mono: true });
  s.arrow('aA', 'bal', 'rA', { tone: 'accent' });
  s.say(`No lock. A reads ${c}…`);
  s.box('rB', { x: 385, y: 130, w: 120, h: 34, label: `read ${c}`, tone: 'hl', mono: true });
  s.arrow('aB', 'bal', 'rB', { tone: 'accent' });
  s.say(`…and before A writes, B also reads ${c}.`);
  s.set('rA', { label: `write ${c + k}` });
  s.arrows.aA = { from: 'rA', to: 'bal', tone: 'ok' };
  s.set('bal', { label: `balance = ${c + k}` });
  s.say(`A adds ${k} and writes ${c + k}.`);
  s.set('rB', { label: `write ${c + k}`, tone: 'bad' });
  s.arrows.aB = { from: 'rB', to: 'bal', tone: 'bad' };
  s.set('bal', { label: `balance = ${c + k}`, tone: 'bad' });
  s.say(`B also writes ${c + k}, overwriting A’s update. It should be ${c + 2 * k}: one deposit vanished. That’s a race condition.`);
  s.del('rA', 'rB', 'aA', 'aB');
  s.set('bal', { label: `balance = ${c}`, tone: 'accent' });
  s.box('lock', { x: 230, y: 60, w: 60, h: 30, label: '🔓', shape: 'tag' });
  s.say('Start again, this time with a lock around the read–add–write.');
  s.box('lock', { x: 140, y: 130, w: 60, h: 30, label: '🔒 A', shape: 'tag' });
  s.box('rA', { x: 15, y: 130, w: 120, h: 34, label: `read ${c}`, tone: 'ok', mono: true });
  s.box('rB', { x: 385, y: 130, w: 120, h: 34, label: 'waiting…', tone: 'dim', mono: false });
  s.say('A takes the lock. B tries too, finds it held, and waits.');
  s.set('rA', { label: `write ${c + k}` });
  s.set('bal', { label: `balance = ${c + k}` });
  s.box('lock', { x: 230, y: 60, w: 60, h: 30, label: '🔓', shape: 'tag' });
  s.say(`A reads ${c}, writes ${c + k}, and releases the lock.`);
  s.box('lock', { x: 320, y: 130, w: 60, h: 30, label: '🔒 B', shape: 'tag' });
  s.set('rB', { label: `read ${c + k}`, tone: 'ok' });
  s.say(`Now B gets the lock and reads ${c + k}: the up-to-date value.`);
  s.set('rB', { label: `write ${c + 2 * k}` });
  s.set('bal', { label: `balance = ${c + 2 * k}`, tone: 'ok' });
  s.box('lock', { x: 230, y: 60, w: 60, h: 30, label: '🔓', shape: 'tag' });
  s.say(`${c + 2 * k}: correct. The lock makes read–add–write happen as one unbroken step: only one thread is ever inside it.`);
  return s.build('A race condition, then a lock');
};

// =====================================================================
// Deadlock
// =====================================================================

const deadlock: AnimScript = () => {
  const s = new Stage();
  const [x, y] = shuffle(['Accounts', 'Orders', 'Stock', 'Users']).slice(0, 2);
  s.box('t1', { x: 0, y: 40, w: 100, h: H, label: 'Thread 1', tone: 'accent', mono: false });
  s.box('t2', { x: 400, y: 40, w: 100, h: H, label: 'Thread 2', tone: 'accent', mono: false });
  s.box('L1', { x: 200, y: 0, w: 100, h: H, label: `🔒 ${x}`, tone: 'plain', mono: false });
  s.box('L2', { x: 200, y: 100, w: 100, h: H, label: `🔒 ${y}`, tone: 'plain', mono: false });
  s.say(`Two threads, two locks: ${x} and ${y}.`);
  s.arrow('h1', 'L1', 't1', { tone: 'ok', label: 'held by' });
  s.tone('L1', 'ok');
  s.say(`Thread 1 locks ${x}.`);
  s.arrow('h2', 'L2', 't2', { tone: 'ok', label: 'held by' });
  s.tone('L2', 'ok');
  s.say(`At the same moment, thread 2 locks ${y}.`);
  s.arrow('w1', 't1', 'L2', { tone: 'bad', label: 'wants', dashed: true });
  s.say(`Thread 1 now needs ${y} too. It’s held, so thread 1 waits…`);
  s.arrow('w2', 't2', 'L1', { tone: 'bad', label: 'wants', dashed: true });
  s.tone(['t1', 't2'], 'bad');
  s.say(`…and thread 2 needs ${x}, held by thread 1. Follow the arrows: they form a cycle. Each waits for the other forever: deadlock. Nothing crashes; it just hangs.`);
  s.del('w1', 'w2', 'h2');
  s.tone(['t1', 't2'], 'accent');
  s.tone('L2', 'plain');
  const [first, second] = [x, y].sort();
  s.say(`The fix: every thread takes the locks in the same order: always ${first} before ${second}.`);
  s.del('h1');
  s.tone('L1', 'plain');
  const f = first === x ? 'L1' : 'L2';
  const g = f === 'L1' ? 'L2' : 'L1';
  s.arrow('h1', f, 't1', { tone: 'ok', label: 'held by' });
  s.tone(f, 'ok');
  s.arrow('w2', 't2', f, { tone: 'warn', label: 'wants', dashed: true });
  s.say(`Thread 1 takes ${first}. Thread 2 also wants ${first} first, so it waits, holding nothing.`);
  s.arrow('h3', g, 't1', { tone: 'ok', label: 'held by' });
  s.tone(g, 'ok');
  s.say(`Thread 1 takes ${second} freely, does its work, and releases both.`);
  s.del('h1', 'h3', 'w2');
  s.arrow('h1', f, 't2', { tone: 'ok', label: 'held by' });
  s.arrow('h3', g, 't2', { tone: 'ok', label: 'held by' });
  s.say('Then thread 2 gets both. With one global order, a waiting cycle can never form.');
  return s.build('Deadlock, and the lock-order fix');
};

// =====================================================================
// Virtual memory & paging
// =====================================================================

const virtualMemory: AnimScript = () => {
  const s = new Stage();
  const size = 1024;
  const frames = 3;
  const refs = (() => {
    for (;;) {
      const r = Array.from({ length: 7 }, () => randInt(0, 4));
      if (new Set(r).size >= 4) return r;
    }
  })();
  s.text('lv', 0, -12, 'virtual pages', { size: 'sm', bold: true, tone: 'dim' });
  for (let p = 0; p < 5; p++) s.box(`v${p}`, { x: 0, y: p * 48, w: 70, h: H, label: `page ${p}`, mono: false });
  s.text('lp', 340, -12, 'RAM frames', { size: 'sm', bold: true, tone: 'dim' });
  for (let f = 0; f < frames; f++) s.box(`f${f}`, { x: 340, y: f * 48, w: 90, h: H, shape: 'slot', label: `frame ${f}`, mono: false });
  s.box('disk', { x: 340, y: 170, w: 90, h: 60, shape: 'frame', label: 'disk' });
  s.say(`A process sees 5 virtual pages of ${size} bytes, but only ${frames} frames of real RAM are free. The page table maps each page to a frame, or to disk.`);
  const page = refs[0];
  const off = randInt(1, size - 1);
  s.text('addr', 120, -12, `address ${page * size + off} = page ${page}, offset ${off}`, { bold: true, tone: 'accent' });
  s.say(`Reading address ${page * size + off}: ${page * size + off} ÷ ${size} = page ${page}, remainder ${off} = the offset within the page.`);
  s.del('addr');
  const mem: number[] = [];
  const at = new Map<number, number>();
  let faults = 0;
  for (const [i, p] of refs.entries()) {
    s.tone(`v${p}`, 'hl');
    if (at.has(p)) {
      mem.push(mem.splice(mem.indexOf(p), 1)[0]);
      s.arrow(`m${p}`, `v${p}`, `f${at.get(p)}`, { tone: 'ok' });
      s.say(`Use page ${p}: it’s in frame ${at.get(p)}. A hit: fast, no disk.`);
    } else {
      faults++;
      let fr: number;
      if (mem.length < frames) fr = mem.length;
      else {
        const victim = mem.shift()!;
        fr = at.get(victim)!;
        at.delete(victim);
        s.del(`m${victim}`, `pg${victim}`);
        s.tone(`f${fr}`, 'bad');
        s.say(`Use page ${p}: not in RAM, and all frames are full. Evict the least recently used page, ${victim}, back to disk.`);
      }
      mem.push(p);
      at.set(p, fr);
      s.box(`pg${p}`, { x: 350, y: fr * 48 + 4, w: 70, h: 32, label: `page ${p}`, tone: 'ok', mono: false });
      s.tone(`f${fr}`, 'plain');
      s.arrow(`m${p}`, `v${p}`, `f${fr}`, { tone: 'accent' });
      s.say(`Page fault #${faults}: page ${p} is loaded from disk into frame ${fr}, and the page table is updated. ${i === 0 ? 'Disk is thousands of times slower than RAM, so faults are expensive.' : ''}`.trim());
    }
    s.tone(`v${p}`, 'plain');
  }
  s.say(`${refs.length} accesses, ${faults} page faults. Every program gets its own private pages, and RAM holds just the ones in use. When programs need far more than RAM, nearly every access faults: that’s thrashing.`);
  return s.build('Virtual memory: pages, frames and faults');
};

// =====================================================================
// Async I/O
// =====================================================================

const asyncIo: AnimScript = () => {
  const s = new Stage();
  const n = 6;
  const T = 2;
  s.text('t1', 0, -14, `Blocking: ${T} threads, ${n} requests that each wait 1 s`, { bold: true });
  for (let t = 0; t < T; t++) s.box(`th${t}`, { x: 0, y: t * 50, w: 80, h: H, label: `thread ${t + 1}`, tone: 'accent', mono: false });
  slotRow(s, 'r', n, { x: 120, y: 120, top: (i) => `req ${i + 1}` });
  for (let i = 0; i < n; i++) onSlot(s, `q${i}`, `R${i + 1}`, i, { x: 120, y: 120 });
  s.say(`${n} requests arrive. Each must wait 1 second for a database. With blocking calls, a thread sits idle for that whole second.`);
  let clock = 0;
  for (let round = 0; round < n / T; round++) {
    for (let t = 0; t < T; t++) {
      const i = round * T + t;
      s.box(`q${i}`, { x: 120 + round * 110, y: t * 50, w: 90, h: H, label: `R${i + 1} waiting`, tone: 'warn', mono: false });
    }
    clock++;
    s.text('clk', 0, 200, `${clock} s`, { bold: true, size: 'lg' });
    s.say(round === 0 ? `Second ${clock}: both threads are blocked waiting. The other ${n - T} requests can’t even start.` : `Second ${clock}: the next ${T} requests. Still blocked, still waiting.`);
    for (let t = 0; t < T; t++) s.tone(`q${round * T + t}`, 'ok');
  }
  s.say(`${clock} seconds in total, and the CPU did almost nothing. The threads were the bottleneck.`);
  for (let i = 0; i < n; i++) s.del(`q${i}`);
  s.del('clk');
  s.text('t1', 0, -14, `Async: the same ${n} requests with await`, { bold: true });
  for (let i = 0; i < n; i++) onSlot(s, `q${i}`, `R${i + 1}`, i, { x: 120, y: 120, tone: 'hl' });
  s.box('os', { x: 520, y: 0, w: 110, h: 90, shape: 'frame', label: 'OS: I/O in flight' });
  s.say('With async, a thread starts a request, and at the await it hands the wait to the operating system and moves straight on.');
  for (let i = 0; i < n; i++) s.box(`q${i}`, { x: 530 + (i % 2) * 50, y: 10 + Math.floor(i / 2) * 26, w: 44, h: 22, label: `R${i + 1}`, tone: 'warn' });
  s.say(`Within milliseconds, all ${n} requests are in flight. No thread is blocked: both are free for other work.`);
  for (let i = 0; i < n; i++) onSlot(s, `q${i}`, `R${i + 1} ✓`, i, { x: 120, y: 120, tone: 'ok' });
  s.text('clk', 0, 200, '≈1 s', { bold: true, size: 'lg', tone: 'ok' });
  s.say(`After about 1 second all the replies arrive together, and pool threads run the rest of each method. ≈1 s instead of ${clock} s, with the same ${T} threads. That’s why servers use async for anything that waits.`);
  return s.build('Blocking threads vs async I/O');
};

export const OS_ANIMS: Record<string, AnimScript> = {
  'processes-threads': processesThreads,
  scheduling,
  locks,
  deadlock,
  'virtual-memory': virtualMemory,
  'async-io': asyncIo,
};

