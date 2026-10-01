# Key-value store with nested transactions

**The ticket.** The settings service needs "try these changes, and undo them if anything fails", including transactions inside transactions (a feature flag rollout that calls a helper which opens its own). Build the in-memory core.

**Build** `TxStore` in `TxStore.cs`:

- `string? Get(string key)`, `void Set(string key, string value)`, `void Delete(string key)`.
- `void Begin()`: start a transaction (may be nested).
- `bool Rollback()`: undo everything since the most recent `Begin`; false if no transaction is open.
- `bool Commit()`: fold the innermost transaction's changes into the one around it (or into the store if it's the outermost); false if none is open.
- `int Depth`: how many transactions are open.

Reads see the newest change: the innermost transaction's writes, then the outer ones, then committed data.

**Hint.** A stack of change sets: each `Begin` pushes a `Dictionary<string, string?>` (null meaning "deleted"). Rollback pops and discards; Commit pops and copies the changes into the next one down. Get searches from the top of the stack down.

**Run:** `dotnet test --filter Lesson=transactions`
