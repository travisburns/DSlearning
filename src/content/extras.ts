import type { ConceptExtras } from '../engine/types';

/**
 * Hand-written facts behind the Break / Choose / Connect / Transfer cards, one entry per structure.
 * Rebuild cards are built from each concept's lens, so they need nothing here.
 */
export const EXTRAS: Record<string, ConceptExtras> = {
  // ---------------- Tier 0 ----------------
  memory: {
    family: 'primitive',
    primitive: 'slots',
    parts: ['numbered cells (addresses)', 'one number per cell'],
    uses: ['Keep a value where it can be read back instantly, given its number.', 'Store a record whose fields sit at fixed offsets from a start address.'],
    rivals: ['static-array', 'matrix', 'dynamic-array'],
    breaks: [
      {
        violation: 'Suppose writing to a cell did NOT replace its old value, but kept both somehow.',
        result: 'A cell would no longer mean one number, so reading it would be ambiguous. The whole “address → value” model breaks.',
        wrong: ['Reads would get faster.', 'Nothing changes; memory already works that way.', 'Only pointers would be affected.'],
      },
      {
        violation: 'Suppose the same address could point to different cells at different times.',
        result: 'A saved address would stop being reliable: you could never find your data again.',
        wrong: ['Memory would use less space.', 'It would only matter for very large programs.', 'Reads would still always return the right value.'],
      },
    ],
    transfer: [
      {
        problem: 'You must swap two numbers a and b, but there is NO spare cell for a temporary.',
        answer: 'a = a + b; b = a − b; a = a − b (or the same with XOR).',
        wrong: [
          { text: 'a = b; b = a', why: 'The first write destroys a’s value; both end up as b.' },
          { text: 'It’s impossible without a third cell.', why: 'Arithmetic can hide both values in one cell temporarily.' },
          { text: 'b = a; a = b', why: 'Same problem: the first write destroys b.' },
        ],
        explain: 'After a = a + b, the sum holds both values. b = sum − b recovers the old a; a = sum − new b recovers the old b. Writing destroys, so you must encode what you still need somewhere.',
      },
    ],
  },
  pointers: {
    family: 'primitive',
    primitive: 'links',
    parts: ['a cell holding an address', 'following (reading) that address'],
    uses: ['Let two parts of a program work on one big table without copying it.', 'Let a function change a variable that belongs to its caller.'],
    rivals: ['linked-list'],
    breaks: [
      {
        violation: 'A pointer still holds the address of memory that has since been freed and reused.',
        result: 'Following it reads (or overwrites) someone else’s data: a “dangling pointer” bug.',
        wrong: ['The pointer automatically becomes null.', 'The old data is kept safe until the pointer is gone.', 'The program always crashes immediately.'],
      },
    ],
    transfer: [
      {
        problem: 'A function must change the caller’s variable x, but arguments are passed by copying values.',
        answer: 'Pass x’s address; the function writes through that pointer.',
        wrong: [
          { text: 'Pass x’s value and assign to the parameter.', why: 'That changes only the function’s own copy.' },
          { text: 'Make the function return nothing.', why: 'That changes nothing at all.' },
          { text: 'Copy x into a global variable.', why: 'The caller’s x still isn’t changed.' },
        ],
        explain: 'An address lets the callee reach the caller’s cell. Writing through it changes the one real copy.',
      },
    ],
  },
  bits: {
    family: 'primitive',
    primitive: 'bits',
    parts: ['on/off bits', 'place values that double'],
    uses: ['Pack eight yes/no settings into a single byte.', 'Know how many different values a fixed-size field can hold.'],
    rivals: ['bitset'],
    breaks: [
      {
        violation: 'You store 300 in an 8-bit (0–255) cell.',
        result: 'It overflows: only the low 8 bits fit, so it becomes 300 − 256 = 44.',
        wrong: ['The cell grows to 9 bits automatically.', 'It is stored as 255, the maximum.', 'The value is rounded to 256.'],
      },
    ],
    transfer: [
      {
        problem: 'Check whether setting number 5 (of 8 on/off settings packed in a byte s) is on.',
        answer: 'Test (s AND 32) ≠ 0, since bit 5 is worth 2⁵ = 32.',
        wrong: [
          { text: 'Check whether s ≥ 5.', why: 'The byte’s total value says nothing about one specific bit.' },
          { text: 'Check whether s AND 5 ≠ 0.', why: '5 is binary 101: that tests bits 0 and 2.' },
          { text: 'Divide s by 5.', why: 'Division doesn’t isolate a bit.' },
        ],
        explain: 'A mask with only the wanted bit set (1 shifted left 5 = 32) isolates that bit with AND.',
      },
    ],
  },

  // ---------------- Tier 1 ----------------
  'static-array': {
    family: 'array',
    primitive: 'slots',
    parts: ['one contiguous block of cells', 'address = base + index × size'],
    uses: ['Store exactly 365 daily temperatures and look up any day instantly.', 'A fixed-size lookup table read by position millions of times.'],
    rivals: ['dynamic-array'],
    breaks: [
      {
        violation: 'Delete an element by leaving an empty gap instead of shifting.',
        result: 'base + i no longer finds the i-th element: every index after the gap is off by one.',
        wrong: ['Access gets faster because nothing moved.', 'The array automatically skips the gap.', 'Only the deleted index is affected.'],
      },
    ],
    transfer: [
      {
        problem: 'Delete an element from the middle of an array in O(1), when the ORDER of elements doesn’t matter.',
        answer: 'Copy the last element into the hole, then shrink the length by one.',
        wrong: [
          { text: 'Shift everything after it left.', why: 'That’s O(n); order isn’t needed, so skip the shifting.' },
          { text: 'Mark it as deleted and leave a gap.', why: 'Gaps break the “no gaps” rule that makes indexing work.' },
          { text: 'Allocate a new, smaller array.', why: 'That copies everything: O(n).' },
        ],
        explain: 'Filling the hole with the last element keeps the block contiguous with one move. You give up order to gain O(1).',
      },
    ],
  },
  matrix: {
    family: 'grid',
    primitive: 'slots',
    parts: ['a 1D contiguous block', 'row-major arithmetic: base + r × cols + c'],
    uses: ['Store the pixels of an image and read any pixel by (row, column).', 'A game board where any square is looked up by coordinates.'],
    rivals: ['sparse-matrix', 'adjacency-matrix'],
    breaks: [
      {
        violation: 'Rows are stored with different lengths but you still compute base + r × cols + c.',
        result: 'The formula lands in the wrong row: it assumes every row is exactly cols long.',
        wrong: ['Only the last row is affected.', 'The computer detects it and adjusts.', 'Reads just become slower.'],
      },
    ],
    transfer: [
      {
        problem: 'Store a symmetric n × n matrix (A[r][c] = A[c][r]) in about half the memory.',
        answer: 'Store only the lower triangle row by row; A[r][c] with c ≤ r is at r(r+1)/2 + c (swap r, c otherwise).',
        wrong: [
          { text: 'Store every other row.', why: 'The skipped rows aren’t recoverable from the others.' },
          { text: 'Store it column by column instead.', why: 'Same size; layout order doesn’t save memory.' },
          { text: 'Store only the diagonal.', why: 'Off-diagonal values would be lost.' },
        ],
        explain: 'Row r of the lower triangle has r + 1 entries, so rows 0..r−1 take r(r+1)/2 cells. New arithmetic, same principle: compute the address.',
      },
    ],
  },
  'dynamic-array': {
    family: 'array',
    primitive: 'slots',
    parts: ['a static array with spare capacity', 'a length and a capacity', 'grow by doubling and copying'],
    uses: ['Collect an unknown number of results, then read them by index.', 'A list that is mostly appended to at the end and read by position.'],
    rivals: ['static-array', 'string'],
    breaks: [
      {
        violation: 'Grow by +1 slot each time instead of doubling.',
        result: 'Every append copies everything: n appends cost about n²/2 copies.',
        wrong: ['Memory use doubles.', 'Appends become O(log n).', 'Nothing changes; growth is rare anyway.'],
      },
    ],
    transfer: [
      {
        problem: 'Your dynamic array also supports pop. When should it SHRINK so it doesn’t waste memory, without thrashing?',
        answer: 'Halve the capacity when it drops to a quarter full.',
        wrong: [
          { text: 'Halve it as soon as it’s half full.', why: 'Then alternating push/pop at the boundary grows and shrinks every time: O(n) each.' },
          { text: 'Shrink by one slot on every pop.', why: 'Copies on every pop: O(n) each.' },
          { text: 'Never shrink.', why: 'Works, but can waste huge amounts of memory after a spike.' },
        ],
        explain: 'Leaving a gap between the grow point (full) and the shrink point (¼) means an expensive resize is always followed by many cheap operations: amortized O(1).',
      },
    ],
  },
  string: {
    family: 'array',
    primitive: 'slots',
    parts: ['an array of character codes', 'a length'],
    uses: ['Store a user’s name and read its 3rd character instantly.', 'Compare two words alphabetically.'],
    rivals: ['rope', 'dynamic-array', 'static-array'],
    breaks: [
      {
        violation: 'Someone changes the characters of a string that another part of the program assumed was immutable and shared.',
        result: 'Everyone sharing it silently sees the change; e.g. a hash map key now lives in the wrong bucket.',
        wrong: ['Only the part that changed it sees the new text.', 'The string is automatically copied first.', 'Nothing: strings are always copies.'],
      },
    ],
    transfer: [
      {
        problem: 'Build one long report from 10,000 small pieces of text quickly.',
        answer: 'Append the pieces to a growable buffer (a StringBuilder) and turn it into a string once at the end.',
        wrong: [
          { text: 'report = report + piece, 10,000 times.', why: 'Each + copies the whole report so far: O(n²).' },
          { text: 'Pre-sort the pieces.', why: 'Sorting doesn’t reduce copying.' },
          { text: 'Store each piece in its own file.', why: 'Doesn’t produce one string.' },
        ],
        explain: 'A dynamic array of characters appends in amortized O(1); the final string is built with one copy.',
      },
    ],
  },
  'linked-list': {
    family: 'list',
    primitive: 'links',
    parts: ['nodes of (value, next)', 'a head pointer'],
    uses: ['A playlist where songs are constantly inserted right after the current one.', 'Splice whole chains of items in and out without moving any of them.'],
    rivals: ['doubly-linked-list', 'circular-linked-list'],
    breaks: [
      {
        violation: 'While inserting after A, you set A.next = N BEFORE setting N.next = A.next.',
        result: 'N points to itself and the rest of the list is unreachable (lost).',
        wrong: ['N ends up at the end of the list.', 'It works the same either way.', 'A is removed from the list.'],
      },
    ],
    transfer: [
      {
        problem: 'Appending to the END of a singly linked list walks the whole list each time. Make append O(1).',
        answer: 'Also keep a tail pointer; append does tail.next = N, tail = N.',
        wrong: [
          { text: 'Make the list doubly linked.', why: 'prev pointers don’t tell you where the end is.' },
          { text: 'Insert at the head instead.', why: 'That reverses the order.' },
          { text: 'Store the length.', why: 'Knowing the length doesn’t give you the last node.' },
        ],
        explain: 'Remember the last node you’ll need, and update it on append (and when the list becomes empty).',
      },
    ],
  },
  'doubly-linked-list': {
    family: 'list',
    primitive: 'links',
    parts: ['nodes of (value, prev, next)', 'head and tail pointers'],
    uses: ['Remove the current song from a playlist given only a pointer to it.', 'A browser history you can walk both backwards and forwards.'],
    rivals: ['linked-list', 'deque'],
    breaks: [
      {
        violation: 'Deleting X, you update X.prev.next but forget X.next.prev.',
        result: 'Walking forwards skips X, but walking backwards still reaches the deleted node.',
        wrong: ['The list becomes circular.', 'Nothing: one direction is enough.', 'X is duplicated.'],
      },
    ],
    transfer: [
      {
        problem: 'Every insert/delete needs special cases for “empty list”, “at head” and “at tail”. Remove all special cases.',
        answer: 'Use sentinel (dummy) head and tail nodes that are always there.',
        wrong: [
          { text: 'Store the list length.', why: 'You still branch on the edge cases.' },
          { text: 'Use a singly linked list.', why: 'That has the same edge cases and loses prev.' },
          { text: 'Never let the list become empty.', why: 'You can’t control what the user removes.' },
        ],
        explain: 'With sentinels, every real node always has a real prev and next, so one code path handles all positions.',
      },
    ],
  },
  'circular-linked-list': {
    family: 'list',
    primitive: 'links',
    parts: ['singly linked nodes', 'last node points back to the first', 'a tail pointer'],
    uses: ['Players taking turns around a table, forever, with players joining and leaving.', 'A round-robin scheduler cycling through tasks.'],
    rivals: ['circular-buffer', 'linked-list', 'queue', 'deque'],
    breaks: [
      {
        violation: 'A loop over a circular list stops only when it reaches ∅.',
        result: 'It never ends: there is no ∅ in a circular list.',
        wrong: ['It stops after one lap automatically.', 'It stops at the tail.', 'It crashes immediately.'],
      },
    ],
    transfer: [
      {
        problem: 'n people stand in a circle; every k-th person is removed until one is left. Simulate it.',
        answer: 'Put them in a circular list; walk k − 1 steps, unlink the next node, repeat.',
        wrong: [
          { text: 'Use an array and shift after each removal.', why: 'Each removal shifts O(n) elements.' },
          { text: 'Sort the people first.', why: 'Order is given by position, not value.' },
          { text: 'Use a stack.', why: 'A stack can’t walk around in a circle.' },
        ],
        explain: 'The circle wraps naturally, and removing a node you’re standing before is O(1).',
      },
    ],
  },
  bitset: {
    family: 'bitset',
    primitive: 'bits',
    parts: ['an array of words', 'element x ↔ bit (x mod w) of word (x ÷ w)'],
    uses: ['Track which of 10,000 seats are taken in 1,250 bytes.', 'Intersect two sets of small integers a whole word at a time.'],
    rivals: ['bloom-filter', 'bits'],
    breaks: [
      {
        violation: 'You compute the bit as x ÷ w and the word as x mod w (swapped).',
        result: 'Elements land in the wrong places and different elements collide: membership answers become wrong.',
        wrong: ['It still works, just slower.', 'Only large numbers are affected.', 'The set just uses more memory.'],
      },
    ],
    transfer: [
      {
        problem: 'Store a set of numbers that all lie between 1,000,000 and 1,000,999.',
        answer: 'Use a 1,000-bit bitset and store x − 1,000,000.',
        wrong: [
          { text: 'A 1,001,000-bit bitset.', why: 'Wastes a million bits on numbers that never appear.' },
          { text: 'You can’t: bitsets only work from 0.', why: 'Subtracting an offset shifts the range to start at 0.' },
          { text: 'Store the numbers in a list.', why: 'Works, but loses O(1) membership and compactness.' },
        ],
        explain: 'A bitset’s size depends on the range, not the values. Shift the range down to 0..999.',
      },
    ],
  },

  // ---------------- Tier 2 ----------------
  stack: {
    family: 'stackqueue',
    primitive: 'slots',
    parts: ['a (dynamic) array', 'a top counter'],
    uses: ['Undo in a text editor: reverse the most recent change first.', 'Check that every ( [ { is closed in the right order.'],
    rivals: ['deque', 'monotonic-stack'],
    breaks: [
      {
        violation: 'Pop takes the item at the BOTTOM (index 0) instead of the top.',
        result: 'It becomes a queue that shifts everything: O(n) per pop, and undo would reverse your oldest change.',
        wrong: ['Nothing changes.', 'Pop becomes faster.', 'Only peek is affected.'],
      },
    ],
    transfer: [
      {
        problem: 'A stack must also report its current MINIMUM in O(1).',
        answer: 'Keep a second stack of running minimums, pushed and popped in step with the main one.',
        wrong: [
          { text: 'Scan the stack for the minimum each time.', why: 'That’s O(n).' },
          { text: 'Keep one variable holding the minimum.', why: 'After popping the minimum you don’t know the next one.' },
          { text: 'Keep the stack sorted.', why: 'Then it’s no longer last-in-first-out.' },
        ],
        explain: 'Each level of the stack remembers the minimum at that moment, so popping restores the previous minimum automatically.',
      },
    ],
  },
  queue: {
    family: 'stackqueue',
    primitive: 'links',
    parts: ['a linked list', 'head (front) and tail (back) pointers'],
    uses: ['Print jobs printed in the order they were sent.', 'Customers served first come, first served.'],
    rivals: ['circular-buffer', 'deque'],
    breaks: [
      {
        violation: 'After dequeuing the last item, head becomes ∅ but tail still points to the removed node.',
        result: 'The next enqueue attaches to a freed node, and the queue loses the new item.',
        wrong: ['The queue works normally.', 'The next dequeue returns the removed item again, harmlessly.', 'Enqueue becomes O(n).'],
      },
    ],
    transfer: [
      {
        problem: 'You only have stacks. Build a queue with amortized O(1) operations.',
        answer: 'Two stacks: push onto “in”; to dequeue, pop from “out”, refilling “out” by moving all of “in” when “out” is empty.',
        wrong: [
          { text: 'One stack, popping everything to reach the bottom each time.', why: 'O(n) per dequeue.' },
          { text: 'It’s impossible.', why: 'Moving items between two stacks reverses them into queue order.' },
          { text: 'Push twice for each enqueue.', why: 'Duplicates don’t change the order.' },
        ],
        explain: 'Each item is moved from “in” to “out” at most once, so the total work over n operations is O(n).',
      },
    ],
  },
  'circular-buffer': {
    family: 'stackqueue',
    primitive: 'slots',
    parts: ['a fixed-size array', 'head index and size', 'wrap-around with mod'],
    uses: ['Keep the last 100 sensor readings in fixed memory, overwriting the oldest.', 'An audio buffer between a producer and a consumer.'],
    rivals: ['queue', 'deque', 'circular-linked-list'],
    breaks: [
      {
        violation: 'Enqueue writes at head + size WITHOUT “mod capacity”.',
        result: 'Writes run past the end of the array (into other memory) instead of wrapping to the free slots at the start.',
        wrong: ['The buffer grows automatically.', 'It only affects dequeue.', 'Nothing: indexes never exceed capacity.'],
      },
    ],
    transfer: [
      {
        problem: 'Keep a running AVERAGE of the last 50 readings, updated in O(1) per new reading.',
        answer: 'A 50-slot circular buffer plus a running sum: subtract the value being overwritten, add the new one.',
        wrong: [
          { text: 'Re-add all 50 values each time.', why: 'O(50) per reading, i.e. O(window).' },
          { text: 'Average all readings ever seen.', why: 'That’s not the last 50.' },
          { text: 'Use a stack of readings.', why: 'A stack gives the newest, not a sliding window.' },
        ],
        explain: 'The buffer tells you exactly which old value leaves the window, so the sum can be updated incrementally.',
      },
    ],
  },
  deque: {
    family: 'stackqueue',
    primitive: 'slots',
    parts: ['a circular buffer', 'push/pop at both ends'],
    uses: ['Browser history of 50 pages: add newest, drop oldest, and “back” removes newest.', 'A work-stealing scheduler taking jobs from either end.'],
    rivals: ['doubly-linked-list', 'circular-buffer', 'queue', 'stack'],
    breaks: [
      {
        violation: 'pushFront writes at head − 1 without wrapping when head is 0.',
        result: 'It writes to index −1, outside the buffer.',
        wrong: ['It writes to index 0 and overwrites the head.', 'The deque grows.', 'Nothing: head is never 0.'],
      },
    ],
    transfer: [
      {
        problem: 'Check whether a word is a palindrome using a deque.',
        answer: 'Push all letters; repeatedly pop one from each end and compare until ≤ 1 remains.',
        wrong: [
          { text: 'Pop only from the front twice.', why: 'You must compare opposite ends.' },
          { text: 'Sort the letters.', why: 'Sorting loses the order that defines a palindrome.' },
          { text: 'Use the deque as a stack only.', why: 'You need both ends at once.' },
        ],
        explain: 'Both ends accessible in O(1) is exactly what comparing mirror positions needs.',
      },
    ],
  },
  'monotonic-stack': {
    family: 'stackqueue',
    primitive: 'slots',
    parts: ['a stack (or deque) of indexes', 'pop anything the newcomer beats'],
    uses: ['For each day, find the next day with a warmer temperature, all in one pass.', 'The maximum of every sliding window of size k.'],
    rivals: ['stack', 'deque'],
    breaks: [
      {
        violation: 'You push each new element WITHOUT popping the smaller ones first.',
        result: 'The stack stops being ordered, so popped items no longer get their correct “next greater” answer.',
        wrong: ['It’s only slower; answers are unchanged.', 'The stack overflows.', 'Nothing changes.'],
      },
    ],
    transfer: [
      {
        problem: 'Stock span: for each day, how many consecutive previous days had a price ≤ today’s?',
        answer: 'Keep a decreasing stack of (price, day); pop while the top ≤ today; span = today − day of the new top.',
        wrong: [
          { text: 'For each day, scan backwards.', why: 'O(n²) in the worst case.' },
          { text: 'Sort the prices.', why: 'Loses the day order.' },
          { text: 'Keep only yesterday’s price.', why: 'Spans can reach far back.' },
        ],
        explain: 'Popped days are beaten by today, so they’ll never be the boundary for any later day. Each day is pushed and popped once: O(n).',
      },
    ],
  },
  'priority-queue': {
    family: 'pq',
    primitive: 'abstract',
    parts: ['insert with a priority', 'remove the most urgent'],
    uses: ['An emergency room: always see the most urgent patient next.', 'Process events in timestamp order as they are scheduled.'],
    rivals: ['binary-heap', 'd-ary-heap', 'mergeable-heaps', 'ordered-map'],
    breaks: [
      {
        violation: 'Implemented as a sorted array, but inserts are appended without keeping it sorted.',
        result: 'removeMin (taking the front) returns whatever is there, not the most urgent item.',
        wrong: ['Only inserts get slower.', 'It becomes a stack.', 'Nothing: the front is still the minimum.'],
      },
    ],
    transfer: [
      {
        problem: 'Keep the 10 LARGEST values seen in an endless stream.',
        answer: 'A MIN-priority queue of size 10: if a new value beats its minimum, remove the minimum and insert the new value.',
        wrong: [
          { text: 'A max-priority queue of everything.', why: 'Memory grows with the stream.' },
          { text: 'Sort the stream.', why: 'It never ends.' },
          { text: 'Keep only the single largest.', why: 'You need ten.' },
        ],
        explain: 'The smallest of your top 10 is the one to beat, so it must be the easiest to find: a min-queue.',
      },
    ],
  },

  // ---------------- Tier 3 ----------------
  'hash-function': {
    family: 'hash',
    primitive: 'abstract',
    parts: ['a deterministic key → number recipe', 'mod the table size'],
    uses: ['Turn a customer name into an array index, the same one every time.', 'Spread keys evenly across buckets.'],
    rivals: ['hash-chaining', 'hash-open-addressing', 'hash-map'],
    breaks: [
      {
        violation: 'The hash of a key depends on the time of day.',
        result: 'The key is stored in one bucket and looked up in another: it can never be found again.',
        wrong: ['Collisions drop to zero.', 'Only performance suffers.', 'Nothing: the bucket is recomputed.'],
      },
    ],
    transfer: [
      {
        problem: 'Hash a pair (x, y) of integers so that (1, 2) and (2, 1) don’t always collide.',
        answer: 'Mix in order: h = h(x) × 31 + h(y).',
        wrong: [
          { text: 'h = x + y', why: 'Symmetric: (1, 2) and (2, 1) always collide.' },
          { text: 'h = x × y', why: 'Also symmetric.' },
          { text: 'h = x', why: 'Ignores y entirely.' },
        ],
        explain: 'Multiplying the running hash before adding the next part makes position matter, the same trick good string hashes use.',
      },
    ],
  },
  'hash-chaining': {
    family: 'hash',
    primitive: 'both',
    parts: ['an array of buckets', 'a hash function', 'a linked list (chain) per bucket'],
    uses: ['A dictionary where colliding keys each keep a short list in their bucket.', 'A table that must keep working even when it gets more than full.'],
    rivals: ['hash-map', 'hash-open-addressing'],
    breaks: [
      {
        violation: 'Keys keep being inserted but the table never grows (load factor keeps rising).',
        result: 'Chains get longer and longer; lookups drift towards O(n).',
        wrong: ['New keys are rejected.', 'Old keys are overwritten.', 'Lookups stay O(1).'],
      },
    ],
    transfer: [
      {
        problem: 'An attacker sends keys chosen to all land in one bucket, making every chain O(n).',
        answer: 'Use a randomly seeded hash function (or make long chains balanced trees).',
        wrong: [
          { text: 'Add more buckets.', why: 'Chosen keys still collide under a known function.' },
          { text: 'Sort each chain.', why: 'Still O(n) to insert.' },
          { text: 'Use a bigger integer type.', why: 'The collisions come from the function, not the size.' },
        ],
        explain: 'If the attacker can’t predict the hash, they can’t target one bucket.',
      },
    ],
  },
  'hash-open-addressing': {
    family: 'hash',
    primitive: 'slots',
    parts: ['one flat array of slots', 'a hash function', 'a probe sequence', 'tombstones for deletes'],
    uses: ['A cache-friendly hash table with no pointers, kept at most half full.', 'A compact table of small keys where allocation per entry is too costly.'],
    rivals: ['hash-chaining', 'hash-map', 'cuckoo-hashing'],
    breaks: [
      {
        violation: 'Delete by simply emptying the slot (no tombstone).',
        result: 'A later search for a key that probed past that slot stops early and wrongly reports “not found”.',
        wrong: ['The table gets faster.', 'Keys are duplicated.', 'Nothing changes.'],
      },
    ],
    transfer: [
      {
        problem: 'Linear probing forms long clusters. Spread colliding keys out instead.',
        answer: 'Double hashing: step by a second hash of the key (h1 + i·h2), so different keys follow different probe paths.',
        wrong: [
          { text: 'Probe backwards.', why: 'Clusters form going the other way.' },
          { text: 'Probe 2 slots at a time for everyone.', why: 'Everyone still shares the same pattern.' },
          { text: 'Remove the probing.', why: 'Then collisions have nowhere to go.' },
        ],
        explain: 'Clusters grow because every collider takes the same next slot. A key-dependent step size breaks that.',
      },
    ],
  },
  'hash-map': {
    family: 'hash',
    primitive: 'both',
    parts: ['a hash table', 'a value stored with each key', 'resize and rehash when too full'],
    uses: ['Count how many times each word appears in a book.', 'Look up a user by exact ID, millions of times per second.'],
    rivals: ['hash-chaining', 'hash-open-addressing', 'cuckoo-hashing', 'ordered-map', 'trie'],
    breaks: [
      {
        violation: 'After inserting a key object, you change a field used in its hash.',
        result: 'Lookups hash to a different bucket and can’t find it, though it’s still stored.',
        wrong: ['The map moves it automatically.', 'The value changes too.', 'Nothing: the map stores the old hash.'],
      },
    ],
    transfer: [
      {
        problem: 'Given a list of numbers, find two that add up to a target, in O(n).',
        answer: 'For each x, check the map for target − x; then add x to the map.',
        wrong: [
          { text: 'Check every pair.', why: 'O(n²).' },
          { text: 'Sort and hope.', why: 'O(n log n) at best, and needs more logic.' },
          { text: 'Put all numbers in a stack.', why: 'A stack can’t answer “have I seen target − x?”.' },
        ],
        explain: 'O(1) “have I seen this value?” turns a pair search into a single pass.',
      },
    ],
  },
  'cuckoo-hashing': {
    family: 'hash',
    primitive: 'slots',
    parts: ['two tables', 'two hash functions', 'kick-out on insert'],
    uses: ['A network switch table that must answer every lookup in a fixed, tiny number of memory reads.', 'Lookups that must never degrade, even when unlucky.'],
    rivals: ['hash-open-addressing', 'hash-map'],
    breaks: [
      {
        violation: 'A kicked-out key is dropped instead of moved to its other home.',
        result: 'Keys silently disappear from the table.',
        wrong: ['Lookups get faster.', 'The table resizes.', 'The key is found in its other table anyway.'],
      },
    ],
    transfer: [
      {
        problem: 'An insert keeps kicking keys around in a loop.',
        answer: 'Stop after a limit, then rebuild with new hash functions (and usually a bigger table).',
        wrong: [
          { text: 'Keep kicking forever.', why: 'A cycle never ends.' },
          { text: 'Drop the key.', why: 'Data loss.' },
          { text: 'Put it in the nearest empty slot.', why: 'Then lookups (two fixed slots) can’t find it.' },
        ],
        explain: 'A cycle means these hash functions can’t place this set of keys. New functions give new homes.',
      },
    ],
  },
  'consistent-hashing': {
    family: 'distributed',
    primitive: 'abstract',
    parts: ['a ring of positions', 'servers hashed onto the ring', 'keys go to the next server clockwise'],
    uses: ['Spread cache keys across servers that come and go, moving as few keys as possible.', 'Assign users to database shards so adding a shard moves only a slice of users.'],
    breaks: [
      {
        violation: 'You go back to server = hash(key) mod N and then add one server.',
        result: 'Almost every key maps to a different server: the whole cache goes cold.',
        wrong: ['Only 1/N of keys move.', 'No keys move.', 'Only the new server’s keys move.'],
      },
    ],
    transfer: [
      {
        problem: 'With only a few servers, their arcs of the ring are very uneven and one server gets most keys.',
        answer: 'Virtual nodes: put each server at many positions on the ring.',
        wrong: [
          { text: 'Use a bigger ring.', why: 'Server positions are still random and uneven.' },
          { text: 'Go back to mod N.', why: 'That brings back mass reshuffling.' },
          { text: 'Give the busy server fewer keys by hand.', why: 'Doesn’t scale or adapt.' },
        ],
        explain: 'Many small arcs per server average out; losing a server spreads its keys over many others.',
      },
    ],
  },

  // ---------------- Tier 4 ----------------
  tree: {
    family: 'tree',
    primitive: 'links',
    parts: ['nodes with child pointers', 'one root', 'no cycles'],
    uses: ['Represent folders that contain files and other folders.', 'An organisation chart where everyone has one manager.'],
    rivals: ['binary-tree'],
    breaks: [
      {
        violation: 'A folder is made a child of one of its own subfolders.',
        result: 'A cycle: walking down never ends, and there is no longer a single path from the root.',
        wrong: ['The tree just gets taller.', 'Nothing: it’s still a tree.', 'Only leaves are affected.'],
      },
    ],
    transfer: [
      {
        problem: 'Given a file node, print its full path (/home/user/file) efficiently.',
        answer: 'Store a parent pointer in each node and walk up to the root, then reverse.',
        wrong: [
          { text: 'Search the whole tree from the root for the file.', why: 'O(n) search every time.' },
          { text: 'Store the full path string in every node.', why: 'Renaming a folder would require rewriting all paths below it.' },
          { text: 'Sort the files by name.', why: 'Names don’t give you ancestry.' },
        ],
        explain: 'Every node has exactly one parent, so walking up is a single path: O(depth).',
      },
    ],
  },
  'binary-tree': {
    family: 'tree',
    primitive: 'links',
    parts: ['nodes with left and right pointers', 'a root'],
    uses: ['An arithmetic expression like (3 + 4) × 5, with operators as internal nodes.', 'A yes/no decision tree.'],
    rivals: ['tree'],
    breaks: [
      {
        violation: 'A node is given a third child pointer.',
        result: 'It’s no longer a binary tree: code with fixed left/right fields can’t represent it, and traversals miss the extra child.',
        wrong: ['It becomes balanced.', 'Nothing changes.', 'It becomes a heap.'],
      },
    ],
    transfer: [
      {
        problem: 'Save a binary tree to a text file and rebuild EXACTLY the same shape later.',
        answer: 'Write a preorder traversal that includes a marker for every empty child.',
        wrong: [
          { text: 'Write the inorder traversal only.', why: 'Many different shapes share the same inorder.' },
          { text: 'Write the values sorted.', why: 'Shape is lost.' },
          { text: 'Write the number of nodes.', why: 'That’s not the tree.' },
        ],
        explain: 'With null markers, preorder is unambiguous: you always know when a subtree ends.',
      },
    ],
  },
  bst: {
    family: 'search-tree',
    primitive: 'links',
    parts: ['a binary tree', 'the order rule: left < node < right'],
    uses: ['Keep keys sorted while inserting in random order, and search them by halving.', 'Answer “what’s the next biggest key?” for data that arrives in random order.'],
    rivals: ['avl-tree', 'red-black-tree', 'splay-tree', 'treap', 'ordered-map', 'skip-list'],
    breaks: [
      {
        violation: 'A node in the LEFT subtree of 50 holds 70.',
        result: 'Searching for 70 goes right at 50 and never finds it.',
        wrong: ['Search still finds it, just slower.', 'The tree rebalances itself.', 'Only inorder traversal is affected, harmlessly.'],
      },
    ],
    transfer: [
      {
        problem: 'Find the k-th smallest key in O(height) instead of walking an inorder traversal.',
        answer: 'Store each node’s subtree size; at each node compare k with the left subtree’s size to choose a side.',
        wrong: [
          { text: 'Store each node’s depth.', why: 'Depth doesn’t tell you how many keys are smaller.' },
          { text: 'Keep a separate sorted array.', why: 'Inserts would be O(n).' },
          { text: 'Always go left k times.', why: 'The shape isn’t a straight line.' },
        ],
        explain: 'If the left subtree has L nodes: k ≤ L → go left; k = L + 1 → this node; else go right looking for k − L − 1.',
      },
    ],
  },
  'binary-heap': {
    family: 'pq',
    primitive: 'slots',
    parts: ['an array', 'complete-tree index arithmetic (2i+1, 2i+2)', 'heap order: parent ≤ children'],
    uses: ['A task scheduler that always runs the highest-priority task next.', 'Keep the 10 largest values from a stream of a billion.'],
    rivals: ['priority-queue', 'd-ary-heap', 'mergeable-heaps'],
    breaks: [
      {
        violation: 'removeMin moves the last item to the root but skips the sift-down.',
        result: 'A large value sits on top: the next removeMin returns the wrong item.',
        wrong: ['The heap stays valid.', 'Only insert is affected.', 'The array becomes sorted.'],
      },
    ],
    transfer: [
      {
        problem: 'Sort an array in place using a heap.',
        answer: 'Build a max-heap in the array, then repeatedly swap the root to the end and sift down the rest (heapsort).',
        wrong: [
          { text: 'Insert each element into a second heap, then copy back.', why: 'Works, but uses O(n) extra space.' },
          { text: 'Read the heap array left to right.', why: 'A heap isn’t sorted.' },
          { text: 'Sift up every element once.', why: 'That builds a heap; it doesn’t sort.' },
        ],
        explain: 'The max is always at index 0; moving it to the end grows a sorted region while the heap shrinks. O(n log n), no extra memory.',
      },
    ],
  },
  'd-ary-heap': {
    family: 'pq',
    primitive: 'slots',
    parts: ['an array', 'd children per node: d·i+1 … d·i+d', 'heap order'],
    uses: ['A priority queue that does far more inserts / decrease-keys than removeMins.', 'A heap tuned so each node’s children fit in one cache line.'],
    rivals: ['binary-heap', 'priority-queue', 'mergeable-heaps'],
    breaks: [
      {
        violation: 'In a 4-ary heap, you compute the parent as (i − 1) ÷ 2.',
        result: 'Sift-up compares with the wrong node, breaking heap order.',
        wrong: ['It works; the formula is the same for any d.', 'Only the root is affected.', 'The heap becomes binary.'],
      },
    ],
    transfer: [
      {
        problem: 'Your priority queue does 10× more decrease-keys (sift-ups) than removeMins. Tune it.',
        answer: 'Use a larger d (e.g. 4 or 8): a shorter tree makes sift-up cheaper, and sift-down is rare.',
        wrong: [
          { text: 'Use d = 1.', why: 'That’s a linked list: O(n) height.' },
          { text: 'Keep d = 2; it’s always best.', why: 'The best d depends on the operation mix.' },
          { text: 'Sort the array after each operation.', why: 'O(n log n) each time.' },
        ],
        explain: 'Height log_d n shrinks as d grows; each removeMin pays d comparisons per level, but it’s rare here.',
      },
    ],
  },
  trie: {
    family: 'trie',
    primitive: 'links',
    parts: ['a tree with one edge per letter', 'end-of-word marks'],
    uses: ['Autocomplete: list every word starting with what the user has typed.', 'Spell-check a word in time proportional to its length, not the dictionary size.'],
    rivals: ['radix-trie'],
    breaks: [
      {
        violation: 'Nodes don’t mark where words end.',
        result: 'After inserting “cart”, a lookup for “car” wrongly says it’s a word (its path exists).',
        wrong: ['Lookups get slower.', 'Nothing changes.', '“cart” can no longer be found.'],
      },
    ],
    transfer: [
      {
        problem: 'Answer “how many stored words start with prefix p?” in O(|p|).',
        answer: 'Store a counter in each node, incremented on every insert that passes through it.',
        wrong: [
          { text: 'Walk the whole subtree under p each time.', why: 'That’s O(subtree size).' },
          { text: 'Store the count only at the root.', why: 'That’s the total, not per prefix.' },
          { text: 'Keep a separate sorted list of words.', why: 'Needs its own search and upkeep.' },
        ],
        explain: 'A node’s counter = number of words passing through it = words with that prefix.',
      },
    ],
  },

  // ---------------- Tier 5 ----------------
  'avl-tree': {
    family: 'search-tree',
    primitive: 'links',
    parts: ['a BST', 'a height (balance factor) per node', 'rotations'],
    uses: ['A sorted index that is read far more often than written, needing the shallowest tree.', 'Guaranteed O(log n) lookups even when keys arrive already sorted.'],
    rivals: ['red-black-tree', 'bst', 'treap', 'splay-tree', 'ordered-map', 'skip-list'],
    breaks: [
      {
        violation: 'Rotations are performed but node heights aren’t updated afterwards.',
        result: 'Balance factors become wrong, so later imbalances go unnoticed (or phantom ones trigger rotations).',
        wrong: ['Nothing: heights are recomputed on search.', 'The tree becomes a heap.', 'Only memory use changes.'],
      },
    ],
    transfer: [
      {
        problem: 'You store subtree SIZES in each AVL node (for k-th smallest). How do you keep them right through a rotation?',
        answer: 'After rotating, recompute size for the node that moved down first, then for the node that moved up.',
        wrong: [
          { text: 'Recompute every size in the tree.', why: 'O(n) per rotation.' },
          { text: 'Sizes don’t change in a rotation.', why: 'The two rotated nodes swap parent/child roles, so their sizes change.' },
          { text: 'Recompute the new top first.', why: 'Its size depends on the lower node’s updated size.' },
        ],
        explain: 'Only the two rotated nodes change subtrees. Fix bottom-up: size = 1 + left.size + right.size.',
      },
    ],
  },
  'red-black-tree': {
    family: 'search-tree',
    primitive: 'links',
    parts: ['a BST', 'a red/black colour bit per node', 'recolouring and rotations'],
    uses: ['A standard-library sorted map with heavy inserts and deletes.', 'An ordered set that must guarantee O(log n) updates with few rotations.'],
    rivals: ['avl-tree', 'bst', 'treap', 'splay-tree', 'ordered-map', 'skip-list'],
    breaks: [
      {
        violation: 'A red node is allowed to have a red child.',
        result: 'Paths can grow much longer than 2× the shortest, so the O(log n) height guarantee is lost.',
        wrong: ['Only the colours look wrong.', 'Search returns wrong keys.', 'The tree becomes an AVL tree.'],
      },
    ],
    transfer: [
      {
        problem: 'Your dictionary is built once and then only searched, billions of times. AVL or red-black?',
        answer: 'AVL: its stricter balance gives a slightly shallower tree, and the extra update cost doesn’t matter here.',
        wrong: [
          { text: 'Red-black, because it’s in more libraries.', why: 'Popularity isn’t the criterion; lookups dominate.' },
          { text: 'A plain BST.', why: 'No balance guarantee.' },
          { text: 'It makes no difference at all.', why: 'Depth differs; for pure lookups, shallower wins.' },
        ],
        explain: 'Red-black trades a bit of depth for cheaper updates. With no updates, take the shallower tree.',
      },
    ],
  },
  'splay-tree': {
    family: 'search-tree',
    primitive: 'links',
    parts: ['a plain BST', 'splaying (rotations) on every access'],
    uses: ['A cache-like set where 1% of keys get 90% of lookups.', 'A workload where recently used keys are likely to be used again soon.'],
    rivals: ['avl-tree', 'red-black-tree', 'bst', 'treap', 'ordered-map'],
    breaks: [
      {
        violation: 'Lookups stop splaying; only inserts do.',
        result: 'Hot keys stay deep, and the amortized O(log n) guarantee no longer holds.',
        wrong: ['Nothing changes.', 'Lookups become O(1).', 'The tree becomes balanced.'],
      },
    ],
    transfer: [
      {
        problem: 'Many threads read the tree at the same time. Is a splay tree a good fit?',
        answer: 'No: even lookups rotate the tree, so every read is a write that needs locking.',
        wrong: [
          { text: 'Yes: lookups don’t change anything.', why: 'Splay lookups do restructure the tree.' },
          { text: 'Yes: it’s always balanced.', why: 'It isn’t, and concurrency is the real issue.' },
          { text: 'Only if keys are integers.', why: 'Key type is irrelevant.' },
        ],
        explain: 'Self-adjusting on reads is the splay tree’s power and also why it’s awkward for concurrent readers.',
      },
    ],
  },
  treap: {
    family: 'search-tree',
    primitive: 'links',
    parts: ['a BST by key', 'a random priority per node in heap order', 'rotations'],
    uses: ['A balanced ordered set in very little code, where expected O(log n) is enough.', 'Splitting and merging ordered sets quickly.'],
    rivals: ['avl-tree', 'red-black-tree', 'bst', 'splay-tree', 'skip-list', 'ordered-map'],
    breaks: [
      {
        violation: 'Priorities are set to the keys themselves instead of random numbers.',
        result: 'The shape equals a BST built in sorted order: a stick of height n − 1.',
        wrong: ['The tree becomes perfectly balanced.', 'Nothing changes.', 'Search returns wrong keys.'],
      },
    ],
    transfer: [
      {
        problem: 'Split an ordered set into “keys < k” and “keys ≥ k” in O(log n).',
        answer: 'Treap split: walk down the path for k, cutting and re-linking subtrees along the way.',
        wrong: [
          { text: 'Remove keys one at a time.', why: 'O(n log n).' },
          { text: 'Copy into two arrays.', why: 'O(n).' },
          { text: 'Rotate k to the root and do nothing else.', why: 'Close in spirit, but the answer needs the two subtrees cut apart.' },
        ],
        explain: 'Everything left of the split path is < k, everything right is ≥ k; only the path nodes need re-linking.',
      },
    ],
  },
  'b-tree': {
    family: 'disk-tree',
    primitive: 'both',
    parts: ['wide nodes of many sorted keys', 'one more child than keys', 'split full nodes upward'],
    uses: ['A database index on disk where each node read is a slow disk access.', 'A file system’s directory index holding millions of names.'],
    rivals: ['b-plus-tree'],
    breaks: [
      {
        violation: 'A full leaf is allowed to keep growing instead of splitting.',
        result: 'Nodes overflow their disk page, so one node needs several disk reads, and the balance guarantees go.',
        wrong: ['Leaves end up at different depths but nothing else changes.', 'Search gets faster.', 'Nothing.'],
      },
    ],
    transfer: [
      {
        problem: 'How many keys should one B-tree node hold on a disk with 4 KB pages and 16-byte keys+pointers?',
        answer: 'About 4096 / 16 ≈ 256: size each node to exactly one page.',
        wrong: [
          { text: '2, like a binary tree.', why: 'Wastes almost every page read.' },
          { text: 'As many as possible, many pages per node.', why: 'Then one node costs several reads.' },
          { text: '1.', why: 'That’s a stick.' },
        ],
        explain: 'Every node visit is one read, so pack a page completely: the tree becomes as short as possible.',
      },
    ],
  },
  'b-plus-tree': {
    family: 'disk-tree',
    primitive: 'both',
    parts: ['routing-only internal nodes', 'all records in leaves', 'leaves linked left to right'],
    uses: ['“All orders between March 1 and March 31” on a huge on-disk table.', 'The index behind most SQL databases, serving both lookups and range scans.'],
    rivals: ['b-tree'],
    breaks: [
      {
        violation: 'Leaves are not linked to each other.',
        result: 'A range scan must climb back up the tree between leaves, costing extra disk reads.',
        wrong: ['Single-key lookups break.', 'The tree becomes unbalanced.', 'Nothing changes.'],
      },
    ],
    transfer: [
      {
        problem: 'You need to scan ranges NEWEST-first (descending) as fast as ascending.',
        answer: 'Doubly link the leaves (add prev pointers) and walk left.',
        wrong: [
          { text: 'Re-descend from the root for each key.', why: 'O(log n) per key.' },
          { text: 'Sort results afterwards.', why: 'Extra work and memory.' },
          { text: 'Build a second tree in reverse order.', why: 'Doubles storage and update cost.' },
        ],
        explain: 'The leaf chain is just a linked list; a doubly linked one can be walked both ways.',
      },
    ],
  },

  // ---------------- Tier 6 ----------------
  graph: {
    family: 'graph',
    primitive: 'abstract',
    parts: ['nodes', 'edges between pairs (directed or not)'],
    uses: ['Model cities and the roads between them, including loops and one-way streets.', 'Model who follows whom on a social network.'],
    rivals: ['adjacency-list', 'adjacency-matrix', 'edge-list'],
    breaks: [
      {
        violation: 'A graph search doesn’t remember which nodes it has already visited.',
        result: 'On a cycle it goes round forever (or does exponential repeated work).',
        wrong: ['It just finishes a bit slower.', 'It skips some edges.', 'Only directed graphs are affected.'],
      },
    ],
    transfer: [
      {
        problem: 'A city has both one-way and two-way streets. Model it.',
        answer: 'A directed graph: a two-way street becomes two edges, one each way.',
        wrong: [
          { text: 'An undirected graph.', why: 'Can’t express one-way streets.' },
          { text: 'A tree rooted at the city centre.', why: 'Streets form cycles and multiple routes.' },
          { text: 'Two separate graphs.', why: 'Routes mix both kinds of streets.' },
        ],
        explain: 'Directed edges are the general case; undirected edges are just pairs of them.',
      },
    ],
  },
  'adjacency-matrix': {
    family: 'graph',
    primitive: 'slots',
    parts: ['an n × n 2D array', 'cell [u][v] = edge or weight'],
    uses: ['A dense graph where you constantly ask “is there an edge between u and v?”.', 'Flight routes between 50 airports, almost all connected.'],
    rivals: ['adjacency-list', 'edge-list', 'graph'],
    breaks: [
      {
        violation: 'For an undirected graph you set [u][v] = 1 but forget [v][u].',
        result: 'The graph is accidentally directed: v doesn’t see u as a neighbour.',
        wrong: ['Nothing: the matrix is read both ways.', 'The edge is doubled.', 'Only the diagonal changes.'],
      },
    ],
    transfer: [
      {
        problem: 'Store a weighted graph (road lengths) in a matrix.',
        answer: 'Put the weight in cell [u][v], and ∞ (or a “none” marker) where there’s no road.',
        wrong: [
          { text: 'Put 0 where there’s no road.', why: '0 looks like a free road of length 0.' },
          { text: 'Use a second matrix for existence only.', why: 'Unnecessary: a marker value does it.' },
          { text: 'Matrices can’t hold weights.', why: 'A cell can hold any number.' },
        ],
        explain: 'A cell is just a number; choose a value that can’t be confused with a real weight for “no edge”.',
      },
    ],
  },
  'adjacency-list': {
    family: 'graph',
    primitive: 'both',
    parts: ['an array indexed by node', 'a list of neighbours per node'],
    uses: ['A road map where each intersection has only a few roads, explored neighbour by neighbour.', 'A social network with a billion users, each with a few hundred friends.'],
    rivals: ['adjacency-matrix', 'edge-list', 'graph'],
    breaks: [
      {
        violation: 'For an undirected edge u–v you add v to u’s list only.',
        result: 'Searches from v never see u: the graph behaves as directed.',
        wrong: ['The edge is simply stored once, which is fine.', 'The list becomes sorted.', 'Memory doubles.'],
      },
    ],
    transfer: [
      {
        problem: 'A sparse graph also needs FAST “is u–v an edge?” checks.',
        answer: 'Keep each node’s neighbours in a hash set instead of a plain list.',
        wrong: [
          { text: 'Switch to an adjacency matrix.', why: 'O(n²) memory for a sparse graph.' },
          { text: 'Scan the list each time.', why: 'O(degree) per check.' },
          { text: 'Keep a sorted edge list.', why: 'O(log e) per check, and awkward to update.' },
        ],
        explain: 'Neighbour iteration stays O(degree), and membership becomes O(1) average.',
      },
    ],
  },
  'edge-list': {
    family: 'graph',
    primitive: 'slots',
    parts: ['an array of (u, v[, weight]) records'],
    uses: ['Process every road from cheapest to most expensive (sort once, then walk).', 'Store a graph as compactly as possible for loading from a file.'],
    rivals: ['adjacency-list', 'adjacency-matrix', 'graph'],
    breaks: [
      {
        violation: 'You use a plain edge list for “give me all neighbours of X” inside a tight loop.',
        result: 'Each call scans every edge: O(e) per call, so the loop becomes very slow.',
        wrong: ['It’s O(1) per call.', 'It’s O(degree) per call.', 'Edges get lost.'],
      },
    ],
    transfer: [
      {
        problem: 'Compute the degree of every node from an edge list, in one pass.',
        answer: 'An array of counters; for each edge (u, v), increment both u and v.',
        wrong: [
          { text: 'For each node, scan all edges.', why: 'O(n · e).' },
          { text: 'Sort the edges.', why: 'Unnecessary work.' },
          { text: 'Increment only u.', why: 'Undirected edges touch both ends.' },
        ],
        explain: 'O(n + e): one pass over the edges, one counter per node.',
      },
    ],
  },
  'union-find': {
    family: 'dsu',
    primitive: 'slots',
    parts: ['a parent array', 'find: follow parents to the root', 'union: link roots (by size)'],
    uses: ['Friend groups that only ever merge; answer “same group?” instantly.', 'Detect whether adding a road would create a loop.'],
    rivals: ['graph', 'adjacency-list'],
    breaks: [
      {
        violation: 'union(a, b) sets parent[a] = b instead of linking their ROOTS.',
        result: 'a leaves its old set: its former set-mates no longer share a root with it.',
        wrong: ['It still works, just slower.', 'The sets merge correctly.', 'Nothing changes.'],
      },
    ],
    transfer: [
      {
        problem: 'Adding roads one by one: detect the first road that closes a cycle.',
        answer: 'Before adding u–v, if find(u) = find(v) they’re already connected, so this road makes a cycle; otherwise union them.',
        wrong: [
          { text: 'Run a full graph search after each road.', why: 'O(n + e) per road.' },
          { text: 'Check whether u and v are adjacent.', why: 'They can be connected through other roads.' },
          { text: 'Count roads; a cycle appears after n roads.', why: 'Cycles can appear much earlier.' },
        ],
        explain: 'Same root = already connected. This is exactly how Kruskal’s algorithm avoids cycles.',
      },
    ],
  },

  // ---------------- Tier 7 ----------------
  'prefix-sum': {
    family: 'range',
    primitive: 'slots',
    parts: ['an array of running totals', 'range = P[r+1] − P[l]'],
    uses: ['Answer millions of “total sales from day l to day r” queries on data that never changes.', 'Fast range sums over a static array.'],
    rivals: ['fenwick-tree', 'segment-tree', 'sparse-table'],
    breaks: [
      {
        violation: 'P is built without the leading 0 (P[0] = a[0]).',
        result: 'Ranges starting at index 0 can’t be expressed, and every formula is off by one.',
        wrong: ['Nothing changes.', 'Only the last element is lost.', 'Queries become O(n).'],
      },
    ],
    transfer: [
      {
        problem: 'Sum any rectangle of a 2D grid in O(1).',
        answer: '2D prefix sums: S = P[r2][c2] − P[r1][c2] − P[r2][c1] + P[r1][c1].',
        wrong: [
          { text: 'One prefix array per row, summing rows each time.', why: 'O(rows) per query.' },
          { text: 'Just P[r2][c2] − P[r1][c1].', why: 'That subtracts the wrong regions.' },
          { text: 'It’s impossible in 2D.', why: 'Inclusion–exclusion fixes the double subtraction.' },
        ],
        explain: 'Subtract the two strips outside the rectangle, then add back the corner you subtracted twice.',
      },
    ],
  },
  'sparse-table': {
    family: 'range',
    primitive: 'slots',
    parts: ['a table of power-of-two block answers', 'two overlapping blocks per query'],
    uses: ['Millions of “coldest day between l and r” queries on data that never changes.', 'O(1) range-minimum queries over a static array.'],
    rivals: ['segment-tree', 'prefix-sum', 'fenwick-tree'],
    breaks: [
      {
        violation: 'The same overlapping-blocks trick is used for range SUM.',
        result: 'Elements in the overlap are counted twice, so sums come out too big.',
        wrong: ['It works for sums too.', 'Sums come out too small.', 'Only single-element ranges break.'],
      },
    ],
    transfer: [
      {
        problem: 'Answer range-GCD queries in O(1) on a static array.',
        answer: 'A sparse table storing gcd instead of min: gcd, like min, doesn’t mind overlap.',
        wrong: [
          { text: 'Prefix sums of the values.', why: 'GCD can’t be recovered by subtraction.' },
          { text: 'A hash map of ranges.', why: 'O(n²) ranges.' },
          { text: 'It can’t be done in O(1).', why: 'gcd(x, x) = x, so overlap is harmless.' },
        ],
        explain: 'Any operation where combining something with itself changes nothing (min, max, gcd, AND, OR) fits a sparse table.',
      },
    ],
  },
  'segment-tree': {
    family: 'range',
    primitive: 'both',
    parts: ['a binary tree over index ranges', 'each node = aggregate of its range', 'O(log n) nodes cover any query'],
    uses: ['A live leaderboard needing both range totals and frequent point updates.', 'Range-minimum queries on data that keeps changing.'],
    rivals: ['fenwick-tree', 'prefix-sum', 'sparse-table'],
    breaks: [
      {
        violation: 'After a point update you fix the leaf but not its ancestors.',
        result: 'Queries that use higher nodes return the old totals.',
        wrong: ['Nothing: queries read leaves only.', 'The tree rebalances.', 'Only the root is wrong.'],
      },
    ],
    transfer: [
      {
        problem: 'Add 5 to every element in a range [l, r], many times, fast.',
        answer: 'Lazy propagation: mark covering nodes with “+5 pending” and push it down only when needed.',
        wrong: [
          { text: 'Update each element separately.', why: 'O((r − l) log n).' },
          { text: 'Rebuild the tree.', why: 'O(n).' },
          { text: 'Store the update in the root only.', why: 'Nodes outside the range would be wrong.' },
        ],
        explain: 'O(log n) covering nodes take the update; children learn about it lazily when visited.',
      },
    ],
  },
  'fenwick-tree': {
    family: 'range',
    primitive: 'bits',
    parts: ['one array', 'f[i] covers lowbit(i) elements', 'i ± lowbit(i) walks'],
    uses: ['Prefix sums with frequent point updates, in minimal memory and code.', 'Counting how many earlier elements are smaller, while scanning.'],
    rivals: ['segment-tree', 'prefix-sum'],
    breaks: [
      {
        violation: 'The update loop does i −= lowbit(i) (the query step) instead of i += lowbit(i).',
        result: 'It updates the wrong entries, the ones a query would read, not the ones covering i.',
        wrong: ['It works either way.', 'Only index 1 breaks.', 'It loops forever.'],
      },
    ],
    transfer: [
      {
        problem: 'You need RANGE updates (+v to all of [l, r]) and POINT queries.',
        answer: 'A Fenwick tree over the difference array: add v at l, −v at r + 1; a point value is a prefix sum.',
        wrong: [
          { text: 'Update each element in [l, r].', why: 'O((r − l) log n).' },
          { text: 'It needs a segment tree.', why: 'Differences make it a prefix-sum problem.' },
          { text: 'Store v at l only.', why: 'Elements after r would also change.' },
        ],
        explain: 'In the difference array, a range update is two point updates, and a point value is a prefix sum.',
      },
    ],
  },
  'interval-tree': {
    family: 'intervals',
    primitive: 'links',
    parts: ['a BST keyed by interval start', 'max end stored per subtree'],
    uses: ['A calendar: find meetings that clash with 2–3pm.', 'Find every gene region overlapping a given DNA position.'],
    rivals: ['segment-tree'],
    breaks: [
      {
        violation: 'Inserts don’t update the max-end field of ancestors.',
        result: 'Searches skip subtrees that actually contain overlapping intervals.',
        wrong: ['Nothing: max is recomputed during search.', 'Searches get slower but stay correct.', 'The tree becomes unbalanced.'],
      },
    ],
    transfer: [
      {
        problem: 'Report ALL intervals overlapping a query, not just one.',
        answer: 'Recurse into any subtree whose max ≥ query start (and whose starts can be ≤ query end); report every overlapping node.',
        wrong: [
          { text: 'Stop at the first overlap.', why: 'That finds only one.' },
          { text: 'Check every interval.', why: 'Loses the pruning: O(n).' },
          { text: 'Only go left.', why: 'Overlaps can be anywhere the max allows.' },
        ],
        explain: 'The same pruning rule, applied without stopping: O(log n + k) for k results.',
      },
    ],
  },
  'kd-tree': {
    family: 'spatial',
    primitive: 'links',
    parts: ['a BST of points', 'the split axis alternates with depth'],
    uses: ['Find the nearest restaurant to a user’s (x, y) location.', 'All points inside a rectangle on a map.'],
    rivals: ['quadtree'],
    breaks: [
      {
        violation: 'Every level compares only x.',
        result: 'It’s a BST on x: points close in x but far in y share branches, and 2D pruning stops working.',
        wrong: ['It becomes a quadtree.', 'Nothing changes.', 'Search becomes O(1).'],
      },
    ],
    transfer: [
      {
        problem: 'Store 3D points (x, y, z).',
        answer: 'Cycle through x, y, z by depth (depth mod 3).',
        wrong: [
          { text: 'Keep alternating x and y only.', why: 'z would never split anything.' },
          { text: 'Use three separate trees.', why: 'Queries must combine all axes at once.' },
          { text: 'k-d trees only work in 2D.', why: 'k is any number of dimensions.' },
        ],
        explain: 'The “k” in k-d tree is the number of dimensions; each level splits on the next axis.',
      },
    ],
  },
  quadtree: {
    family: 'spatial',
    primitive: 'links',
    parts: ['a square region', 'four child quadrants', 'split only when crowded'],
    uses: ['Collision checks in a game world that is mostly empty with dense clusters.', 'Map tiles that zoom in only where there is detail.'],
    rivals: ['kd-tree'],
    breaks: [
      {
        violation: 'A point is placed in the wrong quadrant (e.g. NE instead of SE).',
        result: 'Searches for it descend into the correct quadrant and never find it.',
        wrong: ['It’s found anyway.', 'The tree just gets deeper.', 'Only neighbours are affected.'],
      },
    ],
    transfer: [
      {
        problem: 'Do the same for a 3D world.',
        answer: 'An octree: split each cube into 8 smaller cubes.',
        wrong: [
          { text: 'A quadtree per height level.', why: 'Awkward and uneven.' },
          { text: 'A binary tree of cubes.', why: 'That’s a different split (like a k-d tree).' },
          { text: 'Keep using 4 children.', why: '3D space splits into 8 halves-of-halves-of-halves.' },
        ],
        explain: 'Halving each of 3 axes gives 2 × 2 × 2 = 8 children.',
      },
    ],
  },

  // ---------------- Tier 8 ----------------
  'radix-trie': {
    family: 'trie',
    primitive: 'links',
    parts: ['a trie', 'single-child chains merged into string-labelled edges'],
    uses: ['A router matching an IP address to the longest stored prefix.', 'A trie of long URLs without millions of one-child nodes.'],
    rivals: ['trie'],
    breaks: [
      {
        violation: 'Two edges from the same node are both allowed to start with “t”.',
        result: 'Lookup can’t tell which edge to follow for a word starting with t.',
        wrong: ['Lookups get faster.', 'It saves more memory.', 'Nothing changes.'],
      },
    ],
    transfer: [
      {
        problem: 'Route packets: find the LONGEST stored prefix of a destination address.',
        answer: 'Walk the radix trie along the address bits, remembering the last node marked as a stored prefix.',
        wrong: [
          { text: 'Hash the full address.', why: 'Exact match only, no prefixes.' },
          { text: 'Stop at the first stored prefix.', why: 'That’s the shortest match.' },
          { text: 'Sort all prefixes and binary search.', why: 'Longest-prefix doesn’t map to one binary search.' },
        ],
        explain: 'The walk visits every stored prefix of the address in order; the last one is the longest.',
      },
    ],
  },
  'suffix-array': {
    family: 'text-index',
    primitive: 'slots',
    parts: ['all suffix start positions', 'sorted alphabetically'],
    uses: ['Search a whole genome for millions of different short patterns.', 'A compact full-text index for a large static document.'],
    rivals: ['suffix-tree', 'trie', 'radix-trie'],
    breaks: [
      {
        violation: 'The suffix array is left unsorted.',
        result: 'Binary search no longer works; you’re back to scanning.',
        wrong: ['It just uses more memory.', 'Only long patterns are affected.', 'Nothing changes.'],
      },
    ],
    transfer: [
      {
        problem: 'Find the longest substring that appears at least twice.',
        answer: 'Compute the longest common prefix of each pair of ADJACENT suffixes in the array; take the maximum.',
        wrong: [
          { text: 'Compare every pair of suffixes.', why: 'O(n²) pairs.' },
          { text: 'Take the longest suffix.', why: 'It appears once.' },
          { text: 'Take the first suffix.', why: 'Order isn’t about repeats.' },
        ],
        explain: 'Suffixes sharing a long prefix sort next to each other, so only neighbours need comparing.',
      },
    ],
  },
  'suffix-tree': {
    family: 'text-index',
    primitive: 'links',
    parts: ['a compressed trie', 'of every suffix of text + $'],
    uses: ['Test “is this a substring?” in time depending only on the pattern length.', 'Count occurrences of any pattern in one walk.'],
    rivals: ['suffix-array'],
    breaks: [
      {
        violation: 'The end marker $ is left off.',
        result: 'A suffix that is a prefix of another (like “a” in “banana”) ends mid-edge, so not every suffix has its own leaf.',
        wrong: ['Nothing changes.', 'Search stops working entirely.', 'The tree gets smaller but still has n leaves.'],
      },
    ],
    transfer: [
      {
        problem: 'Find the longest repeated substring of a text.',
        answer: 'The deepest internal node (by string length on its path): internal nodes mean ≥ 2 suffixes share that prefix.',
        wrong: [
          { text: 'The deepest leaf.', why: 'A leaf is one suffix, not a repeat.' },
          { text: 'The root’s longest edge.', why: 'Edges alone don’t imply repeats.' },
          { text: 'The node with most children.', why: 'Most branching isn’t longest.' },
        ],
        explain: 'An internal node exists where suffixes diverge, so its path appears at least twice.',
      },
    ],
  },
  rope: {
    family: 'text-edit',
    primitive: 'links',
    parts: ['a binary tree', 'string chunks in the leaves', 'left-subtree length (weight) in each node'],
    uses: ['A text editor editing a 50 MB file in the middle without copying it.', 'Concatenate huge strings without copying their characters.'],
    rivals: ['string'],
    breaks: [
      {
        violation: 'A node’s weight is set to the length of its WHOLE subtree instead of its left subtree.',
        result: 'Index lookups go left when they should go right, returning the wrong characters.',
        wrong: ['Lookups still work.', 'Only concatenation breaks.', 'The rope gets balanced.'],
      },
    ],
    transfer: [
      {
        problem: 'Add unlimited undo to a rope-based editor cheaply.',
        answer: 'Never modify nodes; each edit builds a new root sharing unchanged subtrees, and keep old roots.',
        wrong: [
          { text: 'Save the full text after every edit.', why: 'O(n) per edit.' },
          { text: 'Only keep the latest version.', why: 'No undo.' },
          { text: 'Store the edits and replay from the start.', why: 'Undo gets slower over time.' },
        ],
        explain: 'Path copying makes each version cost O(log n) new nodes; old roots are old versions.',
      },
    ],
  },

  // ---------------- Tier 9 ----------------
  'skip-list': {
    family: 'search-tree',
    primitive: 'links',
    parts: ['a sorted linked list', 'extra express levels', 'coin flips pick each node’s height'],
    uses: ['A sorted set that many threads update at once (splices are local).', 'Ordered keys with expected O(log n) search and no rebalancing code.'],
    rivals: ['bst', 'avl-tree', 'red-black-tree', 'treap', 'splay-tree', 'ordered-map'],
    breaks: [
      {
        violation: 'Every node is promoted to every level.',
        result: 'Each level is a full copy of the list, so express lanes skip nothing: search becomes O(n).',
        wrong: ['Search becomes O(1).', 'It becomes a balanced tree.', 'Nothing changes.'],
      },
    ],
    transfer: [
      {
        problem: 'Find the k-th smallest element in a skip list in expected O(log n).',
        answer: 'Store on each forward link how many level-1 nodes it skips (its width); sum widths while moving.',
        wrong: [
          { text: 'Walk level 1 for k steps.', why: 'O(k).' },
          { text: 'Count nodes at the top level.', why: 'That’s not rank.' },
          { text: 'Skip lists can’t do it.', why: 'Widths make ranks easy.' },
        ],
        explain: 'Same trick as subtree sizes in trees: remember how many items each step jumps over.',
      },
    ],
  },
  'bloom-filter': {
    family: 'sketch',
    primitive: 'bits',
    parts: ['an m-bit array', 'k hash functions'],
    uses: ['Skip a disk lookup when a key is definitely absent, using only ~10 bits per key.', 'A browser checking URLs against a malicious list in ~10 bits per URL.'],
    rivals: ['bitset'],
    breaks: [
      {
        violation: 'Items are “deleted” by clearing their bits.',
        result: 'Other items sharing those bits now look absent: false negatives appear.',
        wrong: ['Deletion works fine.', 'Only the false-positive rate changes.', 'The filter grows.'],
      },
    ],
    transfer: [
      {
        problem: 'You must support deletes.',
        answer: 'A counting Bloom filter: small counters instead of bits; add increments, delete decrements.',
        wrong: [
          { text: 'Clear the item’s bits.', why: 'False negatives.' },
          { text: 'Keep a separate list of deleted items.', why: 'That list grows without bound.' },
          { text: 'Rebuild after every delete.', why: 'Needs all the items, which the filter doesn’t store.' },
        ],
        explain: 'A counter reaches 0 only when every item using it is gone.',
      },
    ],
  },
  'count-min-sketch': {
    family: 'sketch',
    primitive: 'slots',
    parts: ['a d × w grid of counters', 'one hash function per row', 'estimate = minimum over rows'],
    uses: ['Estimate how many packets each IP address sent, in fixed memory.', 'Track approximate word frequencies in an endless stream.'],
    breaks: [
      {
        violation: 'The estimate takes the MAXIMUM of the item’s counters.',
        result: 'It picks the most collision-polluted counter: overestimates get much worse.',
        wrong: ['Estimates become exact.', 'It can now undercount.', 'Nothing changes.'],
      },
    ],
    transfer: [
      {
        problem: 'Find the heaviest senders (“heavy hitters”) in the stream.',
        answer: 'Count-min sketch for estimates, plus a small min-heap of the current top candidates.',
        wrong: [
          { text: 'Scan all counters at the end.', why: 'Counters don’t say which keys they belong to.' },
          { text: 'A hash map of every sender.', why: 'Unbounded memory.' },
          { text: 'Keep only the last sender.', why: 'Loses everything else.' },
        ],
        explain: 'The sketch estimates any key’s count; the heap remembers which keys currently look biggest.',
      },
    ],
  },
  hyperloglog: {
    family: 'sketch',
    primitive: 'bits',
    parts: ['hashes as coin flips', 'registers storing max leading-zero rank', 'harmonic-mean combination'],
    uses: ['Count distinct daily visitors of a huge website in ~12 KB.', 'Estimate distinct search queries across a whole cluster.'],
    breaks: [
      {
        violation: 'Registers store the SUM of ranks instead of the maximum.',
        result: 'Duplicates now inflate the estimate: it counts total items, not distinct ones.',
        wrong: ['Nothing changes.', 'Estimates get more accurate.', 'It undercounts.'],
      },
    ],
    transfer: [
      {
        problem: 'Ten servers each counted distinct visitors with HyperLogLog. Get the distinct count across all of them.',
        answer: 'Merge by taking the register-wise maximum, then estimate from the merged registers.',
        wrong: [
          { text: 'Add up the ten estimates.', why: 'Visitors seen by several servers are counted repeatedly.' },
          { text: 'Average the ten estimates.', why: 'Ignores visitors unique to each server.' },
          { text: 'It’s impossible without the raw IDs.', why: 'Max-merging gives exactly the sketch of the union.' },
        ],
        explain: 'max is idempotent and order-free: merging sketches equals sketching the combined stream.',
      },
    ],
  },

  // ---------------- Tier 10 ----------------
  'ordered-map': {
    family: 'search-tree',
    primitive: 'links',
    parts: ['a self-balancing BST (red-black)', 'key → value in each node'],
    uses: ['Find the first appointment at or after 14:30.', 'List all orders placed between 9:00 and 9:15, in time order.'],
    rivals: ['red-black-tree', 'avl-tree', 'bst', 'skip-list', 'treap', 'splay-tree', 'b-plus-tree'],
    breaks: [
      {
        violation: 'Keys are compared inconsistently (e.g. sometimes by upper case, sometimes not).',
        result: 'The tree’s order rule is violated, so lookups and ranges miss keys.',
        wrong: ['It just becomes a hash map.', 'Only iteration order changes.', 'Nothing.'],
      },
    ],
    transfer: [
      {
        problem: 'A leaderboard must give any player’s RANK, and update scores quickly.',
        answer: 'An ordered map from score to players, augmented with subtree sizes, plus a hash map player → score.',
        wrong: [
          { text: 'Sort all players on every request.', why: 'O(n log n) per request.' },
          { text: 'A hash map only.', why: 'No order, so no rank.' },
          { text: 'A sorted array.', why: 'Updates are O(n).' },
        ],
        explain: 'Subtree sizes turn a search path into a rank; the hash map finds a player’s current score to remove it on update.',
      },
    ],
  },
  'lru-cache': {
    family: 'cache',
    primitive: 'both',
    parts: ['a hash map key → node', 'a doubly linked list in recency order'],
    uses: ['Keep the 1,000 most recently viewed pages in memory.', 'A database buffer pool that evicts the page untouched the longest.'],
    rivals: ['lfu-cache'],
    breaks: [
      {
        violation: 'get() returns the value but doesn’t move the node to the front.',
        result: 'Recently used keys can be evicted as if unused: it degrades to first-in-first-out.',
        wrong: ['Nothing changes.', 'Eviction stops happening.', 'The cache grows unbounded.'],
      },
    ],
    transfer: [
      {
        problem: 'Entries must also EXPIRE after a time limit, even if recently used.',
        answer: 'Keep the LRU list for eviction plus a min-heap (or ordered map) by expiry time; drop expired entries first.',
        wrong: [
          { text: 'Scan all entries for expired ones on every get.', why: 'O(n) per operation.' },
          { text: 'Just use the LRU order.', why: 'A recently used entry can still be expired.' },
          { text: 'Store expiry in the key.', why: 'Keys wouldn’t match on lookup.' },
        ],
        explain: 'Two orders, two structures: recency (list) and deadline (heap), both pointing at the same entries.',
      },
    ],
  },
  'lfu-cache': {
    family: 'cache',
    primitive: 'both',
    parts: ['a key map', 'one recency list per use-count', 'minFreq'],
    uses: ['A CDN cache where a few assets are popular for weeks and bursts of one-off files must not flush them.', 'Keep long-term favourites cached through traffic spikes.'],
    rivals: ['lru-cache'],
    breaks: [
      {
        violation: 'minFreq isn’t updated when the lowest-count list empties.',
        result: 'Eviction looks in an empty list and fails, or evicts from the wrong count.',
        wrong: ['Nothing: minFreq is optional.', 'Only gets are affected.', 'Counts reset.'],
      },
    ],
    transfer: [
      {
        problem: 'Items popular last month but never used now stay cached forever. Fix it.',
        answer: 'Age the counts: periodically halve every count (or decay counts over time).',
        wrong: [
          { text: 'Switch to FIFO.', why: 'Loses frequency entirely.' },
          { text: 'Double every count.', why: 'Changes nothing relatively.' },
          { text: 'Evict randomly.', why: 'Ignores popularity.' },
        ],
        explain: 'Decay lets old popularity fade, so recent frequency matters most.',
      },
    ],
  },
  'sparse-matrix': {
    family: 'grid',
    primitive: 'slots',
    parts: ['values of the non-zeros', 'their column indexes', 'row pointers (a running count)'],
    uses: ['Store which of 100,000 movies each of a million users rated (~50 each).', 'Multiply a huge, mostly-zero matrix by a vector.'],
    rivals: ['matrix', 'hash-map', 'adjacency-list'],
    breaks: [
      {
        violation: 'rowPtr is built without the final entry (only one per row).',
        result: 'The last row has no end marker, so its non-zeros can’t be found.',
        wrong: ['The first row breaks.', 'Nothing: the end is implied.', 'Values get shifted.'],
      },
    ],
    transfer: [
      {
        problem: 'Your algorithm reads COLUMNS, not rows, constantly.',
        answer: 'Use CSC (compressed sparse column): the same idea with rows and columns swapped.',
        wrong: [
          { text: 'Keep CSR and scan every row for the column.', why: 'O(non-zeros) per column.' },
          { text: 'Store the matrix densely.', why: 'Loses the memory savings.' },
          { text: 'Sort the values.', why: 'Values aren’t the issue.' },
        ],
        explain: 'Compress along the dimension you read most.',
      },
    ],
  },
  'mergeable-heaps': {
    family: 'pq',
    primitive: 'links',
    parts: ['a forest of heap-ordered trees', 'linking trees by one pointer', 'binomial: one tree per 1-bit'],
    uses: ['Merge the priority queues of two servers when one fails.', 'Many decrease-key operations (e.g. in Dijkstra) at O(1) amortized.'],
    rivals: ['binary-heap', 'd-ary-heap', 'priority-queue'],
    breaks: [
      {
        violation: 'When linking two trees, the LARGER root is kept on top.',
        result: 'Heap order breaks: the minimum is no longer at a root.',
        wrong: ['It still works.', 'Only merge gets slower.', 'Trees become unbalanced but valid.'],
      },
    ],
    transfer: [
      {
        problem: 'An algorithm lowers priorities (decrease-key) far more often than it removes the minimum.',
        answer: 'A Fibonacci or pairing heap: decrease-key cuts the node out and makes it a new root, O(1) amortized.',
        wrong: [
          { text: 'A sorted array.', why: 'O(n) per decrease-key.' },
          { text: 'A binary heap, always.', why: 'O(log n) per decrease-key.' },
          { text: 'A hash map.', why: 'No minimum.' },
        ],
        explain: 'Lazy structures postpone tidying until removeMin, so cheap operations stay cheap.',
      },
    ],
  },
  'persistent-structures': {
    family: 'versioning',
    primitive: 'links',
    parts: ['immutable nodes', 'path copying', 'one root per version'],
    uses: ['Unlimited undo/redo in an editor.', 'Let readers keep using a consistent snapshot while a writer makes updates.'],
    rivals: ['stack', 'rope'],
    breaks: [
      {
        violation: 'An update modifies a shared node in place instead of copying it.',
        result: 'Old versions silently change too: history and snapshots are corrupted.',
        wrong: ['Only the new version changes.', 'It just uses less memory, safely.', 'Nothing.'],
      },
    ],
    transfer: [
      {
        problem: 'Implement undo/redo for a document stored in a persistent tree.',
        answer: 'Keep a list of version roots and an index into it; undo/redo just moves the index.',
        wrong: [
          { text: 'Copy the whole tree on every edit.', why: 'O(n) per edit.' },
          { text: 'Store reverse operations and apply them.', why: 'Works, but more complex and slower to jump far back.' },
          { text: 'Keep only the latest root.', why: 'No history.' },
        ],
        explain: 'Every version is a complete, unchanging root. Switching version is just switching roots: O(1).',
      },
    ],
  },
};
