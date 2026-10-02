import type { Card, Concept } from '../engine/types';
import { pick, randInt, shuffle } from '../engine/random';
import { explainGenerators, numberOptions } from './helpers';

const TIER = 2;

// =====================================================================
// Binary arithmetic & logic gates
// =====================================================================

const LG = 'logic-gates';

const bin = (n: number, w = 8) => (n >>> 0).toString(2).padStart(w, '0').slice(-w);

const predictGate = (): Card => {
  const a = randInt(1, 15);
  const b = randInt(1, 15);
  const op = pick([
    { name: 'AND', f: (x: number, y: number) => x & y, rule: '1 only where both bits are 1' },
    { name: 'OR', f: (x: number, y: number) => x | y, rule: '1 where either bit is 1' },
    { name: 'XOR', f: (x: number, y: number) => x ^ y, rule: '1 where the bits differ' },
  ]);
  const ans = op.f(a, b);
  const others = [a & b, a | b, a ^ b, a + b, ~ans & 15].filter((v) => (v & 15) !== ans);
  return {
    concept: LG,
    type: 'predict',
    prompt: `Bit by bit, ${bin(a, 4)} ${op.name} ${bin(b, 4)} = ?`,
    body: {
      kind: 'choice',
      options: shuffle([
        { text: bin(ans, 4), correct: true },
        ...[...new Set(others.map((v) => bin(v, 4)))].filter((t) => t !== bin(ans, 4)).slice(0, 3).map((t) => ({ text: t, correct: false, why: `${op.name} gives 1 ${op.rule}.` })),
      ]),
    },
    explain: `${op.name}: ${op.rule}. Column by column: ${bin(a, 4)} ${op.name} ${bin(b, 4)} = ${bin(ans, 4)}.`,
  };
};

const predictOverflow = (): Card => {
  const a = randInt(100, 127);
  const b = randInt(128 - a, 60);
  const real = a + b;
  const wrapped = real > 127 ? real - 256 : real;
  return {
    concept: LG,
    type: 'predict',
    prompt: `In C#, sbyte is 8 bits, two’s complement (−128 to 127). What is (sbyte)(${a} + ${b}) in an unchecked context?`,
    body: {
      kind: 'choice',
      options: shuffle([
        { text: String(wrapped), correct: true },
        { text: String(real), correct: false, why: `${real} doesn’t fit in 8 bits signed (max 127).` },
        { text: '127', correct: false, why: 'C# doesn’t clamp; the bits just wrap around.' },
        { text: 'An exception', correct: false, why: 'Only in a checked context.' },
      ].filter((o, i, all) => all.findIndex((x) => x.text === o.text) === i)),
    },
    explain: `${real} needs a 9th bit. Keeping only 8 bits wraps it to ${real} − 256 = ${wrapped}: the top bit is now set, which two’s complement reads as negative.`,
  };
};

const orderAdder = (): Card => ({
  concept: LG,
  type: 'simulate',
  prompt: 'The CPU adds 0101 + 0011 with a chain of full adders. Put the steps in order.',
  body: {
    kind: 'order',
    steps: ['Bit 0: 1 + 1 = 0, carry 1.', 'Bit 1: 0 + 1 + carry 1 = 0, carry 1.', 'Bit 2: 1 + 0 + carry 1 = 0, carry 1.', 'Bit 3: 0 + 0 + carry 1 = 1, carry 0.', 'Result 1000 (8): 5 + 3 = 8.'],
  },
  explain: 'Each full adder is built from XOR (the sum bit) and AND/OR (the carry). Chaining them adds numbers of any width, exactly like column addition on paper.',
});

const countRange = (): Card => {
  const n = pick([4, 8, 16]);
  return pick([
    {
      concept: LG,
      type: 'count' as const,
      prompt: `What is the largest value a ${n}-bit signed (two’s complement) number can hold?`,
      body: { kind: 'number' as const, answer: 2 ** (n - 1) - 1, unit: '' },
      explain: `The top bit is the sign, leaving ${n - 1} bits: 2^${n - 1} − 1 = ${2 ** (n - 1) - 1}. The smallest is −${2 ** (n - 1)}.`,
    },
    (() => {
      const v = randInt(1, 2 ** (n - 1) - 1);
      return {
        concept: LG,
        type: 'count' as const,
        prompt: `In ${n}-bit two’s complement, −${v} is stored as the same bit pattern as which unsigned number?`,
        body: { kind: 'number' as const, answer: 2 ** n - v, unit: '' },
        explain: `Negative x is stored as 2^${n} − x: ${2 ** n} − ${v} = ${2 ** n - v}. That’s why the same adder works for signed and unsigned numbers.`,
      };
    })(),
  ]);
};

const lgExplain = explainGenerators({
  concept: LG,
  truths: [
    'Every calculation a CPU does is built from tiny logic gates like AND, OR, XOR and NOT.',
    'A full adder adds two bits plus a carry; chaining them adds whole numbers.',
    'Two’s complement stores negative numbers so the same adder works for positive and negative values.',
    'Fixed-width numbers wrap around when a result doesn’t fit (overflow).',
  ],
  myths: [
    { text: 'The CPU understands decimal numbers directly.', why: 'Everything is binary; decimal is just how we print it.' },
    { text: 'int.MaxValue + 1 throws an error in C# by default.', why: 'It silently wraps to int.MinValue unless you use checked.' },
    { text: 'Negative numbers are stored as a minus sign followed by the number.', why: 'Two’s complement: −x is stored as 2^n − x.' },
  ],
  chains: [
    {
      prompt: 'Why does int.MaxValue + 1 become int.MinValue?',
      steps: ['int is 32 bits in two’s complement.', 'int.MaxValue is 0 followed by 31 ones.', 'Adding 1 carries all the way into the top bit.', 'A top bit of 1 means negative, so the result reads as −2,147,483,648.'],
    },
  ],
  summary: {
    best: 'A CPU is billions of tiny switches wired into gates; a few gates make an adder, and adders plus some wiring make all of arithmetic.',
    others: [
      { text: 'The CPU does maths like a calculator app.', why: 'It does it with gates on bits.' },
      { text: 'Binary is just a way to write numbers.', why: 'It’s how the hardware physically works.' },
      { text: 'Overflow is a bug in C#.', why: 'It’s what fixed-width hardware does.' },
    ],
  },
});

