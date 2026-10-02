import type { Card, Concept } from '../engine/types';
import { pick, randInt, shuffle } from '../engine/random';
import { explainGenerators, numberOptions } from './helpers';

// =====================================================================
// Packets & IP routing
// =====================================================================

const IP = 'packets-ip';

const predictSubnet = (): Card => {
  const a = pick([10, 172, 192]);
  const b = randInt(0, 255);
  const c = randInt(0, 255);
  const inside = Math.random() < 0.5;
  const prefix = pick([16, 24]);
  const host = prefix === 24 ? `${a}.${b}.${inside ? c : (c + randInt(1, 50)) % 256}.${randInt(1, 254)}` : `${a}.${inside ? b : (b + randInt(1, 50)) % 256}.${randInt(0, 255)}.${randInt(1, 254)}`;
  const net = prefix === 24 ? `${a}.${b}.${c}.0/24` : `${a}.${b}.0.0/16`;
  return {
    concept: IP,
    type: 'predict',
    prompt: `Is ${host} inside the network ${net}?`,
    body: {
      kind: 'choice',
      options: [
        { text: 'Yes', correct: inside, why: inside ? undefined : `/${prefix} means the first ${prefix} bits (${prefix / 8} numbers) must match exactly.` },
        { text: 'No', correct: !inside, why: !inside ? undefined : `The first ${prefix / 8} numbers match, and /${prefix} only fixes those.` },
      ],
    },
    explain: `/${prefix} fixes the first ${prefix} bits, which is the first ${prefix / 8} parts of the address. ${inside ? 'They match, so it is inside.' : 'They differ, so it is a different network.'}`,
  };
};

const predictLongest = (): Card => {
  const b = randInt(1, 200);
  const c = randInt(1, 200);
  const routes = shuffle([
    { net: '0.0.0.0/0', hop: 'internet gateway', len: 0 },
    { net: `10.${b}.0.0/16`, hop: 'office router', len: 16 },
    { net: `10.${b}.${c}.0/24`, hop: 'lab switch', len: 24 },
  ]);
  const dest = pick([
    { ip: `10.${b}.${c}.${randInt(2, 250)}`, want: 24 },
    { ip: `10.${b}.${(c + 7) % 250}.${randInt(2, 250)}`, want: 16 },
    { ip: `8.8.${randInt(1, 9)}.${randInt(1, 9)}`, want: 0 },
  ]);
  const right = routes.find((r) => r.len === dest.want)!;
  return {
    concept: IP,
    type: 'predict',
    prompt: `A router’s table: ${routes.map((r) => `${r.net} → ${r.hop}`).join('; ')}. Where does it send a packet for ${dest.ip}?`,
    body: {
      kind: 'choice',
      options: routes.map((r) => ({ text: r.hop, correct: r === right, why: r === right ? undefined : r.len > dest.want ? `${dest.ip} isn’t inside ${r.net}.` : 'It matches, but a longer (more specific) prefix also matches.' })),
    },
    explain: `Longest prefix match: of all routes that contain ${dest.ip}, use the most specific one (${right.net}). 0.0.0.0/0 matches everything, so it’s the default when nothing else does.`,
  };
};

const orderPacket = (): Card => ({
  concept: IP,
  type: 'simulate',
  prompt: 'Your laptop sends a photo to a server in another country. Put the steps in order.',
  body: {
    kind: 'order',
    steps: ['The photo is split into packets, each with a header holding the destination IP address.', 'Each packet goes to your home router (the default gateway).', 'Each router looks up the destination in its routing table and forwards the packet one hop.', 'Packets travel hop by hop, possibly by different paths.', 'The server receives the packets and puts the photo back together.'],
  },
  explain: 'The network only moves packets one hop at a time, each router deciding independently. Putting them back in order and resending lost ones is TCP’s job (next lesson).',
});

const countAddresses = (): Card => {
  const n = pick([20, 22, 24, 26, 28, 30]);
  return {
    concept: IP,
    type: 'count',
    prompt: `How many IP addresses are in a /${n} network? (An IPv4 address has 32 bits.)`,
    body: { kind: 'number', answer: 2 ** (32 - n), unit: 'addresses' },
    explain: `/${n} fixes ${n} bits, leaving ${32 - n} free: 2^${32 - n} = ${(2 ** (32 - n)).toLocaleString()} addresses.`,
  };
};

const ipExplain = explainGenerators({
  concept: IP,
  truths: [
    'Data on the internet travels as small packets, each with a destination IP address in its header.',
    'An IPv4 address is a 32-bit number, written as four numbers from 0 to 255.',
    'A prefix like /24 means the first 24 bits identify the network.',
    'Each router forwards a packet to the next hop using longest prefix match on its routing table.',
    'IP alone is best effort: packets can be lost, duplicated or arrive out of order.',
  ],
  myths: [
    { text: 'Every router knows the full path to every computer.', why: 'Each router only knows the next hop for each prefix.' },
    { text: 'IP guarantees packets arrive in order.', why: 'That’s TCP’s job, on top of IP.' },
    { text: '192.168.1.7 and 192.168.2.7 are on the same /24 network.', why: 'The third number differs, and /24 fixes the first three.' },
  ],
  chains: [
    {
      prompt: 'Why does routing scale to billions of devices?',
      steps: ['Addresses are grouped into networks by prefix.', 'A router stores one entry per prefix, not per device.', 'Each router only decides the next hop.', 'So tables stay small and the work is spread across all routers.'],
    },
  ],
  summary: {
    best: 'IP is the postal system of the internet: data goes in small envelopes with an address, and each sorting office just sends each envelope one step closer.',
    others: [
      { text: 'IP is your internet connection.', why: 'Too vague.' },
      { text: 'IP sends files.', why: 'It sends packets; files are split up.' },
      { text: 'IP addresses are names for websites.', why: 'Names are DNS; IP addresses are numbers.' },
    ],
  },
});

