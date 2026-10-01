import type { Card, Concept } from '../engine/types';
import { distinctInts, pick, randInt, shuffle } from '../engine/random';
import { explainGenerators, options } from './helpers';

// =====================================================================
// Processes & threads
// =====================================================================

const PT = 'processes-threads';

const predictShared = (): Card => {
  const [a, b] = distinctInts(2, 10, 99);
  return {
    concept: PT,
    type: 'predict',
    prompt: `A program sets x = ${a}. It then starts a second THREAD and also launches a copy of itself as a separate PROCESS. The new thread sets x = ${b}. What does each one now see for x?`,
    body: {
      kind: 'choice',
      options: options({ text: `The original thread sees ${b}; the separate process still sees ${a}.`, why: 'Threads share their process’s memory; another process has its own copy.' }, [
        { text: `Everyone sees ${b}.`, why: 'A separate process has its own memory: changes in one don’t appear in the other.' },
        { text: `Everyone still sees ${a}.`, why: 'The thread shares memory with the original thread, so the original sees the change.' },
        { text: `The separate process sees ${b}; the original thread sees ${a}.`, why: 'It’s the other way round: threads share, processes don’t.' },
      ]),
    },
    explain: `Threads of one process share one heap, so the change to ${b} is visible to every thread in it. A separate process has its own memory: it keeps ${a}.`,
  };
};

const predictCheaper = (): Card => ({
  concept: PT,
  type: 'predict',
  prompt: 'A web server must handle 2,000 requests at the same time and they all read the same in-memory cache. What should each request run on?',
  body: {
    kind: 'choice',
    options: shuffle([
      { text: 'A thread inside one process: cheap to start, and all threads can read the shared cache directly.', correct: true },
      { text: 'A separate process each: 2,000 copies of the program and its memory, and no shared cache.', correct: false, why: 'Processes are heavy and don’t share memory, so each would need its own cache.' },
      { text: 'One thread for everything, handling requests one at a time.', correct: false, why: 'Requests that wait (for a database, say) would block all the others.' },
      { text: 'It makes no difference.', correct: false, why: 'Processes cost far more memory and start-up time than threads.' },
    ]),
  },
  explain: 'Threads are the cheap unit of “doing several things at once” inside one program, and they share memory. The price of sharing: you must protect shared data (the next lessons).',
});

const orderSwitch = (): Card => ({
  concept: PT,
  type: 'simulate',
  prompt: 'The CPU is running thread A and the operating system decides to switch to thread B (a context switch). Put the steps in order.',
  body: {
    kind: 'order',
    steps: [
      'A timer interrupt stops thread A.',
      'The OS saves A’s registers and program counter into A’s thread record.',
      'The scheduler picks B as the next thread to run.',
      'The OS loads B’s saved registers and program counter.',
      'B continues exactly where it stopped last time.',
    ],
  },
  explain: 'A thread is really “a saved set of registers plus its own stack”. Switching means saving one set and loading another. It costs microseconds, which adds up if it happens too often.',
});

const countStacks = (): Card => {
  const p = randInt(2, 5);
  const t = randInt(2, 6);
  return pick([
    {
      concept: PT,
      type: 'count' as const,
      prompt: `A process runs ${t} threads. How many call stacks does it have?`,
      body: { kind: 'number' as const, answer: t, unit: 'stacks' },
      explain: `One per thread: ${t}. Each thread has its own stack (its own function calls and local variables), but they all share one heap.`,
    },
    {
      concept: PT,
      type: 'count' as const,
      prompt: `${p} processes are running, each with ${t} threads. How many separate memory spaces (heaps) are there?`,
      body: { kind: 'number' as const, answer: p, unit: 'heaps' },
      explain: `One per process: ${p}. The ${p * t} threads share their own process’s heap; processes never share by default.`,
    },
  ]);
};

const ptExplain = explainGenerators({
  concept: PT,
  truths: [
    'A process is a running program with its own private memory.',
    'Threads are separate lines of execution inside one process; they share its memory.',
    'Each thread has its own stack and registers.',
    'Starting a thread is much cheaper than starting a process.',
    'Because threads share memory, two threads can change the same data at the same time.',
  ],
  myths: [
    { text: 'Each thread gets its own copy of the program’s variables.', why: 'Threads share the heap; only their stacks (local variables) are separate.' },
    { text: 'Two processes can read each other’s variables directly.', why: 'Processes are isolated; they communicate through files, pipes or the network.' },
    { text: 'More threads always make a program faster.', why: 'Past the number of CPU cores, extra CPU-bound threads just take turns and add switching cost.' },
  ],
  chains: [
    {
      prompt: 'Why do threads make shared data dangerous?',
      steps: ['Threads of one process share the same heap.', 'Two threads can run at the same moment on different cores.', 'Both can read and write the same variable.', 'Without coordination, one thread’s update can overwrite the other’s.'],
    },
  ],
  summary: {
    best: 'A process is a program running in its own private room; threads are several workers inside that room, sharing everything in it.',
    others: [
      { text: 'A thread is a small process.', why: 'Misses the key difference: threads share memory.' },
      { text: 'Processes and threads are the same thing.', why: 'They differ in isolation and cost.' },
      { text: 'Threads make code run faster.', why: 'Only sometimes; and that isn’t what they are.' },
    ],
  },
});

