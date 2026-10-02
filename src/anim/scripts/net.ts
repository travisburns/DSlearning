import type { AnimScript } from '../engine';
import { Stage } from '../engine';
import { pick, randInt } from '../../engine/random';

// =====================================================================
// Packets & IP routing
// =====================================================================

const packetsIp: AnimScript = () => {
  const s = new Stage();
  const b = randInt(1, 200);
  const c = randInt(1, 200);
  const dest = pick([
    { ip: `10.${b}.${c}.${randInt(2, 250)}`, via: 'C', len: 24 },
    { ip: `10.${b}.${(c + 9) % 250}.${randInt(2, 250)}`, via: 'B', len: 16 },
    { ip: `8.8.${randInt(1, 9)}.${randInt(1, 9)}`, via: 'D', len: 0 },
  ]);
  const N = { A: [0, 120], B: [200, 30], C: [200, 210], D: [400, 120] } as Record<string, [number, number]>;
  for (const [k, [x, y]] of Object.entries(N)) s.box(`n${k}`, { x, y, w: 50, h: 50, label: k, sub: 'router', shape: 'circle' });
  s.arrow('lAB', 'nA', 'nB', { line: true, tone: 'dim' });
  s.arrow('lAC', 'nA', 'nC', { line: true, tone: 'dim' });
  s.arrow('lAD', 'nA', 'nD', { line: true, tone: 'dim' });
  s.say('The internet is a graph of routers. No router knows the whole graph, only its own links.');
  s.box('pkt', { x: -10, y: 40, w: 150, h: 40, label: `to ${dest.ip}`, top: 'packet header', tone: 'accent', mono: true });
  s.say(`A packet arrives at router A. Its header says where it’s going: ${dest.ip}.`);
  const routes = [
    { net: '0.0.0.0/0', hop: 'D', len: 0 },
    { net: `10.${b}.0.0/16`, hop: 'B', len: 16 },
    { net: `10.${b}.${c}.0/24`, hop: 'C', len: 24 },
  ];
  s.text('th', 520, 0, 'A’s routing table', { bold: true });
  routes.forEach((r, i) => s.box(`rt${i}`, { x: 520, y: 14 + i * 34, w: 190, h: 28, label: `${r.net} → ${r.hop}`, mono: true }));
  s.say('A’s routing table maps address prefixes (groups of addresses) to the next router, not to individual computers.');
  routes.forEach((r, i) => {
    const m = r.len <= dest.len;
    s.tone(`rt${i}`, m ? 'hl' : 'dim');
    s.say(m ? `${r.net}: the first ${r.len} bits ${r.len ? 'match' : '(none) always match'}. A candidate.` : `${r.net}: ${dest.ip} isn’t in this network. No match.`);
  });
  const win = routes.findIndex((r) => r.len === dest.len);
  s.tone(`rt${win}`, 'ok');
  s.say(`Longest prefix match: of the matching routes, the most specific (/${dest.len}) wins. Next hop: router ${dest.via}.`);
  const [x, y] = N[dest.via];
  s.arrow(`lA${dest.via}`, 'nA', `n${dest.via}`, { line: true, tone: 'ok' });
  s.move('pkt', x - 40, y - 46);
  s.say(`The packet goes one hop to router ${dest.via}. That router repeats the same lookup with its own table, and so on until it reaches the destination.`);
  s.tone('pkt', 'warn');
  s.say('IP is best effort: a busy router may drop the packet, and packets of one message can take different paths and arrive out of order. TCP (next lesson) fixes that.');
  return s.build('Routing a packet hop by hop');
};

// =====================================================================
// TCP
// =====================================================================

