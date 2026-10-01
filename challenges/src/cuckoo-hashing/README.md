# Guaranteed-fast lookups (cuckoo hashing)

**The ticket.** A packet filter checks every incoming IP against a blocklist. Average O(1) isn't enough: a lookup must NEVER take more than two probes, even in the worst case. Build a **cuckoo hash set**.

**Build** `CuckooSet` in `CuckooSet.cs`:

- Two tables of the same size (start at 16) and two **different** hash functions h1 and h2 (e.g. mix the bits of x in two different ways, then `% tableSize`). Each value lives in `t1[h1(x)]` **or** `t2[h2(x)]`, never anywhere else.
- `bool Contains(int x)`: check exactly those two slots.
- `bool Add(int x)`: if the slot in t1 is free, take it. Otherwise kick out the occupant and move it to its slot in the other table, which may kick out another… If this goes on too long (say 32 kicks), grow both tables and re-insert everything.
- `bool Remove(int x)`, `int Count`.

**Rules.** No `HashSet`/`Dictionary`. Contains looks at two slots, full stop.

**Run:** `dotnet test --filter Lesson=cuckoo-hashing`
