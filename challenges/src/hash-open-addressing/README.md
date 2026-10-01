# A fast integer set (open addressing)

**The ticket.** A game server tracks which player IDs are online, millions of checks per second. We want a set of ints stored in **one flat array** (cache-friendly), using linear probing.

**Build** `IntSet` in `IntSet.cs`:

- One `int[]` of slots plus a state per slot: empty, used, or deleted (a tombstone). Start with 16 slots.
- `bool Add(int x)` (false if already there), `bool Contains(int x)`, `bool Remove(int x)`, `int Count`.
- Home slot = `(x.GetHashCode() & 0x7FFFFFFF) % capacity`; if taken, try the next slot, wrapping around.
- Remove leaves a **tombstone**, not an empty slot, so later searches keep probing past it.
- Keep the table under 50% full (counting tombstones): when it isn't, rebuild at double size.

**Rules.** No `HashSet`, `Dictionary` or `List` inside.

**Run:** `dotnet test --filter Lesson=hash-open-addressing`