export const processesThreadsConcept: Concept = {
  id: PT,
  kind: 'systems',
  title: 'Processes & Threads',
  tier: 11,
  prereqs: ['memory', 'stack'],
  tagline: 'Private rooms, and workers who share one.',
  hook: {
    problem: 'Your app downloads a big file. While it does, the whole window freezes: no clicks, no scrolling.',
    question: 'How can the program keep responding while it waits?',
    options: [
      { text: 'Run the download on a second thread, so another line of execution keeps handling the window.', good: true, feedback: 'Yes. Threads let one program do several things at once, sharing its memory.' },
      { text: 'Make the download faster.', feedback: 'It still blocks while it runs.' },
      { text: 'Check for clicks every few seconds inside the download loop.', feedback: 'Clumsy and laggy; threads do this properly.' },
    ],
  },
  lens: {
    layout: 'A process = code + its own heap + one or more threads; each thread = its own stack + saved registers.',
    invariant: 'Processes never see each other’s memory; threads of the same process always share theirs.',
    payoff: 'Do several things at once (and use every CPU core), with threads sharing data cheaply.',
    price: 'Shared memory can be changed by two threads at once (races); every switch between threads costs time.',
  },
  learn: {
    what: 'A process is a running program: the operating system gives it its own private memory. Inside a process, threads are separate lines of execution running at the same time. Threads share their process’s memory, which makes them cheap and lets them work together, but also lets them step on each other.',
    how: [
      'Starting a program creates a process with one thread (the main thread).',
      'The program can start more threads; each gets its own stack for its function calls.',
      'All threads of the process read and write the same heap (objects, shared variables).',
      'The OS switches the CPU cores between threads many times a second (a context switch: save one thread’s registers, load another’s).',
    ],
  },
  extras: {
    family: 'execution',
    primitive: 'abstract',
    parts: ['a private heap per process', 'a stack per thread', 'context switches between threads'],
    uses: ['Keep a desktop app responsive while it saves a large file.', 'Use all 8 CPU cores to resize thousands of photos at once.'],
    rivals: ['async-io'],
    breaks: [
      {
        violation: 'Two threads both add to a shared total at the same moment, with no coordination.',
        result: 'Some additions are lost: both read the old value and each writes back its own result.',
        wrong: ['The total is always correct.', 'The program refuses to compile.', 'Each thread gets its own copy of the total.'],
      },
    ],
    transfer: [
      {
        problem: 'A crash in a browser tab used to take down the whole browser. How do modern browsers stop that?',
        answer: 'Run each tab in its own process, so a crash stays inside that process’s private memory.',
        wrong: [
          { text: 'Run each tab in its own thread.', why: 'Threads share memory: a crash in one brings down the process.' },
          { text: 'Catch every error.', why: 'Some crashes (memory corruption) can’t be caught safely.' },
          { text: 'Limit the number of tabs.', why: 'Doesn’t isolate anything.' },
        ],
        explain: 'Processes are isolated by the OS. That costs memory, but buys safety: exactly the trade-off browsers chose.',
      },
    ],
  },
  generators: {
    predict: [predictShared, predictCheaper],
    simulate: [orderSwitch],
    count: [countStacks],
    explain: ptExplain,
  },
};

// =====================================================================
// CPU scheduling
// =====================================================================

const SC = 'scheduling';

const jobs = () => {
  const names = ['A', 'B', 'C', 'D'].slice(0, randInt(3, 4));
  const bursts = distinctInts(names.length, 1, 9);
  return names.map((n, i) => ({ n, t: bursts[i] }));
};
const waitTotal = (order: { t: number }[]) => order.reduce((acc, _, i) => acc + order.slice(0, i).reduce((s, j) => s + j.t, 0), 0);

function roundRobin(js: { n: string; t: number }[], q: number) {
  const left = new Map(js.map((j) => [j.n, j.t]));
  const queue = js.map((j) => j.n);
  const done: string[] = [];
  let slices = 0;
  while (queue.length) {
    const n = queue.shift()!;
    const run = Math.min(q, left.get(n)!);
    left.set(n, left.get(n)! - run);
    slices++;
    if (left.get(n)! > 0) queue.push(n);
    else done.push(n);
  }
  return { done, slices };
}

const predictSjf = (): Card => {
  const js = jobs();
  const sjf = [...js].sort((a, b) => a.t - b.t);
  const fcfs = waitTotal(js);
  const best = waitTotal(sjf);
  return {
    concept: SC,
    type: 'predict',
    prompt: `Jobs all arrive at once, in this order: ${js.map((j) => `${j.n} (${j.t} ms)`).join(', ')}. To make the AVERAGE waiting time as small as possible, in what order should one CPU run them?`,
    body: {
      kind: 'choice',
      options: options({ text: sjf.map((j) => j.n).join(' → '), why: `Shortest first: total waiting ${best} ms instead of ${fcfs} ms in arrival order.` }, [
        { text: [...js].sort((a, b) => b.t - a.t).map((j) => j.n).join(' → '), why: 'Longest first makes everyone else wait behind the big jobs.' },
        { text: js.map((j) => j.n).join(' → '), why: `Arrival order gives ${fcfs} ms of total waiting.` },
        { text: shuffle(js).map((j) => j.n).join(' → '), why: 'Each job waits for every job before it: put the short ones first.' },
      ]),
    },
    explain: `Each job waits for everything that runs before it, so short jobs should go first (Shortest Job First). Total waiting: ${best} ms vs ${fcfs} ms first-come-first-served.`,
  };
};

const orderRR = (): Card => {
  let js: { n: string; t: number }[];
  let q: number;
  let r: ReturnType<typeof roundRobin>;
  do {
    js = jobs();
    q = randInt(2, 3);
    r = roundRobin(js, q);
  } while (r.done.join() === js.map((j) => j.n).join());
  return {
    concept: SC,
    type: 'simulate',
    prompt: `Round robin with a ${q} ms time slice. Jobs queue up in this order: ${js.map((j) => `${j.n} needs ${j.t} ms`).join(', ')}. Each job runs for up to ${q} ms, then goes to the back of the queue if unfinished. Put the jobs in the order they FINISH.`,
    body: { kind: 'order', steps: r.done.map((n) => `${n} finishes`) },
    explain: `Finishing order: ${r.done.join(', ')}, after ${r.slices} slices. Round robin keeps every job moving, so nothing waits forever, at the cost of more switching.`,
  };
};

const countWait = (): Card => {
  const js = jobs();
  return pick([
    {
      concept: SC,
      type: 'count' as const,
      prompt: `First come, first served: ${js.map((j) => `${j.n} (${j.t} ms)`).join(', ')}, all arriving at time 0. What is the TOTAL time spent waiting (summed over all jobs)?`,
      body: { kind: 'number' as const, answer: waitTotal(js), unit: 'ms' },
      explain: `Each job waits for all the ones before it: ${js.map((_, i) => js.slice(0, i).reduce((s, x) => s + x.t, 0)).join(' + ')} = ${waitTotal(js)} ms.`,
    },
    (() => {
      const q = randInt(2, 3);
      const r = roundRobin(js, q);
      return {
        concept: SC,
        type: 'count' as const,
        prompt: `Round robin with a ${q} ms slice: ${js.map((j) => `${j.n} needs ${j.t} ms`).join(', ')}. How many time slices are run in total?`,
        body: { kind: 'number' as const, answer: r.slices, unit: 'slices' },
        explain: `Each job needs ⌈time ÷ ${q}⌉ slices: ${js.map((j) => Math.ceil(j.t / q)).join(' + ')} = ${r.slices}.`,
      };
    })(),
  ]);
};

