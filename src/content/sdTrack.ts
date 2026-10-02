import type { Card, Concept } from '../engine/types';
import { pick, randInt, shuffle } from '../engine/random';
import { explainGenerators, numberOptions } from './helpers';

// =====================================================================
// Caching layer
// =====================================================================

const CL = 'caching-layer';

const predictStale = (): Card => {
  const old = randInt(10, 40);
  const neu = old + randInt(1, 9);
  const ttl = pick([60, 300]);
  return {
    concept: CL,
    type: 'predict',
    prompt: `Product prices are cached for ${ttl} seconds (cache-aside: read the cache, on a miss read the database and fill the cache). An admin changes a price from £${old} to £${neu} in the database only. A customer loads the page 10 seconds later. What price do they see?`,
    body: {
      kind: 'choice',
      options: shuffle([
        { text: `£${old}`, correct: true },
        { text: `£${neu}`, correct: false, why: 'Nobody touched the cache, so the old copy is served until it expires.' },
        { text: 'An error', correct: false, why: 'The cache happily returns what it has.' },
      ]),
    },
    explain: `The cached £${old} lives for up to ${ttl} s. Fix: delete (invalidate) the cache key when the price is written, so the next read misses and loads £${neu}.`,
  };
};

const orderCacheAside = (): Card => ({
  concept: CL,
  type: 'simulate',
  prompt: 'Cache-aside: an API reads a user’s profile that isn’t cached yet, then the user edits it. Put the steps in order.',
  body: {
    kind: 'order',
    steps: ['Look for user:7 in the cache: miss.', 'Read user 7 from the database.', 'Store it in the cache with a TTL and return it.', 'The user updates their profile: write the new data to the database.', 'Delete user:7 from the cache, so the next read loads the fresh copy.'],
  },
  explain: 'Reads fill the cache lazily; writes go to the database and invalidate the cached copy. The TTL is a safety net if an invalidation is ever missed.',
});

const countHitRate = (): Card => {
  const hit = pick([80, 90, 95, 99]);
  const db = pick([100, 200]);
  const c = 1;
  return pick([
    {
      concept: CL,
      type: 'count' as const,
      prompt: `A cache answers in ${c} ms, the database in ${db} ms. ${hit}% of reads hit the cache; misses check the cache then go to the database. What is the average read time, in ms?`,
      body: { kind: 'number' as const, answer: Math.round((c + ((100 - hit) / 100) * db) * 10) / 10, unit: 'ms' },
      explain: `Every read pays the cache’s ${c} ms; ${100 - hit}% also pay ${db} ms: ${c} + ${(100 - hit) / 100} × ${db} = ${Math.round((c + ((100 - hit) / 100) * db) * 10) / 10} ms.`,
    },
    (() => {
      const rps = pick([1000, 5000, 20000]);
      return {
        concept: CL,
        type: 'count' as const,
        prompt: `An API gets ${rps.toLocaleString()} reads per second and the cache hit rate is ${hit}%. How many reads per second reach the database?`,
        body: { kind: 'number' as const, answer: (rps * (100 - hit)) / 100, unit: 'reads/s' },
        explain: `Only misses reach the database: ${100 - hit}% of ${rps.toLocaleString()} = ${(rps * (100 - hit)) / 100}. Going from 90% to 99% hits cuts database load by 10×.`,
      };
    })(),
  ]);
};

const clExplain = explainGenerators({
  concept: CL,
  truths: [
    'A cache keeps copies of expensive results in fast memory so most reads skip the slow source.',
    'Cache-aside: read the cache first; on a miss, load from the database and store it.',
    'Cached data can be stale, so writes should invalidate it and entries should expire (TTL).',
    'A small hot set of keys often gets most of the traffic, which is why caches work.',
  ],
  myths: [
    { text: 'A cache is always up to date with the database.', why: 'It holds a copy; it’s stale until invalidated or expired.' },
    { text: 'Caching makes writes faster.', why: 'It mainly speeds up repeated reads.' },
    { text: 'You can cache everything forever without problems.', why: 'Memory runs out and data goes stale.' },
  ],
  chains: [
    {
      prompt: 'What is a cache stampede and how do you stop it?',
      steps: ['A very popular key expires.', 'Thousands of requests miss at the same moment.', 'They all hit the database together, which may fall over.', 'Fix: let only one request reload the key while the others wait for its result.'],
    },
  ],
  summary: {
    best: 'A cache is a notepad next to a slow filing cabinet: you jot down answers you look up often, and cross them out when they change.',
    others: [
      { text: 'A cache is a faster database.', why: 'It’s a copy in front of the database.' },
      { text: 'A cache is a backup.', why: 'It can be wiped at any time.' },
      { text: 'A cache makes data correct.', why: 'It makes it fast, at the risk of staleness.' },
    ],
  },
});