export const packetsIpConcept: Concept = {
  id: IP,
  kind: 'systems',
  title: 'Packets & IP Routing',
  tier: 14,
  prereqs: ['bits', 'graph'],
  tagline: 'Envelopes with addresses, passed hop by hop.',
  hook: {
    problem: 'Billions of devices, connected through millions of routers. No router can possibly know where every device is.',
    question: 'How does a message still find its way?',
    options: [
      { text: 'Split it into packets with a destination address; each router only knows which neighbour is one step closer for each group of addresses.', good: true, feedback: 'Yes: packets plus hop-by-hop routing on address prefixes.' },
      { text: 'Every router stores every device.', feedback: 'Billions of entries per router, changing constantly.' },
      { text: 'Send it to every device and let the right one keep it.', feedback: 'That would flood the whole internet with every message.' },
    ],
  },
  lens: {
    layout: 'Packets (header with source and destination IP + data); routers, each with a table of prefix → next hop; a graph of links.',
    invariant: 'Every router forwards each packet to the next hop of the longest prefix that matches its destination.',
    payoff: 'Any device can reach any other through a network no single machine fully knows.',
    price: 'Best effort only: packets can be lost, reordered or duplicated, and each hop adds delay.',
  },
  learn: {
    what: 'The internet is a huge graph of routers. Data is split into packets, small chunks each carrying a header with source and destination IP addresses. Each router looks at the destination, picks the next hop from its routing table, and passes the packet on. Nobody knows the whole map; each router just knows its neighbours.',
    how: [
      'An IPv4 address is a 32-bit number, written as four 0–255 parts: 192.168.1.20.',
      'A network is a prefix: 192.168.1.0/24 means “every address whose first 24 bits match”, 256 addresses.',
      'A routing table maps prefixes to next hops. 0.0.0.0/0 matches everything (the default route).',
      'Longest prefix match: when several routes match, use the most specific (the longest prefix). Tries are the classic structure for this.',
      'IP is best effort: packets can be lost or arrive out of order. TCP fixes that.',
    ],
  },
  extras: {
    family: 'routing',
    primitive: 'bits',
    parts: ['32-bit addresses and prefixes', 'a routing table per router', 'longest prefix match'],
    uses: ['Decide which link a router should send a packet out on.', 'Check whether a client’s IP address is inside the company’s office network.'],
    breaks: [
      {
        violation: 'Two routers each list the other as the next hop for the same prefix.',
        result: 'A routing loop: packets bounce between them until their hop counter (TTL) runs out and they are dropped.',
        wrong: ['The packets get delivered faster.', 'The routers merge their tables.', 'The packets go to the default route.'],
      },
    ],
    transfer: [
      {
        problem: 'A firewall must decide, for millions of packets a second, which rule applies: rules are written for networks like 10.0.0.0/8, 10.4.0.0/16, 10.4.7.0/24.',
        answer: 'Use longest prefix match, e.g. with a trie on the address bits: the most specific matching rule wins.',
        wrong: [
          { text: 'Check every rule in order for every packet.', why: 'Too slow at millions per second.' },
          { text: 'Use the first rule that matches.', why: 'Order would decide instead of specificity.' },
          { text: 'Keep a dictionary of every single IP address.', why: 'Billions of entries.' },
        ],
        explain: 'Same problem as routing: specific rules override general ones, and prefix structures make the lookup fast.',
      },
    ],
  },
  generators: {
    predict: [predictSubnet, predictLongest],
    simulate: [orderPacket],
    count: [countAddresses],
    explain: ipExplain,
  },
};

// =====================================================================
// TCP
// =====================================================================

const TC = 'tcp';

const predictAck = (): Card => {
  const size = pick([100, 500, 1000]);
  const n = randInt(4, 6);
  const lost = randInt(2, n - 1);
  const got = Array.from({ length: n }, (_, i) => i + 1).filter((i) => i !== lost);
  const ack = (lost - 1) * size;
  return {
    concept: TC,
    type: 'predict',
    prompt: `A sender sends segments 1 to ${n}, each ${size} bytes (segment 1 holds bytes 0–${size - 1}, and so on). Segment ${lost} is lost. The receiver has segments ${got.join(', ')}. TCP acknowledges the next byte it expects. What does it ACK?`,
    body: {
      kind: 'choice',
      options: numberOptions(ack, [
        { value: n * size, why: `It can’t acknowledge past the gap left by segment ${lost}.` },
        { value: lost * size, why: `Segment ${lost} itself never arrived.` },
        { value: (n - 1) * size, why: 'ACKs are cumulative: everything before the number has arrived.' },
      ], `Everything before byte ${ack} has arrived; byte ${ack} (segment ${lost}) hasn’t.`),
    },
    explain: `ACK ${ack} means “I have everything before byte ${ack}”. The later segments are kept in a buffer; after segment ${lost} is resent, the ACK jumps to ${n * size}.`,
  };
};

