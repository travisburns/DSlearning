import type { Card, Concept } from '../engine/types';
import { pick, randInt, shuffle } from '../engine/random';
import { explainGenerators, numberOptions, options } from './helpers';

// =====================================================================
// Tables, keys & SQL
// =====================================================================

const RM = 'relational-model';

const NAMES = ['Ann', 'Bob', 'Cy', 'Dee', 'Eve', 'Fay', 'Gus', 'Hal'];
const CITIES = ['Leeds', 'York', 'Hull'];

function people() {
  const ns = shuffle(NAMES).slice(0, randInt(5, 6));
  return ns.map((name, i) => ({ id: i + 1, name, age: randInt(18, 60), city: pick(CITIES) }));
}
const tableText = (rows: ReturnType<typeof people>) => rows.map((r) => `(${r.id}, ${r.name}, ${r.age}, ${r.city})`).join(', ');

const predictWhere = (): Card => {
  let rows: ReturnType<typeof people>;
  let x: number;
  let hit: ReturnType<typeof people>;
  do {
    rows = people();
    x = randInt(25, 45);
    hit = rows.filter((r) => r.age > x);
  } while (hit.length < 1 || hit.length === rows.length);
  const sorted = [...hit].sort((a, b) => a.age - b.age || a.name.localeCompare(b.name));
  const wrongAll = [...rows].sort((a, b) => a.age - b.age || a.name.localeCompare(b.name));
  return {
    concept: RM,
    type: 'predict',
    prompt: `Table people(id, name, age, city) holds: ${tableText(rows)}.\n\nSELECT name FROM people WHERE age > ${x} ORDER BY age;\n\nWhat comes back?`,
    body: {
      kind: 'choice',
      options: options({ text: sorted.map((r) => r.name).join(', '), why: `Only rows with age above ${x}, youngest first.` }, [
        { text: wrongAll.map((r) => r.name).join(', '), why: 'WHERE removes rows first.' },
        { text: [...sorted].reverse().map((r) => r.name).join(', '), why: 'ORDER BY sorts ascending unless you say DESC.' },
        { text: rows.filter((r) => r.age >= x && r.age <= x + 5).map((r) => r.name).join(', ') || '(no rows)', why: `The condition is simply age > ${x}.` },
      ]),
    },
    explain: `WHERE keeps ${hit.length} row${hit.length > 1 ? 's' : ''} (age > ${x}), ORDER BY sorts them by age, SELECT returns just the name column: ${sorted.map((r) => r.name).join(', ')}.`,
  };
};

const predictKey = (): Card => ({
  concept: RM,
  type: 'predict',
  prompt: 'orders(id, customer_id, total) has customer_id as a FOREIGN KEY to customers(id). Someone tries to insert an order with customer_id = 999, but there is no customer 999. What happens?',
  body: {
    kind: 'choice',
    options: shuffle([
      { text: 'The database rejects the insert: the order would point at a customer that doesn’t exist.', correct: true },
      { text: 'It is inserted and customer 999 is created automatically.', correct: false, why: 'Databases don’t invent rows; the constraint refuses the insert.' },
      { text: 'It is inserted with customer_id set to NULL.', correct: false, why: 'The value isn’t changed silently; the insert fails.' },
      { text: 'It is inserted; foreign keys are only documentation.', correct: false, why: 'A real foreign key constraint is enforced on every write.' },
    ]),
  },
  explain: 'Keys are rules the database enforces: a primary key is unique, and a foreign key must point at a row that exists. That stops orphaned, inconsistent data at the source.',
});

const orderClauses = (): Card => ({
  concept: RM,
  type: 'simulate',
  prompt: 'SELECT city, COUNT(*) FROM people WHERE age >= 18 GROUP BY city HAVING COUNT(*) > 1 ORDER BY city. In what order does the database logically process the clauses?',
  body: {
    kind: 'order',
    steps: ['FROM people: take the table.', 'WHERE age >= 18: drop rows that don’t match.', 'GROUP BY city: put the remaining rows into groups.', 'HAVING COUNT(*) > 1: drop groups that don’t match.', 'SELECT city, COUNT(*): compute the output columns.', 'ORDER BY city: sort the result.'],
  },
  explain: 'That’s why WHERE can’t use COUNT(*) (groups don’t exist yet) but HAVING can, and why ORDER BY can use names defined in SELECT.',
});

const countGroups = (): Card => {
  const rows = people();
  const c = pick(CITIES);
  return pick([
    {
      concept: RM,
      type: 'count' as const,
      prompt: `people holds: ${tableText(rows)}.\n\nSELECT city, COUNT(*) FROM people GROUP BY city;\n\nHow many rows does the result have?`,
      body: { kind: 'number' as const, answer: new Set(rows.map((r) => r.city)).size, unit: 'rows' },
      explain: `One row per distinct city: ${[...new Set(rows.map((r) => r.city))].join(', ')}.`,
    },
    {
      concept: RM,
      type: 'count' as const,
      prompt: `people holds: ${tableText(rows)}.\n\nSELECT COUNT(*) FROM people WHERE city = '${c}';\n\nWhat number comes back?`,
      body: { kind: 'number' as const, answer: rows.filter((r) => r.city === c).length, unit: '' },
      explain: `Count the rows whose city is ${c}: ${rows.filter((r) => r.city === c).map((r) => r.name).join(', ') || 'none'}.`,
    },
  ]);
};

const rmExplain = explainGenerators({
  concept: RM,
  truths: [
    'A relational database stores data in tables: rows (records) and columns (fields).',
    'A primary key uniquely identifies each row.',
    'A foreign key is a column that must match a primary key in another table.',
    'SQL describes WHAT result you want; the database decides HOW to get it.',
  ],
  myths: [
    { text: 'Rows in a table are stored and returned in insertion order.', why: 'Without ORDER BY, the order is not guaranteed.' },
    { text: 'WHERE can filter on COUNT(*).', why: 'Counts are per group; filter groups with HAVING.' },
    { text: 'You should copy a customer’s name into every order row.', why: 'Store it once and link by key, or copies drift out of sync.' },
  ],
  chains: [
    {
      prompt: 'Why link tables with keys instead of copying data?',
      steps: ['A customer’s details are stored in one row.', 'Each order stores only the customer’s id.', 'Changing the customer’s address updates one place.', 'Every order sees the new address through the key.'],
    },
  ],
  summary: {
    best: 'A relational database is a set of spreadsheets with strict rules: each row has a unique id, rows refer to each other by id, and you ask questions in SQL.',
    others: [
      { text: 'It’s where you store data.', why: 'Too vague.' },
      { text: 'It’s a big hash map.', why: 'Tables, keys and queries are much more than that.' },
      { text: 'SQL is a programming language for loops.', why: 'SQL says what you want, not how to loop.' },
    ],
  },
});

