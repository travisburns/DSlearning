using System.Text;

namespace Challenges.Tries;

public class Autocomplete
{
    private class Node
    {
        public readonly SortedDictionary<char, Node> Kids = new(); // sorted, so we walk children A→Z
        public bool End;
    }

    private readonly Node _root = new();
    private int _count;

    public int Count => _count;

    public void Add(string word)
    {
        var n = _root;
        foreach (var c in word)
        {
            if (!n.Kids.TryGetValue(c, out var next)) n.Kids[c] = next = new Node();
            n = next;
        }
        if (!n.End) _count++;
        n.End = true;
    }

    private Node? Walk(string s)
    {
        var n = _root;
        foreach (var c in s)
            if (!n.Kids.TryGetValue(c, out n!)) return null;
        return n;
    }

    public bool Contains(string word) => Walk(word)?.End == true;

    public List<string> Suggest(string prefix, int limit)
    {
        var outp = new List<string>();
        var start = Walk(prefix);
        if (start != null) Collect(start, new StringBuilder(prefix), outp, limit);
        return outp;
    }

    private static void Collect(Node n, StringBuilder path, List<string> outp, int limit)
    {
        if (outp.Count >= limit) return;
        if (n.End) outp.Add(path.ToString());
        foreach (var (c, kid) in n.Kids)
        {
            if (outp.Count >= limit) return;
            path.Append(c);
            Collect(kid, path, outp, limit);
            path.Length--;
        }
    }
}