export const cachingLayerConcept: Concept = {
  id: CL,
  kind: 'systems',
  title: 'Caching Layer',
  tier: 15,
  prereqs: ['lru-cache', 'http', 'db-indexes'],
  tagline: 'Remember expensive answers; forget them when they change.',
  hook: {
    problem: 'Your product page runs 12 database queries. Black Friday traffic is 50× normal and the database is at 100% CPU, yet 95% of those queries ask for the same 200 popular products.',
    question: 'What gives the biggest win?',
    options: [
      { text: 'Keep recently used results in memory (Redis or in-process), check there first, and invalidate them when products change.', good: true, feedback: 'Yes: a cache layer. 95% of reads never reach the database.' },
      { text: 'Buy a 50× bigger database server.', feedback: 'Hugely expensive, and there is a limit to how big one machine gets.' },
      { text: 'Add more indexes.', feedback: 'The queries are already fast; there are just too many of them.' },
    ],
  },
  lens: {
    layout: 'A fast key-value store (in memory, often LRU with TTLs) in front of a slower source of truth like a database.',
    invariant: 'The database is always the truth; a cached value is a copy that is either fresh or will be invalidated or expire.',
    payoff: 'Most reads are answered in a millisecond, and the database only sees misses.',
    price: 'Stale data, invalidation bugs, cold starts after a restart, and stampedes when hot keys expire.',
  },
  learn: {
    what: 'A caching layer stores the results of expensive reads (database queries, API calls, rendered pages) in fast memory. Most real traffic repeats the same few requests, so a cache in front of the database can absorb almost all of it. The hard part is keeping the copies from going stale.',
    how: [
      'Cache-aside: Get from cache → on a miss, load from the database, store with a TTL, return.',
      'On a write: update the database, then delete the cached key (invalidate).',
      'TTL: every entry expires eventually, a safety net for missed invalidations.',
      'Eviction: when memory is full, drop the least recently used entries (LRU).',
      'Stampede protection: when a hot key misses, only one caller reloads it; the rest wait for that result.',
    ],
  },
  extras: {
    family: 'caching',
    primitive: 'both',
    parts: ['a fast key-value store with LRU eviction', 'TTLs on every entry', 'invalidation on writes'],
    uses: ['Serve product pages on Black Friday without melting the database.', 'Remember the result of a slow third-party API call for a few minutes.'],
    breaks: [
      {
        violation: 'The code updates the database but forgets to invalidate the cached copy, and entries have no TTL.',
        result: 'Users see the old data forever (until the cache restarts).',
        wrong: ['The cache notices the database changed.', 'Only the next request is stale.', 'The database rejects the write.'],
      },
    ],
    transfer: [
      {
        problem: 'The home page’s “top deals” key expires every 60 s. Each time, 3,000 requests miss at once and the database CPU spikes to 100% for a few seconds.',
        answer: 'Stampede protection: let one request rebuild the key while others wait (or serve the old value while it refreshes in the background).',
        wrong: [
          { text: 'Lower the TTL.', why: 'Stampedes happen more often.' },
          { text: 'Remove the cache.', why: 'Every request hits the database.' },
          { text: 'Add more app servers.', why: 'More servers, more simultaneous misses.' },
        ],
        explain: 'The fix is to collapse many identical misses into one load: a lock or a shared Task per key.',
      },
    ],
  },
  generators: {
    predict: [predictStale],
    simulate: [orderCacheAside],
    count: [countHitRate],
    explain: clExplain,
  },
};

// =====================================================================
// Load balancing
// =====================================================================

const LB = 'load-balancing';

const predictRoundRobin = (): Card => {
  const n = randInt(3, 4);
  const servers = ['A', 'B', 'C', 'D'].slice(0, n);
  const down = pick(servers);
  const k = randInt(4, 7);
  const healthy = servers.filter((s) => s !== down);
  const seq = Array.from({ length: k }, (_, i) => healthy[i % healthy.length]);
  return {
    concept: LB,
    type: 'predict',
    prompt: `A load balancer uses round robin over servers ${servers.join(', ')}, in that order, starting at ${healthy[0]}. Health checks have marked ${down} as down. Which server gets request number ${k}?`,
    body: {
      kind: 'choice',
      options: servers.map((s) => ({
        text: s,
        correct: s === seq[k - 1],
        why: s === down ? `${down} is down, so it’s skipped.` : s === seq[k - 1] ? undefined : `The order is ${seq.join(', ')}.`,
      })),
    },
    explain: `Round robin cycles through the healthy servers only: ${seq.join(' → ')}.`,
  };
};

const predictLeast = (): Card => {
  const loads = shuffle([randInt(0, 3), randInt(4, 7), randInt(8, 12)]);
  const names = ['A', 'B', 'C'];
  const best = loads.indexOf(Math.min(...loads));
  return {
    concept: LB,
    type: 'predict',
    prompt: `Least connections: servers have ${names.map((s, i) => `${s} = ${loads[i]}`).join(', ')} requests in progress. Some requests take 10 ms and some take 10 s. Where does the next request go?`,
    body: {
      kind: 'choice',
      options: names.map((s, i) => ({ text: s, correct: i === best, why: i === best ? undefined : `${s} already has ${loads[i]} in progress.` })),
    },
    explain: 'Least connections sends work to whoever is least busy right now, which beats round robin when request costs vary a lot.',
  };
};

const orderFailover = (): Card => ({
  concept: LB,
  type: 'simulate',
  prompt: 'One of four app servers behind a load balancer crashes. Put what happens in order.',
  body: {
    kind: 'order',
    steps: ['The server stops answering its health check (GET /health).', 'After a few failed checks in a row, the load balancer marks it down.', 'New requests are spread over the remaining three servers.', 'The server restarts and passes its health checks again.', 'The load balancer marks it up and sends it traffic again.'],
  },
  explain: 'Health checks plus a pool of identical servers turn one machine dying into a non-event for users.',
});