const scExplain = explainGenerators({
  concept: SC,
  truths: [
    'The scheduler decides which ready thread runs next on each CPU core.',
    'Running the shortest jobs first minimises the average waiting time.',
    'Round robin gives every job a short time slice in turn, so none waits forever.',
    'Priority scheduling uses a priority queue: the most important ready job runs next.',
  ],
  myths: [
    { text: 'First come, first served is always fair and fast.', why: 'One long job at the front makes every short job wait behind it.' },
    { text: 'Smaller time slices are always better.', why: 'Each switch costs time; tiny slices spend more time switching than working.' },
    { text: 'Low-priority jobs are guaranteed to run eventually under strict priority scheduling.', why: 'They can starve if higher-priority work keeps arriving; schedulers add “ageing” to fix this.' },
  ],
  chains: [
    {
      prompt: 'Why does shortest-job-first lower the average wait?',
      steps: ['Every job waits for all the jobs that run before it.', 'A long job at the front adds its whole length to everyone else’s wait.', 'Putting short jobs first adds only small amounts.', 'So the total, and the average, waiting time is smallest.'],
    },
  ],
  summary: {
    best: 'A scheduler is the queue manager for the CPU: it decides who goes next and for how long, trading quick replies against getting the most work done.',
    others: [
      { text: 'It makes the CPU faster.', why: 'It only decides the order.' },
      { text: 'It runs everything at once.', why: 'One core runs one thread at a time.' },
      { text: 'It’s a queue.', why: 'It uses queues; the point is the policy.' },
    ],
  },
});

export const schedulingConcept: Concept = {
  id: SC,
  kind: 'systems',
  title: 'CPU Scheduling',
  tier: 11,
  prereqs: ['processes-threads', 'queue', 'priority-queue'],
  tagline: 'Who runs next, and for how long.',
  hook: {
    problem: 'Your 4-core laptop has 300 threads that all want to run. A video call must never stutter, while a backup can wait.',
    question: 'How should the OS choose what runs?',
    options: [
      { text: 'Keep ready threads in queues, give each a short time slice in turn, and let urgent ones jump ahead.', good: true, feedback: 'Yes: time slices (round robin) plus priorities. That’s the core of every real scheduler.' },
      { text: 'Run each thread until it finishes.', feedback: 'The backup would freeze your video call for minutes.' },
      { text: 'Pick a random thread each time.', feedback: 'No guarantees: the call could starve.' },
    ],
  },
  lens: {
    layout: 'Ready queues of runnable threads (often one per priority), a timer, and a policy that picks the next one.',
    invariant: 'Every ready thread eventually gets CPU time; urgent ones get it sooner.',
    payoff: 'Hundreds of threads share a few cores while interactive work stays responsive.',
    price: 'Every switch costs time, and every policy trades response time against total throughput.',
  },
  learn: {
    what: 'A computer has a few CPU cores but hundreds of threads that want to run. The scheduler is the part of the operating system that decides which thread runs on each core next, and for how long. Its choices decide whether your app feels snappy or sluggish.',
    how: [
      'Threads that are ready to run wait in a queue.',
      'First come, first served: simple, but one long job holds up everyone behind it.',
      'Shortest job first: lowest average waiting, but long jobs can wait a long time.',
      'Round robin: each thread runs for a short time slice (a few ms), then goes to the back of the queue.',
      'Priorities: urgent threads (your mouse, audio) are picked before background ones, usually from a priority queue.',
    ],
  },
  extras: {
    family: 'scheduling',
    primitive: 'abstract',
    parts: ['a ready queue', 'time slices', 'a priority order'],
    uses: ['Keep music playing smoothly while a big file compresses in the background.', 'Decide which of 50 waiting print jobs the office printer handles next.'],
    breaks: [
      {
        violation: 'Strict priorities with a steady stream of high-priority jobs, and no ageing.',
        result: 'Low-priority jobs never get to run: they starve.',
        wrong: ['Every job still finishes in arrival order.', 'The system crashes.', 'High-priority jobs slow down.'],
      },
    ],
    transfer: [
      {
        problem: 'A support team has quick questions and long investigations in one queue. Quick questions wait hours. What should change?',
        answer: 'Handle short tasks first, or give each ticket a short time slice before moving on (round robin).',
        wrong: [
          { text: 'Strictly first come, first served.', why: 'That’s what’s causing the problem.' },
          { text: 'Do the longest tickets first.', why: 'Makes every short one wait even longer.' },
          { text: 'Hire fewer people.', why: 'Doesn’t change the order.' },
        ],
        explain: 'It’s the scheduling problem with people: short-job-first cuts the average wait; time slices keep everything moving.',
      },
    ],
  },
  generators: {
    predict: [predictSjf],
    simulate: [orderRR],
    count: [countWait],
    explain: scExplain,
  },
};

// =====================================================================
// Race conditions & locks
// =====================================================================

const LK = 'locks';

const predictRace = (): Card => {
  const n = pick([1000, 10_000, 100_000]);
  return {
    concept: LK,
    type: 'predict',
    prompt: `Two threads each run count++ ${n.toLocaleString()} times on the same shared variable, with no lock. What is the final count?`,
    body: {
      kind: 'choice',
      options: shuffle([
        { text: `Often less than ${(2 * n).toLocaleString()}, and different on each run.`, correct: true, why: 'count++ is read, add, write: two threads can read the same old value and one update is lost.' },
        { text: `Always exactly ${(2 * n).toLocaleString()}.`, correct: false, why: 'Only with a lock or an atomic increment.' },
        { text: `Exactly ${n.toLocaleString()}.`, correct: false, why: 'Some updates are lost, not all of one thread’s.' },
        { text: 'The program crashes.', correct: false, why: 'It runs fine; the answer is just wrong. That’s what makes races so nasty.' },
      ]),
    },
    explain: 'A race condition: the result depends on the timing. Wrap count++ in a lock (or use Interlocked.Increment) and it is exactly right every time.',
  };
};

