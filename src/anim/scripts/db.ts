import type { AnimScript } from '../engine';
import { Stage } from '../engine';
import { pick, randInt, shuffle } from '../../engine/random';

const NAMES = ['Ann', 'Bob', 'Cy', 'Dee', 'Eve', 'Fay', 'Gus'];
const CITIES = ['Leeds', 'York', 'Hull'];
const RW = 210;
const RH = 30;

/** One table row drawn as a single wide box. */
function row(s: Stage, id: string, x: number, y: number, text: string, tone: 'plain' | 'hl' | 'ok' | 'dim' | 'bad' | 'accent' = 'plain', w = RW) {
  s.box(id, { x, y, w, h: RH - 4, label: text, tone, mono: true });
}

// =====================================================================
// Tables, keys & SQL
// =====================================================================

const relationalModel: AnimScript = () => {
  const s = new Stage();
  const rows = shuffle(NAMES).slice(0, 6).map((name, i) => ({ id: i + 1, name, age: randInt(18, 60), city: pick(CITIES) }));
  const x = randInt(28, 40);
  s.text('h', 0, -10, 'people (id, name, age, city)', { bold: true });
  rows.forEach((r, i) => row(s, `r${r.id}`, 0, i * RH + 4, `${r.id}  ${r.name.padEnd(4)} ${r.age}  ${r.city}`));
  s.say('A table: each row is one person, each column one field. id is the primary key: no two rows share it.');
  s.text('q', 260, 20, `SELECT name, age FROM people`, { bold: true, tone: 'accent' });
  s.text('q2', 260, 40, `WHERE age > ${x} ORDER BY age;`, { bold: true, tone: 'accent' });
  s.say('A query says WHAT you want. The database works out how to get it, in a fixed logical order.');
  for (const r of rows) s.tone(`r${r.id}`, r.age > x ? 'ok' : 'dim');
  const hit = rows.filter((r) => r.age > x).sort((a, b) => a.age - b.age);
  s.say(`FROM people, then WHERE age > ${x}: ${hit.length} row${hit.length === 1 ? '' : 's'} pass (green); the rest are dropped.`);
  hit.forEach((r, i) => row(s, `r${r.id}`, 260, 70 + i * RH, `${r.name.padEnd(4)} ${r.age}`, 'ok', 120));
  s.say('SELECT keeps only the name and age columns, and ORDER BY sorts the result by age.');
  for (const r of rows) if (!hit.includes(r)) s.del(`r${r.id}`);
  for (const r of hit) s.tone(`r${r.id}`, 'plain');
  const groups = CITIES.map((c) => ({ c, n: rows.filter((r) => r.city === c).length })).filter((g) => g.n > 0);
  s.text('q', 260, 20, 'SELECT city, COUNT(*) FROM people', { bold: true, tone: 'accent' });
  s.text('q2', 260, 40, 'GROUP BY city;', { bold: true, tone: 'accent' });
  for (const r of hit) s.del(`r${r.id}`);
  rows.forEach((r, i) => row(s, `r${r.id}`, 0, i * RH + 4, `${r.id}  ${r.name.padEnd(4)} ${r.age}  ${r.city}`));
  s.say('A different question: how many people per city?');
  rows.forEach((r) => {
    const g = CITIES.indexOf(r.city);
    const k = rows.filter((o) => o.city === r.city).indexOf(r);
    row(s, `r${r.id}`, 260 + g * 135, 70 + k * RH, r.name, (['accent', 'ok', 'hl'] as const)[g], 120);
  });
  CITIES.forEach((c, g) => s.text(`g${c}`, 260 + g * 135, 62, c, { size: 'sm', bold: true, tone: 'dim' }));
  s.say('GROUP BY city puts rows into one group per city…');
  rows.forEach((r) => s.del(`r${r.id}`));
  groups.forEach((g) => s.box(`c${g.c}`, { x: 260 + CITIES.indexOf(g.c) * 135, y: 70, w: 120, h: RH - 4, label: `${g.c}: ${g.n}`, tone: 'ok', mono: true }));
  s.say(`…and COUNT(*) collapses each group to one row: ${groups.map((g) => `${g.c} ${g.n}`).join(', ')}. One row per group, no loops written by you.`);
  return s.build('Tables and SQL queries');
};