const orderTcp = (): Card => ({
  concept: TC,
  type: 'simulate',
  prompt: 'A browser opens a TCP connection, sends a request and closes the connection. Put the steps in order.',
  body: {
    kind: 'order',
    steps: ['Client sends SYN (“let’s talk; my numbers start at x”).', 'Server replies SYN-ACK (“OK; mine start at y”).', 'Client sends ACK: the connection is open.', 'Data flows both ways; each side ACKs what it receives and resends what isn’t ACKed.', 'Each side sends FIN to close its direction.'],
  },
  explain: 'The three-way handshake costs one round trip before any data. That’s why reusing connections (keep-alive) matters for speed.',
});

const countThroughput = (): Card => {
  const w = pick([10, 20, 50]);
  const rtt = pick([10, 20, 50, 100]);
  return pick([
    {
      concept: TC,
      type: 'count' as const,
      prompt: `TCP may have at most ${w} unacknowledged segments in flight (its window). The round-trip time is ${rtt} ms. At most how many segments per second can it deliver?`,
      body: { kind: 'number' as const, answer: (w * 1000) / rtt, unit: 'segments/s' },
      explain: `Every ${rtt} ms, at most a full window (${w}) is sent and acknowledged: ${w} × (1000 ÷ ${rtt}) = ${(w * 1000) / rtt}. Bigger windows or shorter round trips mean more throughput.`,
    },
    (() => {
      const seq = randInt(1, 50) * 100;
      const len = pick([100, 200, 300, 500]);
      return {
        concept: TC,
        type: 'count' as const,
        prompt: `A segment starts at sequence number ${seq} and carries ${len} bytes. It arrives in order. What ACK number does the receiver send back?`,
        body: { kind: 'number' as const, answer: seq + len, unit: '' },
        explain: `The ACK is the next byte expected: ${seq} + ${len} = ${seq + len}.`,
      };
    })(),
  ]);
};

const tcExplain = explainGenerators({
  concept: TC,
  truths: [
    'TCP turns unreliable packets into a reliable, ordered stream of bytes.',
    'Every byte has a sequence number, and the receiver acknowledges what it has received.',
    'Segments that aren’t acknowledged in time are resent.',
    'A sliding window lets many segments be in flight before the first is acknowledged.',
    'A connection starts with a three-way handshake: SYN, SYN-ACK, ACK.',
  ],
  myths: [
    { text: 'TCP sends one segment and waits for its ACK before sending the next.', why: 'The window allows many in flight at once.' },
    { text: 'TCP never loses data, so the network must never drop packets.', why: 'The network does drop packets; TCP detects and resends them.' },
    { text: 'Opening a TCP connection is free.', why: 'The handshake costs a full round trip.' },
  ],
  chains: [
    {
      prompt: 'How does TCP recover from a lost packet?',
      steps: ['The receiver gets later segments but not the missing one.', 'It keeps acknowledging only up to the gap.', 'The sender’s timer for the missing segment runs out (or it sees repeated ACKs).', 'It resends the missing segment, and the receiver fills the gap in order.'],
    },
  ],
  summary: {
    best: 'TCP is like numbered pages in a letter sent by post: the reader tells you which page they’ve got up to, and you resend any page that went missing.',
    others: [
      { text: 'TCP is the internet.', why: 'It’s one protocol on top of IP.' },
      { text: 'TCP makes things fast.', why: 'It makes them reliable; that costs some speed.' },
      { text: 'TCP sends files.', why: 'It sends a stream of bytes.' },
    ],
  },
});

