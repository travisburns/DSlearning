# "Is this username taken?" without a database hit

**The ticket.** The sign-up form checks usernames as you type. Most names people try are free, yet each check costs a database query. Put a **Bloom filter** in front: if it says "definitely not taken", skip the database; if it says "maybe", ask the database.

**Build** `BloomFilter` in `BloomFilter.cs`:

- `BloomFilter(int expectedItems, double falsePositiveRate)`: choose the bit count m = ⌈−n·ln(p) / (ln 2)²⌉ and the hash count k = round(m/n · ln 2) (at least 1). Store bits in a `ulong[]`.
- `void Add(string s)` and `bool MightContain(string s)`.
- `int BitCount` (m), `int HashCount` (k).
- For k hash functions, compute two hashes h1, h2 of the string (e.g. two different FNV/xorshift variants) and use `h1 + i·h2` for i = 0..k−1 ("double hashing").

**Rules.** Never a false negative. With 100,000 names at 1%, the measured false-positive rate must stay under 2%.

**Run:** `dotnet test --filter Lesson=bloom-filter`