export const logicGatesConcept: Concept = {
  id: LG,
  kind: 'systems',
  title: 'Binary Arithmetic & Logic Gates',
  tier: TIER,
  prereqs: ['bits'],
  tagline: 'Switches make gates; gates make arithmetic.',
  hook: {
    problem: 'A CPU is made of billions of transistors, which are just on/off switches. Yet it can add, subtract and compare numbers billions of times a second.',
    question: 'How do switches add numbers?',
    options: [
      { text: 'Wire switches into logic gates (AND, OR, XOR); a few gates make a 1-bit adder; chain adders to add whole numbers.', good: true, feedback: 'Yes. Everything above is built from that.' },
      { text: 'The CPU has a tiny lookup table of every possible sum.', feedback: 'For 64-bit numbers that table would be astronomically large.' },
      { text: 'It converts to decimal, adds, and converts back.', feedback: 'There is no decimal inside; it is binary all the way down.' },
    ],
  },
  lens: {
    layout: 'Fixed-width rows of bits; gates that combine bits (AND, OR, XOR, NOT); adders chained bit by bit with carries.',
    invariant: 'An n-bit result keeps only the lowest n bits; two’s complement reads the top bit as the sign.',
    payoff: 'One simple adder circuit handles addition and subtraction for signed and unsigned numbers.',
    price: 'Fixed width means overflow: results that don’t fit silently wrap around.',
  },
  learn: {
    what: 'Underneath every line of C#, the CPU works on fixed-width rows of bits using logic gates. AND, OR, XOR and NOT combine bits; a handful of them make an adder; chained adders do arithmetic. Knowing this explains overflow, why int has the range it has, and what bitwise operators really do.',
    how: [
      'AND: 1 only if both are 1. OR: 1 if either is. XOR: 1 if they differ. NOT flips.',
      'Half adder: sum = a XOR b, carry = a AND b. A full adder also takes a carry in.',
      'Chain n full adders and you can add two n-bit numbers, carrying left like on paper.',
      'Two’s complement: −x is stored as 2^n − x (flip the bits and add 1). Subtraction is adding the negative.',
      'Overflow: if the true result needs more than n bits, the extra is dropped. C# wraps silently unless you write checked(...).',
    ],
  },
  extras: {
    family: 'hardware',
    primitive: 'bits',
    parts: ['logic gates', 'full adders with a carry chain', 'two’s complement'],
    uses: ['Understand why an int counter suddenly went negative.', 'Use bitwise AND/OR/XOR for flags, masks and fast checks.'],
    breaks: [
      {
        violation: 'A page-view counter is an int and passes 2,147,483,647.',
        result: 'It wraps to −2,147,483,648 and every chart built on it breaks.',
        wrong: ['It stops at the maximum.', 'C# throws an exception automatically.', 'It becomes a long automatically.'],
      },
    ],
    transfer: [
      {
        problem: 'Binary search computes mid = (lo + hi) / 2 on int indexes. On a huge array it suddenly reads a negative index. Why?',
        answer: 'lo + hi overflowed int and wrapped negative; use lo + (hi − lo) / 2.',
        wrong: [
          { text: 'The array is corrupted.', why: 'The arithmetic is.' },
          { text: 'Division rounds badly.', why: 'The sum wrapped before dividing.' },
          { text: 'Binary search doesn’t work on big arrays.', why: 'It does, with safe arithmetic.' },
        ],
        explain: 'A famous bug that sat in Java’s standard library for years: fixed-width addition wraps.',
      },
    ],
  },
  generators: {
    predict: [predictGate, predictOverflow],
    simulate: [orderAdder],
    count: [countRange],
    explain: lgExplain,
  },
};

// =====================================================================
// The CPU: fetch, decode, execute
// =====================================================================

const CPU = 'cpu-cycle';

const predictProgram = (): Card => {
  const a = randInt(2, 9);
  const b = randInt(2, 9);
  const n = randInt(2, 4);
  // r0 = a; r1 = b; loop n times: r0 = r0 + r1
  const ans = a + n * b;
  return {
    concept: CPU,
    type: 'predict',
    prompt: `A tiny CPU runs this program (each line is one instruction; JNZ jumps if the register isn’t zero):\n\n0: SET r0, ${a}\n1: SET r1, ${b}\n2: SET r2, ${n}\n3: ADD r0, r1\n4: DEC r2\n5: JNZ r2, 3\n6: HALT\n\nWhat is in r0 at HALT?`,
    body: {
      kind: 'choice',
      options: numberOptions(ans, [
        { value: a + b, why: 'The loop runs more than once.' },
        { value: a + (n - 1) * b, why: `The loop body runs ${n} times, not ${n - 1}.` },
        { value: a + (n + 1) * b, why: `r2 counts down from ${n} to 0: ${n} passes.` },
        { value: n * b, why: `r0 started at ${a}, not 0.` },
      ], `${a} + ${n} × ${b} = ${ans}.`),
    },
    explain: `The program counter goes 3, 4, 5, back to 3… ${n} times, adding ${b} each time: ${a} + ${n} × ${b} = ${ans}. A loop is just a jump backwards.`,
  };
};

const orderCycle = (): Card => ({
  concept: CPU,
  type: 'simulate',
  prompt: 'The CPU runs one instruction, ADD r0, r1. Put the steps in order.',
  body: {
    kind: 'order',
    steps: ['Fetch: read the instruction at the address in the program counter.', 'Decode: work out it is an ADD of registers r0 and r1.', 'Execute: the ALU adds the two register values.', 'Write back: store the result in r0.', 'Move the program counter to the next instruction.'],
  },
  explain: 'Fetch, decode, execute, repeat, billions of times a second. Every if, loop and method call becomes this cycle.',
});

const countClock = (): Card => {
  const ghz = pick([2, 3, 4]);
  const ipc = pick([1, 2, 4]);
  return pick([
    {
      concept: CPU,
      type: 'count' as const,
      prompt: `A ${ghz} GHz core finishes on average ${ipc} instruction${ipc > 1 ? 's' : ''} per clock cycle. How many billion instructions per second is that?`,
      body: { kind: 'number' as const, answer: ghz * ipc, unit: 'billion/s' },
      explain: `${ghz} billion cycles/s × ${ipc} = ${ghz * ipc} billion instructions per second, per core.`,
    },
    (() => {
      const ns = pick([1, 2, 5]);
      return {
        concept: CPU,
        type: 'count' as const,
        prompt: `A ${ghz} GHz CPU’s clock ticks every 1/${ghz} of a nanosecond. How many cycles pass during a ${ns * 100} ns wait for main memory?`,
        body: { kind: 'number' as const, answer: ghz * ns * 100, unit: 'cycles' },
        explain: `${ns * 100} ns × ${ghz} cycles/ns = ${ghz * ns * 100} cycles doing nothing. That’s why caches exist (later lesson).`,
      };
    })(),
  ]);
};

