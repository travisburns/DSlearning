# Count islands on a map, find what's reachable

**The ticket.** Two features for a mapping tool.

1. A satellite image is a grid of `#` (land) and `.` (water). Count the separate islands (land squares touching up/down/left/right belong together) and the size of the biggest.
2. A wiki: given links between pages, list every page reachable from a start page.

**Build** in `Explore.cs`:

- `(int Count, int Largest) Islands(string[] map)`.
- `HashSet<string> Reachable(Dictionary<string, List<string>> links, string start)`.

**Hint.** Depth-first search: go as far as possible, back up at dead ends, and mark everything you visit. For the map, each unvisited land square you find starts a new island: flood it.

**Rules.** Use an **explicit `Stack<T>`**, not recursion: a 1000 × 1000 all-land map is one island a million squares deep, which overflows the call stack.

**Run:** `dotnet test --filter Lesson=dfs`
