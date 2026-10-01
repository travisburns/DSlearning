namespace Challenges.EdgeList;

public record Road(string A, string B, int Km);

public static class Roads
{
    public static List<Road> Parse(string csv)
    {
        var roads = new List<Road>();
        foreach (var raw in csv.Split('\n'))
        {
            var line = raw.Trim();
            if (line.Length == 0 || line.Equals("from,to,km", StringComparison.OrdinalIgnoreCase)) continue;
            var p = line.Split(',').Select(s => s.Trim()).ToArray();
            roads.Add(new Road(p[0], p[1], int.Parse(p[2])));
        }
        return roads;
    }

    public static long TotalKm(List<Road> roads) => roads.Sum(r => (long)r.Km);

    public static List<Road> Longest(List<Road> roads, int n) => roads.OrderByDescending(r => r.Km).Take(n).ToList(); // OrderBy is stable

    public static Dictionary<string, List<(string To, int Km)>> ToAdjacency(List<Road> roads)
    {
        var adj = new Dictionary<string, List<(string, int)>>();
        void Add(string a, string b, int km)
        {
            if (!adj.TryGetValue(a, out var l)) adj[a] = l = new List<(string, int)>();
            l.Add((b, km));
        }
        foreach (var r in roads)
        {
            Add(r.A, r.B, r.Km);
            Add(r.B, r.A, r.Km); // two-way road
        }
        return adj;
    }
}
