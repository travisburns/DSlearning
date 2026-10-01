# Build-system task runner

**The ticket.** Our build tool runs tasks like `compile`, `test` and `package`, each depending on others. Work out an order that runs every task after everything it depends on, and fail loudly on circular dependencies.

**Build** in `TaskRunner.cs`:

- `List<string> Order(Dictionary<string, List<string>> dependsOn)`: key = a task, value = tasks it needs first. Tasks that only appear in dependency lists still count. When several tasks are ready at once, run them **alphabetically** (so builds are reproducible).
- Throw `InvalidOperationException` if there's a cycle.

**Hint.** Kahn's algorithm: count each task's unfinished dependencies; repeatedly take a ready task (count 0), and lower the count of every task waiting on it. A min-ordered `PriorityQueue<string, string>` or `SortedSet` gives "alphabetically first ready task". If tasks remain but none are ready, there's a cycle.

**Rules.** O((V + E) log V). 100,000 tasks must be fast.

**Run:** `dotnet test --filter Lesson=topological-sort`