export const tcpConcept: Concept = {
  id: TC,
  kind: 'systems',
  title: 'TCP: Reliable Delivery',
  tier: 14,
  prereqs: ['packets-ip', 'circular-buffer'],
  tagline: 'Number every byte, acknowledge, resend.',
  hook: {
    problem: 'IP can lose, duplicate or reorder packets. But a web page or a bank transfer must arrive complete and in order.',
    question: 'How can you build reliable delivery on an unreliable network?',
    options: [
      { text: 'Number every byte; the receiver acknowledges what it has; the sender resends anything not acknowledged in time.', good: true, feedback: 'Yes: that’s TCP. Sequence numbers, ACKs, retransmission.' },
      { text: 'Send everything twice.', feedback: 'Both copies can be lost, and it doubles traffic.' },
      { text: 'Use better cables.', feedback: 'Packets are also dropped by busy routers.' },
    ],
  },
  lens: {
    layout: 'A connection between two hosts, with sequence numbers per byte, send and receive buffers (ring buffers) and a sliding window.',
    invariant: 'Every byte is delivered to the application exactly once and in order, or the connection reports an error.',
    payoff: 'Applications get a simple reliable stream (HTTP, databases, SSH) over an unreliable network.',
    price: 'A handshake round trip to start, retransmission delays on loss, and head-of-line blocking: one lost packet stalls everything behind it.',
  },
  learn: {
    what: 'TCP sits on top of IP and turns its best-effort packets into a reliable, ordered stream of bytes, the thing web pages, APIs and databases are actually sent over. It numbers every byte, waits for acknowledgements, resends what goes missing, and puts everything back in order.',
    how: [
      'Handshake: SYN, SYN-ACK, ACK. Each side picks a starting sequence number.',
      'Each segment carries a sequence number; the receiver replies with an ACK = the next byte it expects.',
      'Segments not ACKed before a timeout (or after repeated duplicate ACKs) are resent.',
      'A sliding window lets many segments be in flight; out-of-order arrivals wait in a buffer until the gap is filled.',
      'Congestion control shrinks the window when packets are lost, so senders don’t overload the network.',
    ],
  },
  extras: {
    family: 'transport',
    primitive: 'slots',
    parts: ['sequence numbers and ACKs', 'retransmission on timeout', 'a sliding window with buffers'],
    uses: ['Download a file so that every byte arrives, in order, even over a lossy Wi-Fi link.', 'Carry a database connection where a single lost byte would corrupt a query.'],
    rivals: ['latency-retries'],
    breaks: [
      {
        violation: 'A receiver delivers segments to the application as soon as they arrive, without waiting for gaps to fill.',
        result: 'The application gets bytes out of order: a file or message is scrambled.',
        wrong: ['Nothing changes because IP keeps packets in order.', 'The download simply gets faster.', 'TCP resends everything.'],
      },
    ],
    transfer: [
      {
        problem: 'A video call over TCP freezes for a moment whenever one packet is lost, even though later packets arrived. Why, and what do video apps do instead?',
        answer: 'TCP holds later data until the lost packet is resent (head-of-line blocking); real-time apps use UDP and simply skip lost frames.',
        wrong: [
          { text: 'The camera is slow.', why: 'It’s the transport waiting, not the camera.' },
          { text: 'Use a bigger TCP window.', why: 'Still waits for the gap.' },
          { text: 'Send every frame twice over TCP.', why: 'TCP still delivers in order.' },
        ],
        explain: 'Reliability and order cost waiting. For live audio and video, a late frame is useless, so they choose a protocol that doesn’t wait.',
      },
    ],
  },
  generators: {
    predict: [predictAck],
    simulate: [orderTcp],
    count: [countThroughput],
    explain: tcExplain,
  },
};

// =====================================================================
// DNS
// =====================================================================

const DN = 'dns';

const predictCache = (): Card => {
  const ttl = pick([60, 300, 3600]);
  const after = pick([ttl / 2, ttl * 2]);
  const fresh = after < ttl;
  return {
    concept: DN,
    type: 'predict',
    prompt: `Your resolver looked up shop.example.com and got an answer with a TTL of ${ttl} seconds. ${after} seconds later you look it up again. What happens?`,
    body: {
      kind: 'choice',
      options: [
        { text: 'It answers instantly from its cache.', correct: fresh, why: fresh ? undefined : `The TTL (${ttl} s) has expired, so the cached answer can’t be trusted any more.` },
        { text: 'It asks the DNS servers again.', correct: !fresh, why: fresh ? `The answer is still within its ${ttl} s TTL.` : undefined },
      ],
    },
    explain: `TTL = how long an answer may be cached. Within ${ttl} s it’s reused; after that it must be fetched again. That’s also why DNS changes take a while to reach everyone.`,
  };
};

const orderDns = (): Card => ({
  concept: DN,
  type: 'simulate',
  prompt: 'Your laptop needs the IP address of shop.example.com and nothing is cached anywhere. Put the lookup steps in order.',
  body: {
    kind: 'order',
    steps: ['The laptop asks its resolver (e.g. the ISP’s or 1.1.1.1).', 'The resolver asks a root server, which points it to the .com servers.', 'The .com servers point it to example.com’s name servers.', 'example.com’s name server answers with the IP address of shop.example.com.', 'The resolver caches the answer (for its TTL) and returns it to the laptop.'],
  },
  explain: 'A tree walked from the top: root → com → example.com. Thanks to caching, most lookups stop at the resolver and take a millisecond.',
});

const countMisses = (): Card => {
  const ttl = pick([60, 300, 600]);
  const mins = pick([10, 30, 60]);
  return {
    concept: DN,
    type: 'count',
    prompt: `A server looks up api.example.com every second for ${mins} minutes. The answer has a TTL of ${ttl} seconds. How many times does the resolver have to ask the authoritative servers (cache misses)?`,
    body: { kind: 'number', answer: Math.ceil((mins * 60) / ttl), unit: 'lookups' },
    explain: `One fresh lookup every ${ttl} s: ${mins * 60} ÷ ${ttl} = ${Math.ceil((mins * 60) / ttl)}. The other ${mins * 60 - Math.ceil((mins * 60) / ttl)} are answered from cache.`,
  };
};

const dnExplain = explainGenerators({
  concept: DN,
  truths: [
    'DNS translates names like example.com into IP addresses.',
    'Names form a tree: root, then top-level domains like .com, then example.com, and so on.',
    'Resolvers cache answers for as long as their TTL says.',
    'A CNAME record says “this name is an alias for that name”.',
  ],
  myths: [
    { text: 'There is one central server that knows every name.', why: 'The work is split down the tree, with each zone run by its owner.' },
    { text: 'Changing a DNS record takes effect for everyone instantly.', why: 'Cached copies live until their TTL expires.' },
    { text: 'Every page load asks the root servers.', why: 'Caching means most lookups never leave your resolver.' },
  ],
  chains: [
    {
      prompt: 'Why can DNS handle billions of lookups a day?',
      steps: ['Names are split into a hierarchy of zones.', 'Each zone is answered by its own servers.', 'Resolvers cache answers for their TTL.', 'So most lookups are answered from a cache close to the user.'],
    },
  ],
  summary: {
    best: 'DNS is the internet’s phone book: you look up a name to get the number, and you remember answers for a while so you don’t have to look them up again.',
    others: [
      { text: 'DNS is a website.', why: 'It’s a global system of servers.' },
      { text: 'DNS sends your web pages.', why: 'It only finds the address.' },
      { text: 'DNS is a database of every computer.', why: 'It maps names to addresses, split across many servers.' },
    ],
  },
});

