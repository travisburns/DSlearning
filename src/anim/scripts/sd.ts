import type { AnimScript } from '../engine';
import { Stage } from '../engine';
import { pick, randInt } from '../../engine/random';

// =====================================================================
// Caching layer
// =====================================================================

const cachingLayer: AnimScript = () => {
  const s = new Stage();
  const id = randInt(1, 99);
  const old = randInt(10, 40);
  const neu = old + randInt(1, 9);
  const ttl = pick([60, 300]);
  s.box('api', { x: 0, y: 110, w: 100, h: 44, label: 'API' });
  s.box('cache', { x: 220, y: 20, w: 160, h: 44, label: 'cache', sub: '1 ms · empty', tone: 'accent' });
  s.box('db', { x: 220, y: 200, w: 160, h: 44, label: 'database', sub: `50 ms · product ${id} = £${old}` });
  s.say(`Cache-aside. The API needs product ${id}’s price. The cache is fast but empty; the database is the truth but slow.`);
  s.arrow('q1', 'api', 'cache', { tone: 'accent', label: `product:${id}?` });
  s.tone('cache', 'bad');
  s.say('Step 1: ask the cache. Miss.');
  s.tone('cache', 'accent');
  s.arrow('q2', 'api', 'db', { tone: 'hl', label: 'SELECT …' });
  s.tone('db', 'hl');
  s.say('Step 2: on a miss, read from the database (the slow part).');
  s.tone('db', 'plain');
  s.del('q1');
  s.del('q2');
  s.set('cache', { sub: `product:${id} = £${old} (TTL ${ttl}s)`, tone: 'ok' });
  s.arrow('fill', 'api', 'cache', { tone: 'ok', label: 'store' });
  s.say(`Step 3: store the result in the cache with a TTL of ${ttl} s, and return it.`);
  s.del('fill');
  s.arrow('q3', 'api', 'cache', { tone: 'ok', label: 'hit!' });
  s.say('The next thousand requests for this product are hits: 1 ms each, and the database never hears about them.');
  s.del('q3');
  s.set('db', { sub: `50 ms · product ${id} = £${neu}`, tone: 'warn' });
  s.say(`An admin changes the price to £${neu} in the database. The cache still says £${old}: stale data.`);
  s.arrow('inv', 'api', 'cache', { tone: 'bad', label: `DELETE product:${id}` });
  s.set('cache', { sub: 'empty', tone: 'accent' });
  s.tone('db', 'plain');
  s.say('So every write also invalidates the cached key. The next read misses and loads the fresh price.');
  s.del('inv');
  s.box('crowd', { x: 0, y: 0, w: 100, h: 44, label: '3,000 requests', tone: 'warn' });
  s.arrow('st', 'crowd', 'db', { tone: 'bad', label: 'all miss at once' });
  s.say('Danger: when a hot key expires, thousands of requests can miss together and stampede the database.');
  s.del('st');
  s.arrow('one', 'api', 'db', { tone: 'ok', label: 'only one reload' });
  s.say('Fix: let one request reload the key while the others wait for its result. One database query instead of 3,000.');
  return s.build('Cache-aside, invalidation and stampedes');
};

// =====================================================================
// Load balancing
// =====================================================================

const loadBalancing: AnimScript = () => {
  const s = new Stage();
  const names = ['A', 'B', 'C'];
  const down = pick(names);
  s.box('lb', { x: 0, y: 110, w: 120, h: 44, label: 'load balancer', tone: 'accent', mono: false });
  names.forEach((n, i) => s.box(`s${n}`, { x: 360, y: 20 + i * 90, w: 110, h: 44, label: `server ${n}`, sub: '0 in progress' }));
  s.say('One public address, three identical app servers behind it.');
  const load: Record<string, number> = { A: 0, B: 0, C: 0 };
  for (let r = 0; r < 3; r++) {
    const n = names[r];
    load[n]++;
    s.arrow('req', 'lb', `s${n}`, { tone: 'accent', label: `req ${r + 1}` });
    s.set(`s${n}`, { sub: `${load[n]} in progress`, tone: 'hl' });
    s.say(r === 0 ? 'Round robin: request 1 goes to A…' : r === 1 ? '…request 2 to B…' : '…request 3 to C. Then back to A.');
    s.tone(`s${n}`, 'plain');
  }
  s.del('req');
  s.set(`s${down}`, { tone: 'bad', label: `server ${down}`, sub: 'health check failed ×3' });
  s.say(`Server ${down} crashes. The load balancer probes GET /health every few seconds; after three failures it marks ${down} down.`);
  const up = names.filter((n) => n !== down);
  for (let r = 0; r < 2; r++) {
    const n = up[r];
    load[n]++;
    s.arrow('req', 'lb', `s${n}`, { tone: 'accent', label: `req ${r + 4}` });
    s.set(`s${n}`, { sub: `${load[n]} in progress`, tone: 'hl' });
    s.say(r === 0 ? `New requests skip ${down} and go only to the healthy servers.` : 'Users notice nothing: the other servers absorb the traffic.');
    s.tone(`s${n}`, 'plain');
  }
  s.del('req');
  s.set(`s${up[0]}`, { sub: '9 in progress (slow reports)' });
  load[up[0]] = 9;
  const least = up.reduce((a, b) => (load[a] <= load[b] ? a : b));
  s.arrow('req', 'lb', `s${least}`, { tone: 'ok', label: 'least busy' });
  s.tone(`s${least}`, 'ok');
  s.say(`Least connections: if ${up[0]} is stuck on slow requests, new work goes to the server with the fewest in progress, ${least}.`);
  s.set(`s${down}`, { tone: 'plain', sub: 'healthy again' });
  s.say(`When ${down} restarts and passes its health checks, it rejoins the pool. Because the servers are stateless, any of them can serve any user.`);
  return s.build('Load balancing with health checks');
};