const countServers = (): Card => {
  const rps = pick([2000, 5000, 12000]);
  const per = pick([500, 1000]);
  const need = Math.ceil(rps / per);
  return pick([
    {
      concept: LB,
      type: 'count' as const,
      prompt: `Peak traffic is ${rps.toLocaleString()} requests/s and one app server handles ${per}. If you want to survive one server failing at peak, how many servers do you need?`,
      body: { kind: 'number' as const, answer: need + 1, unit: 'servers' },
      explain: `${rps} ÷ ${per} = ${need} to carry the load, plus 1 spare (N+1) = ${need + 1}.`,
    },
    {
      concept: LB,
      type: 'count' as const,
      prompt: `${rps.toLocaleString()} requests/s are spread evenly over ${need + 1} servers. One fails. How many requests/s does each remaining server now handle?`,
      body: { kind: 'number' as const, answer: Math.round(rps / need), unit: 'req/s' },
      explain: `${rps} ÷ ${need} = ${Math.round(rps / need)}. Each survivor picks up a share of the dead server’s traffic.`,
    },
  ]);
};

const lbExplain = explainGenerators({
  concept: LB,
  truths: [
    'A load balancer spreads requests across a pool of identical servers.',
    'Health checks take broken servers out of the pool automatically.',
    'Round robin takes turns; least connections picks the least busy server.',
    'Servers behind a load balancer should be stateless, keeping sessions in a shared store.',
  ],
  myths: [
    { text: 'A load balancer makes each request faster.', why: 'It adds capacity and resilience, not per-request speed.' },
    { text: 'You can keep login sessions in each server’s memory with no downside.', why: 'The next request may land on another server.' },
    { text: 'Round robin is always best.', why: 'With uneven request costs, least connections balances better.' },
  ],
  chains: [
    {
      prompt: 'Why should app servers be stateless?',
      steps: ['The load balancer can send any request to any server.', 'If a server kept your session in memory, another server wouldn’t know you.', 'If that server died, your session would vanish.', 'So session data goes in a shared store (database or Redis), and any server can serve anyone.'],
    },
  ],
  summary: {
    best: 'A load balancer is the host at a busy restaurant: it seats each new table with a waiter who has room, and stops seating anyone with a waiter who has gone home.',
    others: [
      { text: 'A load balancer is a bigger server.', why: 'It spreads work over many servers.' },
      { text: 'A load balancer stores data.', why: 'It just routes requests.' },
      { text: 'A load balancer is a cache.', why: 'Different job: distributing, not remembering.' },
    ],
  },
});

export const loadBalancingConcept: Concept = {
  id: LB,
  kind: 'systems',
  title: 'Load Balancing',
  tier: 15,
  prereqs: ['http', 'latency-retries', 'queue'],
  tagline: 'Many servers, one address, nobody overloaded.',
  hook: {
    problem: 'One server can handle 1,000 requests a second. You get 8,000, and if that single server dies, the whole site is down.',
    question: 'How do you scale and survive a crash?',
    options: [
      { text: 'Run many identical servers and put a load balancer in front that spreads requests and skips servers that fail health checks.', good: true, feedback: 'Yes: horizontal scaling plus health checks.' },
      { text: 'Buy one server 8× bigger.', feedback: 'Still one machine: when it dies, everything dies.' },
      { text: 'Give each customer a different server address.', feedback: 'Uneven load and no automatic failover.' },
    ],
  },
  lens: {
    layout: 'One public address in front of a pool of identical, stateless servers, with a health status and a request count per server.',
    invariant: 'Every request goes to a healthy server, and load is spread so no healthy server is overwhelmed.',
    payoff: 'Add capacity by adding servers, and lose a server without users noticing.',
    price: 'Servers must be stateless, the load balancer itself must be redundant, and health checks can be slow to notice problems.',
  },
  learn: {
    what: 'A load balancer sits in front of several copies of your app and sends each incoming request to one of them. It’s how real sites handle more traffic than one machine can, and keep working when a machine crashes. In Azure or AWS you configure one; behind it, your ASP.NET app just runs on several servers.',
    how: [
      'Round robin: A, B, C, A, B, C…: simple and fair when requests cost about the same.',
      'Least connections: send to the server with the fewest requests in progress: better when costs vary.',
      'Health checks: probe GET /health every few seconds; mark a server down after several failures, up after it recovers.',
      'Keep servers stateless: sessions and uploads go to a shared database, cache or blob store.',
      'Plan for N+1: enough servers to carry peak load even with one down.',
    ],
  },
  extras: {
    family: 'scaling',
    primitive: 'abstract',
    parts: ['a pool of identical servers', 'a routing rule (round robin, least connections)', 'health checks'],
    uses: ['Run a web API on 6 servers behind one address.', 'Deploy a new version server by server with no downtime.'],
    breaks: [
      {
        violation: 'Each server keeps logged-in users’ sessions in its own memory, and the load balancer uses round robin.',
        result: 'Users are randomly logged out as their requests land on servers that don’t know them.',
        wrong: ['Nothing changes.', 'Sessions are copied automatically.', 'Only the first request is slower.'],
      },
    ],
    transfer: [
      {
        problem: 'A report endpoint takes 20 s while everything else takes 20 ms. With round robin, one server sometimes gets three reports in a row and its other requests time out.',
        answer: 'Use least connections (or a separate pool for reports), so slow work doesn’t pile up on one server.',
        wrong: [
          { text: 'Add a bigger timeout.', why: 'Users still wait behind the pile-up.' },
          { text: 'Use round robin with more servers.', why: 'Pile-ups still happen by chance.' },
          { text: 'Cache the health check.', why: 'Unrelated to the load spread.' },
        ],
        explain: 'Round robin assumes requests cost the same. When they don’t, balance on how busy servers actually are.',
      },
    ],
  },
  generators: {
    predict: [predictRoundRobin, predictLeast],
    simulate: [orderFailover],
    count: [countServers],
    explain: lbExplain,
  },
};