const orderLock = (): Card => ({
  concept: LK,
  type: 'simulate',
  prompt: 'One thread safely adds money to a shared balance using a lock. Put its steps in order.',
  body: {
    kind: 'order',
    steps: ['Acquire the lock (wait if another thread holds it).', 'Read the current balance.', 'Add the amount.', 'Write the new balance back.', 'Release the lock so others can go.'],
  },
  explain: 'Everything between acquire and release is a critical section: only one thread at a time can be in it, so read–add–write can’t be interleaved.',
});

const countLost = (): Card => {
  const c = randInt(10, 90);
  const k = randInt(1, 9);
  return {
    concept: LK,
    type: 'count',
    prompt: `balance = ${c}. Thread A and thread B both run balance = balance + ${k}, with no lock. This time both READ the balance before either WRITES. What is the final balance?`,
    body: { kind: 'number', answer: c + k, unit: '' },
    explain: `Both read ${c}, both compute ${c + k}, both write ${c + k}. One addition of ${k} is lost: it should be ${c + 2 * k}.`,
  };
};

const lkExplain = explainGenerators({
  concept: LK,
  truths: [
    'A race condition is when the result depends on the exact timing of threads.',
    'count++ is really three steps: read, add, write, so it can be interrupted in the middle.',
    'A lock lets only one thread at a time into a critical section.',
    'Atomic operations (like Interlocked.Increment) do read–add–write as one indivisible step.',
  ],
  myths: [
    { text: 'A single line of code like count++ can’t be interrupted.', why: 'It compiles to separate read, add and write instructions.' },
    { text: 'Locks make code faster.', why: 'They make it correct; threads waiting on a lock do no work.' },
    { text: 'If a race bug doesn’t show up in testing, it isn’t there.', why: 'Races depend on timing and may appear only under load.' },
  ],
  chains: [
    {
      prompt: 'How is an update lost without a lock?',
      steps: ['Thread A reads the value.', 'Thread B reads the same value before A writes.', 'A writes its new value.', 'B writes its new value, overwriting A’s change.'],
    },
  ],
  summary: {
    best: 'A lock is like a single key to a bathroom: whoever holds it goes in alone, so two people never end up changing the same thing at once.',
    others: [
      { text: 'A lock stops threads.', why: 'Only those waiting for that one lock.' },
      { text: 'A lock makes data read-only.', why: 'The holder can change it freely.' },
      { text: 'A lock is a kind of thread.', why: 'It’s a coordination tool between threads.' },
    ],
  },
});

export const locksConcept: Concept = {
  id: LK,
  kind: 'systems',
  title: 'Race Conditions & Locks',
  tier: 11,
  prereqs: ['processes-threads'],
  tagline: 'One at a time through the critical section.',
  hook: {
    problem: 'Two people buy the last concert ticket at the same instant. Both see “1 left”, both pay, and you’ve sold the seat twice.',
    question: 'What has to happen?',
    options: [
      { text: 'Only one buyer at a time may check-and-take the ticket; the other waits, then sees 0 left.', good: true, feedback: 'Yes: mutual exclusion. In code, that’s a lock around the check and the update.' },
      { text: 'Check the count twice.', feedback: 'Both can still pass both checks.' },
      { text: 'Make the server faster.', feedback: 'Narrows the window but never closes it.' },
    ],
  },
  lens: {
    layout: 'Shared data, threads that read and write it, and a lock (mutex) guarding the code that touches it.',
    invariant: 'At most one thread is inside a critical section at any moment.',
    payoff: 'Read-modify-write steps on shared data become safe: no lost updates, no double-selling.',
    price: 'Threads wait for each other (less parallelism), and careless locking can deadlock.',
  },
  learn: {
    what: 'When threads share data, an operation like “read the balance, add 10, write it back” can be interleaved with another thread doing the same, and one update disappears. That’s a race condition. A lock fixes it by letting only one thread at a time run the code that touches the shared data.',
    how: [
      'Find the critical section: the code that reads AND changes shared data.',
      'Before it, acquire the lock (C#: lock (obj) { … }); if another thread holds it, wait.',
      'Do the read and the write while holding the lock.',
      'Release the lock (automatic at the end of a lock block), letting the next thread in.',
      'For a single number, atomic operations (Interlocked.Increment) do the same job without a lock.',
    ],
  },
  extras: {
    family: 'synchronization',
    primitive: 'abstract',
    parts: ['a critical section', 'a lock (mutex)', 'acquire and release'],
    uses: ['Stop two checkouts from selling the same last item in stock.', 'Let many threads safely add log lines to one shared list.'],
    rivals: ['deadlock'],
    breaks: [
      {
        violation: 'The code checks “is a seat free?” while holding the lock, releases it, then books the seat in a second locked block.',
        result: 'Another thread can book the seat in between: the check and the update must be in ONE critical section.',
        wrong: ['It’s still safe because both parts are locked.', 'It deadlocks.', 'The lock is released twice.'],
      },
    ],
    transfer: [
      {
        problem: 'A shared Dictionary is used as a cache by 20 threads and occasionally throws strange errors or loses entries. What’s the fix?',
        answer: 'Guard every access with a lock, or switch to ConcurrentDictionary, which is built for many threads.',
        wrong: [
          { text: 'Catch the exceptions and retry.', why: 'The dictionary’s insides can already be corrupted.' },
          { text: 'Give it a bigger initial capacity.', why: 'Fewer resizes, but still not thread-safe.' },
          { text: 'Make the threads sleep randomly.', why: 'Hides the race; doesn’t fix it.' },
        ],
        explain: 'Dictionary isn’t safe for concurrent writes. Every shared mutable structure needs a lock or a concurrent version.',
      },
    ],
  },
  generators: {
    predict: [predictRace],
    simulate: [orderLock],
    count: [countLost],
    explain: lkExplain,
  },
};

// =====================================================================
// Deadlock
// =====================================================================

const DL = 'deadlock';