export const relationalModelConcept: Concept = {
  id: RM,
  kind: 'systems',
  title: 'Tables, Keys & SQL',
  tier: 12,
  prereqs: ['hash-map', 'static-array'],
  tagline: 'Rows, columns, and rules about how they link.',
  hook: {
    problem: 'An online shop keeps everything in one big spreadsheet: each order row repeats the customer’s name and address. A customer moves house, and half their orders still show the old address.',
    question: 'How should the data be organised?',
    options: [
      { text: 'One table of customers and one of orders; each order stores just the customer’s id.', good: true, feedback: 'Yes: separate tables linked by keys. Each fact lives in exactly one place.' },
      { text: 'Search and replace the old address.', feedback: 'It keeps happening, and you’ll miss some.' },
      { text: 'Add a column “current address”.', feedback: 'Now there are two addresses to keep in sync.' },
    ],
  },
  lens: {
    layout: 'Tables of rows and columns; a primary key per table; foreign keys linking rows across tables.',
    invariant: 'Every row has a unique primary key, and every foreign key points at a row that exists.',
    payoff: 'Each fact is stored once, and any question can be asked in SQL without writing loops.',
    price: 'Answers often need joins across tables, and a schema has to be designed (and changed) carefully.',
  },
  learn: {
    what: 'Most applications keep their data in a relational database (SQL Server, PostgreSQL, MySQL, SQLite). Data lives in tables: each row is one record, each column one field. Rows are identified by a primary key and linked to other tables with foreign keys. You ask questions in SQL and the database works out how to answer them.',
    how: [
      'Design tables so each fact is stored once: customers(id, name, …), orders(id, customer_id, total, …).',
      'A primary key (id) is unique per row; a foreign key (customer_id) must match a row in the other table.',
      'SELECT … FROM … WHERE … picks rows and columns; ORDER BY sorts them.',
      'GROUP BY puts rows into groups and COUNT/SUM/AVG summarise each group; HAVING filters the groups.',
    ],
  },
  extras: {
    family: 'data-model',
    primitive: 'abstract',
    parts: ['tables of rows and columns', 'primary keys', 'foreign keys between tables'],
    uses: ['Store customers and their orders so a change of address shows up everywhere.', 'Answer “how many orders did each city place last month?” without writing loops.'],
    breaks: [
      {
        violation: 'Orders copy the customer’s name and email instead of storing the customer id.',
        result: 'When a customer changes their email, old orders keep the old one: the data contradicts itself.',
        wrong: ['Every copy updates automatically.', 'Queries get faster with no downside.', 'The database rejects the change.'],
      },
    ],
    transfer: [
      {
        problem: 'A school needs students, courses, and which student takes which course (many students per course, many courses per student). How do you model it?',
        answer: 'Three tables: students, courses, and enrolments(student_id, course_id) linking them.',
        wrong: [
          { text: 'A “courses” column holding a comma-separated list in each student row.', why: 'Hard to query and can’t be checked with keys.' },
          { text: 'One table with a column per course.', why: 'Adding a course means changing the table.' },
          { text: 'Store students inside courses as text.', why: 'Duplicates every student.' },
        ],
        explain: 'Many-to-many relationships get their own table of key pairs.',
      },
    ],
  },
  generators: {
    predict: [predictWhere, predictKey],
    simulate: [orderClauses],
    count: [countGroups],
    explain: rmExplain,
  },
};

// =====================================================================
// Indexes
// =====================================================================

const IX = 'db-indexes';

const predictComposite = (): Card => {
  const q = pick([
    { q: "WHERE last_name = 'Smith' AND first_name = 'Ann'", ok: true, why: 'Uses both columns of the index, in order.' },
    { q: "WHERE last_name = 'Smith'", ok: true, why: 'Uses the first column of the index: all the Smiths are next to each other.' },
    { q: "WHERE first_name = 'Ann'", ok: false, why: 'The index is sorted by last name first, so the Anns are scattered through it.' },
  ]);
  return {
    concept: IX,
    type: 'predict',
    prompt: `A table has an index on (last_name, first_name). Can the database use that index to find rows for this query quickly?\n\nSELECT * FROM people ${q.q};`,
    body: {
      kind: 'choice',
      options: [
        { text: 'Yes', correct: q.ok, why: q.ok ? q.why : undefined },
        { text: 'No: it has to scan', correct: !q.ok, why: q.ok ? undefined : q.why },
      ],
    },
    explain: `${q.why} A composite index is like a phone book sorted by last name, then first name: great for “last name” or “last + first”, useless for “first name only”.`,
  };
};

const predictScan = (): Card => {
  const n = pick([1, 10, 50]);
  return {
    concept: IX,
    type: 'predict',
    prompt: `A users table has ${n} million rows and no index on email. A login runs SELECT * FROM users WHERE email = 'x@y.com'. What does the database have to do?`,
    body: {
      kind: 'choice',
      options: shuffle([
        { text: `Read every one of the ${n} million rows and check each email (a full table scan).`, correct: true },
        { text: 'Jump straight to the row, because emails are unique.', correct: false, why: 'Without an index it has no way to know where that email is.' },
        { text: 'Binary search the table.', correct: false, why: 'Rows aren’t stored sorted by email.' },
        { text: 'Return an error asking for an index.', correct: false, why: 'It works, just slowly.' },
      ]),
    },
    explain: 'CREATE INDEX ix_users_email ON users(email) builds a B+ tree sorted by email. The same query then reads about 3–4 pages instead of millions of rows.',
  };
};

const orderLookup = (): Card => ({
  concept: IX,
  type: 'simulate',
  prompt: 'SELECT * FROM users WHERE email = ? uses a B+ tree index on email. Put the steps in order.',
  body: {
    kind: 'order',
    steps: ['Read the index’s root page and pick the child whose key range contains the email.', 'Follow it down through the inner pages.', 'Reach the leaf page holding that email and its row id.', 'Use the row id to fetch the full row from the table.'],
  },
  explain: 'A few page reads down the tree, then one more to fetch the row. That’s why indexed lookups stay fast as tables grow.',
});

