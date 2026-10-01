# Unique visitors counter

**The ticket.** Analytics shows "unique visitors today" per page for thousands of pages. Storing every visitor ID per page is gigabytes. **HyperLogLog** estimates the number of distinct items within a couple of percent using a few kilobytes.

**Build** `HyperLogLog` in `HyperLogLog.cs`:

- `HyperLogLog(int precision = 12)`: m = 2^precision registers (bytes).
- `void Add(string item)`: hash to 64 bits (use a good mixer, e.g. FNV-1a 64 then a splitmix64 finish). The first `precision` bits pick a register; in the remaining bits, find the position of the first 1 (leading zeros + 1). Keep the maximum per register.
- `long Count()`: E = α·m² / Σ 2^(−register), with α = 0.7213 / (1 + 1.079/m). If E ≤ 2.5·m and some registers are 0, use linear counting instead: m · ln(m / zeroRegisters).
- `void Merge(HyperLogLog other)`: register-wise max (counts the union).

**Rules.** Memory is just the registers. Within 5% for 1,000 and 200,000 distinct visitors; repeats don't change the count.

**Run:** `dotnet test --filter Lesson=hyperloglog`