// =====================================================================
// Sharding & replication
// =====================================================================

const shardingReplication: AnimScript = () => {
  const s = new Stage();
  const n = 3;
  const user = randInt(100, 999);
  const shard = user % n;
  for (let i = 0; i < n; i++) {
    s.box(`sh${i}`, { x: 160 + i * 190, y: 0, w: 170, h: 250, shape: 'frame', label: `shard ${i}: id mod 3 = ${i}` });
    s.box(`L${i}`, { x: 175 + i * 190, y: 20, w: 140, h: 40, label: 'leader', sub: 'log: 0 writes', tone: 'accent', mono: false });
    s.box(`F${i}a`, { x: 175 + i * 190, y: 110, w: 140, h: 36, label: 'follower 1', sub: 'applied 0', mono: false });
    s.box(`F${i}b`, { x: 175 + i * 190, y: 180, w: 140, h: 36, label: 'follower 2', sub: 'applied 0', mono: false });
  }
  s.box('app', { x: 0, y: 100, w: 120, h: 44, label: 'app' });
  s.say('Sharding: users are split across 3 shards by id mod 3. Replication: each shard is copied onto a leader and 2 followers.');
  s.arrow('w', 'app', `L${shard}`, { tone: 'accent', label: `user ${user}` });
  s.tone(`L${shard}`, 'hl');
  s.say(`Write: update user ${user}. ${user} mod 3 = ${shard}, so it goes to shard ${shard}’s leader. The other shards never see it.`);
  s.set(`L${shard}`, { sub: 'log: 1 write', tone: 'accent' });
  s.say('The leader appends the write to its log and replies OK.');
  s.arrow('rep', `L${shard}`, `F${shard}a`, { tone: 'ok', label: 'stream log' });
  s.set(`F${shard}a`, { sub: 'applied 1', tone: 'ok' });
  s.say('It streams the log to its followers. Follower 1 has applied the write…');
  s.del('w');
  s.set(`F${shard}b`, { sub: 'applied 0 (lagging)', tone: 'warn' });
  s.arrow('r', 'app', `F${shard}b`, { tone: 'warn', label: 'read' });
  s.say('…but follower 2 is behind. A read sent to it returns the OLD value: replication lag. Reads that must see your own write go to the leader.');
  s.del('r');
  s.del('rep');
  s.set(`L${shard}`, { tone: 'bad', label: 'leader (dead)' });
  s.say(`Shard ${shard}’s leader crashes.`);
  s.set(`F${shard}a`, { label: 'NEW leader', tone: 'accent' });
  s.set(`L${shard}`, { label: 'gone', tone: 'dim' });
  s.say('The most up-to-date follower (follower 1, which has the write) is promoted. Writes for shard ' + shard + ' now go there. The other shards were never affected.');
  s.set(`F${shard}b`, { sub: 'catching up from new leader', tone: 'plain' });
  s.say('Had the leader died before streaming that write, it would be lost: the price of fast, asynchronous replication.');
  return s.build('Sharding, replication and failover');
};

// =====================================================================
// Message queues
// =====================================================================