export const dnsConcept: Concept = {
  id: DN,
  kind: 'systems',
  title: 'DNS',
  tier: 14,
  prereqs: ['packets-ip', 'hash-map', 'tree'],
  tagline: 'The internet’s phone book, with a memory.',
  hook: {
    problem: 'People type “shop.example.com”, but packets need an IP address like 93.184.216.34. Billions of names change owners and servers constantly.',
    question: 'How does a name become an address, worldwide, in milliseconds?',
    options: [
      { text: 'A tree of servers (root → .com → example.com), each answering for its part, with answers cached along the way.', good: true, feedback: 'Yes: DNS. Delegation down a tree, plus caching with time limits.' },
      { text: 'One giant central list.', feedback: 'It would be overwhelmed and a single point of failure.' },
      { text: 'Every computer keeps a copy of every name.', feedback: 'Billions of entries, always out of date.' },
    ],
  },
  lens: {
    layout: 'A tree of zones (root, top-level domains, domains) served by name servers, plus caching resolvers near users.',
    invariant: 'Every name has one authoritative source, and any cached copy is valid only until its TTL expires.',
    payoff: 'Human-friendly names, owned and updated by each domain, resolved in a millisecond from cache.',
    price: 'Changes spread slowly (until caches expire), and a DNS outage makes working servers unreachable.',
  },
  learn: {
    what: 'Computers find each other by IP address, but people use names. DNS (the Domain Name System) turns names into addresses. It’s a tree: the root delegates .com, .com delegates example.com, and example.com’s own servers answer for shop.example.com. Resolvers cache answers so most lookups take a millisecond.',
    how: [
      'Your device asks a resolver (your ISP’s, or 1.1.1.1 / 8.8.8.8).',
      'If it isn’t cached, the resolver walks the tree: root servers → .com servers → example.com’s name servers.',
      'Records include A (name → IPv4), AAAA (IPv6), CNAME (alias to another name) and MX (mail server).',
      'Each answer has a TTL: how many seconds it may be cached.',
      'Short TTLs let you switch servers quickly; long TTLs mean fewer lookups.',
    ],
  },
  extras: {
    family: 'naming',
    primitive: 'both',
    parts: ['a tree of zones', 'authoritative name servers', 'caching resolvers with TTLs'],
    uses: ['Turn a website’s name into the IP address of its server.', 'Move a site to a new server and have users follow within minutes.'],
    breaks: [
      {
        violation: 'A company sets a 1-week TTL on its main record, then has to move to a new server in an emergency.',
        result: 'Many users keep going to the old address for up to a week, until their cached copies expire.',
        wrong: ['Everyone switches instantly.', 'DNS rejects the change.', 'Only new visitors are affected for a minute.'],
      },
    ],
    transfer: [
      {
        problem: 'Your service calls a partner’s API by hostname. They move it to new servers, and your app keeps calling the old address for hours after their DNS changed. Why?',
        answer: 'Your app (or HttpClient) cached the DNS answer and never refreshed it; respect the TTL or recycle connections.',
        wrong: [
          { text: 'The partner forgot to update DNS.', why: 'Other clients already follow the new address.' },
          { text: 'DNS can’t change addresses.', why: 'It can; caches just hold on to old answers.' },
          { text: 'Their firewall blocks you.', why: 'You’re still reaching the old servers.' },
        ],
        explain: 'Long-lived processes often cache DNS forever. In .NET, recycling connections (SocketsHttpHandler.PooledConnectionLifetime) picks up new answers.',
      },
    ],
  },
  generators: {
    predict: [predictCache],
    simulate: [orderDns],
    count: [countMisses],
    explain: dnExplain,
  },
};

// =====================================================================
// HTTP
// =====================================================================

const HT = 'http';

const STATUS = [
  { code: 200, s: 'The request worked and here is the result.' },
  { code: 201, s: 'A new resource (like an order) was created.' },
  { code: 301, s: 'The page has moved permanently to a new URL.' },
  { code: 400, s: 'The request itself is malformed (e.g. invalid JSON).' },
  { code: 401, s: 'You are not logged in (no valid credentials).' },
  { code: 403, s: 'You are logged in but not allowed to do this.' },
  { code: 404, s: 'There is nothing at this URL.' },
  { code: 429, s: 'Too many requests: slow down.' },
  { code: 500, s: 'The server crashed while handling the request.' },
  { code: 503, s: 'The server is overloaded or down for maintenance; try later.' },
];

const predictStatus = (): Card => {
  const it = pick(STATUS);
  const others = shuffle(STATUS.filter((x) => x !== it)).slice(0, 3);
  return {
    concept: HT,
    type: 'predict',
    prompt: `Which HTTP status code should a server return?\n\n“${it.s}”`,
    body: { kind: 'choice', options: shuffle([{ text: String(it.code), correct: true }, ...others.map((o) => ({ text: String(o.code), correct: false, why: `${o.code}: ${o.s}` }))]) },
    explain: `${it.code}. Rule of thumb: 2xx success, 3xx go elsewhere, 4xx the client did something wrong, 5xx the server failed.`,
  };
};

