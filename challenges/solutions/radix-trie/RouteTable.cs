namespace Challenges.RadixTrie;

public class RouteTable
{
    private class Node
    {
        public readonly Dictionary<char, (string Edge, Node Child)> Kids = new(); // keyed by the edge's first char
        public string? Handler;
    }

    private readonly Node _root = new();
    private int _nodes = 1;

    public int NodeCount => _nodes;

    public void Add(string route, string handler)
    {
        var n = _root;
        var rest = route;
        while (rest.Length > 0)
        {
            if (!n.Kids.TryGetValue(rest[0], out var e))
            {
                var leaf = new Node { Handler = handler };
                n.Kids[rest[0]] = (rest, leaf); // one edge holds the whole remainder
                _nodes++;
                return;
            }
            var p = 0;
            while (p < e.Edge.Length && p < rest.Length && e.Edge[p] == rest[p]) p++;
            if (p < e.Edge.Length)
            {
                // Only part of the edge matches: split it at p.
                var mid = new Node();
                mid.Kids[e.Edge[p]] = (e.Edge[p..], e.Child);
                n.Kids[rest[0]] = (e.Edge[..p], mid);
                _nodes++;
                e = (e.Edge[..p], mid);
            }
            n = e.Child;
            rest = rest[p..];
        }
        n.Handler = handler;
    }

    public string? Get(string route)
    {
        var n = _root;
        var rest = route;
        while (rest.Length > 0)
        {
            if (!n.Kids.TryGetValue(rest[0], out var e) || !rest.StartsWith(e.Edge, StringComparison.Ordinal)) return null;
            n = e.Child;
            rest = rest[e.Edge.Length..];
        }
        return n.Handler;
    }

    public string? LongestPrefix(string path)
    {
        var n = _root;
        var best = n.Handler;
        var at = 0;
        while (at < path.Length && n.Kids.TryGetValue(path[at], out var e) && string.CompareOrdinal(path, at, e.Edge, 0, e.Edge.Length) == 0 && at + e.Edge.Length <= path.Length)
        {
            n = e.Child;
            at += e.Edge.Length;
            best = n.Handler ?? best; // remember the deepest route seen so far
        }
        return best;
    }
}