// =====================================================================
// Indexes
// =====================================================================

const dbIndexes: AnimScript = () => {
  const s = new Stage();
  const emails = shuffle(['ann@x', 'bob@x', 'cy@x', 'dee@x', 'eve@x', 'fay@x', 'gus@x', 'hal@x', 'ida@x']);
  const target = pick(emails.slice(4));
  s.text('h', 0, -10, 'users table (stored in insert order)', { bold: true });
  emails.forEach((e, i) => row(s, `u${i}`, 0, i * RH + 4, `${i + 1}  ${e}`, 'plain', 150));
  s.say(`Find the user with email ${target}. Rows aren’t stored in email order, so with no index the database must check them one by one.`);
  const at = emails.indexOf(target);
  for (let i = 0; i <= at; i++) {
    s.tone(`u${i}`, i === at ? 'ok' : 'hl');
    if (i < 2 || i === at) s.say(i === at ? `Found it at row ${at + 1}, after ${at + 1} checks. With 20 million rows, that’s 20 million checks: a full table scan.` : `Row ${i + 1}: ${emails[i]}? No.`);
    if (i !== at) s.tone(`u${i}`, 'dim');
  }
  for (let i = 0; i < emails.length; i++) s.tone(`u${i}`, 'plain');
  const sorted = [...emails].sort();
  const leaves = [sorted.slice(0, 3), sorted.slice(3, 6), sorted.slice(6)];
  const X = 240;
  s.box('root', { x: X + 120, y: 0, w: 140, h: RH, label: `< ${leaves[1][0]} | < ${leaves[2][0]}`, tone: 'accent', mono: true });
  leaves.forEach((l, i) => {
    s.box(`lf${i}`, { x: X + i * 130, y: 90, w: 120, h: 3 * 22 + 8, shape: 'frame', label: `leaf ${i + 1}`, tone: 'accent' });
    l.forEach((e, k) => s.box(`k${e}`, { x: X + 8 + i * 130, y: 96 + k * 22, w: 104, h: 20, label: `${e} → ${emails.indexOf(e) + 1}`, mono: true }));
    s.arrow(`ra${i}`, 'root', `lf${i}`, { tone: 'dim' });
  });
  s.say('CREATE INDEX ON users(email) builds a B+ tree: emails sorted, each pointing at its row number. Real pages hold hundreds of keys, so even huge tables need only 3–4 levels.');
  const li = leaves.findIndex((l) => l.includes(target));
  s.tone('root', 'hl');
  s.say(`Lookup: read the root page. Compare ${target} with its signposts: it belongs in leaf ${li + 1}.`);
  s.tone('root', 'accent');
  s.arrow(`ra${li}`, 'root', `lf${li}`, { tone: 'ok' });
  s.tone(`k${target}`, 'ok');
  s.say(`Read leaf ${li + 1}: ${target} → row ${at + 1}.`);
  s.arrow('fetch', `k${target}`, `u${at}`, { tone: 'ok' });
  s.tone(`u${at}`, 'ok');
  s.say('Fetch that one row. Three page reads instead of a scan. The price: every insert, update and delete must also update this tree.');
  return s.build('Full scan vs an index');
};

// =====================================================================
// Joins (hash join)
// =====================================================================