const cpuExplain = explainGenerators({
  concept: CPU,
  truths: [
    'A CPU repeats one loop: fetch an instruction, decode it, execute it, move on.',
    'The program counter holds the address of the next instruction.',
    'Registers are a handful of tiny, ultra-fast storage slots inside the CPU.',
    'Loops and ifs are compiled into jumps that change the program counter.',
  ],
  myths: [
    { text: 'The CPU runs C# directly.', why: 'C# is compiled down to machine instructions first.' },
    { text: 'Variables always live in RAM while they are used.', why: 'Hot values sit in registers.' },
    { text: 'A loop is a special hardware feature.', why: 'It is just a conditional jump backwards.' },
  ],
  chains: [
    {
      prompt: 'How does a while loop run on the CPU?',
      steps: ['The compiler turns the condition into a compare instruction.', 'A conditional jump skips past the loop if the condition fails.', 'The body runs as ordinary instructions.', 'A jump at the end sets the program counter back to the condition.'],
    },
  ],
  summary: {
    best: 'A CPU is a very fast, very literal clerk: it reads one instruction from a numbered list, does it, and moves to the next number unless told to jump.',
    others: [
      { text: 'The CPU thinks about your program.', why: 'It mechanically follows instructions.' },
      { text: 'The CPU is the computer’s memory.', why: 'Memory is separate; the CPU works on a few registers.' },
      { text: 'The CPU runs every line at once.', why: 'Each core follows one stream of instructions.' },
    ],
  },
});

export const cpuCycleConcept: Concept = {
  id: CPU,
  kind: 'systems',
  title: 'The CPU: Fetch, Decode, Execute',
  tier: TIER,
  prereqs: ['logic-gates', 'memory'],
  tagline: 'Read an instruction, do it, move on. Forever.',
  hook: {
    problem: 'Your C# has classes, loops, LINQ and async. The CPU has none of those. It only has a few registers, an adder and some wires to memory.',
    question: 'So how does your program actually run?',
    options: [
      { text: 'It is compiled into simple numbered instructions (load, add, compare, jump) and the CPU loops: fetch the next one, do it, repeat.', good: true, feedback: 'Yes: the fetch–decode–execute cycle.' },
      { text: 'The CPU reads the C# source code line by line.', feedback: 'Source code is compiled long before the CPU sees it.' },
      { text: 'Each class runs on its own part of the chip.', feedback: 'All code becomes one stream of instructions per core.' },
    ],
  },
  lens: {
    layout: 'Registers (a few named slots), an ALU that does the arithmetic, a program counter, and memory holding both instructions and data.',
    invariant: 'The program counter always holds the address of the next instruction; each cycle reads it, executes it, and advances or jumps.',
    payoff: 'Any program, however complex, runs as a sequence of tiny steps the hardware can do.',
    price: 'One step at a time per core, and every trip to memory costs far more than work in registers.',
  },
  learn: {
    what: 'The CPU is a loop in hardware. It reads the instruction at the address in its program counter, works out what it means, does it (usually with the ALU on registers), and moves the counter on. Ifs and loops are just jumps: instructions that change the program counter.',
    how: [
      'Registers: a few dozen tiny storage slots inside the CPU, the fastest memory there is.',
      'ALU (arithmetic logic unit): the adders and gates from the last lesson.',
      'Program counter (PC): the address of the next instruction.',
      'Each cycle: fetch → decode → execute → write back → PC moves on (or jumps).',
      'A 3 GHz CPU ticks 3 billion times a second; modern cores finish several instructions per tick.',
    ],
  },
  extras: {
    family: 'hardware',
    primitive: 'slots',
    parts: ['registers and an ALU', 'a program counter', 'the fetch–decode–execute loop'],
    uses: ['Understand what a debugger’s “step” and instruction pointer show.', 'Read a JIT disassembly (SharpLab) and know what each line does.'],
    breaks: [
      {
        violation: 'A bug makes the program counter jump into the middle of a data array.',
        result: 'The CPU decodes the data as instructions and does random things or crashes: it can’t tell code from data.',
        wrong: ['It skips the data.', 'It reports a syntax error.', 'It converts the data to code safely.'],
      },
    ],
    transfer: [
      {
        problem: 'You want to understand why one C# loop is faster than another that looks almost the same.',
        answer: 'Look at the machine code the JIT produces (e.g. SharpLab.io or BenchmarkDotNet’s disassembler) and compare the instructions in the loop body.',
        wrong: [
          { text: 'Count the lines of C#.', why: 'One C# line can be one or fifty instructions.' },
          { text: 'Compare the IL only.', why: 'The JIT changes a lot after IL.' },
          { text: 'Guess from the method names.', why: 'Measure and read the instructions.' },
        ],
        explain: 'The CPU only runs instructions; that’s where speed is decided.',
      },
    ],
  },
  generators: {
    predict: [predictProgram],
    simulate: [orderCycle],
    count: [countClock],
    explain: cpuExplain,
  },
};

// =====================================================================
// Machine code & the call stack
// =====================================================================

const CS = 'call-stack';

const predictFrames = (): Card => {
  const n = randInt(3, 6);
  return {
    concept: CS,
    type: 'predict',
    prompt: `int Fact(int n) => n <= 1 ? 1 : n * Fact(n - 1);\n\nWhile Fact(1) is running (called from Fact(${n})), how many Fact frames are on the call stack?`,
    body: {
      kind: 'choice',
      options: numberOptions(n, [
        { value: 1, why: 'Each call waits for the one it made: their frames are all still there.' },
        { value: n - 1, why: `Fact(${n}) down to Fact(1) inclusive.` },
        { value: n + 1, why: 'Fact(0) is never called: n <= 1 stops at 1.' },
      ], `Fact(${n}), Fact(${n - 1}), …, Fact(1): ${n} frames.`),
    },
    explain: `Each call pushes a frame (its argument, locals and return address) and only pops it when it returns. At the deepest point there are ${n} frames.`,
  };
};

const predictOverflowStack = (): Card => ({
  concept: CS,
  type: 'predict',
  prompt: 'A recursive method has a bug: its base case is never reached. What happens?',
  body: {
    kind: 'choice',
    options: shuffle([
      { text: 'Frames pile up until the stack’s fixed space (about 1 MB per thread) runs out: a StackOverflowException kills the process.', correct: true },
      { text: 'It runs forever.', correct: false, why: 'Each call uses stack space, which is limited.' },
      { text: 'The garbage collector frees old frames.', correct: false, why: 'Frames are still in use; the GC doesn’t touch the stack.' },
      { text: 'It throws an exception you can catch and carry on.', correct: false, why: 'In .NET, stack overflow can’t be caught.' },
    ]),
  },
  explain: 'The stack is a fixed-size block of memory per thread. Deep recursion on large inputs should become a loop with an explicit Stack<T>.',
});

