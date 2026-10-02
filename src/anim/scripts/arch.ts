import type { AnimScript } from '../engine';
import { Stage } from '../engine';
import { pick, randInt, shuffle } from '../../engine/random';

const bits = (n: number, w: number) => Array.from({ length: w }, (_, i) => (n >> (w - 1 - i)) & 1);

// =====================================================================
// Binary arithmetic & logic gates: a ripple-carry adder
// =====================================================================

const logicGates: AnimScript = () => {
  const s = new Stage();
  const W = 4;
  const a = randInt(3, 12);
  const b = randInt(3, 15 - Math.min(a, 12) + 3);
  const A = bits(a, W);
  const B = bits(b, W);
  const X = (i: number) => 60 + i * 70;
  s.text('la', 0, 22, `a = ${a}`, { bold: true });
  s.text('lb', 0, 72, `b = ${b}`, { bold: true });
  for (let i = 0; i < W; i++) {
    s.box(`a${i}`, { x: X(i), y: 0, w: 44, h: 36, label: String(A[i]), top: `bit ${W - 1 - i}` });
    s.box(`b${i}`, { x: X(i), y: 50, w: 44, h: 36, label: String(B[i]) });
    s.box(`s${i}`, { x: X(i), y: 150, w: 44, h: 36, label: '?', shape: 'slot' });
  }
  s.text('ls', 0, 172, 'sum', { bold: true });
  s.say(`Add ${a} + ${b} in 4-bit binary. The CPU does it with one full adder per column, from the right.`);
  let carry = 0;
  for (let i = W - 1; i >= 0; i--) {
    const x = A[i];
    const y = B[i];
    const sum = x ^ y ^ carry;
    const out = (x & y) | (carry & (x ^ y));
    s.tone(`a${i}`, 'hl');
    s.tone(`b${i}`, 'hl');
    s.box('fa', { x: X(i) - 8, y: 100, w: 60, h: 30, label: 'FA', tone: 'accent' });
    s.set(`s${i}`, { label: String(sum), tone: 'ok', shape: 'rect' });
    s.box('cin', { x: X(i) + 60, y: 104, w: 30, h: 22, label: `c${carry}`, shape: 'tag' });
    s.say(`Bit ${W - 1 - i}: ${x} XOR ${y} XOR carry ${carry} = ${sum}. Carry out = ${out}${out ? ' (at least two of the three inputs were 1)' : ''}.`);
    s.tone(`a${i}`, 'dim');
    s.tone(`b${i}`, 'dim');
    carry = out;
  }
  s.del('fa');
  s.del('cin');
  const total = a + b;
  if (carry) {
    s.box('ov', { x: X(0) - 70, y: 150, w: 44, h: 36, label: '1', tone: 'bad', top: 'lost' });
    s.say(`The final carry is 1, but there are only 4 bits: it is dropped. 4-bit result = ${total & 15}, not ${total}. That is overflow, and it is exactly what int does at 32 bits.`);
  } else {
    s.say(`No carry out: the result ${total} fits in 4 bits. The same circuit, 64 columns wide, adds two longs.`);
  }
  s.say('Each full adder is just a few gates: two XORs for the sum bit, ANDs and an OR for the carry. Every addition in your program is this, billions of times a second.');
  return s.build('A ripple-carry adder');
};

// =====================================================================
// The CPU: fetch, decode, execute
// =====================================================================

