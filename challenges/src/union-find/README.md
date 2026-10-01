# Which devices are on the same network?

**The ticket.** A network monitor receives a stream of "device A is cabled to device B" events for a million devices, and is asked at any moment "can A reach B?" and "how many separate networks are there?". Re-running a graph search per question is far too slow. Use **union-find**.

**Build** `Networks` in `Networks.cs` (devices are numbered 0..n-1):

- `Networks(int n)`: everyone starts in their own group.
- `void Connect(int a, int b)`: merge their groups (attach the smaller group's root under the larger's).
- `bool CanReach(int a, int b)`: same root?
- `int GroupCount`, `int GroupSize(int a)`.
- `int Find(int a)`: the group's root; on the way, point every visited node straight at the root (path compression).

**Rules.** Both tricks (union by size + path compression) make each operation practically O(1). Use plain `int[]` arrays.

**Run:** `dotnet test --filter Lesson=union-find`