const orderCall = (): Card => ({
  concept: CS,
  type: 'simulate',
  prompt: 'Main calls Add(2, 3), which returns 5. Put what happens on the call stack in order.',
  body: {
    kind: 'order',
    steps: ['The arguments 2 and 3 are placed where Add will find them (registers or the stack).', 'CALL pushes the return address (where Main continues) and jumps to Add.', 'Add moves the stack pointer to make room for its locals: its frame.', 'Add computes 5 and puts it in the return-value register.', 'RET pops the frame and the return address, and jumps back into Main.'],
  },
  explain: 'A method call is just: save where to come back to, jump, make room, work, clean up, jump back. The stack pointer moving up and down is the whole mechanism.',
});

const countStack = (): Card => {
  const frame = pick([64, 96, 128, 200]);
  const kb = pick([256, 512, 1024]);
  return {
    concept: CS,
    type: 'count',
    prompt: `Each recursive call uses a ${frame}-byte frame and the thread’s stack is ${kb} KB (${kb * 1024} bytes). About how many nested calls fit before it overflows? (Round down.)`,
    body: { kind: 'number', answer: Math.floor((kb * 1024) / frame), unit: 'calls' },
    explain: `${kb * 1024} ÷ ${frame} = ${Math.floor((kb * 1024) / frame)}. Recursion depth is limited by bytes, not by how clever the code is.`,
  };
};

const csExplain = explainGenerators({
  concept: CS,
  truths: [
    'Each method call pushes a frame holding its locals and the address to return to.',
    'The stack pointer register marks the top of the stack; calls move it, returns move it back.',
    'A thread’s stack is a fixed-size block of memory, about 1 MB by default in .NET.',
    'A stack trace is a list of the frames currently on the stack.',
  ],
  myths: [
    { text: 'Every object you create lives on the stack.', why: 'Class instances live on the heap; the stack holds references and value-type locals.' },
    { text: 'Recursion and loops cost the same memory.', why: 'Each recursive call adds a frame; a loop reuses one.' },
    { text: 'Returning from a method frees the objects it created.', why: 'Its frame goes; heap objects stay until the GC collects them.' },
  ],
  chains: [
    {
      prompt: 'How does the CPU know where to continue after a method returns?',
      steps: ['CALL pushes the address of the next instruction onto the stack.', 'The method runs, pushing and popping its own data.', 'By the end it has restored the stack pointer.', 'RET pops that saved address into the program counter.'],
    },
  ],
  summary: {
    best: 'The call stack is a pile of sticky notes: each method call adds a note saying “my local stuff, and where to go back to”, and returning peels the top note off.',
    others: [
      { text: 'The call stack stores all your data.', why: 'Objects live on the heap.' },
      { text: 'The call stack is a C# collection.', why: 'It is a region of memory managed by the CPU.' },
      { text: 'The call stack is unlimited.', why: 'It is a fixed size per thread.' },
    ],
  },
});

export const callStackConcept: Concept = {
  id: CS,
  kind: 'systems',
  title: 'Machine Code & the Call Stack',
  tier: TIER,
  prereqs: ['cpu-cycle', 'pointers'],
  tagline: 'Push where to come back to, jump, pop, return.',
  hook: {
    problem: 'Method A calls B, which calls C, which calls B again. Each needs its own local variables, and each must return to exactly the right place.',
    question: 'How does the CPU keep track?',
    options: [
      { text: 'A region of memory used as a stack: each call pushes a frame (locals + return address), each return pops it.', good: true, feedback: 'Yes: the call stack, driven by the stack pointer register.' },
      { text: 'Each method has one fixed place for its variables.', feedback: 'Then recursion would overwrite itself.' },
      { text: 'The operating system remembers every call.', feedback: 'It’s all done by CPU instructions, far too fast for the OS.' },
    ],
  },
  lens: {
    layout: 'A fixed block of memory per thread, a stack pointer register marking the top, and one frame per active call (arguments, locals, return address).',
    invariant: 'Frames are popped in exactly the reverse order they were pushed; the stack pointer is back where it started after every call returns.',
    payoff: 'Calls of any depth, including recursion, each with private locals, at almost zero cost.',
    price: 'A fixed size: very deep recursion overflows and kills the process.',
  },
  learn: {
    what: 'Machine code has no “methods”, only instructions and jumps. A method call is built from a stack in memory: CALL saves the return address and jumps; the method grabs space for its locals by moving the stack pointer; RET pops back to the saved address. This is the stack you see in every stack trace.',
    how: [
      'Stack pointer (SP): a register holding the address of the top of the stack. In x64 the stack grows downward.',
      'CALL f: push the return address, jump to f.',
      'Prologue: f moves SP to make room for its locals (its frame).',
      'Epilogue + RET: f restores SP and pops the return address into the program counter.',
      'Each thread has its own stack (~1 MB in .NET). Too many nested calls → StackOverflowException.',
    ],
  },
  extras: {
    family: 'hardware',
    primitive: 'slots',
    parts: ['a stack pointer register', 'one frame per call', 'CALL and RET'],
    uses: ['Read a stack trace and know exactly what it means.', 'Turn a deep recursion into a loop with Stack<T> before it overflows.'],
    breaks: [
      {
        violation: 'A method stores the address of one of its local variables and another method uses it after the first one returned.',
        result: 'That frame’s memory has been reused by other calls: the pointer now reads garbage (C# prevents this; C and C++ don’t).',
        wrong: ['The value is kept safe forever.', 'The GC moves it to the heap.', 'The CPU throws an error.'],
      },
    ],
    transfer: [
      {
        problem: 'A recursive JSON-tree walker works in tests but crashes the server on one customer’s 200,000-level-deep file.',
        answer: 'Each level adds a stack frame; replace the recursion with a loop and an explicit Stack<T> on the heap (or cap the depth).',
        wrong: [
          { text: 'Catch the StackOverflowException.', why: '.NET can’t catch it; the process dies.' },
          { text: 'Add more RAM.', why: 'The stack size is fixed per thread.' },
          { text: 'Use async.', why: 'Still a frame per level.' },
        ],
        explain: 'The heap can hold millions of entries; the stack holds about a megabyte.',
      },
    ],
  },
  generators: {
    predict: [predictFrames, predictOverflowStack],
    simulate: [orderCall],
    count: [countStack],
    explain: csExplain,
  },
};

// =====================================================================
// Caches & the memory hierarchy
// =====================================================================

const CC = 'cpu-caches';

