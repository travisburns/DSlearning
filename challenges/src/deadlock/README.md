# Bank transfers that never deadlock

**The ticket.** Transfers lock both accounts so money can't be lost. Under load the service occasionally freezes forever: transfer A→B and B→A ran at the same time, each holding one account and waiting for the other.

**Build** in `Bank.cs`:

- `Bank(int accounts, long startingBalance)`, `long Balance(int id)`, `long Total()`.
- `bool Transfer(int from, int to, long amount)`: lock **both** accounts (one lock object per account) and move the money; return false (moving nothing) if `from` doesn't have enough or `from == to`. To stay deadlock-free, always lock the **lower account id first**.
- `static List<string>? FindDeadlock(Dictionary<string, string> waitsFor)`: given "thread X is waiting for a lock held by thread Y", return the threads in a waiting cycle (start anywhere in the cycle, in arrow order), or null if there's none.

**Rules.** Many threads transfer between random accounts at once; the test fails if it hangs or if money appears or disappears.

**Run:** `dotnet test --filter Lesson=deadlock`