const cpuCycle: AnimScript = () => {
  const s = new Stage();
  const a = randInt(2, 9);
  const b = randInt(2, 5);
  const n = randInt(2, 3);
  const prog = [`SET r0, ${a}`, `SET r1, ${b}`, `SET r2, ${n}`, 'ADD r0, r1', 'DEC r2', 'JNZ r2, 3', 'HALT'];
  prog.forEach((p, i) => s.box(`i${i}`, { x: 0, y: i * 34, w: 150, h: 28, label: `${i}: ${p}`, mono: true }));
  s.text('mh', 0, -10, 'memory (instructions)', { size: 'sm', bold: true, tone: 'dim' });
  const R = [0, 0, 0];
  ['r0', 'r1', 'r2'].forEach((r, i) => s.box(r, { x: 360, y: i * 50, w: 80, h: 36, label: '0', top: r }));
  s.box('pc', { x: 240, y: 0, w: 80, h: 36, label: '0', top: 'PC', tone: 'accent' });
  s.box('alu', { x: 240, y: 110, w: 80, h: 40, label: 'ALU', tone: 'plain' });
  s.say('Registers r0–r2, a program counter (PC) and an ALU. The program is just numbered instructions in memory.');
  let pc = 0;
  let steps = 0;
  while (pc < prog.length && steps < 20) {
    steps++;
    const ins = prog[pc];
    s.tone(`i${pc}`, 'hl');
    s.arrow('f', 'pc', `i${pc}`, { tone: 'ptr' });
    let next = pc + 1;
    let msg = '';
    if (ins.startsWith('SET')) {
      const r = Number(ins[5]);
      R[r] = Number(ins.split(', ')[1]);
      s.set(`r${r}`, { label: String(R[r]), tone: 'ok' });
      msg = `Fetch instruction ${pc}, decode SET, execute: r${r} = ${R[r]}.`;
    } else if (ins.startsWith('ADD')) {
      R[0] += R[1];
      s.tone('alu', 'accent');
      s.set('r0', { label: String(R[0]), tone: 'ok' });
      msg = `ADD: the ALU adds r0 + r1 and writes ${R[0]} back into r0.`;
    } else if (ins.startsWith('DEC')) {
      R[2]--;
      s.set('r2', { label: String(R[2]), tone: 'ok' });
      msg = `DEC: r2 counts down to ${R[2]}.`;
    } else if (ins.startsWith('JNZ')) {
      if (R[2] !== 0) {
        next = 3;
        msg = 'JNZ: r2 isn’t zero, so the PC is set back to 3. That is the whole of a loop: a jump backwards.';
      } else msg = 'JNZ: r2 is zero, so no jump: the PC just moves on.';
    } else {
      msg = `HALT. r0 = ${a} + ${n} × ${b} = ${R[0]}.`;
      next = prog.length;
    }
    if (steps <= 4 || ins.startsWith('JNZ') || ins === 'HALT') s.say(msg);
    s.tone(`i${pc}`, 'plain');
    s.tone('alu', 'plain');
    for (const r of ['r0', 'r1', 'r2']) s.tone(r, 'plain');
    pc = next;
    if (pc < prog.length) s.set('pc', { label: String(pc) });
  }
  s.del('f');
  s.say(`${steps} instructions ran. A real core does this cycle billions of times a second, on exactly this kind of instruction.`);
  return s.build('Fetch, decode, execute');
};

// =====================================================================
// The call stack
// =====================================================================

const callStack: AnimScript = () => {
  const s = new Stage();
  const n = randInt(3, 4);
  const H = 44;
  const base = 280;
  s.box('mem', { x: 0, y: 0, w: 230, h: base + 10, shape: 'frame', label: 'stack (newest frame at the bottom)' });
  s.text('code', 280, 20, `int Fact(int n) => n <= 1 ? 1 : n * Fact(n - 1);`, { size: 'sm', bold: true });
  s.box('main', { x: 10, y: 10, w: 210, h: H - 6, label: 'Main: frame', sub: '', tone: 'dim', mono: false });
  s.box('sp', { x: 280, y: 60, w: 90, h: 30, label: 'SP', shape: 'tag' });
  s.arrow('spa', 'sp', 'main', { tone: 'ptr' });
  s.say(`Main calls Fact(${n}). Each thread has a block of stack memory and a stack pointer register (SP) marking its top.`);
  for (let k = 0; k < n; k++) {
    const v = n - k;
    const y = 10 + (k + 1) * H;
    s.box(`f${v}`, { x: 10, y, w: 210, h: H - 6, label: `Fact(${v}): n = ${v}`, mono: true, tone: 'accent' });
    s.arrow('spa', 'sp', `f${v}`, { tone: 'ptr' });
    s.say(k === 0 ? `CALL pushes the return address (back into Main) and a frame for Fact(${v}) holding n = ${v}. SP moves to the new top.` : `Fact(${v + 1}) needs Fact(${v}) first: another CALL, another frame. Fact(${v + 1}) waits, its frame still on the stack.`);
    s.tone(`f${v}`, 'plain');
  }
  s.tone('f1', 'hl');
  s.say(`Fact(1) hits the base case. ${n} Fact frames are on the stack right now: that is the stack trace a debugger would show.`);
  let acc = 1;
  for (let v = 1; v <= n; v++) {
    const below = v + 1 <= n ? `f${v + 1}` : 'main';
    s.del(`f${v}`);
    s.arrow('spa', 'sp', below, { tone: 'ptr' });
    if (v < n) {
      acc *= v + 1;
      s.set(below, { sub: `got ${v === 1 ? 1 : acc / (v + 1)} → returns ${acc}`, tone: 'ok' });
      s.say(`RET pops Fact(${v})’s frame and jumps to the saved return address inside Fact(${v + 1}), which computes ${v + 1} × ${acc / (v + 1)} = ${acc}.`);
    } else {
      s.set('main', { sub: `result ${acc}`, tone: 'ok' });
      s.say(`The last RET lands back in Main with ${acc}. SP is exactly where it started.`);
    }
  }
  s.say('With n = 100,000 the frames wouldn’t fit in the ~1 MB stack: StackOverflowException. Same mechanism, just too deep.');
  return s.build('Calls push frames; returns pop them');
};