const predictRowCol = (): Card => ({
  concept: CC,
  type: 'predict',
  prompt: 'int[,] grid = new int[4000, 4000]. Two loops sum every cell: A loops rows outside, columns inside (grid[r, c]); B loops columns outside, rows inside. Which is faster?',
  body: {
    kind: 'choice',
    options: shuffle([
      { text: 'A, often several times faster: it reads memory in order, using every byte of each cache line.', correct: true },
      { text: 'B, because columns are shorter.', correct: false, why: 'They’re the same size; B jumps 16 KB between reads.' },
      { text: 'They’re the same: same number of additions.', correct: false, why: 'Same work, very different memory traffic.' },
      { text: 'It depends on the values in the grid.', correct: false, why: 'Only the access order matters.' },
    ]),
  },
  explain: 'C# stores a 2D array row by row. A walks memory sequentially, so each 64-byte cache line serves 16 ints. B jumps a whole row each step, so nearly every read is a cache miss.',
});

const predictListVsArray = (): Card => ({
  concept: CC,
  type: 'predict',
  prompt: 'You sum 10 million ints stored (1) in an int[] and (2) in a LinkedList<int>. Both are O(n). Which is faster, and why?',
  body: {
    kind: 'choice',
    options: shuffle([
      { text: 'The array, by a lot: its values are contiguous, so the cache and prefetcher feed them in fast; list nodes are scattered.', correct: true },
      { text: 'The linked list, because it doesn’t need resizing.', correct: false, why: 'Summing doesn’t resize anything.' },
      { text: 'Same speed: both are O(n).', correct: false, why: 'Big O hides constant factors like cache misses.' },
      { text: 'The linked list, because nodes are smaller.', correct: false, why: 'Nodes are bigger: value + pointers + object header.' },
    ]),
  },
  explain: 'Big O counts steps; caches decide how long each step takes. Following pointers to scattered nodes misses the cache over and over.',
});

const orderMiss = (): Card => ({
  concept: CC,
  type: 'simulate',
  prompt: 'The CPU reads an int that isn’t in any cache. Put what happens in order.',
  body: {
    kind: 'order',
    steps: ['Check L1 cache (~1 ns): miss.', 'Check L2 (~4 ns): miss.', 'Check L3 (~15 ns): miss.', 'Read from main memory (~80–100 ns).', 'The whole 64-byte line holding that int is copied into the caches, so its neighbours are now fast to read.'],
  },
  explain: 'Each level is bigger and slower. A miss all the way to RAM costs hundreds of cycles, so code that reuses nearby data runs far faster.',
});

const countLines = (): Card => {
  const n = pick([1024, 4096, 16384]);
  const size = pick([4, 8]);
  return pick([
    {
      concept: CC,
      type: 'count' as const,
      prompt: `You read an array of ${n} ${size === 4 ? 'ints (4 bytes)' : 'longs (8 bytes)'} in order. Cache lines are 64 bytes and nothing is cached yet. How many cache misses (ignoring prefetching)?`,
      body: { kind: 'number' as const, answer: (n * size) / 64, unit: 'misses' },
      explain: `${n} × ${size} = ${n * size} bytes ÷ 64 = ${(n * size) / 64} lines. One miss per line; the other ${64 / size - 1} reads in each line are hits.`,
    },
    {
      concept: CC,
      type: 'count' as const,
      prompt: `A cache hit costs 1 ns and a miss to RAM 100 ns. Reading ${n} ints in order (16 per 64-byte line), how many ns in total, ignoring prefetching?`,
      body: { kind: 'number' as const, answer: (n / 16) * 100 + (n - n / 16) * 1, unit: 'ns' },
      explain: `${n / 16} misses × 100 + ${n - n / 16} hits × 1 = ${(n / 16) * 100 + (n - n / 16)} ns. If every read missed (random order) it would be ${n * 100} ns.`,
    },
  ]);
};

const ccExplain = explainGenerators({
  concept: CC,
  truths: [
    'Main memory is roughly 100 times slower than the CPU’s L1 cache.',
    'Data moves between memory and cache in 64-byte lines, not single values.',
    'Reading memory in order is fast because each line serves many reads and the CPU prefetches the next ones.',
    'Scattered data, like linked list nodes, causes many cache misses.',
  ],
  myths: [
    { text: 'Two O(n) loops always take about the same time.', why: 'Cache behaviour can make one 10× slower.' },
    { text: 'Memory access takes the same time wherever the data is.', why: 'L1 ~1 ns, RAM ~100 ns.' },
    { text: 'The cache holds single variables.', why: 'It holds 64-byte lines.' },
  ],
  chains: [
    {
      prompt: 'Why is List<T> usually faster than LinkedList<T> for iteration?',
      steps: ['List<T> keeps its items in one contiguous array.', 'Each cache line loaded brings in several neighbouring items.', 'The CPU sees the sequential pattern and prefetches ahead.', 'LinkedList nodes are scattered, so almost every step waits for RAM.'],
    },
  ],
  summary: {
    best: 'Caches are the desk next to the CPU and RAM is the warehouse: fetching from the warehouse is slow, so you bring back a whole box of neighbouring items each trip.',
    others: [
      { text: 'Caches are extra RAM.', why: 'They are small, fast copies of RAM inside the CPU.' },
      { text: 'Caches only matter for games.', why: 'They decide the speed of every loop.' },
      { text: 'You control the cache from C#.', why: 'You control it indirectly through data layout and access order.' },
    ],
  },
});

