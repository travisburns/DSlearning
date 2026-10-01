# Median house price (fast)

**The ticket.** The property site shows the median price of a few million listings and refreshes it constantly. Fully sorting just to read the middle is wasted work.

**Build** in `Prices.cs`:

- `int KthSmallest(int[] values, int k)`: k = 0 is the smallest. Use **quickselect**: partition around a pivot like quicksort, then continue only into the side that contains position k.
- `double Median(int[] values)`: the middle value, or the average of the two middle values for an even count.

**Rules.**
- Don't modify the caller's array (work on a copy).
- No `Sort` or `OrderBy`.
- Pick the pivot **at random**. The tests feed already-sorted data, where a "first element" pivot degrades to O(n²).

**Run:** `dotnet test --filter Lesson=quicksort`