const tcp: AnimScript = () => {
  const s = new Stage();
  const n = 5;
  const lost = randInt(2, 4);
  s.box('cl', { x: 0, y: 0, w: 90, h: 300, label: 'client', shape: 'frame' });
  s.box('sv', { x: 460, y: 0, w: 90, h: 300, label: 'server', shape: 'frame' });
  s.box('m1', { x: 180, y: 10, w: 180, h: 26, label: 'SYN (seq starts at 0)', tone: 'accent', mono: true });
  s.say('Opening a connection: the client sends SYN, “let’s talk, my byte numbers start here”.');
  s.box('m2', { x: 180, y: 42, w: 180, h: 26, label: '← SYN-ACK', tone: 'accent', mono: true });
  s.say('The server replies SYN-ACK. One more ACK from the client and the connection is open: a full round trip before any data.');
  s.del('m1');
  s.del('m2');
  for (let i = 1; i <= n; i++) s.box(`s${i}`, { x: 100, y: 10 + (i - 1) * 34, w: 120, h: 28, label: `seg ${i}: ${(i - 1) * 100}–${i * 100 - 1}`, tone: 'hl', mono: true });
  s.say(`The client has 500 bytes to send, in ${n} segments of 100 bytes. Each carries the number of its first byte.`);
  s.say('A sliding window lets it send all of them without waiting for each ACK. They’re all in flight at once.');
  s.text('rb', 330, 216, 'receive buffer', { size: 'sm', bold: true, tone: 'dim' });
  for (let i = 1; i <= n; i++) {
    if (i === lost) {
      s.move(`s${i}`, 250, 10 + (i - 1) * 34);
      s.tone(`s${i}`, 'bad');
      s.set(`s${i}`, { label: `seg ${i}: LOST` });
      s.say(`Segment ${i} is dropped by a busy router.`);
      s.del(`s${i}`);
    } else {
      s.move(`s${i}`, 330, 10 + (i - 1) * 34);
      s.tone(`s${i}`, i < lost ? 'ok' : 'warn');
    }
  }
  s.say(`Segments ${Array.from({ length: n }, (_, i) => i + 1).filter((i) => i > lost).join(', ')} arrive but wait (amber) in the buffer: the app must get bytes in order, and there’s a gap.`);
  s.box('ack', { x: 180, y: 250, w: 200, h: 28, label: `← ACK ${(lost - 1) * 100}`, tone: 'accent', mono: true });
  s.say(`The receiver keeps replying ACK ${(lost - 1) * 100}: “I have everything before byte ${(lost - 1) * 100}”. ACKs are cumulative, so they can’t skip the gap.`);
  s.box(`s${lost}`, { x: 100, y: 10 + (lost - 1) * 34, w: 120, h: 28, label: `seg ${lost} (resent)`, tone: 'hl', mono: true });
  s.say(`The sender sees repeated ACKs (or its timer runs out) and resends segment ${lost}.`);
  s.move(`s${lost}`, 330, 10 + (lost - 1) * 34);
  for (let i = 1; i <= n; i++) s.tone(`s${i}`, 'ok');
  s.set('ack', { label: `← ACK ${n * 100}` });
  s.say(`The gap is filled. All ${n} segments go to the app in order, and the ACK jumps to ${n * 100}: everything received.`);
  return s.build('TCP: ACKs and resending a lost segment');
};

// =====================================================================
// DNS
// =====================================================================

