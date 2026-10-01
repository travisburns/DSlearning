namespace Challenges.Dfs;

public static class Explore
{
    public static (int Count, int Largest) Islands(string[] map)
    {
        int rows = map.Length, cols = rows == 0 ? 0 : map[0].Length, count = 0, largest = 0;
        var seen = new bool[rows, cols];
        var stack = new Stack<(int, int)>();
        for (var r = 0; r < rows; r++)
            for (var c = 0; c < cols; c++)
            {
                if (map[r][c] != '#' || seen[r, c]) continue;
                count++; // unvisited land: a new island; flood it
                var size = 0;
                seen[r, c] = true;
                stack.Push((r, c));
                while (stack.Count > 0)
                {
                    var (y, x) = stack.Pop();
                    size++;
                    foreach (var (ny, nx) in new[] { (y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1) })
                    {
                        if (ny < 0 || nx < 0 || ny >= rows || nx >= cols || map[ny][nx] != '#' || seen[ny, nx]) continue;
                        seen[ny, nx] = true;
                        stack.Push((ny, nx));
                    }
                }
                largest = Math.Max(largest, size);
            }
        return (count, largest);
    }

    public static HashSet<string> Reachable(Dictionary<string, List<string>> links, string start)
    {
        var seen = new HashSet<string> { start };
        var stack = new Stack<string>();
        stack.Push(start);
        while (stack.Count > 0)
            foreach (var next in links.GetValueOrDefault(stack.Pop()) ?? new List<string>())
                if (seen.Add(next)) stack.Push(next); // mark before pushing: cycles can't loop us
        return seen;
    }
}
