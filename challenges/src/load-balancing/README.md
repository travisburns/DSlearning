# A load balancer core

**The ticket.** Our internal gateway spreads API calls over a pool of servers. It needs round robin for cheap calls, least-connections for the expensive ones, and health checks so dead servers stop getting traffic. Pools can be big (tens of thousands of worker processes), so picking a server must stay fast.

**Build** `LoadBalancer` in `LoadBalancer.cs`:

- `LoadBalancer(IReadOnlyList<string> servers, int failuresToMarkDown)`: all servers start up, with nothing in progress.
- `string? NextRoundRobin()`: take turns in list order, skipping servers that are down: with A, B, C you get A, B, C, A… If B is down: A, C, A, C… Null if every server is down.
- `string? Acquire()`: least connections: the up server with the fewest requests in progress (ties: earliest in the list). Counts one more in progress on it. Null if every server is down.
- `void Release(string server)`: that request finished.
- `int InProgress(string server)`.
- `void ReportHealth(string server, bool ok)`: a health check result. `failuresToMarkDown` failures in a row mark it down; one success marks it up again (and resets the count).
- `bool IsUp(string server)`.

**Hint.** Round robin is just an index that moves forward. For least connections, scanning every server on every request is too slow for big pools: keep the up servers in a `SortedSet<(int InProgress, int Index)>`, and remove and re-add a server's entry whenever its count or health changes.

**Run:** `dotnet test --filter Lesson=load-balancing`