const dns: AnimScript = () => {
  const s = new Stage();
  const name = pick(['shop', 'api', 'mail', 'www']) + '.example.com';
  const ip = `93.184.${randInt(1, 250)}.${randInt(1, 250)}`;
  const ttl = pick([60, 300, 3600]);
  s.box('pc', { x: 0, y: 120, w: 90, h: 44, label: 'laptop' });
  s.box('res', { x: 170, y: 120, w: 110, h: 44, label: 'resolver', sub: 'cache: empty', tone: 'accent' });
  s.box('root', { x: 400, y: 0, w: 140, h: 40, label: 'root (.)' });
  s.box('com', { x: 400, y: 100, w: 140, h: 40, label: '.com servers' });
  s.box('ex', { x: 400, y: 200, w: 140, h: 40, label: 'example.com NS' });
  s.say(`The laptop needs the IP address of ${name}. Packets can only go to numbers, not names.`);
  s.arrow('q0', 'pc', 'res', { tone: 'accent', label: name });
  s.say('It asks its resolver (your ISP’s, or 1.1.1.1). The resolver’s cache is empty, so it has to walk the tree of names from the top.');
  s.arrow('q1', 'res', 'root', { tone: 'hl', label: 'where’s .com?' });
  s.tone('root', 'hl');
  s.say('Root servers don’t know the answer, but they know who runs .com.');
  s.tone('root', 'dim');
  s.arrow('q2', 'res', 'com', { tone: 'hl', label: 'example.com?' });
  s.tone('com', 'hl');
  s.say('The .com servers don’t know either, but they know which name servers run example.com.');
  s.tone('com', 'dim');
  s.arrow('q3', 'res', 'ex', { tone: 'ok', label: name });
  s.tone('ex', 'ok');
  s.say(`example.com’s own name server is authoritative: “${name} = ${ip}, TTL ${ttl} s”.`);
  s.del('q1');
  s.del('q2');
  s.del('q3');
  s.set('res', { sub: `${name.split('.')[0]} → ${ip} (${ttl}s)`, tone: 'ok' });
  s.arrow('a0', 'res', 'pc', { tone: 'ok', label: ip });
  s.del('q0');
  s.say(`The resolver caches the answer for ${ttl} seconds and returns it. Now the laptop can open a TCP connection to ${ip}.`);
  s.del('a0');
  s.box('pc2', { x: 180, y: 260, w: 90, h: 44, label: 'phone' });
  s.arrow('q4', 'pc2', 'res', { tone: 'accent', label: name });
  s.say('A minute later, another device asks the same resolver for the same name.');
  s.del('q4');
  s.arrow('a4', 'res', 'pc2', { tone: 'ok', label: `${ip} (cached)` });
  s.say('Answered straight from cache in about a millisecond. No root, no .com, no example.com. Most lookups work like this.');
  s.set('res', { sub: 'cache: expired', tone: 'warn' });
  s.say(`After ${ttl} seconds the cached copy expires, and the next lookup walks the tree again. That’s why a DNS change can take up to the TTL to reach everyone.`);
  return s.build('DNS: walking the tree, then caching');
};

// =====================================================================
// HTTP
// =====================================================================

const http: AnimScript = () => {
  const s = new Stage();
  const id = randInt(10, 99);
  const rtt = pick([20, 40, 80]);
  s.box('cl', { x: 0, y: 0, w: 90, h: 280, label: 'browser', shape: 'frame' });
  s.box('sv', { x: 470, y: 0, w: 90, h: 280, label: 'server', shape: 'frame' });
  const steps = ['DNS lookup', 'TCP handshake', 'TLS handshake'];
  steps.forEach((t, i) => {
    s.box(`rt${i}`, { x: 120, y: 10 + i * 34, w: 320, h: 28, label: `${t}: 1 round trip (${rtt} ms)`, tone: 'dim', mono: true });
    s.say(i === 0 ? `A brand-new HTTPS request to /orders/${id}. First: the server’s address (DNS).` : i === 1 ? 'Then the TCP handshake to open a connection.' : 'Then TLS, to agree on encryption keys (the “s” in https).');
  });
  s.say(`${3 * rtt} ms gone and not one byte of the request sent yet.`);
  s.box('req', { x: 120, y: 120, w: 320, h: 70, label: `GET /orders/${id} HTTP/1.1\nHost: shop.example.com\nAccept: application/json`, tone: 'accent', mono: true });
  s.say('The request: a method (GET = read), a path, then headers. A blank line ends the headers; GET has no body.');
  s.box('res', { x: 120, y: 200, w: 320, h: 70, label: `HTTP/1.1 200 OK\nContent-Type: application/json\n\n{"id":${id},"total":42.5}`, tone: 'ok', mono: true });
  s.say('The response: a status code (200 OK), headers saying what the body is, a blank line, then the body.');
  s.say(`Total: 4 round trips = ${4 * rtt} ms before the answer arrives.`);
  for (let i = 0; i < 3; i++) s.del(`rt${i}`);
  s.set('req', { label: `POST /payments HTTP/1.1\nIdempotency-Key: 7f3a\n\n{"amount":20}` });
  s.tone('res', 'dim');
  s.set('res', { label: '…no response (timeout)' });
  s.say('Next request reuses the same connection: one round trip. But this POST times out. Did the payment happen or not?');
  s.set('res', { label: 'HTTP/1.1 201 Created\n(same result as first try)', tone: 'ok' });
  s.say('The client retries with the same Idempotency-Key. The server sees it already handled that key and returns the stored result instead of charging twice.');
  s.set('res', { label: '4xx: you sent something wrong\n5xx: I (the server) failed', tone: 'warn' });
  s.say('Status code families tell the client what to do: fix a 4xx request; retry a 5xx (like 503) later with backoff.');
  return s.build('An HTTP request, start to finish');
};