const joins: AnimScript = () => {
  const s = new Stage();
  const cust = shuffle(NAMES).slice(0, 3).map((n, i) => ({ id: i + 1, n }));
  const orders = Array.from({ length: 5 }, (_, i) => ({ id: 100 + i, c: randInt(1, 4) }));
  s.text('hc', 0, -10, 'customers', { bold: true });
  cust.forEach((c, i) => row(s, `c${c.id}`, 0, i * RH + 4, `${c.id}  ${c.n}`, 'plain', 110));
  s.text('ho', 0, 130, 'orders (id, customer_id)', { bold: true });
  orders.forEach((o, i) => row(s, `o${o.id}`, 0, 144 + i * RH, `${o.id}  → ${o.c}`, 'plain', 110));
  s.say('Show each order with its customer’s name. Orders store only customer_id, so the two tables must be joined.');
  const B = 3;
  for (let b = 0; b < B; b++) s.box(`b${b}`, { x: 200, y: b * 46, w: 50, h: 36, shape: 'slot', label: `${b}`, mono: true });
  s.text('hb', 200, -10, 'hash table on id', { bold: true, size: 'sm', tone: 'dim' });
  s.say('Hash join, step 1 (build): put the smaller table, customers, into a hash table keyed by id.');
  cust.forEach((c) => {
    const b = c.id % B;
    s.box(`h${c.id}`, { x: 262, y: b * 46 + 3, w: 90, h: 30, label: `${c.id}: ${c.n}`, tone: 'accent', mono: true });
    s.tone(`c${c.id}`, 'dim');
  });
  s.say(`Each customer goes into bucket id % ${B}. One pass over customers.`);
  const out: string[] = [];
  orders.forEach((o, i) => {
    s.tone(`o${o.id}`, 'hl');
    const c = cust.find((x) => x.id === o.c);
    if (c) {
      s.tone(`h${c.id}`, 'ok');
      out.push(`${o.id} ${c.n}`);
      row(s, `j${o.id}`, 400, (out.length - 1) * RH + 4, `${o.id}  ${c.n}`, 'ok', 110);
      if (i < 2) s.say(`Step 2 (probe): order ${o.id} has customer_id ${o.c}. Look in bucket ${o.c % B}: found ${c.n}. Output a joined row.`);
      s.tone(`h${c.id}`, 'accent');
    } else {
      s.tone(`o${o.id}`, 'bad');
      s.say(`Order ${o.id} points at customer ${o.c}, who doesn’t exist: no match, so an INNER JOIN drops it (a LEFT JOIN from orders would keep it with NULLs).`);
    }
    s.tone(`o${o.id}`, 'dim');
  });
  s.text('hj', 400, -10, 'result', { bold: true });
  s.say(`${out.length} joined rows. Each order needed one hash lookup: about customers + orders steps, instead of comparing every order with every customer.`);
  return s.build('Hash join');
};

// =====================================================================
// Transactions
// =====================================================================

const transactions: AnimScript = () => {
  const s = new Stage();
  const a = randInt(3, 9) * 100;
  const x = randInt(1, 5) * 50;
  s.box('A', { x: 0, y: 40, w: 120, h: 44, label: `Alice ${a}`, tone: 'plain', mono: true });
  s.box('B', { x: 300, y: 40, w: 120, h: 44, label: 'Bob 0', tone: 'plain', mono: true });
  s.text('t', 0, -10, `Transfer ${x} from Alice to Bob: two updates`, { bold: true });
  s.say(`Moving ${x} is two writes: subtract from Alice, add to Bob. First, without a transaction.`);
  s.set('A', { label: `Alice ${a - x}`, tone: 'hl' });
  s.say(`Write 1: Alice becomes ${a - x}.`);
  s.box('crash', { x: 150, y: 110, w: 120, h: 34, label: '💥 crash', tone: 'bad', mono: false });
  s.say(`The server crashes before write 2.`);
  s.tone('A', 'bad');
  s.say(`After restart: Alice ${a - x}, Bob 0. ${x} has vanished from the bank.`);
  s.del('crash');
  s.set('A', { label: `Alice ${a}`, tone: 'plain' });
  s.box('tx', { x: -10, y: 20, w: 450, h: 84, shape: 'frame', label: 'BEGIN TRANSACTION', tone: 'accent' });
  s.say('Again, inside a transaction: BEGIN … COMMIT. Until COMMIT, every change is provisional and can be undone.');
  s.set('A', { label: `Alice ${a - x}`, tone: 'hl' });
  s.say(`Write 1 (provisional): Alice ${a - x}.`);
  s.box('crash', { x: 150, y: 110, w: 120, h: 34, label: '💥 crash', tone: 'bad', mono: false });
  s.say('Same crash, same moment.');
  s.del('crash');
  s.set('A', { label: `Alice ${a}`, tone: 'ok' });
  s.set('tx', { label: 'ROLLED BACK', tone: 'bad' });
  s.say(`On restart the database sees the transaction never committed, so it undoes write 1. Alice ${a}, Bob 0: as if it never started. Nothing lost.`);
  s.set('tx', { label: 'BEGIN TRANSACTION', tone: 'accent' });
  s.tone('A', 'plain');
  s.set('A', { label: `Alice ${a - x}`, tone: 'hl' });
  s.set('B', { label: `Bob ${x}`, tone: 'hl' });
  s.say('Third try, no crash: both writes happen…');
  s.set('tx', { label: 'COMMITTED', tone: 'ok' });
  s.tone(['A', 'B'], 'ok');
  s.say('…then COMMIT makes both permanent and visible at once. All or nothing: that’s atomicity, the A in ACID.');
  return s.build('A transfer with and without a transaction');
};

