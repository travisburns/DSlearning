# Snapshot isolation with MVCC

**The ticket.** Long-running reports must see a consistent snapshot while writers keep working, and two writers must never silently overwrite each other. Build a tiny **multi-version** key-value store.

**Build** in `MvccStore.cs`:

- `MvccStore`: keeps, for each key, a list of committed versions `(commitTs, value)`; a global clock counts commits.
- `Tx Begin()`: the transaction's snapshot = the current clock value.
- `Tx.Read(key)`: its own uncommitted write if it made one; otherwise the newest version with `commitTs <= snapshot` (null if none).
- `Tx.Write(key, value)`: buffered inside the transaction (null = delete).
- `bool Tx.Commit()`: **first committer wins**: if any key this transaction wrote has a version committed after its snapshot, return false and apply nothing. Otherwise bump the clock and add all its writes as versions with that new timestamp.
- `int VersionCount(string key)` on the store, for tests.

**Run:** `dotnet test --filter Lesson=isolation-mvcc`
