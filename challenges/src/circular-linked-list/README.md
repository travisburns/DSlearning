# Round-robin task scheduler

**The ticket.** A worker runs tasks in turns: one time slice each, then on to the next, forever, wrapping back to the first. Tasks join and finish at any time.

**Build** `RoundRobin` in `RoundRobin.cs` as a **circular linked list** (the last node points back to the first):

- `void Add(string task)`: the new task takes its turn just before the current one (it goes last in the cycle).
- `string Next()`: return the task whose turn it is, and move on to the following one. Throw `InvalidOperationException` if empty.
- `bool Finish(string task)`: remove it from the circle.
- `int Count`.

**Rules.** No `List`/`Queue` inside. Next is O(1); there's no "end" to check for.

**Run:** `dotnet test --filter Lesson=circular-linked-list`
