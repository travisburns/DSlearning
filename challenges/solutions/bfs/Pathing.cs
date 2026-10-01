namespace Challenges.Bfs;

public static class Pathing
{
    public static int MinMoves(string[] grid)
    {
        int rows = grid.Length, cols = grid[0].Length;
        var dist = new int[rows, cols];
        var q = new Queue<(int R, int C)>();
        for (var r = 0; r < rows; r++)
            for (var c = 0; c < cols; c++)
            {
                dist[r, c] = -1;
                if (grid[r][c] == 'S')
                {
                    dist[r, c] = 0;
                    q.Enqueue((r, c));
                }
            }
        (int, int)[] dirs = [(1, 0), (-1, 0), (0, 1), (0, -1)];
        while (q.Count > 0)
        {
            var (r, c) = q.Dequeue();
            if (grid[r][c] == 'E') return dist[r, c]; // first arrival = fewest moves
            foreach (var (dr, dc) in dirs)
            {
                int nr = r + dr, nc = c + dc;
                if (nr < 0 || nc < 0 || nr >= rows || nc >= cols || grid[nr][nc] == '#' || dist[nr, nc] >= 0) continue;
                dist[nr, nc] = dist[r, c] + 1; // seen when enqueued, so nothing is queued twice
                q.Enqueue((nr, nc));
            }
        }
        return -1;
    }

    public static List<string>? Chain(Dictionary<string, List<string>> friends, string from, string to)
    {
        var prev = new Dictionary<string, string?> { [from] = null };
        var q = new Queue<string>();
        q.Enqueue(from);
        while (q.Count > 0)
        {
            var p = q.Dequeue();
            if (p == to)
            {
                var path = new List<string>();
                for (string? cur = to; cur != null; cur = prev[cur]) path.Add(cur);
                path.Reverse();
                return path;
            }
            foreach (var f in friends.GetValueOrDefault(p) ?? new List<string>())
                if (prev.TryAdd(f, p)) q.Enqueue(f);
        }
        return null;
    }
}