const countLevels = (): Card => {
  const fan = pick([100, 200, 500]);
  const n = pick([1e4, 1e6, 1e8]);
  let levels = 1;
  let cap = fan;
  while (cap < n) {
    cap *= fan;
    levels++;
  }
  return {
    concept: IX,
    type: 'count',
    prompt: `An index is a B+ tree where each page holds ${fan} keys. The table has ${n.toLocaleString()} rows. How many index pages must be read, from the root down to a leaf, to find one key?`,
    body: { kind: 'number', answer: levels, unit: 'pages' },
    explain: `Each level multiplies the reach by ${fan}: ${Array.from({ length: levels }, (_, i) => `${fan}^${i + 1} = ${(fan ** (i + 1)).toLocaleString()}`).join(', ')}. ${levels} levels cover ${n.toLocaleString()} rows. A full scan would read all of them.`,
  };
};

const ixExplain = explainGenerators({
  concept: IX,
  truths: [
    'An index is a separate sorted structure (usually a B+ tree) pointing at table rows.',
    'Without an index, finding rows by a column means scanning the whole table.',
    'Indexes make reads faster but every insert, update and delete must also update them.',
    'A composite index on (a, b) helps queries on a, or on a and b, but not on b alone.',
  ],
  myths: [
    { text: 'Indexing every column is always a good idea.', why: 'Each index slows writes and takes space.' },
    { text: 'An index changes the results of a query.', why: 'It only changes how fast the same results are found.' },
    { text: 'An index on (a, b) speeds up WHERE b = 5.', why: 'Rows are sorted by a first, so matching b values are scattered.' },
  ],
  chains: [
    {
      prompt: 'Why does an index make a lookup fast?',
      steps: ['The index keeps keys sorted in a B+ tree.', 'Each page holds hundreds of keys, so the tree is only a few levels deep.', 'A lookup reads one page per level.', 'So it touches a handful of pages instead of every row.'],
    },
  ],
  summary: {
    best: 'An index is like the index at the back of a book: instead of reading every page to find a word, you look it up and jump straight there.',
    others: [
      { text: 'An index makes the database faster.', why: 'Only for reads that use it, and writes get slower.' },
      { text: 'An index is a copy of the table.', why: 'It’s a sorted list of keys with pointers.' },
      { text: 'An index is the primary key.', why: 'Any column can be indexed.' },
    ],
  },
});

export const dbIndexesConcept: Concept = {
  id: IX,
  kind: 'systems',
  title: 'Database Indexes',
  tier: 12,
  prereqs: ['relational-model', 'b-plus-tree'],
  tagline: 'The index at the back of the book.',
  hook: {
    problem: 'Logging in takes 4 seconds: the users table has 20 million rows and the query looks them up by email.',
    question: 'What fixes it?',
    options: [
      { text: 'Add an index on email: a B+ tree that finds the row in a few page reads.', good: true, feedback: 'Yes. One CREATE INDEX turns a full scan into a few page reads.' },
      { text: 'Buy a faster disk.', feedback: 'Still reads 20 million rows.' },
      { text: 'Cache all users in memory.', feedback: 'Helps, but the real problem is scanning everything.' },
    ],
  },
  lens: {
    layout: 'A B+ tree per index, sorted by the indexed column(s), whose leaves point at table rows.',
    invariant: 'The index always holds exactly the table’s current values, in sorted order.',
    payoff: 'Lookups, range queries and sorting by the indexed columns read a few pages instead of the whole table.',
    price: 'Extra disk space, and every write must update every index on the table.',
  },
  learn: {
    what: 'An index is a separate structure the database keeps next to a table, usually a B+ tree sorted by one or more columns, whose leaves point at the rows. With an index on email, finding a user by email takes a few page reads instead of scanning every row. You saw the B+ tree itself in tier 5; this is where it earns its keep.',
    how: [
      'CREATE INDEX ix_users_email ON users(email) builds a B+ tree keyed by email.',
      'A query with WHERE email = … walks down the tree to the right leaf, then fetches the row.',
      'Range queries (WHERE created BETWEEN …) and ORDER BY on the indexed column read along the linked leaves.',
      'A composite index on (last_name, first_name) is sorted by last name, then first name, like a phone book.',
      'Every insert, update and delete must also update each index, so only index what queries actually need.',
    ],
  },
  extras: {
    family: 'db-index',
    primitive: 'links',
    parts: ['a B+ tree per index', 'sorted keys pointing at rows', 'index maintenance on every write'],
    uses: ['Make logging in by email fast on a table of 20 million users.', 'Show the 50 most recent orders without sorting the whole orders table.'],
    breaks: [
      {
        violation: 'A table that receives 50,000 inserts per second gets 12 indexes “just in case”.',
        result: 'Every insert must update 12 B+ trees, so writes slow to a crawl and the disk fills up.',
        wrong: ['Inserts get faster too.', 'Indexes are free to maintain.', 'The database ignores unused indexes on writes.'],
      },
    ],
    transfer: [
      {
        problem: 'A report runs WHERE status = ‘open’ ORDER BY created_at DESC LIMIT 20 every few seconds and is slow. Which index helps most?',
        answer: 'A composite index on (status, created_at): it finds the open rows already sorted by date.',
        wrong: [
          { text: 'An index on created_at only.', why: 'Has to skip past all the closed rows.' },
          { text: 'An index on (created_at, status).', why: 'Sorted by date first, so open rows aren’t together.' },
          { text: 'No index; add more RAM.', why: 'Still scans and sorts every time.' },
        ],
        explain: 'Equality column first, then the column you sort or range over: the matching rows sit together, in order.',
      },
    ],
  },
  generators: {
    predict: [predictScan, predictComposite],
    simulate: [orderLookup],
    count: [countLevels],
    explain: ixExplain,
  },
};

// =====================================================================
// Joins
// =====================================================================

const JN = 'query-joins';

function joinData() {
  const cust = shuffle(NAMES).slice(0, randInt(3, 4)).map((name, i) => ({ id: i + 1, name }));
  const orders = Array.from({ length: randInt(3, 6) }, (_, i) => ({ id: 100 + i, cid: randInt(1, cust.length + 1) }));
  return { cust, orders };
}