const predictDeadlock = (): Card => {
  const [x, y] = shuffle(['Accounts', 'Orders', 'Users', 'Stock']).slice(0, 2);
  return {
    concept: DL,
    type: 'predict',
    prompt: `Thread 1 locks ${x}, then tries to lock ${y}. At the same moment, thread 2 locks ${y}, then tries to lock ${x}. What happens?`,
    body: {
      kind: 'choice',
      options: shuffle([
        { text: 'Both wait for each other forever: a deadlock.', correct: true, why: 'Each holds what the other needs, and neither will let go.' },
        { text: 'One gets both locks and the other waits a moment.', correct: false, why: 'Each already holds one lock; neither can get the second.' },
        { text: 'The runtime notices and throws an error.', correct: false, why: 'C# lock never times out: the threads just hang.' },
        { text: 'Both proceed, since locks are released automatically.', correct: false, why: 'Only when a lock block ends, which never happens here.' },
      ]),
    },
    explain: `The classic fix: every thread takes locks in the SAME order (e.g. always ${[x, y].sort()[0]} before ${[x, y].sort()[1]}). Then a cycle of waiting can’t form.`,
  };
};

function waitGraph() {
  const n = randInt(4, 6);
  const ts = Array.from({ length: n }, (_, i) => `T${i + 1}`);
  for (;;) {
    const wait = new Map<string, string | null>(ts.map((t) => [t, Math.random() < 0.8 ? pick(ts.filter((o) => o !== t)) : null]));
    const inCycle = new Set<string>();
    for (const t of ts) {
      const seen: string[] = [];
      let cur: string | null = t;
      while (cur && !seen.includes(cur)) {
        seen.push(cur);
        cur = wait.get(cur) ?? null;
      }
      if (cur) seen.slice(seen.indexOf(cur)).forEach((x) => inCycle.add(x));
    }
    if (inCycle.size > 0 && inCycle.size < n) return { ts, wait, inCycle };
  }
}

const simulateCycle = (): Card => {
  const { ts, wait, inCycle } = waitGraph();
  return {
    concept: DL,
    type: 'simulate',
    prompt: `Each arrow means “is waiting for a lock held by”: ${ts.map((t) => (wait.get(t) ? `${t} → ${wait.get(t)}` : `${t} is running`)).join(', ')}. Select every thread that is deadlocked (can never continue AND is part of a cycle).`,
    body: { kind: 'choice', multi: true, options: ts.map((t) => ({ text: t, correct: inCycle.has(t), why: inCycle.has(t) ? undefined : 'Not part of a cycle of waiting.' })) },
    explain: `Follow the arrows: ${[...inCycle].join(' → ')} → back to the start. A cycle in the wait-for graph is a deadlock; threads merely waiting on that cycle are stuck too, but they aren’t part of the cycle.`,
  };
};

const countPhilosophers = (): Card => {
  const n = randInt(4, 9);
  return {
    concept: DL,
    type: 'count',
    prompt: `${n} philosophers sit round a table with one fork between each pair (${n} forks). Eating needs both neighbouring forks. At most how many can eat at the same time?`,
    body: { kind: 'number', answer: Math.floor(n / 2), unit: 'philosophers' },
    explain: `Each eater uses 2 of the ${n} forks and neighbours can’t both eat: ⌊${n} / 2⌋ = ${Math.floor(n / 2)}. If all ${n} grab their left fork at once, nobody can get a right fork: deadlock.`,
  };
};

const dlExplain = explainGenerators({
  concept: DL,
  truths: [
    'A deadlock is a cycle of threads, each waiting for a lock another one holds.',
    'Taking locks in one global order makes a cycle impossible.',
    'A wait-for graph with a cycle means there is a deadlock.',
    'Holding a lock while waiting for another is a precondition for deadlock.',
  ],
  myths: [
    { text: 'Deadlocks only happen with more than two threads.', why: 'Two threads and two locks are enough.' },
    { text: 'Adding more locks prevents deadlocks.', why: 'More locks usually means more chances for a cycle.' },
    { text: 'A deadlocked program crashes with an error.', why: 'It just hangs, which is often harder to diagnose.' },
  ],
  chains: [
    {
      prompt: 'Why does a fixed lock order prevent deadlock?',
      steps: ['A deadlock needs a cycle of “waits for”.', 'With a fixed order, a thread only ever waits for a lock later in the order than ones it holds.', 'Following the waits always moves forward in the order.', 'You can never come back round to the start, so no cycle can form.'],
    },
  ],
  summary: {
    best: 'Deadlock is two people in a narrow corridor each waiting for the other to step back first: agree on who always goes first and it can’t happen.',
    others: [
      { text: 'It’s when a program is slow.', why: 'It’s stuck forever, not slow.' },
      { text: 'It’s a race condition.', why: 'Races give wrong answers; deadlocks give no answer.' },
      { text: 'It’s when a lock breaks.', why: 'The locks work; the waiting forms a cycle.' },
    ],
  },
});

