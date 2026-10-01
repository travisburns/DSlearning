# Fewest steps: warehouse robot

**The ticket.** A warehouse robot moves on a grid one square at a time (up, down, left, right). Find the fewest moves from its dock to a shelf, avoiding racks. Also used: "degrees of separation" between two users.

**Build** in `Pathing.cs`:

- `int MinMoves(string[] grid)`: `S` = start, `E` = end, `#` = rack, `.` = floor. Return the fewest moves, or -1 if unreachable.
- `List<string>? Chain(Dictionary<string, List<string>> friends, string from, string to)`: the shortest chain of people from → … → to (inclusive), or null. When several shortest chains exist, prefer exploring friends in list order.

**Hint.** Breadth-first search with a `Queue<T>`: everything 1 step away, then 2 steps, … The first time you reach the target is the shortest. Mark squares/people as seen when you **enqueue** them.

**Rules.** O(cells) / O(people + friendships). A 1000 × 1000 warehouse must be fast.

**Run:** `dotnet test --filter Lesson=bfs`