const predictIdempotent = (): Card => {
  const m = pick([
    { m: 'GET /orders/42', ok: true, why: 'Reading changes nothing.' },
    { m: 'PUT /users/7/email (set it to a@b.com)', ok: true, why: 'Setting a value to the same thing twice leaves the same result.' },
    { m: 'DELETE /cart/items/3', ok: true, why: 'Once it’s gone, deleting again changes nothing more.' },
    { m: 'POST /payments (charge £20)', ok: false, why: 'Each POST creates a new payment: retrying charges twice.' },
  ]);
  return {
    concept: HT,
    type: 'predict',
    prompt: `The network times out and the client can’t tell whether this request reached the server. Is it safe to simply send it again?\n\n${m.m}`,
    body: { kind: 'choice', options: [{ text: 'Yes, repeating it is harmless (idempotent)', correct: m.ok, why: m.ok ? undefined : m.why }, { text: 'No, repeating it could do it twice', correct: !m.ok, why: m.ok ? m.why : undefined }] },
    explain: `${m.why} GET, PUT and DELETE are meant to be idempotent; POST usually isn’t, so payment APIs accept an idempotency key to make retries safe.`,
  };
};

const orderRequest = (): Card => ({
  concept: HT,
  type: 'simulate',
  prompt: 'You type https://shop.example.com/cart into a browser for the first time. Put what happens in order.',
  body: {
    kind: 'order',
    steps: ['DNS turns shop.example.com into an IP address.', 'TCP handshake opens a connection to that address.', 'TLS handshake sets up encryption (the “s” in https).', 'The browser sends: GET /cart HTTP/1.1 with headers.', 'The server replies 200 OK with headers and the page’s HTML.'],
  },
  explain: 'Three round trips before the first byte of the page (DNS, TCP, TLS). Reusing connections and caching DNS skip most of them on the next request.',
});

const countRoundTrips = (): Card => {
  const rtt = pick([20, 40, 80, 150]);
  return {
    concept: HT,
    type: 'count',
    prompt: `A brand-new HTTPS request needs one round trip each for DNS, the TCP handshake, the TLS handshake and the request itself. The round trip time is ${rtt} ms. Ignoring server time, how long until the response starts arriving?`,
    body: { kind: 'number', answer: 4 * rtt, unit: 'ms' },
    explain: `4 round trips × ${rtt} ms = ${4 * rtt} ms. On a reused connection only the request’s own round trip remains: ${rtt} ms.`,
  };
};

const htExplain = explainGenerators({
  concept: HT,
  truths: [
    'HTTP is a request/response protocol: the client sends a method, a path and headers; the server sends a status code, headers and a body.',
    'Status codes in the 4xx range mean the client made a mistake; 5xx mean the server failed.',
    'GET should only read; POST usually creates; PUT replaces; DELETE removes.',
    'HTTP runs over TCP (and TLS for https).',
  ],
  myths: [
    { text: 'A 404 means the server is down.', why: 'The server answered: there is just nothing at that path.' },
    { text: 'GET requests can safely change data.', why: 'Browsers, caches and crawlers may repeat GETs at any time.' },
    { text: 'HTTPS hides which website you are visiting from everyone.', why: 'It encrypts content, but the server’s name and IP are still visible to the network.' },
  ],
  chains: [
    {
      prompt: 'Why should GET never change data?',
      steps: ['GET is defined as safe: it only reads.', 'So browsers prefetch links and caches replay GETs freely.', 'Crawlers also follow every link with GET.', 'A GET that deleted things would be triggered by accident.'],
    },
  ],
  summary: {
    best: 'HTTP is how a browser or app asks a server for something: “GET me this page” or “POST this order”, and the server answers with a code saying how it went, plus the data.',
    others: [
      { text: 'HTTP is a website.', why: 'It’s the protocol websites are fetched with.' },
      { text: 'HTTP is the internet.', why: 'It’s one protocol that runs on top of it.' },
      { text: 'HTTP is HTML.', why: 'HTML is one kind of content HTTP can carry.' },
    ],
  },
});

