namespace Challenges.Dijkstra;

public static class Courier
{
    public static long[] Cheapest(int n, List<(int A, int B, int Cost)> roads, int from) => Run(n, roads, from).Dist;

    public static List<int>? Route(int n, List<(int A, int B, int Cost)> roads, int from, int to)
    {
        var (dist, prev) = Run(n, roads, from);
        if (dist[to] < 0) return null;
        var path = new List<int>();
        for (var v = to; v != -1; v = prev[v]) path.Add(v);
        path.Reverse();
        return path;
    }

    private static (long[] Dist, int[] Prev) Run(int n, List<(int A, int B, int Cost)> roads, int from)
    {
        var adj = new List<(int To, int Cost)>[n];
        for (var i = 0; i < n; i++) adj[i] = new();
        foreach (var (a, b, c) in roads)
        {
            adj[a].Add((b, c));
            adj[b].Add((a, c));
        }
        var dist = new long[n];
        var prev = new int[n];
        Array.Fill(dist, long.MaxValue);
        Array.Fill(prev, -1);
        dist[from] = 0;
        var pq = new PriorityQueue<int, long>();
        pq.Enqueue(from, 0);
        while (pq.TryDequeue(out var u, out var d))
        {
            if (d > dist[u]) continue; // stale entry: u was already finalised more cheaply
            foreach (var (v, c) in adj[u])
                if (d + c < dist[v])
                {
                    dist[v] = d + c; // relax: going through u is cheaper
                    prev[v] = u;
                    pq.Enqueue(v, dist[v]);
                }
        }
        for (var i = 0; i < n; i++) if (dist[i] == long.MaxValue) dist[i] = -1;
        return (dist, prev);
    }
}