// =====================================================================
// Sharding & replication
// =====================================================================

const SR = 'sharding-replication';

const predictLag = (): Card => ({
  concept: SR,
  type: 'predict',
  prompt: 'A user changes their display name. The write goes to the leader database; reads are served by a follower that is 2 seconds behind. The page reloads immediately and reads from the follower. What does the user see?',
  body: {
    kind: 'choice',
    options: shuffle([
      { text: 'Their old name, as if the change didn’t save.', correct: true },
      { text: 'Their new name.', correct: false, why: 'The follower hasn’t received the change yet.' },
      { text: 'An error.', correct: false, why: 'The follower just returns its slightly old data.' },
      { text: 'Both names.', correct: false, why: 'Each copy has one version.' },
    ]),
  },
  explain: 'Replication lag. Fix: read-your-own-writes, e.g. read from the leader for a few seconds after a user writes.',
});

const predictShard = (): Card => {
  const n = pick([3, 4, 5, 8]);
  const id = randInt(10, 999);
  return {
    concept: SR,
    type: 'predict',
    prompt: `Users are sharded by user id: shard = id mod ${n}. Which shard holds user ${id}?`,
    body: {
      kind: 'choice',
      options: numberOptions(id % n, [
        { value: (id + 1) % n, why: 'Off by one.' },
        { value: Math.floor(id / n) % n, why: 'That’s division, not the remainder.' },
        { value: (id % n) + 1, why: 'Shards are numbered from 0.' },
        { value: (id + 2) % n, why: `${id} mod ${n} is ${id % n}.` },
      ], `${id} mod ${n} = ${id % n}.`),
    },
    explain: `${id} ÷ ${n} leaves ${id % n}. Every query for user ${id} goes straight to shard ${id % n}. (Changing the number of shards moves most keys, which is why consistent hashing exists.)`,
  };
};

const orderFailoverDb = (): Card => ({
  concept: SR,
  type: 'simulate',
  prompt: 'The leader of a replicated database crashes. Put the failover in order.',
  body: {
    kind: 'order',
    steps: ['The leader stops sending heartbeats.', 'The followers (or a coordinator) agree the leader is dead.', 'The follower with the most up-to-date log is promoted to leader.', 'Clients are redirected to the new leader for writes.', 'Writes the old leader accepted but never replicated are lost.'],
  },
  explain: 'Asynchronous replication is fast, but a crash can lose the last few writes. Synchronous replication (wait for a follower to confirm) prevents that at the cost of slower writes.',
});

const countQuorum = (): Card => {
  const n = pick([3, 5]);
  const w = pick(n === 3 ? [2, 3] : [3, 4]);
  return pick([
    {
      concept: SR,
      type: 'count' as const,
      prompt: `Each record is stored on ${n} replicas. A write waits for ${w} of them. What is the smallest number of replicas a read must ask so it’s guaranteed to see the latest write (R + W > N)?`,
      body: { kind: 'number' as const, answer: n - w + 1, unit: 'replicas' },
      explain: `R + ${w} > ${n} → R ≥ ${n - w + 1}. Any ${n - w + 1} replicas must overlap at least one of the ${w} that took the write.`,
    },
    (() => {
      const gb = pick([200, 600, 1200]);
      const per = pick([100, 200]);
      return {
        concept: SR,
        type: 'count' as const,
        prompt: `Your data is ${gb} GB and each machine can hold ${per} GB. Every shard is kept on 3 machines (a leader and 2 followers). How many machines do you need?`,
        body: { kind: 'number' as const, answer: Math.ceil(gb / per) * 3, unit: 'machines' },
        explain: `${Math.ceil(gb / per)} shards × 3 copies = ${Math.ceil(gb / per) * 3}. Sharding splits the data; replication multiplies it.`,
      };
    })(),
  ]);
};