const predictJoin = (): Card => {
  const { cust, orders } = joinData();
  const inner = orders.filter((o) => cust.some((c) => c.id === o.cid)).length;
  const left = cust.reduce((s, c) => s + Math.max(1, orders.filter((o) => o.cid === c.id).length), 0);
  const kind = pick(['INNER', 'LEFT'] as const);
  const ans = kind === 'INNER' ? inner : left;
  return {
    concept: JN,
    type: 'predict',
    prompt: `customers: ${cust.map((c) => `(${c.id}, ${c.name})`).join(', ')}.\norders(id, customer_id): ${orders.map((o) => `(${o.id}, ${o.cid})`).join(', ')}.\n\nSELECT * FROM customers c ${kind} JOIN orders o ON o.customer_id = c.id;\n\nHow many rows come back?`,
    body: {
      kind: 'choice',
      options: numberOptions(ans, [
        { value: kind === 'INNER' ? left : inner, why: kind === 'INNER' ? 'That’s the LEFT JOIN count: INNER drops customers with no orders.' : 'That’s the INNER count: LEFT also keeps customers with no orders (one row each, with NULLs).' },
        { value: cust.length * orders.length, why: 'That’s every combination (a cross join), ignoring the ON condition.' },
        { value: orders.length, why: kind === 'INNER' ? 'Orders whose customer doesn’t exist find no match.' : 'Customers without orders still appear once each.' },
        { value: cust.length, why: 'Customers with several orders appear once per order.' },
      ], 'One row per matching (customer, order) pair, plus unmatched customers for LEFT JOIN.'),
    },
    explain: `INNER JOIN: one row per order whose customer exists = ${inner}. LEFT JOIN: every customer, once per order or once with NULLs if they have none = ${left}.`,
  };
};

const orderHashJoin = (): Card => ({
  concept: JN,
  type: 'simulate',
  prompt: 'The database joins a small customers table with a huge orders table using a HASH JOIN. Put the steps in order.',
  body: {
    kind: 'order',
    steps: ['Pick the smaller table (customers) as the build side.', 'Put every customer into a hash table keyed by id.', 'Read the orders table once, row by row.', 'For each order, look up its customer_id in the hash table.', 'Output a joined row for each match.'],
  },
  explain: 'Build once, probe once: O(n + m) instead of comparing every pair (n × m). It’s the Two Sum trick from the hash map lesson, applied to tables.',
});

const countJoinWork = (): Card => {
  const n = pick([1000, 5000, 10_000]);
  const m = pick([100_000, 1_000_000]);
  return pick([
    {
      concept: JN,
      type: 'count' as const,
      prompt: `A nested-loop join with no index compares every customer (${n.toLocaleString()}) with every order (${m.toLocaleString()}). How many comparisons is that?`,
      body: { kind: 'number' as const, answer: n * m, unit: 'comparisons' },
      explain: `${n.toLocaleString()} × ${m.toLocaleString()} = ${(n * m).toLocaleString()}. A hash join does about ${(n + m).toLocaleString()} steps instead.`,
    },
    {
      concept: JN,
      type: 'count' as const,
      prompt: `A hash join builds a hash table from ${n.toLocaleString()} customers, then probes it once per order (${m.toLocaleString()} orders). About how many steps (inserts + lookups)?`,
      body: { kind: 'number' as const, answer: n + m, unit: 'steps' },
      explain: `${n.toLocaleString()} inserts + ${m.toLocaleString()} lookups = ${(n + m).toLocaleString()}, versus ${(n * m).toLocaleString()} for a nested loop.`,
    },
  ]);
};

const jnExplain = explainGenerators({
  concept: JN,
  truths: [
    'A join combines rows from two tables where a condition matches, usually a foreign key.',
    'INNER JOIN keeps only rows with a match on both sides.',
    'LEFT JOIN keeps every row of the left table, filling NULLs where there’s no match.',
    'Databases pick a join algorithm: nested loop, hash join or merge join.',
  ],
  myths: [
    { text: 'A join always compares every row with every other row.', why: 'Hash and merge joins avoid that.' },
    { text: 'LEFT JOIN and INNER JOIN return the same rows when keys are correct.', why: 'LEFT also returns left rows that have no match at all.' },
    { text: 'Joins are slow, so you should copy data into one big table.', why: 'With indexes and hash joins they are fast, and copies drift out of sync.' },
  ],
  chains: [
    {
      prompt: 'Why is a hash join fast?',
      steps: ['The smaller table is loaded into a hash table keyed by the join column.', 'Each row of the bigger table needs one hash lookup.', 'A hash lookup is O(1) on average.', 'So the whole join is about n + m steps, not n × m.'],
    },
  ],
  summary: {
    best: 'A join lines up rows from two tables that belong together, like matching each order slip to the customer card with the same customer number.',
    others: [
      { text: 'A join merges two tables into one.', why: 'It matches rows; the tables stay as they are.' },
      { text: 'A join is a loop.', why: 'It can be, but often isn’t.' },
      { text: 'A join removes duplicates.', why: 'That’s DISTINCT.' },
    ],
  },
});

export const joinsConcept: Concept = {
  id: JN,
  kind: 'systems',
  title: 'Joins',
  tier: 12,
  prereqs: ['relational-model', 'hash-map', 'merge-sort'],
  tagline: 'Match rows that belong together.',
  hook: {
    problem: 'The orders report needs each order with its customer’s name. Orders only store customer_id.',
    question: 'How do you get both in one result?',
    options: [
      { text: 'JOIN orders to customers ON orders.customer_id = customers.id.', good: true, feedback: 'Yes: a join matches the rows; the database picks a fast way to do it.' },
      { text: 'Run one query per order to fetch its customer.', feedback: 'That’s the N+1 problem: 10,000 orders = 10,001 queries.' },
      { text: 'Copy the name into every order.', feedback: 'Then names go stale when customers change them.' },
    ],
  },
  lens: {
    layout: 'Two tables and a matching condition, executed as a nested loop, a hash join (hash table of one side) or a merge join (both sorted).',
    invariant: 'The result contains exactly the pairs of rows that satisfy the join condition (plus unmatched rows for outer joins).',
    payoff: 'Data stays stored once, yet queries can combine any tables in one round trip.',
    price: 'Naive joins are n × m; without indexes or memory for hashing, big joins get expensive.',
  },
  learn: {
    what: 'Because each fact is stored once, answering a question often means combining tables: orders with their customers, customers with their addresses. A join does that by matching rows whose keys are equal. Inside, the database chooses an algorithm, and the good ones use exactly the structures you’ve learned.',
    how: [
      'INNER JOIN: one output row for each pair of rows that match; unmatched rows disappear.',
      'LEFT JOIN: every row of the left table appears; where nothing matches, the right side is NULL.',
      'Nested loop: for each row on one side, look for matches on the other (fast only with an index).',
      'Hash join: build a hash table from the smaller table, then probe it with each row of the larger: about n + m steps.',
      'Merge join: if both sides are sorted by the key, walk them together like the merge in merge sort.',
    ],
  },
  extras: {
    family: 'db-join',
    primitive: 'both',
    parts: ['a join condition on keys', 'a hash table of the smaller table', 'probing with each row of the larger'],
    uses: ['Show each order with its customer’s name in one query.', 'List every customer, including those who have never ordered.'],
    breaks: [
      {
        violation: 'The ON condition is left out, so every customer is paired with every order.',
        result: 'A cross join: customers × orders rows, almost all of them nonsense.',
        wrong: ['The database guesses the right condition.', 'It returns zero rows.', 'It returns one row per order as usual.'],
      },
    ],
    transfer: [
      {
        problem: 'A page lists 50 blog posts and their authors. The code loads the posts, then runs a separate query for each author. Pages are slow. What’s the fix?',
        answer: 'Fetch posts and authors in one query with a JOIN (or one IN query for all author ids).',
        wrong: [
          { text: 'Cache each author query.', why: 'Still 51 round trips the first time.' },
          { text: 'Add an index on posts.title.', why: 'Not where the time goes.' },
          { text: 'Load authors one by one in parallel.', why: 'Still 50 extra queries.' },
        ],
        explain: 'This is the N+1 query problem. One join replaces N extra round trips.',
      },
    ],
  },
  generators: {
    predict: [predictJoin],
    simulate: [orderHashJoin],
    count: [countJoinWork],
    explain: jnExplain,
  },
};

