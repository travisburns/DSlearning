# Nearest store finder

**The ticket.** "Find my nearest store" for a chain with hundreds of thousands of locations, answering a flood of requests. Checking the distance to every store per request doesn't scale. Build a **k-d tree** over the store coordinates.

**Build** `StoreFinder` in `StoreFinder.cs` (plain x/y coordinates; straight-line distance):

- `StoreFinder(List<(double X, double Y, string Name)> stores)`: build by splitting at the median, alternating x and y by depth.
- `string Nearest(double x, double y)`: descend to the query's side first; on the way back up, only search the other side of a split if the split line is closer than the best store found so far.
- `List<string> Within(double x, double y, double radius)`: every store within the radius, sorted by name.

**Rules.** Nearest must check far fewer than all the stores: 100,000 queries over 200,000 stores in well under two seconds.

**Run:** `dotnet test --filter Lesson=kd-tree`