// =====================================================================
// Write-ahead log
// =====================================================================

const writeAheadLog: AnimScript = () => {
  const s = new Stage();
  let x = randInt(1, 5) * 10;
  const v1 = randInt(6, 9) * 10;
  const v2 = randInt(10, 15) * 10;
  s.box('memf', { x: -10, y: 0, w: 150, h: 70, shape: 'frame', label: 'memory' });
  s.box('mem', { x: 10, y: 15, w: 110, h: 34, label: `x = ${x}`, tone: 'plain', mono: true });
  s.box('diskf', { x: 220, y: 0, w: 150, h: 70, shape: 'frame', label: 'data file (disk)' });
  s.box('disk', { x: 240, y: 15, w: 110, h: 34, label: `x = ${x}`, tone: 'plain', mono: true });
  s.box('logf', { x: -10, y: 110, w: 380, h: 140, shape: 'frame', label: 'log file (disk, append-only)', tone: 'accent' });
  s.say('A database keeps working data in memory and a data file on disk. Writing scattered data pages on every commit is slow, so it keeps an append-only log instead.');
  const add = (i: number, text: string, tone: 'plain' | 'ok' | 'hl' = 'plain') => s.box(`l${i}`, { x: 0, y: 122 + i * 30, w: 200, h: 26, label: text, tone, mono: true });
  add(0, `T1: set x = ${v1}`, 'hl');
  s.say(`T1 sets x = ${v1}. First, append that change to the log.`);
  add(1, 'T1: COMMIT', 'ok');
  s.box('fsync', { x: 220, y: 150, w: 130, h: 30, label: 'fsync ✓', tone: 'ok', mono: false });
  s.say('Append a COMMIT record and flush the log to disk. Only now does the client hear “committed”. One quick sequential write.');
  s.del('fsync');
  s.set('mem', { label: `x = ${v1}`, tone: 'ok' });
  x = v1;
  s.say(`Memory is updated. The data file on disk still says the old value: it will be written later, in the background.`);
  add(2, `T2: set x = ${v2}`, 'hl');
  s.set('mem', { label: `x = ${v2}`, tone: 'hl' });
  s.say(`T2 starts and sets x = ${v2}: logged and applied in memory, but T2 hasn’t committed yet.`);
  s.box('crash', { x: 220, y: 200, w: 130, h: 34, label: '💥 power cut', tone: 'bad', mono: false });
  s.del('mem');
  s.say('Power cut. Memory is wiped. The data file is stale. What’s the true state?');
  s.del('crash');
  s.box('mem', { x: 10, y: 15, w: 110, h: 34, label: '?', tone: 'dim', mono: true });
  s.tone('l0', 'ok');
  s.say(`Recovery reads the log from the start. T1 has a COMMIT record, so redo it: x = ${v1}.`);
  s.set('mem', { label: `x = ${v1}`, tone: 'ok' });
  s.tone('l2', 'bad');
  s.say('T2 has no COMMIT record: it never finished, so its change is discarded.');
  s.set('disk', { label: `x = ${x}`, tone: 'ok' });
  s.say(`x = ${v1}: exactly what was committed. The rule: nothing is “committed” until it’s in the flushed log. Checkpoints later write the data file and trim old log records.`);
  return s.build('Write-ahead log and crash recovery');
};