export const cpuCachesConcept: Concept = {
  id: CC,
  kind: 'systems',
  title: 'Caches & the Memory Hierarchy',
  tier: TIER,
  prereqs: ['cpu-cycle', 'static-array', 'linked-list'],
  tagline: 'Nearby data is fast data.',
  hook: {
    problem: 'A CPU can do an addition in a third of a nanosecond. Reading a value from main memory takes about 100 ns, 300 times longer. If every read went to RAM, the CPU would spend almost all its time waiting.',
    question: 'How do CPUs avoid that?',
    options: [
      { text: 'Small, fast caches inside the CPU keep recently used memory, loaded 64 bytes at a time, so nearby data is already there.', good: true, feedback: 'Yes: the memory hierarchy, L1/L2/L3 caches.' },
      { text: 'They make RAM as fast as the CPU.', feedback: 'Physics and cost prevent it: big memories are slow.' },
      { text: 'They read everything into registers first.', feedback: 'There are only a few dozen registers.' },
    ],
  },
  lens: {
    layout: 'Registers → L1 (~32 KB, ~1 ns) → L2 (~1 MB, ~4 ns) → L3 (tens of MB, ~15 ns) → RAM (GBs, ~100 ns). Data moves in 64-byte cache lines.',
    invariant: 'The CPU only works on data in its caches; a miss loads the whole 64-byte line containing the address.',
    payoff: 'Code that touches memory in order or reuses recent data runs near CPU speed.',
    price: 'Scattered or strided access misses constantly, so two O(n) algorithms can differ 10× in real speed.',
  },
  learn: {
    what: 'Memory is a hierarchy: tiny and fast near the CPU, huge and slow further away. The CPU never reads one int from RAM; it pulls the whole 64-byte line into its caches. So reading memory in order is cheap, and jumping around is expensive. This is why arrays beat linked lists in practice, even when Big O says they’re equal.',
    how: [
      'L1 ~1 ns, L2 ~4 ns, L3 ~15 ns, RAM ~100 ns (hundreds of CPU cycles).',
      'Cache line: 64 bytes. Reading arr[0] also brings in arr[1..15] (for ints).',
      'Spatial locality: use data next to what you just used. Temporal locality: reuse data soon.',
      'The prefetcher spots sequential patterns and loads lines before you ask.',
      '2D arrays in C# are row-major: loop rows outside, columns inside.',
    ],
  },
  extras: {
    family: 'hardware',
    primitive: 'slots',
    parts: ['L1/L2/L3 caches', '64-byte cache lines', 'locality and prefetching'],
    uses: ['Pick List<T> or arrays over LinkedList<T> for anything iterated often.', 'Order nested loops to walk memory sequentially.'],
    breaks: [
      {
        violation: 'Two threads each update their own counter, but the two counters sit next to each other in memory (the same cache line).',
        result: 'False sharing: the cores keep stealing the line from each other and both threads slow down dramatically.',
        wrong: ['Nothing; they are different variables.', 'The values get mixed up.', 'Only one thread runs.'],
      },
    ],
    transfer: [
      {
        problem: 'A game stores 100,000 entities as class objects in a List and updates their positions every frame. It’s slow even though the loop is simple.',
        answer: 'Store positions in contiguous arrays of structs (data-oriented layout) so the update loop streams through memory instead of chasing references.',
        wrong: [
          { text: 'Use a LinkedList.', why: 'Even more scattered.' },
          { text: 'Use a Dictionary keyed by id.', why: 'Hashing scatters access further.' },
          { text: 'Make the loop parallel only.', why: 'Each core still stalls on misses.' },
        ],
        explain: 'Objects are scattered on the heap; arrays of structs are contiguous. Layout often matters more than the algorithm.',
      },
    ],
  },
  generators: {
    predict: [predictRowCol, predictListVsArray],
    simulate: [orderMiss],
    count: [countLines],
    explain: ccExplain,
  },
};

// =====================================================================
// Pipelining & branch prediction
// =====================================================================

const PL = 'pipelining';

const predictSorted = (): Card => ({
  concept: PL,
  type: 'predict',
  prompt: 'This loop runs over 10 million random bytes: if (data[i] >= 128) sum += data[i]; Then you sort the array first and run the same loop. Which run is faster?',
  body: {
    kind: 'choice',
    options: shuffle([
      { text: 'The sorted one, often several times faster: the branch becomes predictable.', correct: true },
      { text: 'Same speed: same data, same work.', correct: false, why: 'Same work, but the unsorted branch is mispredicted half the time.' },
      { text: 'The unsorted one: sorting moves data around.', correct: false, why: 'The loop itself is what is timed.' },
      { text: 'It depends on the cache only.', correct: false, why: 'Both scan in order; the difference is the branch.' },
    ]),
  },
  explain: 'With sorted data the condition is false, false, … then true, true …: the predictor is almost always right. With random data it guesses wrong about half the time, and each miss throws away ~15 cycles of pipeline work.',
});

const orderPipeline = (): Card => ({
  concept: PL,
  type: 'simulate',
  prompt: 'A pipelined CPU reaches an if whose outcome isn’t known yet, and guesses wrong. Put what happens in order.',
  body: {
    kind: 'order',
    steps: ['The branch predictor guesses which way the if will go.', 'The CPU starts fetching and executing instructions down the guessed path.', 'The real condition is finally computed: the guess was wrong.', 'All the speculative work is thrown away (the pipeline is flushed).', 'Fetching restarts down the correct path, ~15–20 cycles lost.'],
  },
  explain: 'Pipelines keep many instructions in flight, so they must guess at branches. Right guesses are free; wrong ones cost a flush.',
});

const countPipe = (): Card => {
  const k = pick([4, 5, 6]);
  const n = pick([10, 20, 100]);
  return pick([
    {
      concept: PL,
      type: 'count' as const,
      prompt: `A ${k}-stage pipeline, one new instruction entering per cycle, no stalls. How many cycles to finish ${n} instructions?`,
      body: { kind: 'number' as const, answer: n + k - 1, unit: 'cycles' },
      explain: `The first finishes after ${k} cycles, then one more finishes every cycle: ${k} + (${n} − 1) = ${n + k - 1}. Without pipelining it would be ${n} × ${k} = ${n * k}.`,
    },
    (() => {
      const miss = pick([5, 10, 50]);
      const pen = pick([15, 20]);
      return {
        concept: PL,
        type: 'count' as const,
        prompt: `A loop runs ${n * 10} times. Each iteration takes 2 cycles, but ${miss}% of iterations mispredict a branch, costing ${pen} extra cycles each. Total cycles?`,
        body: { kind: 'number' as const, answer: n * 10 * 2 + ((n * 10 * miss) / 100) * pen, unit: 'cycles' },
        explain: `${n * 10} × 2 = ${n * 20}, plus ${(n * 10 * miss) / 100} misses × ${pen} = ${((n * 10 * miss) / 100) * pen}: ${n * 20 + ((n * 10 * miss) / 100) * pen}.`,
      };
    })(),
  ]);
};

const plExplain = explainGenerators({
  concept: PL,
  truths: [
    'A pipeline overlaps instructions like an assembly line: one is fetched while another is decoded and another executed.',
    'At an if, the CPU must guess the outcome to keep the pipeline full.',
    'A wrong guess throws away the work in flight and costs around 15–20 cycles.',
    'Predictable branches (mostly one way, or regular patterns) are nearly free.',
  ],
  myths: [
    { text: 'An if statement always costs the same.', why: 'Predictable branches are almost free; unpredictable ones are expensive.' },
    { text: 'CPUs run one instruction completely before starting the next.', why: 'Pipelines have many in progress at once.' },
    { text: 'Sorting data can’t speed up a loop that doesn’t depend on order.', why: 'It can make the branch predictable.' },
  ],
  chains: [
    {
      prompt: 'Why does a mispredicted branch cost so much?',
      steps: ['The pipeline holds many instructions at different stages.', 'At a branch it fills up with instructions from the guessed path.', 'If the guess is wrong, all of them are discarded.', 'The pipeline must refill from the right path, wasting those cycles.'],
    },
  ],
  summary: {
    best: 'A pipeline is a kitchen working on several orders at once; at every fork it guesses what the customer will choose and starts cooking, and a wrong guess means binning the half-made dish.',
    others: [
      { text: 'Pipelining means multiple cores.', why: 'It’s overlap inside one core.' },
      { text: 'Branch prediction predicts the user.', why: 'It predicts which way each if goes.' },
      { text: 'Pipelines make every instruction faster.', why: 'They increase throughput, not the time of one instruction.' },
    ],
  },
});

