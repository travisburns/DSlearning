# Which maintenance windows clash?

**The ticket.** Ops has a year of scheduled maintenance windows across all systems. When someone plans a deploy, show every window that overlaps it. Checking every window per request is too slow once there are hundreds of thousands.

**Build** `WindowIndex` in `WindowIndex.cs` (windows are `[Start, End]`, inclusive; they never change after building):

- `WindowIndex(List<(int Start, int End, string Name)> windows)`: sort by start and build a balanced tree over the sorted list in which every node also stores the **largest End** in its subtree.
- `List<string> Overlapping(int from, int to)`: names of windows with `Start <= to && End >= from`, ordered by start (ties: by name).
- While searching, skip a whole subtree when its largest End is before `from`, and don't go right of any window starting after `to`.

**Rules.** O(log n + matches) per query.

**Run:** `dotnet test --filter Lesson=interval-tree`
