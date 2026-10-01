# Days until a higher price

**The ticket.** For every day in a price history, the app shows "price beats today's in N days" (0 if it never does). Histories are long, and a falling market makes the obvious double loop take forever.

**Build** in `PriceAlerts.cs`:

- `int[] DaysUntilHigher(int[] prices)`.

**Hint.** Walk left to right with a stack of days still waiting for a higher price. Their prices only go down from bottom to top. When today's price beats the top, that day has its answer: pop it and check the next.

**Rules.** O(n): each day is pushed and popped at most once.

**Run:** `dotnet test --filter Lesson=monotonic-stack`
