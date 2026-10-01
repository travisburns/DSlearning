# Delivery cost between depots

**The ticket.** A courier network has depots and two-way roads with costs. Quote the cheapest delivery cost from the main depot to every other depot, and the route for a given delivery.

**Build** in `Courier.cs` (depots are 0..n-1; roads are `(A, B, Cost)` with Cost ≥ 0):

- `long[] Cheapest(int n, List<(int A, int B, int Cost)> roads, int from)`: cost to reach each depot, or -1 if unreachable.
- `List<int>? Route(int n, List<(int A, int B, int Cost)> roads, int from, int to)`: depots along a cheapest route, from → to, or null.

**Hint.** Dijkstra: always finalise the unfinished depot with the smallest known cost next. Use `PriorityQueue<int, long>`; it's fine to enqueue a depot again when you find a cheaper cost and skip stale entries when you dequeue them.

**Rules.** O((V + E) log V). 100,000 depots and 300,000 roads must be fast.

**Run:** `dotnet test --filter Lesson=dijkstra`
