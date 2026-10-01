# Music playlist

**The ticket.** The music player keeps the play queue as a chain of songs. Users insert songs right after the current one ("play next"), remove songs, and reverse the playlist.

**Build** `Playlist` in `Playlist.cs` as a **singly linked list** you write yourself (a `Node` class with `Title` and `Next`):

- `void AddLast(string title)`: O(1) (keep a tail reference).
- `bool InsertAfter(string existing, string title)`: insert after the first song with that title; false if not found.
- `bool Remove(string title)`: unlink the first match.
- `void Reverse()`: reverse the order in place by re-pointing `Next` references (no new nodes).
- `List<string> Titles()`: the songs in order.

**Rules.** Don't use `List<T>` or `LinkedList<T>` inside (only for the `Titles` result).

**Run:** `dotnet test --filter Lesson=linked-list`