const srExplain = explainGenerators({
  concept: SR,
  truths: [
    'Sharding splits data across machines by key, so each holds only part of it.',
    'Replication keeps copies of the same data on several machines.',
    'Sharding scales storage and writes; replication adds read capacity and survives failures.',
    'Followers usually lag behind the leader, so reads from them can be slightly stale.',
  ],
  myths: [
    { text: 'Replication lets you store more data than fits on one machine.', why: 'Each replica holds all of it; that’s sharding’s job.' },
    { text: 'Sharding by id mod N lets you add shards without moving data.', why: 'Changing N moves most keys; consistent hashing reduces that.' },
    { text: 'A query across all shards is as cheap as one on a single shard.', why: 'It has to ask every shard and merge the answers.' },
  ],
  chains: [
    {
      prompt: 'Why choose a good shard key?',
      steps: ['Every query that includes the key goes to one shard.', 'Queries without it must ask every shard.', 'A key with a few hot values puts most load on one shard.', 'So pick a key that spreads evenly and appears in most queries (like user id).'],
    },
  ],
  summary: {
    best: 'Sharding is splitting a phone book into volumes A–F, G–M and so on so no shelf has to hold it all; replication is keeping photocopies of each volume in case one burns.',
    others: [
      { text: 'Sharding and replication are the same thing.', why: 'One splits, the other copies.' },
      { text: 'Sharding is a backup.', why: 'Each shard holds different data.' },
      { text: 'Replication makes writes faster.', why: 'Writes must still reach the leader (and maybe followers).' },
    ],
  },
});

export const shardingReplicationConcept: Concept = {
  id: SR,
  kind: 'systems',
  title: 'Sharding & Replication',
  tier: 15,
  prereqs: ['consistent-hashing', 'write-ahead-log', 'transactions'],
  tagline: 'Split the data to grow; copy it to survive.',
  hook: {
    problem: 'Your database has 4 TB of data and 30,000 writes a second, more than any single machine handles. And when that machine fails, everything stops.',
    question: 'What do large systems do?',
    options: [
      { text: 'Split the data by key across many machines (sharding), and keep each piece on several machines (replication).', good: true, feedback: 'Yes: shards for size and write load; replicas for reads and failover.' },
      { text: 'Back it up every night.', feedback: 'Helps recovery, but doesn’t add capacity, and loses a day of data.' },
      { text: 'Cache everything.', feedback: 'Helps reads, but writes still overwhelm one machine.' },
    ],
  },
  lens: {
    layout: 'Shards, each owning a range or hash of keys; each shard has a leader that takes writes and followers that copy its log.',
    invariant: 'Each key lives on exactly one shard, and every copy of a shard applies the same writes in the same order.',
    payoff: 'Storage and write throughput grow with machines, reads spread across replicas, and a dead machine is replaced automatically.',
    price: 'Cross-shard queries and transactions are hard, followers lag, and failover can lose recent writes.',
  },
  learn: {
    what: 'When data outgrows one machine you split it: sharding puts different keys on different machines (users 0–999 here, 1000–1999 there). To survive failures and serve more reads, you copy each shard to several machines: replication. The leader takes writes and streams its log to followers.',
    how: [
      'Shard key: choose a field present in most queries that spreads evenly (user id, tenant id).',
      'Routing: hash(key) mod N, ranges, or consistent hashing (moves fewer keys when N changes).',
      'Replication: the leader appends each write to a log; followers replay it in order.',
      'Lag: followers are a little behind; read from the leader when you must see your own writes.',
      'Failover: if the leader dies, promote the most up-to-date follower. Quorums (R + W > N) give stronger guarantees.',
    ],
  },
  extras: {
    family: 'distributed-data',
    primitive: 'abstract',
    parts: ['a shard key and routing function', 'leader and followers per shard', 'a replicated log'],
    uses: ['Store 500 million user accounts across 32 database machines.', 'Keep the site up when a database machine dies.'],
    rivals: ['caching-layer'],
    breaks: [
      {
        violation: 'A chat app shards messages by country, and 60% of users are in one country.',
        result: 'One shard does most of the work and becomes the bottleneck (a hot shard), while others sit idle.',
        wrong: ['Load is spread evenly anyway.', 'Replication fixes it.', 'The database rebalances by itself instantly.'],
      },
    ],
    transfer: [
      {
        problem: 'An app shards orders by order id. The most common page, “my orders”, has to query all 16 shards and merge the results, and it’s slow.',
        answer: 'Shard by customer id instead, so all of a customer’s orders live on one shard and the common query hits one machine.',
        wrong: [
          { text: 'Add more shards.', why: 'The query would have to ask even more shards.' },
          { text: 'Add more replicas.', why: 'Still 16 shards per query.' },
          { text: 'Use a bigger machine per shard.', why: 'The fan-out is the problem.' },
        ],
        explain: 'Pick the shard key from your most common queries, so they stay on one shard.',
      },
    ],
  },
  generators: {
    predict: [predictLag, predictShard],
    simulate: [orderFailoverDb],
    count: [countQuorum],
    explain: srExplain,
  },
};

// =====================================================================
// Message queues
// =====================================================================

const MQ = 'message-queues';

const predictRedelivery = (): Card => ({
  concept: MQ,
  type: 'predict',
  prompt: 'A worker takes an “email receipt” message from the queue, sends the email, and then crashes before acknowledging the message. What happens next?',
  body: {
    kind: 'choice',
    options: shuffle([
      { text: 'The message becomes visible again and another worker sends the email a second time.', correct: true },
      { text: 'The message is lost forever.', correct: false, why: 'It wasn’t acknowledged, so the queue keeps it.' },
      { text: 'The queue knows the email was sent and deletes it.', correct: false, why: 'The queue only knows about acknowledgements.' },
      { text: 'The queue stops until the worker restarts.', correct: false, why: 'Other workers continue.' },
    ]),
  },
  explain: 'At-least-once delivery: anything not acknowledged is redelivered. So consumers must be idempotent, e.g. record which message ids they’ve handled.',
});