// =====================================================================
// Caches
// =====================================================================

const cpuCaches: AnimScript = () => {
  const s = new Stage();
  const N = 4; // 4x4 ints, 4 ints per (tiny) cache line for the picture
  const order = pick(['row', 'col'] as const);
  for (let r = 0; r < N; r++)
    for (let c = 0; c < N; c++) s.box(`m${r}${c}`, { x: c * 50, y: 30 + r * 46, w: 44, h: 38, label: `[${r},${c}]`, mono: true });
  s.text('h', 0, 10, 'int[4,4] in memory: each row is one cache line (in this picture)', { size: 'sm', bold: true });
  s.box('cache', { x: 300, y: 30, w: 220, h: 100, shape: 'frame', label: 'cache: holds 1 line' });
  s.text('stat', 300, 170, 'hits 0 · misses 0', { bold: true });
  s.say('Memory moves into the cache a whole line at a time (64 bytes = 16 ints on a real CPU). Here, one line = one row, and the cache holds one line.');
  let hits = 0;
  let miss = 0;
  let line = -1;
  const visit = (r: number, c: number, narrate: boolean) => {
    s.tone(`m${r}${c}`, 'hl');
    if (line === r) {
      hits++;
      s.tone(`m${r}${c}`, 'ok');
      if (narrate) s.say(`[${r},${c}]: row ${r} is already in the cache. Hit (~1 ns).`);
    } else {
      miss++;
      line = r;
      s.box('cl', { x: 310, y: 60, w: 200, h: 40, label: `row ${r}: [${r},0]..[${r},3]`, tone: 'warn', mono: true });
      s.tone(`m${r}${c}`, 'bad');
      if (narrate) s.say(`[${r},${c}]: not cached. Miss (~100 ns): load all of row ${r}.`);
    }
    s.text('stat', 300, 170, `hits ${hits} · misses ${miss}`, { bold: true });
  };
  const loop = (kind: 'row' | 'col') => {
    hits = 0;
    miss = 0;
    line = -1;
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) s.tone(`m${r}${c}`, 'plain');
    s.text('code', 0, 230, kind === 'row' ? 'for r … for c … sum += a[r, c]   (row by row)' : 'for c … for r … sum += a[r, c]   (column by column)', { bold: true, tone: 'accent' });
    let k = 0;
    for (let i = 0; i < N; i++)
      for (let j = 0; j < N; j++) {
        const [r, c] = kind === 'row' ? [i, j] : [j, i];
        visit(r, c, k < 3);
        k++;
      }
    s.say(kind === 'row' ? `Row by row: ${miss} misses, ${hits} hits. Each line loaded is fully used before moving on.` : `Column by column: ${miss} misses out of ${N * N}. Every step jumps to another row, evicting the line it will need again next.`);
  };
  const first = order;
  loop(first);
  loop(first === 'row' ? 'col' : 'row');
  s.say('Same additions, same Big O. On a real 4000×4000 grid the column order is often 5–10× slower, purely from cache misses.');
  return s.build('Cache lines and access order');
};

// =====================================================================
// Pipelining & branch prediction
// =====================================================================