// =====================================================================
// Transactions & ACID
// =====================================================================

const TX = 'transactions';

const predictCrash = (): Card => {
  const a = randInt(2, 9) * 100;
  const x = randInt(1, 9) * 10;
  return {
    concept: TX,
    type: 'predict',
    prompt: `Account A has ${a}, account B has 0. A transfer runs BEGIN; UPDATE A −${x}; UPDATE B +${x}; COMMIT; but the server crashes right after the first UPDATE. After restart, what are the balances?`,
    body: {
      kind: 'choice',
      options: options({ text: `A = ${a}, B = 0: the unfinished transaction is rolled back.`, why: 'Atomicity: all of it or none of it.' }, [
        { text: `A = ${a - x}, B = 0: the money is gone.`, why: 'That’s what happens WITHOUT a transaction.' },
        { text: `A = ${a - x}, B = ${x}: the database finishes the transfer.`, why: 'It never committed, so the database can’t assume you wanted it.' },
        { text: `A = ${a}, B = ${x}.`, why: 'Money can’t appear from nowhere.' },
      ]),
    },
    explain: 'A transaction is all-or-nothing. Until COMMIT, its changes can be undone; after a crash, unfinished transactions are rolled back.',
  };
};

const predictAcid = (): Card => {
  const items = [
    { k: 'Atomicity', d: 'Either every change in the transaction happens, or none does.' },
    { k: 'Consistency', d: 'A transaction moves the database from one valid state to another; rules like keys and checks always hold.' },
    { k: 'Isolation', d: 'Transactions running at the same time don’t see each other’s half-finished work.' },
    { k: 'Durability', d: 'Once COMMIT returns, the change survives a crash or power cut.' },
  ];
  const it = pick(items);
  return {
    concept: TX,
    type: 'predict',
    prompt: `Which ACID property is this?\n\n“${it.d}”`,
    body: { kind: 'choice', options: items.map((x) => ({ text: x.k, correct: x.k === it.k, why: x.k === it.k ? undefined : x.d })) },
    explain: `${it.k}: ${it.d}`,
  };
};

const orderTx = (): Card => ({
  concept: TX,
  type: 'simulate',
  prompt: 'Checkout must take payment, reduce stock and create the order together. Put the steps in order.',
  body: {
    kind: 'order',
    steps: ['BEGIN TRANSACTION', 'UPDATE stock: reduce the item count (fail if it would go below 0)', 'INSERT the order row', 'INSERT the payment row', 'COMMIT (or ROLLBACK if any step failed)'],
  },
  explain: 'Everything between BEGIN and COMMIT is one unit: if stock runs out halfway, ROLLBACK undoes the order and the payment too.',
});

const countRollback = (): Card => {
  const start = randInt(5, 20) * 10;
  const ops = Array.from({ length: 4 }, () => randInt(1, 9) * 5);
  const committedUpTo = randInt(1, 3);
  const after = start - ops.slice(0, committedUpTo).reduce((s, x) => s + x, 0);
  return {
    concept: TX,
    type: 'count',
    prompt: `balance = ${start}. Each line is its own transaction: ${ops.map((o, i) => `withdraw ${o}${i < committedUpTo ? ' (committed)' : i === committedUpTo ? ' (crash before commit)' : ' (never started)'}`).join('; ')}. What is the balance after the database restarts?`,
    body: { kind: 'number', answer: after, unit: '' },
    explain: `Only committed transactions survive: ${start} − ${ops.slice(0, committedUpTo).join(' − ')} = ${after}. The one interrupted before COMMIT is rolled back.`,
  };
};

const txExplain = explainGenerators({
  concept: TX,
  truths: [
    'A transaction groups several changes so they succeed or fail together.',
    'ROLLBACK undoes every change made since BEGIN.',
    'After COMMIT returns, the changes are durable, even if the power fails.',
    'Concurrent transactions are isolated from each other’s unfinished changes.',
  ],
  myths: [
    { text: 'Each UPDATE is saved permanently the moment it runs, even inside a transaction.', why: 'Nothing is final until COMMIT.' },
    { text: 'Transactions are only needed for money.', why: 'Any multi-step change that must stay consistent needs one.' },
    { text: 'A crash during a transaction leaves half of it applied.', why: 'Recovery rolls back unfinished transactions.' },
  ],
  chains: [
    {
      prompt: 'Why does a transfer need a transaction?',
      steps: ['A transfer is two writes: subtract from one account, add to another.', 'A crash can happen between them.', 'Without a transaction, money would vanish.', 'With one, the first write is undone unless both commit.'],
    },
  ],
  summary: {
    best: 'A transaction is a promise of “all or nothing”: either every step of the job happens, or it’s as if none of it ever did.',
    others: [
      { text: 'A transaction is a payment.', why: 'Only in everyday language.' },
      { text: 'A transaction is a query.', why: 'It groups many statements.' },
      { text: 'A transaction makes things faster.', why: 'It makes them safe.' },
    ],
  },
});