export const pipeliningConcept: Concept = {
  id: PL,
  kind: 'systems',
  title: 'Pipelining & Branch Prediction',
  tier: TIER,
  prereqs: ['cpu-cycle'],
  tagline: 'Work on many instructions at once; guess the ifs.',
  hook: {
    problem: 'Each instruction takes several steps (fetch, decode, execute, write back). Doing them strictly one after another leaves most of the CPU idle most of the time.',
    question: 'How do CPUs keep every part busy?',
    options: [
      { text: 'An assembly line: start the next instruction while the previous is still in progress, and guess which way each if goes so the line never stops.', good: true, feedback: 'Yes: pipelining plus branch prediction.' },
      { text: 'Run each instruction faster.', feedback: 'There are physical limits; overlap gives more.' },
      { text: 'Skip the decode step.', feedback: 'Every instruction must be decoded.' },
    ],
  },
  lens: {
    layout: 'A pipeline of stages (fetch, decode, execute, memory, write back), each holding a different instruction, plus a branch predictor that remembers how each branch went recently.',
    invariant: 'Results are always as if instructions ran one at a time in order; speculative work from a wrong guess is discarded.',
    payoff: 'Close to one (or several) instructions finished per cycle, despite each taking many cycles.',
    price: 'Mispredicted branches flush the pipeline (~15–20 cycles), so unpredictable ifs in hot loops are expensive.',
  },
  learn: {
    what: 'Modern CPUs are assembly lines. While one instruction executes, the next is being decoded and the one after fetched. An if is a problem: the CPU doesn’t know yet which way to go, so it guesses, using a branch predictor that remembers each branch’s history. Right guesses are free; wrong ones throw away the work in progress.',
    how: [
      'k pipeline stages → up to k instructions in flight; n instructions take about n + k − 1 cycles.',
      'Branch predictor: a small table, per branch, of recent outcomes (e.g. a 2-bit counter: strongly/weakly taken/not taken).',
      'Misprediction: flush the pipeline, restart on the right path, ~15–20 cycles lost.',
      'Loops are very predictable (taken, taken, …, not taken once).',
      'Random data in a hot if is the worst case; sorting or branch-free code (e.g. Math.Max, bit tricks) can help.',
    ],
  },
  extras: {
    family: 'hardware',
    primitive: 'abstract',
    parts: ['pipeline stages', 'a branch predictor', 'speculative execution and flushing'],
    uses: ['Explain why sorted data makes a filtering loop faster.', 'Replace an unpredictable branch in a hot loop with branch-free arithmetic.'],
    breaks: [
      {
        violation: 'A hot loop does if (rnd.Next(2) == 0) a++; else b++; over millions of items.',
        result: 'About half the branches are mispredicted, and the loop runs several times slower than the same work with a predictable condition.',
        wrong: ['No effect: branches are free.', 'The CPU learns random numbers.', 'The JIT removes the if.'],
      },
    ],
    transfer: [
      {
        problem: 'Profiling shows a filter loop over unsorted sensor readings is slow, though it only does a compare and an add per item.',
        answer: 'The compare is an unpredictable branch: make it branch-free (e.g. add value × (cond ? 1 : 0) via bit masks) or process sorted/partitioned data.',
        wrong: [
          { text: 'Add more cores.', why: 'Each core still mispredicts.' },
          { text: 'Use a linked list.', why: 'Makes memory access worse too.' },
          { text: 'Use a bigger cache.', why: 'Memory isn’t the bottleneck here.' },
        ],
        explain: 'When the work per item is tiny, branch mispredictions can dominate the cost.',
      },
    ],
  },
  generators: {
    predict: [predictSorted],
    simulate: [orderPipeline],
    count: [countPipe],
    explain: plExplain,
  },
};

// =====================================================================
// SIMD
// =====================================================================

const SI = 'simd';

const predictLanes = (): Card => {
  const bits = pick([128, 256, 512]);
  const t = pick([
    { name: 'int', b: 32 },
    { name: 'float', b: 32 },
    { name: 'double', b: 64 },
    { name: 'short', b: 16 },
  ]);
  const ans = bits / t.b;
  return {
    concept: SI,
    type: 'predict',
    prompt: `On a CPU with ${bits}-bit vector registers, how many ${t.name} values (${t.b} bits each) does one SIMD add process at once?`,
    body: {
      kind: 'choice',
      options: numberOptions(ans, [
        { value: ans * 2, why: `${t.name} is ${t.b} bits.` },
        { value: ans / 2, why: `${bits} ÷ ${t.b} = ${ans}.` },
        { value: 1, why: 'That would be ordinary scalar code.' },
        { value: bits / 8, why: 'That’s bytes, not values.' },
      ], `${bits} ÷ ${t.b} = ${ans} lanes.`),
    },
    explain: `${bits} bits ÷ ${t.b} bits per ${t.name} = ${ans} lanes. In C#, Vector<${t.name}>.Count tells you this at runtime.`,
  };
};

const predictDependent = (): Card => ({
  concept: SI,
  type: 'predict',
  prompt: 'Which loop can SIMD speed up directly?',
  body: {
    kind: 'choice',
    options: shuffle([
      { text: 'c[i] = a[i] * b[i] for every i', correct: true },
      { text: 'a[i] = a[i - 1] * 2 + 1 for every i', correct: false, why: 'Each step needs the previous result, so lanes can’t run side by side.' },
      { text: 'Walking a linked list and summing values', correct: false, why: 'Each next node is only known after reading the current one.' },
      { text: 'Looking up each item in a Dictionary', correct: false, why: 'Hash lookups jump around unpredictably.' },
    ]),
  },
  explain: 'SIMD needs independent work on contiguous data: the same operation on many items at once. Chains where each step depends on the last can’t be split into lanes.',
});

