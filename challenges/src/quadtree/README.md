# Map pins in view

**The ticket.** A map shows pins (shops, cafés, …) for whatever rectangle is on screen, and redraws on every pan and zoom. With hundreds of thousands of pins we can't check each one per frame. Store them in a **quadtree**.

**Build** `PinMap` in `PinMap.cs` (the world is the square `0 ≤ x, y < size`):

- `PinMap(double size, int leafCapacity = 8)`.
- `void Add(double x, double y, int id)`: when a square holds more than `leafCapacity` pins, split it into 4 quarters and push its pins down (stop splitting below a tiny size so equal points can't recurse forever).
- `List<int> InView(double x0, double y0, double x1, double y1)`: ids of pins with x0 ≤ x ≤ x1 and y0 ≤ y ≤ y1, sorted. Skip any square that doesn't overlap the view.
- `int Count`.

**Rules.** A small view must only touch the few squares around it.

**Run:** `dotnet test --filter Lesson=quadtree`
