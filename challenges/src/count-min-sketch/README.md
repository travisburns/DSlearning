# Trending hashtags

**The ticket.** The trending sidebar needs counts for hashtags in a firehose of millions of posts per hour. Keeping an exact counter for every hashtag ever seen uses too much memory. A **count-min sketch** keeps a small grid of counters and gives estimates that are never too low and only slightly too high.

**Build** `CountMinSketch` in `CountMinSketch.cs`:

- `CountMinSketch(int width, int depth)`: `depth` rows of `width` counters, each row with its own hash (e.g. a seeded hash: mix the string's hash with the row number).
- `void Add(string item, long count = 1)`: in every row, add to the counter that row's hash picks.
- `long Estimate(string item)`: the **minimum** of its counters across the rows.
- `long Total`: everything added.

**Rules.** Memory is fixed: width × depth counters, no dictionary of items. Estimates must never be below the true count, and with width 2,000 the error on a 200,000-item stream should be small (the tests check).

**Run:** `dotnet test --filter Lesson=count-min-sketch`