const orderSimd = (): Card => ({
  concept: SI,
  type: 'simulate',
  prompt: 'Summing an int[] of 1,003 items with Vector<int> (8 lanes). Put the steps in order.',
  body: {
    kind: 'order',
    steps: ['Start with a vector of 8 zeros.', 'Load 8 ints at a time and add them to the vector, lane by lane (125 times).', 'Add up the 8 lanes of the vector into one total.', 'Add the 3 leftover items one at a time.', 'Return the total.'],
  },
  explain: 'Vector part for the bulk, scalar loop for the remainder. The bulk does 8 additions per instruction.',
});

const countVec = (): Card => {
  const n = pick([1000, 1003, 4099, 10000]);
  const w = pick([4, 8, 16]);
  return pick([
    {
      concept: SI,
      type: 'count' as const,
      prompt: `Processing ${n} floats with ${w}-wide vectors, how many full vector operations are needed?`,
      body: { kind: 'number' as const, answer: Math.floor(n / w), unit: 'operations' },
      explain: `${n} ÷ ${w} = ${Math.floor(n / w)} full vectors${n % w ? `, with ${n % w} items left for a scalar loop` : ''}.`,
    },
    {
      concept: SI,
      type: 'count' as const,
      prompt: `Processing ${n} floats with ${w}-wide vectors: after the full vector operations, how many items are left for the scalar loop?`,
      body: { kind: 'number' as const, answer: n % w, unit: 'items' },
      explain: `${n} mod ${w} = ${n % w}.`,
    },
  ]);
};

const siExplain = explainGenerators({
  concept: SI,
  truths: [
    'SIMD means one instruction works on several values at once, in lanes of a wide register.',
    'In C#, System.Numerics.Vector<T> uses SIMD, and Vector<T>.Count says how many lanes there are.',
    'SIMD works best on contiguous arrays where each item is processed independently.',
    'Much of .NET (string search, Span helpers, LINQ Sum on arrays) already uses SIMD internally.',
  ],
  myths: [
    { text: 'SIMD is the same as using multiple threads.', why: 'It is parallelism inside one instruction on one core.' },
    { text: 'Any loop can be vectorised.', why: 'Loops where each step depends on the previous one can’t.' },
    { text: 'SIMD needs special hardware you rarely have.', why: 'Every modern x64 and ARM CPU has it.' },
  ],
  chains: [
    {
      prompt: 'Why does SIMD need contiguous data?',
      steps: ['A vector load reads one block of neighbouring memory into all lanes.', 'Arrays store items next to each other, so one load fills the register.', 'Scattered objects would need a separate load per lane.', 'So arrays of values vectorise well and object graphs don’t.'],
    },
  ],
  summary: {
    best: 'SIMD is a stamp that prints 8 letters in one press instead of typing them one by one: the same operation, applied to a whole row of values at once.',
    others: [
      { text: 'SIMD is multithreading.', why: 'One thread, wide instructions.' },
      { text: 'SIMD is a GPU.', why: 'GPUs use a similar idea; SIMD is in every CPU.' },
      { text: 'SIMD makes all code faster.', why: 'Only independent work on contiguous data.' },
    ],
  },
});

export const simdConcept: Concept = {
  id: SI,
  kind: 'systems',
  title: 'SIMD: One Instruction, Many Values',
  tier: TIER,
  prereqs: ['cpu-caches', 'pipelining'],
  tagline: 'Do the same thing to 8 numbers in one step.',
  hook: {
    problem: 'An image filter multiplies 8 million pixel values by the same factor. One multiply per instruction means 8 million instructions.',
    question: 'How can one core do it several times faster?',
    options: [
      { text: 'Use wide registers that hold several values and instructions that operate on all of them at once (SIMD).', good: true, feedback: 'Yes: 8 or 16 multiplies per instruction.' },
      { text: 'Raise the clock speed.', feedback: 'Hardware can’t just go faster on demand.' },
      { text: 'Use a Dictionary of precomputed answers.', feedback: 'Lookups are slower than multiplying.' },
    ],
  },
  lens: {
    layout: 'Wide vector registers (128/256/512 bits) split into lanes; instructions that load, add, multiply or compare all lanes at once.',
    invariant: 'Every lane gets the same operation; lanes don’t depend on each other.',
    payoff: 'Several times more work per instruction for number crunching over arrays.',
    price: 'Only for independent, contiguous data; leftover items need a scalar loop, and the code is more complex.',
  },
  learn: {
    what: 'SIMD (Single Instruction, Multiple Data) lets one instruction process a whole row of values. A 256-bit register holds 8 ints, and one add instruction adds all 8 pairs. In C#, Vector<T> gives you this without writing assembly, and many .NET methods already use it under the hood.',
    how: [
      'Vector<T>.Count = how many T fit in a vector register on this machine (e.g. 8 ints with AVX2).',
      'Load a vector from an array or span: new Vector<int>(array, i).',
      'Add, multiply or compare vectors with ordinary operators: v1 + v2.',
      'Loop i += Vector<T>.Count over the bulk, then finish the remainder with a normal loop.',
      'Combine the lanes at the end (Vector.Sum(v)) or store them back to an array.',
    ],
  },
  extras: {
    family: 'hardware',
    primitive: 'slots',
    parts: ['wide vector registers', 'lanes', 'a scalar tail loop'],
    uses: ['Speed up image, audio or statistics code that applies the same maths to big arrays.', 'Understand why Span-based .NET APIs are so fast.'],
    breaks: [
      {
        violation: 'A vectorised loop runs i += Vector<int>.Count up to the array length but forgets the leftover items.',
        result: 'The last few items (length mod lane count) are silently skipped: wrong totals on most array sizes.',
        wrong: ['The vector reads past the end safely.', 'The leftovers are processed automatically.', 'It only fails on empty arrays.'],
      },
    ],
    transfer: [
      {
        problem: 'You need to find whether a 50 MB byte array contains a particular byte, as fast as possible.',
        answer: 'Use Span<byte>.IndexOf (vectorised internally), or compare a Vector<byte> of that byte against blocks of the array.',
        wrong: [
          { text: 'Put the bytes in a HashSet first.', why: 'Building it costs more than one scan.' },
          { text: 'Use a LINQ Where with a lambda.', why: 'One item at a time with call overhead.' },
          { text: 'Sort it and binary search.', why: 'Sorting costs far more than one scan.' },
        ],
        explain: 'A vectorised scan checks 32 or 64 bytes per instruction.',
      },
    ],
  },
  generators: {
    predict: [predictLanes, predictDependent],
    simulate: [orderSimd],
    count: [countVec],
    explain: siExplain,
  },
};

export const ARCH_CONCEPTS: Concept[] = [logicGatesConcept, cpuCycleConcept, callStackConcept, cpuCachesConcept, pipeliningConcept, simdConcept];