export const deadlockConcept: Concept = {
  id: DL,
  kind: 'systems',
  title: 'Deadlock',
  tier: 11,
  prereqs: ['locks', 'graph'],
  tagline: 'Everyone waiting for everyone else.',
  hook: {
    problem: 'Transferring money from A to B locks A then B. At the same moment someone transfers from B to A, locking B then A. The app freezes, forever.',
    question: 'How do you stop this for good?',
    options: [
      { text: 'Always lock accounts in the same order (say, lower account number first), whatever the direction of the transfer.', good: true, feedback: 'Yes: a global lock order makes a cycle of waiting impossible.' },
      { text: 'Use one lock per transfer.', feedback: 'Each transfer still needs both accounts.' },
      { text: 'Retry when it freezes.', feedback: 'Nothing ever returns to retry from.' },
    ],
  },
  lens: {
    layout: 'Threads, the locks they hold, and the locks they’re waiting for: a wait-for graph.',
    invariant: 'A deadlock exists exactly when the wait-for graph has a cycle.',
    payoff: 'Knowing the cause gives simple prevention: one lock order, timeouts, or detecting cycles.',
    price: 'Prevention constrains how you write code; detection needs extra bookkeeping and a way to back out.',
  },
  learn: {
    what: 'A deadlock happens when threads wait for each other in a circle: thread 1 holds lock A and waits for B, while thread 2 holds B and waits for A. Neither can ever continue. The program doesn’t crash; it just hangs.',
    how: [
      'Draw a wait-for graph: an arrow from each waiting thread to the thread holding the lock it wants.',
      'A cycle in that graph is a deadlock.',
      'Prevent it: take locks in one fixed global order (e.g. by id), so no cycle can form.',
      'Or use timeouts (Monitor.TryEnter) and back off, or detect cycles and abort one thread.',
    ],
  },
  extras: {
    family: 'deadlock',
    primitive: 'links',
    parts: ['locks held while waiting', 'a wait-for graph', 'a global lock order'],
    uses: ['Move money between two bank accounts while thousands of other transfers run at once.', 'Find out why a server stops responding under load but uses no CPU.'],
    rivals: ['locks'],
    breaks: [
      {
        violation: 'Transfer(a, b) locks a then b, and Transfer(b, a) locks b then a, running at the same time.',
        result: 'Each thread holds one account and waits for the other forever.',
        wrong: ['One transfer simply waits a little.', 'The balances end up wrong but the program continues.', 'C# detects it and throws.'],
      },
    ],
    transfer: [
      {
        problem: 'A database finds two transactions each waiting for rows the other has locked. What does it do?',
        answer: 'Detect the cycle in its wait-for graph and abort one transaction (the “victim”), which can then retry.',
        wrong: [
          { text: 'Wait forever.', why: 'Databases actively detect deadlocks.' },
          { text: 'Let both finish.', why: 'Neither can progress.' },
          { text: 'Merge the transactions.', why: 'They do unrelated work.' },
        ],
        explain: 'Detection plus recovery: find the cycle, break it by aborting one participant.',
      },
    ],
  },
  generators: {
    predict: [predictDeadlock],
    simulate: [simulateCycle],
    count: [countPhilosophers],
    explain: dlExplain,
  },
};

// =====================================================================
// Virtual memory & paging
// =====================================================================

const VM = 'virtual-memory';

function faults(refs: number[], frames: number, policy: 'FIFO' | 'LRU') {
  const mem: number[] = [];
  let f = 0;
  const evicted: (number | null)[] = [];
  for (const p of refs) {
    const i = mem.indexOf(p);
    if (i >= 0) {
      if (policy === 'LRU') mem.push(mem.splice(i, 1)[0]);
      evicted.push(null);
      continue;
    }
    f++;
    let out: number | null = null;
    if (mem.length === frames) out = mem.shift()!;
    mem.push(p);
    evicted.push(out);
  }
  return { f, evicted };
}

const predictTranslate = (): Card => {
  const size = pick([256, 1024, 4096]);
  const page = randInt(1, 9);
  const off = randInt(1, size - 1);
  const addr = page * size + off;
  return {
    concept: VM,
    type: 'predict',
    prompt: `Pages are ${size} bytes. A program reads virtual address ${addr}. Which page is it on, and at what offset inside the page?`,
    body: {
      kind: 'choice',
      options: options({ text: `Page ${page}, offset ${off}`, why: `${addr} ÷ ${size} = ${page} remainder ${off}.` }, [
        { text: `Page ${page + 1}, offset ${off}`, why: 'Pages count from 0.' },
        { text: `Page ${off}, offset ${page}`, why: 'Page = address ÷ size; offset = the remainder.' },
        { text: `Page ${page}, offset ${addr}`, why: 'The offset is only the part left over within the page.' },
      ]),
    },
    explain: `page = ${addr} ÷ ${size} = ${page}, offset = ${addr} mod ${size} = ${off}. The page table maps page ${page} to some physical frame; the offset stays the same.`,
  };
};

const simulateLru = (): Card => {
  let refs: number[];
  let r: ReturnType<typeof faults>;
  let step: number;
  do {
    refs = Array.from({ length: 9 }, () => randInt(1, 5));
    r = faults(refs, 3, 'LRU');
    const cands = r.evicted.map((e, i) => (e !== null ? i : -1)).filter((i) => i >= 0);
    step = cands.length ? pick(cands) : -1;
  } while (step < 0);
  const out = r.evicted[step]!;
  const pagesBefore = [...new Set(refs.slice(0, step))];
  return {
    concept: VM,
    type: 'simulate',
    prompt: `3 physical frames, LRU replacement. Pages are used in this order: ${refs.join(', ')}. When page ${refs[step]} is needed at step ${step + 1}, it isn’t in memory. Which page gets evicted?`,
    body: {
      kind: 'choice',
      options: options({ text: `Page ${out}`, why: 'It’s the one used longest ago among the three in memory.' }, pagesBefore.filter((p) => p !== out).map((p) => ({ text: `Page ${p}`, why: 'It was used more recently than the victim (or isn’t in memory).' }))),
    },
    explain: `Least recently used: look back from step ${step + 1}. Of the pages in memory, ${out} was used longest ago, so it goes.`,
  };
};

const countFaults = (): Card => {
  const refs = Array.from({ length: 10 }, () => randInt(1, 5));
  const policy = pick(['FIFO', 'LRU'] as const);
  const { f } = faults(refs, 3, policy);
  return {
    concept: VM,
    type: 'count',
    prompt: `3 frames, ${policy} replacement, memory starts empty. Pages are used in this order: ${refs.join(', ')}. How many page faults happen?`,
    body: { kind: 'number', answer: f, unit: 'faults' },
    explain: `A fault happens whenever the page isn’t already in one of the 3 frames. ${policy === 'LRU' ? 'LRU evicts the page used longest ago.' : 'FIFO evicts the page that was loaded first.'} Total: ${f}.`,
  };
};