const orderQueue = (): Card => ({
  concept: MQ,
  type: 'simulate',
  prompt: 'A customer places an order; confirmation emails go through a queue. Put the steps in order.',
  body: {
    kind: 'order',
    steps: ['The API saves the order and puts an “order placed” message on the queue.', 'The API replies to the customer immediately.', 'A worker receives the message; it becomes invisible to other workers.', 'The worker sends the email and acknowledges the message.', 'The queue deletes the message.'],
  },
  explain: 'The slow part (email) happens after the customer already has their answer, and if a worker dies mid-way the message comes back for another worker.',
});

const countBacklog = (): Card => {
  const inRate = pick([100, 200, 500]);
  const per = pick([20, 25, 50]);
  const workers = randInt(2, 4);
  const mins = pick([5, 10]);
  const growth = Math.max(0, inRate - per * workers) * 60 * mins;
  return pick([
    {
      concept: MQ,
      type: 'count' as const,
      prompt: `Messages arrive at ${inRate}/s. Each worker handles ${per}/s. How many workers are needed so the queue doesn’t grow?`,
      body: { kind: 'number' as const, answer: Math.ceil(inRate / per), unit: 'workers' },
      explain: `${inRate} ÷ ${per} = ${Math.ceil(inRate / per)}. Fewer than that and the backlog grows forever.`,
    },
    {
      concept: MQ,
      type: 'count' as const,
      prompt: `Messages arrive at ${inRate}/s. ${workers} workers each handle ${per}/s. After ${mins} minutes, how many messages are waiting (starting from empty)?`,
      body: { kind: 'number' as const, answer: growth, unit: 'messages' },
      explain: `Processing ${per * workers}/s against ${inRate}/s arriving: grows ${Math.max(0, inRate - per * workers)}/s × ${60 * mins} s = ${growth}.`,
    },
  ]);
};

const mqExplain = explainGenerators({
  concept: MQ,
  truths: [
    'A message queue lets one service hand work to another without waiting for it to finish.',
    'Producers and consumers can run at different speeds; the queue absorbs bursts.',
    'Most queues deliver at least once, so consumers must handle duplicates.',
    'Messages that keep failing are moved to a dead-letter queue instead of blocking everything.',
  ],
  myths: [
    { text: 'Queues guarantee each message is processed exactly once.', why: 'Crashes cause redelivery; exactly-once needs idempotent consumers.' },
    { text: 'A queue makes slow work fast.', why: 'It moves the work off the request path; it still takes as long.' },
    { text: 'If the queue keeps growing, it will catch up on its own.', why: 'Only if consumers are faster than producers.' },
  ],
  chains: [
    {
      prompt: 'Why do queues make systems more reliable?',
      steps: ['The producer only needs the queue to be up, not the consumer.', 'If the consumer is down, messages wait in the queue.', 'When it comes back, it works through the backlog.', 'So a consumer outage delays work instead of losing it or failing requests.'],
    },
  ],
  summary: {
    best: 'A message queue is a to-do tray between two desks: one person drops jobs in and carries on; the other picks them up at their own pace, and nothing is lost if they step out.',
    others: [
      { text: 'A queue is a database.', why: 'It holds work in transit, not long-term records.' },
      { text: 'A queue makes calls faster.', why: 'It makes them asynchronous.' },
      { text: 'A queue is a list in memory.', why: 'Real queues are durable and shared between machines.' },
    ],
  },
});