export const httpConcept: Concept = {
  id: HT,
  kind: 'systems',
  title: 'HTTP & APIs',
  tier: 14,
  prereqs: ['tcp', 'dns'],
  tagline: 'Ask with a method and a path; answer with a status.',
  hook: {
    problem: 'A phone app, a website and another company’s server all need to talk to your backend, in different languages, over the internet.',
    question: 'What do they need to agree on?',
    options: [
      { text: 'One simple text format for requests (method, path, headers, body) and responses (status code, headers, body): HTTP.', good: true, feedback: 'Yes. Every language has an HTTP client, so everyone can talk to your API.' },
      { text: 'Each client gets its own custom protocol.', feedback: 'Three protocols to build, test and secure.' },
      { text: 'Clients connect directly to your database.', feedback: 'No control, no security, no versioning.' },
    ],
  },
  lens: {
    layout: 'Requests (method, path, headers, optional body) and responses (status code, headers, body), sent as text over a TCP (+TLS) connection.',
    invariant: 'Every request gets exactly one response with a status code; GET is safe, and GET/PUT/DELETE are idempotent.',
    payoff: 'Any client in any language can use any server; caches, proxies and load balancers understand the traffic.',
    price: 'Round trips for each new connection, text overhead, and non-idempotent requests that are unsafe to retry blindly.',
  },
  learn: {
    what: 'HTTP is the language web browsers, apps and services use to talk to servers. A request says what to do (the method), to what (the path) and adds headers and maybe a body; the response gives a status code, headers and a body. ASP.NET, Node, every API you’ll build speaks it.',
    how: [
      'Request: GET /orders/42 HTTP/1.1, then headers like Host and Authorization, a blank line, then an optional body.',
      'Methods: GET reads, POST creates, PUT replaces, PATCH changes part, DELETE removes.',
      'Response: HTTP/1.1 200 OK, headers like Content-Type and Content-Length, a blank line, then the body.',
      'Status codes: 2xx success, 3xx redirect, 4xx client error (400, 401, 403, 404, 429), 5xx server error.',
      'Idempotent methods (GET, PUT, DELETE) can be retried safely; POST needs care (idempotency keys).',
    ],
  },
  extras: {
    family: 'application-protocol',
    primitive: 'abstract',
    parts: ['methods and paths', 'status codes', 'headers and a body'],
    uses: ['Let a mobile app load a user’s orders from your server.', 'Let another company’s system send you webhooks when a payment succeeds.'],
    breaks: [
      {
        violation: 'An API deletes items when it receives GET /items/5/delete.',
        result: 'A browser prefetch, a search crawler or a link preview silently deletes items.',
        wrong: ['Nothing, GET is just another method.', 'Caches stop it happening.', 'The browser asks the user first.'],
      },
    ],
    transfer: [
      {
        problem: 'A mobile app’s “Pay” request sometimes times out and the app retries, charging some customers twice. How do payment APIs prevent this?',
        answer: 'The client sends an idempotency key with the POST; the server stores the result per key and returns it again on a retry instead of charging twice.',
        wrong: [
          { text: 'Never retry.', why: 'Then timed-out payments that did fail are never completed.' },
          { text: 'Use GET for payments.', why: 'GET must not change anything.' },
          { text: 'Retry faster.', why: 'Still charges twice.' },
        ],
        explain: 'An idempotency key makes a non-idempotent operation safe to retry: same key, same single effect.',
      },
    ],
  },
  generators: {
    predict: [predictStatus, predictIdempotent],
    simulate: [orderRequest],
    count: [countRoundTrips],
    explain: htExplain,
  },
};

// =====================================================================
// Latency, timeouts & retries
// =====================================================================

const LR = 'latency-retries';

const predictHerd = (): Card => ({
  concept: LR,
  type: 'predict',
  prompt: 'A database goes down for 30 seconds. 10,000 app servers all retry their failed queries every 100 ms, at exactly the same moments. When the database comes back, what happens?',
  body: {
    kind: 'choice',
    options: shuffle([
      { text: 'It is hit by a huge synchronised burst of retries and falls over again (a thundering herd).', correct: true },
      { text: 'It recovers smoothly because the retries are spread out.', correct: false, why: 'They aren’t spread out: everyone retries at the same instants.' },
      { text: 'Clients give up, so there’s no load.', correct: false, why: 'They retry forever at a fixed interval.' },
      { text: 'Retries only help, so it recovers faster.', correct: false, why: 'Retries add load exactly when the system is weakest.' },
    ]),
  },
  explain: 'The fix: exponential backoff (wait longer after each failure), random jitter (so clients don’t retry in sync), a retry limit, and circuit breakers that stop calling a dependency that’s clearly down.',
});

const orderResilient = (): Card => ({
  concept: LR,
  type: 'simulate',
  prompt: 'A service calls a flaky payment API. Put the resilient way to make the call in order.',
  body: {
    kind: 'order',
    steps: ['Send the request with a timeout (never wait forever).', 'On a timeout or 503, wait a backoff delay with random jitter.', 'Retry with the same idempotency key, doubling the delay each time.', 'Stop after a few attempts and report the failure.', 'If failures keep piling up, open the circuit breaker and fail fast for a while.'],
  },
  explain: 'Timeouts bound the waiting; backoff with jitter spreads retries out; limits and circuit breakers stop retries from making an outage worse.',
});

const countBackoff = (): Card => {
  const base = pick([100, 200, 500]);
  const n = randInt(3, 6);
  return pick([
    {
      concept: LR,
      type: 'count' as const,
      prompt: `Exponential backoff: wait ${base} ms before the 1st retry, and double the wait each time. How long is the wait before retry number ${n}?`,
      body: { kind: 'number' as const, answer: base * 2 ** (n - 1), unit: 'ms' },
      explain: `${base} × 2^${n - 1} = ${base * 2 ** (n - 1)} ms. Waits grow fast, so a failing dependency gets breathing room.`,
    },
    {
      concept: LR,
      type: 'count' as const,
      prompt: `Exponential backoff starting at ${base} ms and doubling. If all ${n} retries fail, how much time was spent waiting in total?`,
      body: { kind: 'number' as const, answer: base * (2 ** n - 1), unit: 'ms' },
      explain: `${Array.from({ length: n }, (_, i) => base * 2 ** i).join(' + ')} = ${base * (2 ** n - 1)} ms.`,
    },
  ]);
};