// =====================================================================
// Latency, timeouts & retries
// =====================================================================

const latencyRetries: AnimScript = () => {
  const s = new Stage();
  const base = pick([100, 200]);
  const fails = randInt(2, 3);
  s.box('svc', { x: 0, y: 100, w: 110, h: 50, label: 'checkout' });
  s.box('dep', { x: 440, y: 100, w: 130, h: 50, label: 'shipping API', tone: 'bad' });
  s.box('brk', { x: 220, y: 20, w: 130, h: 40, label: 'breaker: CLOSED', tone: 'ok', mono: true });
  s.say('Checkout calls a shipping-rates API. Today the API is struggling.');
  let wait = base;
  for (let i = 1; i <= fails; i++) {
    s.arrow('call', 'svc', 'dep', { tone: 'accent', label: `try ${i}` });
    s.box('t', { x: 180, y: 180, w: 220, h: 30, label: `timeout after 1000 ms`, tone: 'bad', mono: true });
    s.say(i === 1 ? 'Every call has a timeout. Without one, a hung call would hold a thread forever, and soon every thread would be stuck.' : `Try ${i} times out too.`);
    s.del('call');
    const j = randInt(0, Math.floor(wait / 2));
    s.set('t', { label: `wait ${wait} ms + jitter ${j} ms`, tone: 'warn' });
    s.say(i === 1 ? `Wait before retrying: ${wait} ms plus a random extra (jitter), so thousands of clients don’t all retry at the same instant.` : `Exponential backoff: the wait doubles to ${wait} ms (plus jitter).`);
    wait *= 2;
  }
  s.set('brk', { label: 'breaker: OPEN', tone: 'bad' });
  s.set('t', { label: 'fail fast: “rates unavailable”', tone: 'bad' });
  s.say(`After ${fails} failures in a row the circuit breaker opens. For the next 30 s, calls fail instantly without touching the API: checkout shows a fallback and the API gets room to recover.`);
  s.set('dep', { tone: 'ok' });
  s.set('brk', { label: 'breaker: HALF-OPEN', tone: 'warn' });
  s.arrow('call', 'svc', 'dep', { tone: 'accent', label: 'one trial call' });
  s.say('After the cool-down, the breaker lets one trial call through.');
  s.set('t', { label: '200 OK in 80 ms', tone: 'ok' });
  s.set('brk', { label: 'breaker: CLOSED', tone: 'ok' });
  s.say('It succeeds, so the breaker closes and traffic flows normally again. A sick dependency was contained instead of taking checkout down with it.');
  return s.build('Timeouts, backoff and a circuit breaker');
};

export const NET_ANIMS: Record<string, AnimScript> = {
  'packets-ip': packetsIp,
  tcp,
  dns,
  http,
  'latency-retries': latencyRetries,
};
