# Document versions with cheap snapshots

**The ticket.** A settings editor saves a new version on every change, and users can open, compare or restore any old version. Copying the whole settings map per version uses far too much memory once there are thousands of keys and versions. Make the map **persistent**: each version shares everything it didn't change with the previous one.

**Build** `VersionedMap` in `VersionedMap.cs` (string keys and values):

- `int Set(string key, string value)` and `int Remove(string key)`: apply the change to the **latest** version and return the new version number (version 0 is the empty map; each change makes version +1).
- `string? Get(int version, string key)`.
- `int Count(int version)`, `int Latest`.
- `int Restore(int version)`: make a new latest version equal to an old one (O(1): just point at its root).

**Hint.** Store each version as the root of an immutable binary search tree. To change a key, copy only the nodes on the path from the root to that key (path copying); every other subtree is shared. A plain BST is fine for this ticket; .NET's `ImmutableSortedDictionary` works the same way.

**Rules.** Don't copy the whole map per version: 20,000 versions over 20,000 keys must fit in memory and run fast.

**Run:** `dotnet test --filter Lesson=persistent-structures`