const vmExplain = explainGenerators({
  concept: VM,
  truths: [
    'Every process sees its own virtual addresses, translated to physical memory by a page table.',
    'Memory is divided into fixed-size pages (often 4 KB).',
    'A page fault happens when a page isn’t in RAM; the OS loads it from disk.',
    'When RAM is full, a replacement policy such as LRU picks a page to evict.',
  ],
  myths: [
    { text: 'A program’s addresses are the real locations in the RAM chips.', why: 'They’re virtual; the page table maps them.' },
    { text: 'Two processes using address 1000 are reading the same byte.', why: 'Each has its own page table, so they map to different physical memory.' },
    { text: 'Page faults are errors that crash the program.', why: 'Normally the OS quietly loads the page and the program continues.' },
  ],
  chains: [
    {
      prompt: 'How does a read of a virtual address reach real memory?',
      steps: ['Split the address into page number and offset.', 'Look up the page number in the process’s page table.', 'If the page isn’t in RAM, fault and load it from disk.', 'Combine the physical frame with the offset and read the byte.'],
    },
  ],
  summary: {
    best: 'Virtual memory gives every program its own pretend address book; the OS quietly maps each page to real memory, and swaps pages to disk when RAM runs out.',
    others: [
      { text: 'It’s fake memory.', why: 'It maps onto real memory; it isn’t fake.' },
      { text: 'It makes RAM bigger.', why: 'It lets you use disk as overflow, but slowly.' },
      { text: 'It’s a cache.', why: 'It uses caching ideas, but its main job is isolation and mapping.' },
    ],
  },
});

export const virtualMemoryConcept: Concept = {
  id: VM,
  kind: 'systems',
  title: 'Virtual Memory & Paging',
  tier: 11,
  prereqs: ['memory', 'hash-map', 'lru-cache'],
  tagline: 'Every program gets its own address book.',
  hook: {
    problem: 'Two programs both think their data lives at address 1000, and together they need more memory than the machine has.',
    question: 'How can both run safely?',
    options: [
      { text: 'Give each program its own “virtual” addresses and translate them to real memory page by page, keeping unused pages on disk.', good: true, feedback: 'Yes: virtual memory. Isolation, plus more apparent memory than RAM.' },
      { text: 'Let the second program wait until the first finishes.', feedback: 'Then nothing runs at the same time.' },
      { text: 'Have the programs agree on different addresses.', feedback: 'Impossible to coordinate for every program ever written.' },
    ],
  },
  lens: {
    layout: 'Virtual pages, a page table per process (page number → physical frame), physical frames in RAM, and swap space on disk.',
    invariant: 'A process can only reach physical memory through its own page table.',
    payoff: 'Isolation between programs, the same addresses for every program, and more apparent memory than RAM.',
    price: 'Each access needs a translation (cached in the TLB); page faults to disk are thousands of times slower than RAM.',
  },
  learn: {
    what: 'Programs don’t use real memory addresses. Each process gets its own virtual address space, cut into pages (usually 4 KB). The operating system keeps a page table per process that maps each virtual page to a physical frame of RAM, or notes that it is currently on disk.',
    how: [
      'Split a virtual address into a page number (address ÷ page size) and an offset (the remainder).',
      'Look the page number up in the page table to find the physical frame.',
      'If the page is on disk, that’s a page fault: the OS loads it into a free frame.',
      'If no frame is free, evict one, usually the least recently used page (LRU, from the LRU cache lesson).',
    ],
  },
  extras: {
    family: 'memory-management',
    primitive: 'both',
    parts: ['a page table per process', 'fixed-size pages and frames', 'a page replacement policy'],
    uses: ['Run 30 programs that together need more memory than the laptop has.', 'Stop a buggy program from overwriting another program’s memory.'],
    breaks: [
      {
        violation: 'The working set of several programs is much bigger than RAM, so every access needs a page that was just evicted.',
        result: 'Thrashing: the machine spends nearly all its time moving pages to and from disk and barely runs.',
        wrong: ['Programs just get a little slower.', 'The OS refuses to start more programs.', 'Memory is automatically compressed to fit.'],
      },
    ],
    transfer: [
      {
        problem: 'A database keeps its most-used disk pages in memory and must choose which to drop when memory is full. What does it do?',
        answer: 'Keep a buffer pool and evict pages with an LRU-style policy, just like virtual memory.',
        wrong: [
          { text: 'Drop a random page.', why: 'Throws away hot pages as often as cold ones.' },
          { text: 'Never cache pages.', why: 'Every read would hit the disk.' },
          { text: 'Drop the newest page.', why: 'That’s usually the one about to be used again.' },
        ],
        explain: 'Same problem, same answer: a fixed number of frames and a replacement policy that keeps the working set in memory.',
      },
    ],
  },
  generators: {
    predict: [predictTranslate],
    simulate: [simulateLru],
    count: [countFaults],
    explain: vmExplain,
  },
};

// =====================================================================
// Async I/O & event loops
// =====================================================================

const AI = 'async-io';

const predictAsync = (): Card => {
  const n = pick([100, 200, 500, 1000]);
  const w = pick([1, 2]);
  const t = pick([10, 20, 50]);
  return {
    concept: AI,
    type: 'predict',
    prompt: `A server must make ${n} web requests that each wait ${w} s for a reply. Option 1: a pool of ${t} threads, each BLOCKING while it waits. Option 2: async/await on a few threads. Roughly how long does each take?`,
    body: {
      kind: 'choice',
      options: options({ text: `Option 1 ≈ ${(n / t) * w} s; option 2 ≈ ${w} s.`, why: 'Blocked threads can’t start new requests; async starts them all and waits for all at once.' }, [
        { text: `Both ≈ ${w} s.`, why: `Only ${t} blocking threads can wait at once.` },
        { text: `Both ≈ ${(n / t) * w} s.`, why: 'Async doesn’t need a thread per waiting request.' },
        { text: `Option 1 ≈ ${w} s; option 2 ≈ ${n * w} s.`, why: 'It’s the other way round.' },
      ]),
    },
    explain: `${n} requests ÷ ${t} threads = ${n / t} rounds of ${w} s when each thread blocks. With async, waiting costs no thread, so all ${n} requests wait at the same time: about ${w} s.`,
  };
};

const orderAwait = (): Card => ({
  concept: AI,
  type: 'simulate',
  prompt: 'A request handler runs: var data = await http.GetStringAsync(url); then saves the data. Put what happens in order.',
  body: {
    kind: 'order',
    steps: [
      'The handler starts the network request.',
      'At the await, the method returns and the thread goes back to the pool to do other work.',
      'The operating system signals that the reply has arrived.',
      'The rest of the method is queued as a continuation.',
      'A pool thread picks it up and saves the data.',
    ],
  },
  explain: 'While waiting, no thread is tied up. That’s why one server can keep tens of thousands of requests in flight with only a handful of threads.',
});