export const transactionsConcept: Concept = {
  id: TX,
  kind: 'systems',
  title: 'Transactions & ACID',
  tier: 12,
  prereqs: ['relational-model', 'locks'],
  tagline: 'All of it, or none of it.',
  hook: {
    problem: 'A bank transfer subtracts £100 from Alice, then the server crashes before adding it to Bob. £100 has vanished.',
    question: 'What guarantee is missing?',
    options: [
      { text: 'Both updates must happen together or not at all: wrap them in a transaction.', good: true, feedback: 'Yes: atomicity. On a crash, the half-done transfer is undone.' },
      { text: 'Do the addition first.', feedback: 'Then a crash creates £100 from nothing.' },
      { text: 'Retry the transfer after a crash.', feedback: 'You don’t know whether the first half happened.' },
    ],
  },
  lens: {
    layout: 'BEGIN … COMMIT/ROLLBACK around a group of statements, backed by a log and locks or versions.',
    invariant: 'ACID: atomic (all or nothing), consistent (rules hold), isolated (no half-finished views), durable (committed means saved).',
    payoff: 'Multi-step changes stay correct through crashes and concurrent users.',
    price: 'Logging, locking and waiting cost throughput; long transactions block others.',
  },
  learn: {
    what: 'Real operations are several writes that must stay together: move money, place an order and reduce stock, create a user and their settings. A transaction groups them so the database guarantees all of them happen, or none of them do, even if the server crashes halfway or other users are writing at the same time.',
    how: [
      'BEGIN starts a transaction; the following statements belong to it.',
      'COMMIT makes all its changes permanent and visible at once.',
      'ROLLBACK (or a crash before COMMIT) undoes all of them.',
      'ACID: Atomicity, Consistency (constraints always hold), Isolation (others don’t see half-done work), Durability (committed changes survive crashes).',
      'In C#: using var tx = connection.BeginTransaction(); … tx.Commit();',
    ],
  },
  extras: {
    family: 'transaction',
    primitive: 'abstract',
    parts: ['BEGIN, COMMIT and ROLLBACK', 'all-or-nothing changes', 'isolation from other users'],
    uses: ['Move money between two accounts so a crash can never lose or create money.', 'Place an order, reduce stock and record payment as one unit.'],
    rivals: ['write-ahead-log', 'isolation-mvcc'],
    breaks: [
      {
        violation: 'Checkout reduces stock and inserts the order as two separate auto-committed statements, and the second fails.',
        result: 'Stock goes down for an order that doesn’t exist: the data no longer adds up.',
        wrong: ['The database links them automatically.', 'Stock is restored when the next order arrives.', 'Nothing happens until both succeed.'],
      },
    ],
    transfer: [
      {
        problem: 'Signing up must create a user row and a default settings row. Sometimes users end up with no settings. Why, and what fixes it?',
        answer: 'The two inserts aren’t atomic: wrap them in one transaction so both happen or neither does.',
        wrong: [
          { text: 'Create the settings later, on first login.', why: 'Moves the problem; doesn’t make it atomic.' },
          { text: 'Insert settings first.', why: 'Then you can get settings with no user.' },
          { text: 'Add a retry loop.', why: 'Can’t tell what already happened.' },
        ],
        explain: 'Any group of writes that must stay consistent belongs in one transaction.',
      },
    ],
  },
  generators: {
    predict: [predictCrash, predictAcid],
    simulate: [orderTx],
    count: [countRollback],
    explain: txExplain,
  },
};

// =====================================================================
// Write-ahead log & recovery
// =====================================================================

const WL = 'write-ahead-log';

function logRun() {
  const txs = ['T1', 'T2', 'T3'].slice(0, randInt(2, 3));
  const committed = new Set(txs.filter(() => Math.random() < 0.6));
  if (committed.size === 0) committed.add(txs[0]);
  if (committed.size === txs.length && txs.length > 1) committed.delete(txs[txs.length - 1]);
  const lines: { tx: string; text: string; val?: number }[] = [];
  let x = randInt(1, 9) * 10;
  const start = x;
  for (const t of txs) {
    const v = randInt(1, 9) * 10;
    lines.push({ tx: t, text: `${t}: set x = ${v}`, val: v });
    if (committed.has(t)) lines.push({ tx: t, text: `${t}: COMMIT` });
  }
  for (const l of lines) if (l.val !== undefined && committed.has(l.tx)) x = l.val;
  return { lines, committed, start, final: x };
}

const predictRedo = (): Card => ({
  concept: WL,
  type: 'predict',
  prompt: 'A transaction’s COMMIT record has been flushed to the log on disk, but its changed data pages were still only in memory when the power failed. After restart, is the change there?',
  body: {
    kind: 'choice',
    options: shuffle([
      { text: 'Yes: recovery replays (redoes) the committed changes from the log.', correct: true },
      { text: 'No: the data pages were never written, so it’s lost.', correct: false, why: 'The log has everything needed to redo it; that’s its whole purpose.' },
      { text: 'Only if the user retries.', correct: false, why: 'Durability means the database promised it was saved.' },
      { text: 'The database can’t tell, so it asks an admin.', correct: false, why: 'The log says exactly what was committed.' },
    ]),
  },
  explain: 'Write-ahead logging: write the change to the log and flush it BEFORE saying “committed”. Data pages can be written lazily later, because the log can always rebuild them.',
});

const orderWal = (): Card => ({
  concept: WL,
  type: 'simulate',
  prompt: 'With write-ahead logging, put the steps of committing a change in order.',
  body: {
    kind: 'order',
    steps: ['Append the change to the log in memory.', 'Append a COMMIT record.', 'Flush the log to disk (fsync).', 'Tell the client “committed”.', 'Later, write the changed data pages to disk in the background.'],
  },
  explain: 'Only one sequential write (the log flush) is needed before replying. Random writes to data pages happen later, in bulk. That’s both safe and fast.',
});

const countRecover = (): Card => {
  const r = logRun();
  return {
    concept: WL,
    type: 'count',
    prompt: `x was ${r.start} when the log starts. The log on disk reads: ${r.lines.map((l) => l.text).join(' | ')}. Then the server crashed. After recovery (redo committed transactions in order, ignore the rest), what is x?`,
    body: { kind: 'number', answer: r.final, unit: '' },
    explain: `Only ${[...r.committed].join(', ')} reached COMMIT, so only their writes are replayed, in log order. x = ${r.final}.`,
  };
};