export const messageQueuesConcept: Concept = {
  id: MQ,
  kind: 'systems',
  title: 'Message Queues',
  tier: 15,
  prereqs: ['queue', 'latency-retries', 'transactions'],
  tagline: 'Hand off work now; do it reliably later.',
  hook: {
    problem: 'Placing an order calls the email service, the warehouse system and the analytics service before replying. Any one being slow makes checkout slow; any one being down makes checkout fail.',
    question: 'How do you stop them dragging checkout down?',
    options: [
      { text: 'Save the order, put an “order placed” message on a durable queue, reply at once, and let each service process the message in its own time.', good: true, feedback: 'Yes: a message queue decouples them.' },
      { text: 'Call them all in parallel.', feedback: 'Still waits for the slowest and fails if one is down.' },
      { text: 'Skip them when they’re slow.', feedback: 'Orders never ship.' },
    ],
  },
  lens: {
    layout: 'A durable FIFO of messages; producers append, consumers receive, process and acknowledge. In-flight messages are hidden for a visibility timeout.',
    invariant: 'A message stays in the queue until a consumer acknowledges it; if it isn’t acknowledged in time, it is delivered again.',
    payoff: 'Producers don’t wait for consumers, bursts are absorbed, and consumer crashes delay work instead of losing it.',
    price: 'Work happens later (eventual consistency), duplicates must be handled, and growing backlogs need monitoring.',
  },
  learn: {
    what: 'A message queue (Azure Service Bus, RabbitMQ, SQS, Kafka) sits between services. A producer drops a message in and carries on; consumers pick messages up and process them. It turns “do this now, while the user waits” into “this will definitely get done, soon”.',
    how: [
      'Send: the producer appends a message; the queue stores it durably.',
      'Receive: a consumer takes the next message; it becomes invisible to others for a visibility timeout.',
      'Ack: after processing, the consumer deletes it. No ack before the timeout → it’s redelivered (at-least-once).',
      'Idempotent consumers: record processed message ids so a redelivery does nothing.',
      'Dead-letter queue: after N failed deliveries, move the message aside for a human to inspect.',
    ],
  },
  extras: {
    family: 'messaging',
    primitive: 'slots',
    parts: ['a durable FIFO', 'visibility timeouts and acknowledgements', 'a dead-letter queue'],
    uses: ['Send order confirmation emails without slowing down checkout.', 'Resize uploaded images on a pool of background workers.'],
    rivals: ['load-balancing'],
    breaks: [
      {
        violation: 'One message has a bug that makes every consumer crash, and there is no limit on deliveries.',
        result: 'It is redelivered forever (a poison message), wasting workers and possibly blocking the messages behind it.',
        wrong: ['The queue deletes it after a crash.', 'Only one worker is affected.', 'The message fixes itself.'],
      },
    ],
    transfer: [
      {
        problem: 'Customers are occasionally charged twice. The payment worker reads from a queue; logs show the same message processed twice after a worker restart.',
        answer: 'Make the consumer idempotent: store the message (or payment) id and skip any message already processed.',
        wrong: [
          { text: 'Switch to a queue with exactly-once delivery.', why: 'Crashes between work and ack still cause redelivery.' },
          { text: 'Never restart workers.', why: 'Crashes happen anyway.' },
          { text: 'Ack the message before charging.', why: 'Then a crash loses the payment entirely.' },
        ],
        explain: 'At-least-once delivery plus an idempotent consumer gives effectively-once processing.',
      },
    ],
  },
  generators: {
    predict: [predictRedelivery],
    simulate: [orderQueue],
    count: [countBacklog],
    explain: mqExplain,
  },
};

// =====================================================================
// Rate limiting
// =====================================================================

const RL = 'rate-limiting';

const predictBucket = (): Card => {
  const cap = pick([5, 10]);
  const burst = cap + randInt(2, 6);
  return {
    concept: RL,
    type: 'predict',
    prompt: `A token bucket holds up to ${cap} tokens and is full. Each request uses one token. A client sends ${burst} requests in the same instant. How many are allowed?`,
    body: {
      kind: 'choice',
      options: numberOptions(cap, [
        { value: burst, why: 'Only as many tokens as the bucket holds.' },
        { value: 1, why: 'A full bucket allows a burst.' },
        { value: 0, why: 'The bucket starts full.' },
        { value: cap - 1, why: 'All the tokens can be used.' },
      ], `${cap} tokens, so ${cap} requests; the other ${burst - cap} get 429 Too Many Requests.`),
    },
    explain: `The bucket allows a burst up to its size (${cap}), then only as fast as tokens refill.`,
  };
};

const predictFixedWindow = (): Card => {
  const limit = pick([10, 100]);
  return {
    concept: RL,
    type: 'predict',
    prompt: `A fixed-window limiter allows ${limit} requests per calendar minute (12:00:00–12:00:59, then 12:01:00–…). A client sends ${limit} requests at 12:00:59 and ${limit} more at 12:01:00. How many are allowed?`,
    body: {
      kind: 'choice',
      options: numberOptions(2 * limit, [
        { value: limit, why: 'They fall in two different windows, each with its own count.' },
        { value: 0, why: 'Each window starts at zero.' },
        { value: limit / 2, why: 'Fixed windows don’t smooth anything.' },
      ], `All ${2 * limit}: ${limit} in each window, but within 1 second.`),
    },
    explain: 'Fixed windows allow double the rate at the boundary. Sliding windows (count the last 60 s from now) or token buckets avoid that.',
  };
};

const orderLimit = (): Card => ({
  concept: RL,
  type: 'simulate',
  prompt: 'An API limits each key to 100 requests per minute using a sliding window. Put what happens on each request in order.',
  body: {
    kind: 'order',
    steps: ['Identify the client (API key or user id).', 'Drop that client’s timestamps older than 60 seconds.', 'Count the timestamps left.', 'If there are fewer than 100, record this request’s timestamp and let it through.', 'Otherwise reply 429 Too Many Requests with a Retry-After header.'],
  },
  explain: 'A queue of timestamps per client gives an exact sliding window. Token buckets give a cheaper approximation with bursts.',
});

const countRefill = (): Card => {
  const rate = pick([2, 5, 10]);
  const secs = randInt(2, 6);
  const cap = pick([10, 20, 50]);
  return {
    concept: RL,
    type: 'count',
    prompt: `A token bucket refills ${rate} tokens per second and holds at most ${cap}. It is empty. After ${secs} seconds with no requests, how many requests can go through at once?`,
    body: { kind: 'number', answer: Math.min(cap, rate * secs), unit: 'requests' },
    explain: `${rate} × ${secs} = ${rate * secs}${rate * secs > cap ? `, capped at the bucket size ${cap}` : ''}: ${Math.min(cap, rate * secs)}.`,
  };
};