const countBlocking = (): Card => {
  const n = pick([60, 120, 240, 600]);
  const t = pick([10, 20, 30]);
  const w = pick([100, 200, 500]);
  return {
    concept: AI,
    type: 'count',
    prompt: `${n} requests each wait ${w} ms for a database. A pool of ${t} threads handles them, each thread BLOCKING while it waits. How long until all are done (ignore CPU time)?`,
    body: { kind: 'number', answer: Math.ceil(n / t) * w, unit: 'ms' },
    explain: `${t} at a time: ⌈${n} ÷ ${t}⌉ = ${Math.ceil(n / t)} rounds × ${w} ms = ${Math.ceil(n / t) * w} ms. With async I/O they’d all wait together: about ${w} ms.`,
  };
};

const aiExplain = explainGenerators({
  concept: AI,
  truths: [
    'Most server time is spent waiting for I/O: networks, disks, databases.',
    'A blocked thread does nothing useful but still costs memory.',
    'async/await frees the thread while waiting and resumes the method when the result arrives.',
    'Async helps I/O-bound work; CPU-bound work still needs cores.',
  ],
  myths: [
    { text: 'async makes code run in parallel on more cores.', why: 'It avoids blocking while waiting; it doesn’t add CPU power.' },
    { text: 'Every await starts a new thread.', why: 'No thread is used while waiting; a pool thread resumes the work later.' },
    { text: 'Calling .Result on a Task is the same as await.', why: '.Result blocks the thread, throwing away the benefit (and can deadlock).' },
  ],
  chains: [
    {
      prompt: 'Why can async handle far more waiting requests than blocking threads?',
      steps: ['A blocking request holds a whole thread while it waits.', 'Threads cost memory, so there can only be so many.', 'With await, the waiting request holds no thread at all.', 'So the number of in-flight requests is no longer limited by threads.'],
    },
  ],
  summary: {
    best: 'Async is like a waiter who takes your order, serves other tables while the kitchen cooks, and comes back when your food is ready, instead of standing at the kitchen door.',
    others: [
      { text: 'Async makes code faster.', why: 'It makes waiting cheaper, not computing faster.' },
      { text: 'Async uses lots of threads.', why: 'It uses fewer.' },
      { text: 'Async runs code in the background.', why: 'Vague; misses the point about not blocking while waiting.' },
    ],
  },
});

export const asyncIoConcept: Concept = {
  id: AI,
  kind: 'systems',
  title: 'Async I/O & Event Loops',
  tier: 11,
  prereqs: ['processes-threads', 'queue'],
  tagline: 'Don’t hold a thread while you wait.',
  hook: {
    problem: 'Your API calls a payment service that takes 2 seconds to reply. Under load, the server runs out of threads and stops answering, while the CPU sits at 3%.',
    question: 'What’s going wrong?',
    options: [
      { text: 'Every request holds a thread just to wait. Use async I/O so waiting requests hold no thread.', good: true, feedback: 'Yes: the threads are all blocked waiting, not working. await frees them.' },
      { text: 'The CPU is too slow.', feedback: 'It’s at 3%: it isn’t the bottleneck.' },
      { text: 'Add more servers.', feedback: 'Helps a little, but each one wastes threads the same way.' },
    ],
  },
  lens: {
    layout: 'A small pool of threads, I/O requests handed to the operating system, and a queue of continuations to run when results arrive.',
    invariant: 'No thread is ever blocked waiting for I/O; waiting work sits in a queue, not on a thread.',
    payoff: 'A few threads can keep thousands of slow requests in flight at once.',
    price: 'Code is split into continuations (harder to debug), and blocking anywhere (.Result, Thread.Sleep) quietly ruins it.',
  },
  learn: {
    what: 'Most programs spend their time waiting: for the network, the disk or a database. If each waiting task holds a thread, you run out of threads long before you run out of CPU. Async I/O hands the wait to the operating system and frees the thread; when the result arrives, the rest of the work is queued and a thread picks it up.',
    how: [
      'Start the I/O (GetStringAsync, ReadAsync, a database call) and await it.',
      'At the await the method returns; the thread goes back to the pool to run other work.',
      'The OS notifies the runtime when the I/O completes.',
      'The rest of your method (the continuation) is put on a queue and a pool thread runs it.',
      'Node.js does the same with one thread and an event loop; C# uses a thread pool.',
    ],
  },
  extras: {
    family: 'io-model',
    primitive: 'abstract',
    parts: ['non-blocking I/O handed to the OS', 'a queue of continuations', 'a small thread pool'],
    uses: ['Serve 20,000 open chat connections from one small server.', 'Call 50 external APIs for one page and wait for all of them at once.'],
    rivals: ['processes-threads'],
    breaks: [
      {
        violation: 'Inside an async web handler, the code calls .Result on a slow Task instead of awaiting it.',
        result: 'The thread blocks while waiting, so under load the pool runs dry and the server stalls (and some contexts deadlock).',
        wrong: ['Nothing changes: .Result and await are equivalent.', 'It runs faster because there’s no continuation.', 'The compiler refuses it.'],
      },
    ],
    transfer: [
      {
        problem: 'A page needs data from 5 independent services, each taking ~300 ms. It currently awaits them one after another (1.5 s). How do you speed it up?',
        answer: 'Start all 5 requests first, then await Task.WhenAll: the waits overlap, about 300 ms total.',
        wrong: [
          { text: 'Use 5 threads with Thread.Sleep polling.', why: 'Wastes threads and adds polling delay.' },
          { text: 'Cache nothing and retry faster.', why: 'Doesn’t overlap the waits.' },
          { text: 'Make the requests synchronous.', why: 'That blocks even more.' },
        ],
        explain: 'Async lets independent waits happen at the same time, so the total is the slowest one, not the sum.',
      },
    ],
  },
  generators: {
    predict: [predictAsync],
    simulate: [orderAwait],
    count: [countBlocking],
    explain: aiExplain,
  },
};

export const OS_CONCEPTS: Concept[] = [processesThreadsConcept, schedulingConcept, locksConcept, deadlockConcept, virtualMemoryConcept, asyncIoConcept];