const lrExplain = explainGenerators({
  concept: LR,
  truths: [
    'Every network call can be slow or fail, so every call needs a timeout.',
    'Retries help with brief, random failures.',
    'Exponential backoff with jitter spreads retries out instead of hammering a struggling service.',
    'Only retry operations that are safe to repeat, or use an idempotency key.',
    'A circuit breaker stops calling a failing dependency for a while so it can recover.',
  ],
  myths: [
    { text: 'Retrying immediately and forever is the most reliable approach.', why: 'It multiplies load during outages and never gives up.' },
    { text: 'A missing timeout is fine because the network is fast.', why: 'One hung call can tie up threads until the whole service stalls.' },
    { text: 'If the average latency is low, every user gets a fast response.', why: 'The slowest few percent (tail latency) still hit real users, and fan-out makes it likelier.' },
  ],
  chains: [
    {
      prompt: 'Why does jitter matter?',
      steps: ['Many clients fail at the same moment during an outage.', 'With identical backoff, they all retry at the same instants.', 'Random jitter spreads each client’s retries over time.', 'So the recovering service sees a smooth trickle, not a spike.'],
    },
  ],
  summary: {
    best: 'Talking to other services is like phoning a busy shop: don’t wait on hold forever, don’t redial instantly over and over, and if it’s clearly closed, stop calling for a while.',
    others: [
      { text: 'Just retry until it works.', why: 'That’s what causes thundering herds.' },
      { text: 'Make the network faster.', why: 'Failures still happen.' },
      { text: 'Timeouts are errors to avoid.', why: 'Timeouts are a safety tool.' },
    ],
  },
});

export const latencyRetriesConcept: Concept = {
  id: LR,
  kind: 'systems',
  title: 'Latency, Timeouts & Retries',
  tier: 14,
  prereqs: ['tcp'],
  tagline: 'Don’t wait forever; don’t retry like a mob.',
  hook: {
    problem: 'Your checkout calls a shipping-rates API. One day it hangs instead of failing. Within a minute every checkout thread is stuck waiting, and the whole shop is down, because of one slow dependency.',
    question: 'What should every outgoing call have?',
    options: [
      { text: 'A timeout, a few retries with growing random delays, and a way to stop calling a dependency that’s clearly down.', good: true, feedback: 'Yes: timeouts, backoff with jitter, and a circuit breaker.' },
      { text: 'A faster server.', feedback: 'The dependency hung; your speed doesn’t matter.' },
      { text: 'Unlimited instant retries.', feedback: 'Makes the outage worse for everyone.' },
    ],
  },
  lens: {
    layout: 'A call with a timeout, a retry loop with exponentially growing, randomised delays, and a circuit breaker that tracks recent failures.',
    invariant: 'No call waits forever, retries back off, and a failing dependency is cut off instead of being hammered.',
    payoff: 'Brief glitches are absorbed and one sick dependency can’t take everything down with it.',
    price: 'Added latency on failures, and retries are only safe for idempotent operations.',
  },
  learn: {
    what: 'Every call over a network can be slow, time out or fail, and at scale something always is. Resilient systems assume that: they put a timeout on every call, retry briefly with sensible delays, never retry in a way that duplicates work, and stop calling dependencies that are down so they can recover.',
    how: [
      'Timeout: decide how long the answer is worth waiting for (HttpClient.Timeout, CancellationToken).',
      'Retry only transient failures (timeouts, 503, connection resets), and only idempotent operations (or with an idempotency key).',
      'Exponential backoff: wait base, 2×base, 4×base… between attempts, with random jitter so clients don’t sync up.',
      'Limit attempts; then fail clearly.',
      'Circuit breaker: after N failures in a row, fail fast for a while (open), then let one trial call through (half-open).',
    ],
  },
  extras: {
    family: 'resilience',
    primitive: 'abstract',
    parts: ['timeouts on every call', 'exponential backoff with jitter', 'a circuit breaker'],
    uses: ['Keep checkout working when the shipping-rates API is slow or down.', 'Stop 10,000 servers from hammering a database the moment it comes back.'],
    rivals: ['tcp'],
    breaks: [
      {
        violation: 'A service calls a slow dependency with no timeout, under heavy load.',
        result: 'Every request thread ends up stuck waiting, and the whole service stops responding.',
        wrong: ['Requests just take a little longer.', 'The runtime adds a timeout automatically.', 'Only that one feature is affected.'],
      },
    ],
    transfer: [
      {
        problem: 'A page calls 20 backend services in parallel. Each is slow only 1% of the time, yet the page is slow far more often than 1%. Why?',
        answer: 'The page waits for the slowest of 20 calls: the chance at least one is slow is about 1 − 0.99²⁰ ≈ 18%. Tail latency compounds with fan-out.',
        wrong: [
          { text: 'One of the services is broken.', why: 'Each behaves as described.' },
          { text: 'Parallel calls are slower than sequential ones.', why: 'It’s the waiting for the slowest that hurts.' },
          { text: 'The average is wrong.', why: 'The average is fine; the tail is the issue.' },
        ],
        explain: 'With fan-out, rare slowness becomes common. That’s why teams track p99 latency, set timeouts, and sometimes send backup requests.',
      },
    ],
  },
  generators: {
    predict: [predictHerd],
    simulate: [orderResilient],
    count: [countBackoff],
    explain: lrExplain,
  },
};

export const NET_CONCEPTS: Concept[] = [packetsIpConcept, tcpConcept, dnsConcept, httpConcept, latencyRetriesConcept];