const rlExplain = explainGenerators({
  concept: RL,
  truths: [
    'A rate limiter caps how many requests a client may make in a period of time.',
    'Over the limit, HTTP APIs reply 429 Too Many Requests.',
    'A token bucket allows short bursts up to its size, then a steady refill rate.',
    'A sliding window counts requests in the last N seconds from now, avoiding boundary bursts.',
  ],
  myths: [
    { text: 'Fixed windows strictly cap the rate at every moment.', why: 'Requests on both sides of a boundary can double it.' },
    { text: 'Rate limiting is only for stopping attackers.', why: 'It also protects shared capacity from one noisy customer or buggy client.' },
    { text: 'The limiter should just slow requests down by sleeping.', why: 'That ties up server resources; rejecting quickly is cheaper.' },
  ],
  chains: [
    {
      prompt: 'Why does one shared API need per-client limits?',
      steps: ['All clients share the same servers and database.', 'One buggy client in a retry loop can send thousands of requests a second.', 'Without limits it uses up the capacity everyone shares.', 'Per-client limits contain the damage to that one client.'],
    },
  ],
  summary: {
    best: 'A rate limiter is a bouncer with a clicker: each guest group may only come in so often, so one rowdy group can’t fill the whole club.',
    others: [
      { text: 'A rate limiter makes the API faster.', why: 'It protects capacity; it doesn’t add any.' },
      { text: 'A rate limiter is a firewall.', why: 'It limits how often, not who.' },
      { text: 'A rate limiter is a queue.', why: 'It rejects excess rather than storing it.' },
    ],
  },
});

export const rateLimitingConcept: Concept = {
  id: RL,
  kind: 'systems',
  title: 'Rate Limiting',
  tier: 15,
  prereqs: ['sliding-window', 'queue', 'http'],
  tagline: 'Fair share for everyone, 429 for the greedy.',
  hook: {
    problem: 'One customer’s script has a bug and calls your API 5,000 times a second. Every other customer’s requests start timing out.',
    question: 'How do you protect everyone else?',
    options: [
      { text: 'Count requests per client and reject those over their limit with 429 Too Many Requests.', good: true, feedback: 'Yes: per-client rate limiting.' },
      { text: 'Add servers until it’s handled.', feedback: 'The buggy script can always send more.' },
      { text: 'Block that customer forever.', feedback: 'Heavy-handed: they’re a paying customer with a bug.' },
    ],
  },
  lens: {
    layout: 'Per client: a token bucket (token count + last refill time) or a sliding window (a queue of recent timestamps).',
    invariant: 'No client gets more than its allowed rate; excess requests are rejected immediately.',
    payoff: 'Shared capacity is protected from any one client, and abuse or bugs are contained.',
    price: 'Per-client state (shared across servers, often in Redis), and legitimate bursts may be rejected.',
  },
  learn: {
    what: 'A rate limiter decides, for each request, whether this client is still within its allowance. Public APIs (GitHub, Stripe) all do it, and ASP.NET Core has a built-in rate limiting middleware. The classic algorithms are a token bucket and a sliding window.',
    how: [
      'Token bucket: a bucket of N tokens refills at R per second; each request takes one; empty bucket → 429.',
      'Fixed window: count per calendar minute. Simple, but allows 2× at window edges.',
      'Sliding window log: keep each client’s timestamps in a queue; drop old ones; count what’s left.',
      'Return 429 Too Many Requests with Retry-After so well-behaved clients back off.',
      'With many servers, keep counters in a shared store (Redis) so the limit is global.',
    ],
  },
  extras: {
    family: 'protection',
    primitive: 'slots',
    parts: ['per-client state', 'a token bucket or sliding window', '429 responses with Retry-After'],
    uses: ['Allow each API key 100 requests a minute.', 'Stop a login form from being brute-forced.'],
    breaks: [
      {
        violation: 'An app runs on 10 servers, and each keeps its own in-memory limit of 100 requests per minute per client.',
        result: 'A client can actually make about 1,000 per minute, as the load balancer spreads its requests over all 10.',
        wrong: ['The limit stays 100.', 'Servers share counters automatically.', 'The limit becomes 10.'],
      },
    ],
    transfer: [
      {
        problem: 'A login endpoint is being hit with millions of password guesses from many IP addresses for the same few accounts.',
        answer: 'Rate limit per account (and per IP): e.g. at most 5 failed attempts per account per 15 minutes.',
        wrong: [
          { text: 'Limit per IP only.', why: 'The attacker uses many IPs.' },
          { text: 'Add a CAPTCHA to the home page.', why: 'The attack targets the login endpoint.' },
          { text: 'Make passwords longer.', why: 'Doesn’t stop guessing.' },
        ],
        explain: 'Choose the limiting key to match the thing being protected: here, the account.',
      },
    ],
  },
  generators: {
    predict: [predictBucket, predictFixedWindow],
    simulate: [orderLimit],
    count: [countRefill],
    explain: rlExplain,
  },
};

export const SD_CONCEPTS: Concept[] = [cachingLayerConcept, loadBalancingConcept, shardingReplicationConcept, messageQueuesConcept, rateLimitingConcept];