// =====================================================================
// Isolation & MVCC
// =====================================================================

const isolationMvcc: AnimScript = () => {
  const s = new Stage();
  const p1 = randInt(1, 9) * 10;
  const p2 = p1 + randInt(1, 5) * 10;
  s.text('h', 0, -30, 'versions of row “price” (newest on the right)', { bold: true });
  s.box('v1', { x: 0, y: 0, w: 120, h: 44, label: `${p1}`, top: 'committed t=1', tone: 'ok', mono: true });
  s.say(`MVCC keeps versions of each row instead of overwriting it. Right now there is one: price ${p1}, committed at time 1.`);
  s.box('T1', { x: 0, y: 120, w: 150, h: 40, label: 'T1 (snapshot t=2)', tone: 'accent', mono: false });
  s.arrow('r1', 'T1', 'v1', { tone: 'accent', label: 'reads' });
  s.say(`At time 2, a long report T1 starts. It takes a snapshot: it will see the database exactly as it was at time 2. It reads ${p1}.`);
  s.box('T2', { x: 260, y: 120, w: 150, h: 40, label: 'T2 writes', tone: 'warn', mono: false });
  s.box('v2', { x: 200, y: 0, w: 120, h: 44, label: `${p2}`, top: 'uncommitted', tone: 'hl', mono: true });
  s.arrow('w2', 'T2', 'v2', { tone: 'warn', label: 'creates' });
  s.arrow('chain', 'v2', 'v1', { tone: 'dim', label: 'older' });
  s.say(`T2 changes the price to ${p2}. It doesn’t overwrite: it adds a NEW version. T1 never waits, and T2 never waits for T1.`);
  s.set('v2', { top: 'committed t=3', tone: 'ok' });
  s.set('T2', { label: 'T2 committed', tone: 'ok' });
  s.say('T2 commits at time 3.');
  s.arrow('r1', 'T1', 'v1', { tone: 'accent', label: 'reads again' });
  s.tone('v1', 'hl');
  s.say(`T1 reads the price again. Its snapshot is time 2, and the ${p2} version was committed at time 3, so T1 still sees ${p1}. Its whole report stays consistent.`);
  s.tone('v1', 'ok');
  s.box('T3', { x: 460, y: 120, w: 150, h: 40, label: 'T3 (snapshot t=4)', tone: 'accent', mono: false });
  s.arrow('r3', 'T3', 'v2', { tone: 'accent', label: 'reads' });
  s.say(`A new transaction T3 starts at time 4: it sees ${p2}. Same row, different answers, each correct for its own snapshot.`);
  s.box('T4', { x: 460, y: 200, w: 150, h: 40, label: 'T1 tries to write', tone: 'bad', mono: false });
  s.say('If T1 now tried to UPDATE the price, it would conflict with T2’s newer commit. First committer wins: T1 must abort and retry, so no update is lost.');
  s.del('T4');
  s.set('T1', { label: 'T1 finished' });
  s.del('r1');
  s.tone('v1', 'dim');
  s.say(`When no running snapshot can see the ${p1} version any more, garbage collection (VACUUM) removes it.`);
  return s.build('MVCC: snapshots and row versions');
};

export const DB_ANIMS: Record<string, AnimScript> = {
  'relational-model': relationalModel,
  'db-indexes': dbIndexes,
  'query-joins': joins,
  transactions,
  'write-ahead-log': writeAheadLog,
  'isolation-mvcc': isolationMvcc,
};
