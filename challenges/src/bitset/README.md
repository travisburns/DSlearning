# Room availability calendar

**The ticket.** Each meeting room has a calendar of 365 days. We store one bit per day instead of a list of dates, so finding days when several rooms are all free is a handful of bit operations.

**Build** `YearCalendar` in `YearCalendar.cs`, backed by a `ulong[]` (64 days per ulong):

- `void Book(int day)` / `void Free(int day)` / `bool IsBooked(int day)` for day 0–364.
- `int BookedCount`.
- `YearCalendar BookedByEither(YearCalendar other)`: a new calendar booked on any day either one is (bitwise OR of the words).
- `List<int> FreeInBoth(YearCalendar other)`: the days both rooms are free.

**Rules.** Day `d` lives in word `d / 64`, bit `d % 64`. No `bool[]` or sets.

**Run:** `dotnet test --filter Lesson=bitset`