const pipelining: AnimScript = () => {
  const s = new Stage();
  const stages = ['Fetch', 'Decode', 'Execute', 'Write'];
  const ins = ['i1', 'i2', 'i3', 'i4', 'i5'];
  stages.forEach((st, k) => s.box(`st${k}`, { x: k * 110, y: 0, w: 100, h: 30, label: st, tone: 'dim', mono: false }));
  s.say('Each instruction passes through 4 stages. Without a pipeline, the next instruction waits until the previous one is completely done.');
  const shown = new Set<string>();
  for (let cyc = 0; cyc < ins.length + stages.length - 1; cyc++) {
    for (let k = 0; k < stages.length; k++) {
      const i = cyc - k;
      if (i >= 0 && i < ins.length) {
        s.box(ins[i], { x: k * 110 + 20, y: 44, w: 60, h: 36, label: ins[i], tone: k === 3 ? 'ok' : 'accent' });
        shown.add(ins[i]);
      }
    }
    for (const id of [...shown]) {
      const i = ins.indexOf(id);
      if (cyc - i >= stages.length) {
        s.del(id);
        shown.delete(id);
      }
    }
    s.text('cyc', 460, 64, `cycle ${cyc + 1}`, { bold: true });
    const inFlight = stages.map((st, k) => (cyc - k >= 0 && cyc - k < ins.length ? `${ins[cyc - k]} ${st.toLowerCase()}` : null)).filter(Boolean);
    if (cyc === 0) s.say('Cycle 1: i1 is fetched.');
    else if (cyc === 3) s.say('Cycle 4: the pipeline is full. Four instructions are in progress at once, each in a different stage.');
    else if (cyc === ins.length + stages.length - 2) s.say(`All ${ins.length} done in ${ins.length + stages.length - 1} cycles instead of ${ins.length * stages.length}. One finishes every cycle once the pipeline is full.`);
    else s.say(`Cycle ${cyc + 1}: ${inFlight.join(', ')}.`);
  }
  for (const id of [...shown]) s.del(id);
  s.del('cyc');
  const sorted = Math.random() < 0.5;
  const data = sorted ? [12, 40, 90, 150, 200, 230] : shuffle([12, 40, 90, 150, 200, 230]);
  s.text('q', 0, 120, `if (x >= 128) …   data: ${data.join(', ')}${sorted ? ' (sorted)' : ' (random)'}`, { bold: true, tone: 'accent' });
  s.say('Problem: at an if, the next instruction depends on a result that isn’t computed yet. The CPU guesses, using what this branch did last time.');
  let last = false;
  let wrong = 0;
  data.forEach((x, i) => {
    const actual = x >= 128;
    const guess = last;
    const ok = guess === actual;
    if (!ok) wrong++;
    s.box(`d${i}`, { x: i * 80, y: 140, w: 70, h: 40, label: String(x), sub: `guess ${guess ? 'yes' : 'no'}`, tone: ok ? 'ok' : 'bad' });
    last = actual;
  });
  s.say(`Green = guessed right (free), red = wrong: the pipeline is flushed, ~15–20 cycles lost each. Here: ${wrong} wrong out of ${data.length}.`);
  s.say(sorted ? 'Sorted data: the answer only changes once, so the predictor is almost always right. On millions of items that is the famous “sorted array is faster” effect.' : 'Random data: the answer flips unpredictably, so roughly half the guesses are wrong. Sort the data (or remove the branch) and the same loop gets several times faster.');
  return s.build('A pipeline and a branch predictor');
};

// =====================================================================
// SIMD
// =====================================================================

const simd: AnimScript = () => {
  const s = new Stage();
  const L = 4;
  const n = L * 2 + randInt(1, 3);
  const a = Array.from({ length: n }, () => randInt(1, 9));
  const b = Array.from({ length: n }, () => randInt(1, 9));
  a.forEach((v, i) => s.box(`a${i}`, { x: i * 46, y: 0, w: 40, h: 34, label: String(v), top: i === 0 ? 'a' : undefined }));
  b.forEach((v, i) => s.box(`b${i}`, { x: i * 46, y: 50, w: 40, h: 34, label: String(v), top: i === 0 ? 'b' : undefined }));
  for (let i = 0; i < n; i++) s.box(`c${i}`, { x: i * 46, y: 140, w: 40, h: 34, label: '', shape: 'slot', top: i === 0 ? 'c = a + b' : undefined });
  s.say(`Add two arrays of ${n} ints. A normal loop does one addition per instruction: ${n} instructions.`);
  s.box('v', { x: 0, y: 96, w: 46 * L - 6, h: 30, label: `Vector<int>: ${L} lanes`, shape: 'frame', tone: 'accent' });
  s.say(`A vector register holds ${L} ints here (8 with AVX2, 16 with AVX-512). One instruction adds all ${L} lanes at once.`);
  let i = 0;
  let ops = 0;
  for (; i + L <= n; i += L) {
    ops++;
    s.move('v', i * 46, 96);
    for (let k = i; k < i + L; k++) {
      s.tone(`a${k}`, 'hl');
      s.tone(`b${k}`, 'hl');
      s.set(`c${k}`, { label: String(a[k] + b[k]), tone: 'ok', shape: 'rect' });
    }
    s.say(`Vector op ${ops}: load a[${i}..${i + L - 1}] and b[${i}..${i + L - 1}], add lane by lane, store ${L} results. One instruction.`);
    for (let k = i; k < i + L; k++) {
      s.tone(`a${k}`, 'dim');
      s.tone(`b${k}`, 'dim');
    }
  }
  s.del('v');
  const tail = n - i;
  for (; i < n; i++) {
    s.tone(`a${i}`, 'warn');
    s.tone(`b${i}`, 'warn');
    s.set(`c${i}`, { label: String(a[i] + b[i]), tone: 'warn', shape: 'rect' });
  }
  s.say(`${tail} item${tail === 1 ? '' : 's'} left over (${n} isn’t a multiple of ${L}): a plain scalar loop finishes them. Forgetting this tail is the classic SIMD bug.`);
  s.say(`Total: ${ops} vector instructions + ${tail} scalar, instead of ${n}. It works because every lane is independent and the data is contiguous.`);
  return s.build('SIMD: four additions per instruction');
};

export const ARCH_ANIMS: Record<string, AnimScript> = {
  'logic-gates': logicGates,
  'cpu-cycle': cpuCycle,
  'call-stack': callStack,
  'cpu-caches': cpuCaches,
  pipelining,
  simd,
};