const wlExplain = explainGenerators({
  concept: WL,
  truths: [
    'Every change is written to an append-only log before it changes the data files.',
    'A transaction counts as committed once its COMMIT record is flushed to disk.',
    'After a crash, recovery replays committed changes from the log and discards unfinished ones.',
    'Appending to a log is a fast sequential write, unlike updating pages all over the disk.',
  ],
  myths: [
    { text: 'Data pages must be written to disk before COMMIT returns.', why: 'Only the log must be flushed; pages can follow later.' },
    { text: 'The log is just for debugging.', why: 'It is the source of truth for crash recovery.' },
    { text: 'Recovery replays every transaction in the log.', why: 'Only the committed ones.' },
  ],
  chains: [
    {
      prompt: 'Why is it safe to reply “committed” before the data pages are written?',
      steps: ['The change and its COMMIT record are flushed to the log first.', 'If the machine crashes, the log is still on disk.', 'Recovery reads the log and re-applies committed changes.', 'So the data pages end up correct either way.'],
    },
  ],
  summary: {
    best: 'A write-ahead log is like writing every change in a notebook before doing it: if you get interrupted, the notebook tells you exactly what to redo.',
    others: [
      { text: 'It’s a log file of errors.', why: 'It’s a log of data changes.' },
      { text: 'It’s a backup.', why: 'It’s for crash recovery, written continuously.' },
      { text: 'It makes writes slower.', why: 'It usually makes them faster.' },
    ],
  },
});

export const writeAheadLogConcept: Concept = {
  id: WL,
  kind: 'systems',
  title: 'Write-Ahead Log & Recovery',
  tier: 12,
  prereqs: ['transactions'],
  tagline: 'Write it in the notebook first.',
  hook: {
    problem: 'The database promised “committed”, then the power failed before the data file was updated. The customer’s order is gone.',
    question: 'How can “committed” really mean safe, without slow random disk writes on every commit?',
    options: [
      { text: 'Append every change to a log and flush the log before replying; replay it after a crash.', good: true, feedback: 'Yes: write-ahead logging. One fast sequential write makes the commit durable.' },
      { text: 'Write every data page to disk before replying.', feedback: 'Safe, but many slow random writes per commit.' },
      { text: 'Keep everything in memory and hope.', feedback: 'That’s exactly what failed.' },
    ],
  },
  lens: {
    layout: 'An append-only log file of change records (with COMMIT markers), plus data pages written lazily, plus periodic checkpoints.',
    invariant: 'A change is in the flushed log before it is reported committed, and before its data page reaches disk.',
    payoff: 'Durable commits with one sequential write each, and exact recovery after any crash.',
    price: 'Every change is written twice (log and data), and the log must be trimmed with checkpoints.',
  },
  learn: {
    what: 'Durability is the D in ACID: once COMMIT returns, the change must survive a crash. Writing every changed page to disk immediately would be slow. Instead, databases append each change to a log, flush the log, then reply. If the machine crashes, the log is read back and committed changes are replayed. Git, file systems and message queues use the same trick.',
    how: [
      'For each change, append a record (“T7: set x = 5”) to the log.',
      'On COMMIT, append a commit record and flush the log to disk (fsync). Now it’s durable.',
      'Update the real data pages in memory, and write them to disk later in the background.',
      'After a crash: read the log, redo every committed transaction, discard the uncommitted ones.',
      'Checkpoints periodically write all pages so old log records can be deleted.',
    ],
  },
  extras: {
    family: 'durability',
    primitive: 'slots',
    parts: ['an append-only log', 'COMMIT records flushed to disk', 'replay on recovery'],
    uses: ['Make a key-value store survive power cuts without losing committed writes.', 'Rebuild a database to its exact state after the server crashes.'],
    rivals: ['transactions'],
    breaks: [
      {
        violation: 'The database replies “committed” before flushing the log, to be faster.',
        result: 'A crash in that window loses transactions the client was told were saved: durability is broken.',
        wrong: ['Nothing changes, the log is still written eventually.', 'Recovery still finds them.', 'Only uncommitted data is affected.'],
      },
    ],
    transfer: [
      {
        problem: 'A chat app must never lose a message once the sender sees a tick, even if the server restarts. How?',
        answer: 'Append each message to a log on disk and flush it before showing the tick; rebuild state from the log on restart.',
        wrong: [
          { text: 'Keep messages in a list in memory.', why: 'Lost on restart.' },
          { text: 'Save the whole chat history file after every message.', why: 'Very slow, and a crash mid-save can corrupt it.' },
          { text: 'Show the tick, then save in the background.', why: 'Messages can be lost after the tick.' },
        ],
        explain: 'That’s write-ahead logging applied to messages: append, flush, then acknowledge.',
      },
    ],
  },
  generators: {
    predict: [predictRedo],
    simulate: [orderWal],
    count: [countRecover],
    explain: wlExplain,
  },
};

// =====================================================================
// Isolation & MVCC
// =====================================================================

const MV = 'isolation-mvcc';

const predictSnapshot = (): Card => {
  const [a, b] = [randInt(1, 9) * 10, randInt(10, 19) * 10];
  return {
    concept: MV,
    type: 'predict',
    prompt: `Snapshot isolation. Transaction T1 starts and reads price = ${a}. Then T2 changes price to ${b} and commits. T1 (still open) reads price again. What does it see?`,
    body: {
      kind: 'choice',
      options: options({ text: `${a}: T1 keeps seeing the database as it was when it started.`, why: 'Each transaction reads from its own snapshot.' }, [
        { text: `${b}: the latest committed value.`, why: 'That’s READ COMMITTED behaviour, not snapshot isolation.' },
        { text: 'It waits until T2’s change is undone.', why: 'MVCC readers never wait for writers.' },
        { text: 'An error: the row changed.', why: 'Reads never fail under MVCC; only conflicting writes can.' },
      ]),
    },
    explain: `MVCC keeps both versions: ${a} (for snapshots that started earlier) and ${b} (for later ones). T1 consistently sees ${a} until it ends.`,
  };
};

const predictAnomaly = (): Card => {
  const all = [
    { k: 'Dirty read', d: 'T1 reads a value that T2 has written but not committed, and T2 then rolls back.' },
    { k: 'Non-repeatable read', d: 'T1 reads a row twice and gets different values, because T2 committed a change in between.' },
    { k: 'Lost update', d: 'T1 and T2 both read a counter, both add 1 and both write back: one increment disappears.' },
    { k: 'Phantom read', d: 'T1 counts rows matching a condition twice and gets different counts, because T2 inserted a matching row.' },
  ];
  const it = pick(all);
  return {
    concept: MV,
    type: 'simulate',
    prompt: `Which concurrency anomaly is this?\n\n“${it.d}”`,
    body: { kind: 'choice', options: all.map((x) => ({ text: x.k, correct: x.k === it.k, why: x.k === it.k ? undefined : x.d })) },
    explain: `${it.k}. Stronger isolation levels (READ COMMITTED → REPEATABLE READ → SNAPSHOT → SERIALIZABLE) rule out more of these, at more cost.`,
  };
};

