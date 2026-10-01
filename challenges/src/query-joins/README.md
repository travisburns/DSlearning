# Join two big exports

**The ticket.** Finance exports 200,000 orders and 100,000 customers as two lists and needs them combined. The current code loops over every order and, inside, over every customer: 20 billion comparisons. Write a proper join.

**Build** in `Joins.cs` (generic, like LINQ's `Join`):

- `List<(TL Left, TR Right)> HashJoin<TL, TR, TKey>(IEnumerable<TL> left, IEnumerable<TR> right, Func<TL, TKey> leftKey, Func<TR, TKey> rightKey)`: an INNER JOIN. Build a `Dictionary<TKey, List<TL>>` from the left side, then probe it with each right row. Output pairs in the order of the right side; several left matches come in left-side order.
- `List<(TL Left, TR? Right)> LeftJoin<…>(…)`: every left row appears; with each match, or once with `default` if none. Output in left-side order.

**Rules.** No LINQ `Join`/`GroupJoin`/`ToLookup`. About n + m work, not n × m.

**Run:** `dotnet test --filter Lesson=query-joins`
