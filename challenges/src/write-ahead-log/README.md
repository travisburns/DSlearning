# A key-value store that survives crashes

**The ticket.** Our config service keeps a small key-value map in memory and must never lose a committed change, even if the process is killed mid-write. Build it on a **write-ahead log**.

**Build** `WalStore` in `WalStore.cs`:

- `WalStore(Stream log)`: on startup, **recover**: read the log from the beginning and replay every committed batch. Then keep appending to the same stream.
- `void Commit(IReadOnlyDictionary<string, string?> changes)`: one atomic batch (null value = delete). Append one line per change, `SET <key>\t<value>` or `DEL <key>`, then a line `COMMIT`, then `Flush()` the stream. Only after that apply the changes in memory.
- `string? Get(string key)`, `int Count`.

Recovery rules: a batch counts only if its `COMMIT` line is there and complete (ends with a newline). A crash can cut the log off anywhere, even mid-line; everything after the last complete `COMMIT` is ignored. Keys and values never contain tabs or newlines.

**Run:** `dotnet test --filter Lesson=write-ahead-log`
