# Import a road network from CSV

**The ticket.** The routing team gets road data as CSV lines `townA,townB,km`. Before anything else, it's stored as a plain **edge list**: just a list of edges. Write the importer and a few reports.

**Build** in `Roads.cs` (`record Road(string A, string B, int Km)` is given):

- `List<Road> Parse(string csv)`: one road per non-empty line; trim spaces; skip a header line `from,to,km` if present.
- `long TotalKm(List<Road> roads)`.
- `List<Road> Longest(List<Road> roads, int n)`: the n longest, longest first (ties: original order).
- `Dictionary<string, List<(string To, int Km)>> ToAdjacency(List<Road> roads)`: roads are two-way, so add both directions.

**Run:** `dotnet test --filter Lesson=edge-list`
