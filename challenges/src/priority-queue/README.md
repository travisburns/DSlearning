# Support ticket triage

**The ticket.** The help desk takes tickets with a priority (1 = site down, 5 = typo). Agents always pick up the most urgent ticket; among equal priorities, the one that has waited longest.

**Build** `Triage` in `Triage.cs`:

- `void Add(string ticketId, int priority)`.
- `string? Next()`: remove and return the next ticket to work on, or null if none.
- `int Count`.

**Hint.** C#'s `PriorityQueue<TElement, TPriority>` hands out the smallest priority first. What can you use as the priority so that ties go to the earliest arrival?

**Rules.** Add and Next are O(log n). Don't sort a list on every call.

**Run:** `dotnet test --filter Lesson=priority-queue`
