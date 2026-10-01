# Room booking without overlaps (using the red-black tree you already have)

**The ticket.** Book a meeting room: accept a booking only if it doesn't overlap an existing one. With thousands of bookings, checking every booking for each request is too slow.

Nobody hand-writes a red-black tree at work: in C#, `SortedSet<T>` and `SortedDictionary<TKey, TValue>` **are** red-black trees. This challenge is about using one well.

**Build** `RoomCalendar` in `RoomCalendar.cs` (times are ints; a booking is `[start, end)`, so 10–12 and 12–13 don't overlap):

- `bool Book(int start, int end)`: only the booking just before `start` and the one at/after `start` can possibly overlap. Find them in O(log n) with `SortedSet.GetViewBetween(...)` and read just the first item of each view. Watch out: `.Count` on a view is O(n) in .NET, which quietly makes the whole thing O(n²).
- `List<(int Start, int End)> Between(int from, int to)`: bookings that start in `[from, to)`, in order.
- `int Count`.

**Rules.** O(log n) per booking. No scanning all bookings.

**Run:** `dotnet test --filter Lesson=red-black-tree`
