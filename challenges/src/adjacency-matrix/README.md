# Flight route table

**The ticket.** A regional airline flies between a fixed set of ~20 airports. The booking page constantly asks "is there a direct flight from X to Y, and what does it cost?" With so few airports and many routes, a **matrix** is the simplest, fastest store.

**Build** `RouteTable` in `RouteTable.cs`:

- `RouteTable(string[] airports)`: map each code to an index; keep an `int[,]` of prices where 0 means "no flight". Flights are one-way.
- `void AddFlight(string from, string to, int price)`, `bool HasDirect(string from, string to)`, `int Price(string from, string to)` (0 if none).
- `List<string> Destinations(string from)`: in the order the airports were given.
- `int CheapestWithOneStop(string from, string to)`: the cheapest price using exactly one connection (from → X → to), or -1.

**Rules.** HasDirect and Price are O(1): one array cell.

**Run:** `dotnet test --filter Lesson=adjacency-matrix`