const countVisible = (): Card => {
  const versions = [
    { v: randInt(1, 9) * 10, ts: 5 },
    { v: randInt(10, 19) * 10, ts: 12 },
    { v: randInt(20, 29) * 10, ts: 20 },
  ];
  const snap = pick([7, 15, 25]);
  const seen = [...versions].reverse().find((x) => x.ts <= snap)!;
  return {
    concept: MV,
    type: 'count',
    prompt: `MVCC keeps these committed versions of a row: ${versions.map((x) => `value ${x.v} committed at time ${x.ts}`).join(', ')}. A transaction whose snapshot was taken at time ${snap} reads the row. What value does it see?`,
    body: { kind: 'number', answer: seen.v, unit: '' },
    explain: `It sees the newest version committed at or before its snapshot (time ${snap}): the one from time ${seen.ts}, value ${seen.v}.`,
  };
};

const mvExplain = explainGenerators({
  concept: MV,
  truths: [
    'Isolation decides how much concurrent transactions can see of each other’s changes.',
    'MVCC keeps several versions of each row instead of overwriting it.',
    'Each transaction reads the versions that were committed when its snapshot was taken.',
    'With MVCC, readers don’t block writers and writers don’t block readers.',
  ],
  myths: [
    { text: 'MVCC means two transactions can both overwrite the same row without any conflict.', why: 'Conflicting writes are still detected; one must wait or abort.' },
    { text: 'Old row versions are kept forever.', why: 'Garbage collection (VACUUM) removes versions no snapshot can see.' },
    { text: 'The strictest isolation level is free.', why: 'Stronger isolation means more waiting or more aborted transactions.' },
  ],
  chains: [
    {
      prompt: 'Why don’t readers wait for writers under MVCC?',
      steps: ['A writer creates a new version instead of changing the row in place.', 'The old version stays available.', 'A reader picks the version that matches its snapshot.', 'So the reader never has to wait for the writer to finish.'],
    },
  ],
  summary: {
    best: 'MVCC is like everyone reading their own photocopy of the database from the moment they started, while writers quietly make new copies.',
    others: [
      { text: 'It’s a kind of lock.', why: 'Its point is avoiding most locks.' },
      { text: 'It keeps backups.', why: 'Versions are for concurrent readers, not backups.' },
      { text: 'It makes transactions run one at a time.', why: 'It lets them run at the same time safely.' },
    ],
  },
});

export const isolationMvccConcept: Concept = {
  id: MV,
  kind: 'systems',
  title: 'Isolation & MVCC',
  tier: 12,
  prereqs: ['transactions', 'persistent-structures'],
  tagline: 'Everyone reads their own snapshot.',
  hook: {
    problem: 'A long report reads every account to total the bank’s money. Meanwhile transfers keep running, so the report counts some money twice and misses some: the total is wrong.',
    question: 'How can the report see a consistent picture without stopping all transfers?',
    options: [
      { text: 'Keep old versions of rows, and let the report read everything as of the moment it started.', good: true, feedback: 'Yes: multi-version concurrency control (MVCC). A consistent snapshot, and nobody waits.' },
      { text: 'Lock the whole database while the report runs.', feedback: 'Correct, but every transfer stops for minutes.' },
      { text: 'Run the report twice and average.', feedback: 'Both runs can be wrong.' },
    ],
  },
  lens: {
    layout: 'Several versions per row, each tagged with the transaction that wrote it; each transaction holds a snapshot timestamp.',
    invariant: 'A transaction only sees versions committed before its snapshot, and its own writes.',
    payoff: 'Consistent reads without blocking writers, and writers that don’t block readers.',
    price: 'Old versions take space and must be cleaned up; write conflicts still abort or wait.',
  },
  learn: {
    what: 'When many transactions run at once, the I in ACID decides what each one can see of the others. Locking everything is correct but slow. Most databases (PostgreSQL, SQL Server with snapshot isolation, Oracle) instead keep several versions of each row (multi-version concurrency control, MVCC), the same idea as the persistent structures you learned. Each transaction reads from a snapshot.',
    how: [
      'An UPDATE writes a new version of the row, tagged with its transaction; the old version stays.',
      'A transaction gets a snapshot when it starts (or per statement, depending on the isolation level).',
      'Reads return the newest version committed before that snapshot: a consistent picture of the past.',
      'If two transactions write the same row, the second to commit must wait or abort (first committer wins).',
      'Old versions nobody can see any more are removed by garbage collection (VACUUM).',
    ],
  },
  extras: {
    family: 'isolation',
    primitive: 'links',
    parts: ['multiple versions per row', 'snapshot timestamps', 'write-conflict detection'],
    uses: ['Run a long financial report that sees a consistent total while transfers keep running.', 'Let thousands of users read product pages while prices are being updated.'],
    rivals: ['transactions'],
    breaks: [
      {
        violation: 'Two transactions update the same row from the same snapshot, and both are allowed to commit.',
        result: 'One update silently overwrites the other: a lost update.',
        wrong: ['Both changes are merged automatically.', 'The newer snapshot wins and nothing is lost.', 'Readers see both values.'],
      },
    ],
    transfer: [
      {
        problem: 'A backup must copy a live database consistently while users keep writing. How do databases do it?',
        answer: 'Start a snapshot transaction and copy everything as of that snapshot; writers carry on making new versions.',
        wrong: [
          { text: 'Lock all tables during the backup.', why: 'Users can’t write for the whole backup.' },
          { text: 'Copy the files while they’re changing.', why: 'The copy can be inconsistent.' },
          { text: 'Back up each table at a different time.', why: 'Tables won’t match each other.' },
        ],
        explain: 'A snapshot gives a consistent view at one moment without stopping anyone.',
      },
    ],
  },
  generators: {
    predict: [predictSnapshot],
    simulate: [predictAnomaly],
    count: [countVisible],
    explain: mvExplain,
  },
};

export const DB_CONCEPTS: Concept[] = [relationalModelConcept, dbIndexesConcept, joinsConcept, transactionsConcept, writeAheadLogConcept, isolationMvccConcept];
