namespace Challenges.Kruskal;

public static class Cabling
{
    public static (long Total, List<(int A, int B, int Cost)> Chosen)? Plan(int n, List<(int A, int B, int Cost)> options)
    {
        var parent = Enumerable.Range(0, n).ToArray();
        int Find(int x)
        {
            while (parent[x] != x) x = parent[x] = parent[parent[x]]; // path halving
            return x;
        }
        var chosen = new List<(int, int, int)>(Math.Max(0, n - 1));
        long total = 0;
        foreach (var o in options.OrderBy(o => o.Cost)) // cheapest first
        {
            int ra = Find(o.A), rb = Find(o.B);
            if (ra == rb) continue; // already connected: this run would only make a loop
            parent[ra] = rb;
            chosen.Add(o);
            total += o.Cost;
            if (chosen.Count == n - 1) break;
        }
        return chosen.Count == n - 1 ? (total, chosen) : null;
    }
}