const messageQueues: AnimScript = () => {
  const s = new Stage();
  const ids = [101, 102, 103].map((x) => x + randInt(0, 50) * 10);
  s.box('api', { x: 0, y: 100, w: 100, h: 44, label: 'checkout API', mono: false });
  s.box('q', { x: 160, y: 60, w: 260, h: 130, shape: 'frame', label: 'queue' });
  s.box('w1', { x: 500, y: 40, w: 110, h: 44, label: 'worker 1', mono: false });
  s.box('w2', { x: 500, y: 160, w: 110, h: 44, label: 'worker 2', mono: false });
  s.box('dlq', { x: 160, y: 240, w: 260, h: 40, label: 'dead-letter queue: empty', tone: 'dim' });
  s.say('Checkout puts work on a queue instead of calling the email service directly. Workers process it in the background.');
  ids.forEach((id, i) => {
    s.box(`m${id}`, { x: 175 + i * 80, y: 100, w: 70, h: 40, label: `#${id}` });
  });
  s.say(`Three orders placed: messages #${ids.join(', #')} are stored durably. Checkout already replied to the customers.`);
  s.move(`m${ids[0]}`, 520, 90);
  s.tone(`m${ids[0]}`, 'hl');
  s.set(`m${ids[0]}`, { sub: 'invisible 30 s' });
  s.say(`Worker 1 receives #${ids[0]}. It stays in the queue but is hidden from other workers for 30 s (the visibility timeout).`);
  s.set('w1', { tone: 'bad', label: 'worker 1 ✗' });
  s.say('Worker 1 sends the email… and crashes before acknowledging.');
  s.move(`m${ids[0]}`, 175, 100);
  s.set(`m${ids[0]}`, { sub: 'delivery 2', tone: 'warn' });
  s.say(`30 s pass with no ack, so #${ids[0]} becomes visible again. Nothing is lost: at-least-once delivery.`);
  s.move(`m${ids[0]}`, 520, 210);
  s.say(`Worker 2 receives #${ids[0]} again. It checks a table of processed message ids, sees #${ids[0]} already done, and skips the email: an idempotent consumer.`);
  s.del(`m${ids[0]}`);
  s.tone('w2', 'ok');
  s.say('It acknowledges, and the queue deletes the message for good.');
  s.set(`m${ids[1]}`, { sub: 'failed ×5', tone: 'bad' });
  s.say(`Message #${ids[1]} has bad data and makes every worker throw. After 5 failed deliveries…`);
  s.del(`m${ids[1]}`);
  s.set('dlq', { label: `dead-letter queue: #${ids[1]}`, tone: 'bad' });
  s.say('…it’s moved to the dead-letter queue for a human to look at, instead of blocking the workers forever.');
  return s.build('A message queue: ack, redelivery, dead letters');
};

// =====================================================================
// Rate limiting
// =====================================================================

const rateLimiting: AnimScript = () => {
  const s = new Stage();
  const cap = pick([4, 5]);
  const burst = cap + 2;
  s.box('cl', { x: 0, y: 90, w: 100, h: 44, label: 'client' });
  s.text('bt', 200, 0, `token bucket (max ${cap}, +1 token/s)`, { bold: true });
  for (let i = 0; i < cap; i++) s.box(`t${i}`, { x: 200 + i * 44, y: 20, w: 36, h: 36, label: '●', shape: 'circle', tone: 'ok' });
  s.say(`Each client has a bucket of ${cap} tokens. Each request spends one. The bucket refills at 1 token per second.`);
  let left = cap;
  for (let r = 1; r <= burst; r++) {
    if (left > 0) {
      left--;
      s.tone(`t${left}`, 'ghost');
      s.box('res', { x: 200, y: 120, w: 260, h: 34, label: `request ${r}: 200 OK`, tone: 'ok', mono: true });
      if (r === 1 || left === 0) s.say(r === 1 ? 'A burst of requests arrives. Request 1 takes a token: allowed.' : `Request ${r} takes the last token. A full bucket allows a burst of ${cap}.`);
    } else {
      s.box('res', { x: 200, y: 120, w: 260, h: 34, label: `request ${r}: 429 Too Many Requests`, tone: 'bad', mono: true });
      s.say(`Request ${r}: the bucket is empty, so it’s rejected immediately with 429 and a Retry-After header. No server work is wasted.`);
    }
  }
  s.tone('t0', 'ok');
  s.tone('t1', 'ok');
  s.set('res', { label: '2 s later: 2 tokens back', tone: 'plain' });
  s.say('Time passes and tokens drip back in: after 2 seconds, 2 more requests are allowed. Over time the client gets at most 1 request/second.');
  s.del('res');
  s.text('sw', 200, 190, 'sliding window: last 60 s of timestamps', { bold: true });
  const ts = [5, 18, 40, 61, 70];
  ts.forEach((t, i) => s.box(`w${i}`, { x: 200 + i * 60, y: 210, w: 52, h: 30, label: `${t}s`, mono: true }));
  s.say('Another approach: keep each client’s request times in a queue.');
  s.tone('w0', 'dim');
  s.tone('w1', 'dim');
  s.say('At time 75 s, drop the timestamps older than 60 s (5 s and 18 s)…');
  s.del('w0');
  s.del('w1');
  s.say('…and count what’s left (3). If that’s under the limit, allow the request and add its timestamp. Exact, and no burst at window edges.');
  return s.build('Token bucket and sliding window');
};

export const SD_ANIMS: Record<string, AnimScript> = {
  'caching-layer': cachingLayer,
  'load-balancing': loadBalancing,
  'sharding-replication': shardingReplication,
  'message-queues': messageQueues,
  'rate-limiting': rateLimiting,
};
