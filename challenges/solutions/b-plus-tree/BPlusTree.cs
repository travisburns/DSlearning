namespace Challenges.BPlusTrees;

public class BPlusTree(int maxKeys)
{
    private abstract class Node
    {
        public readonly List<int> Keys = new();
    }

    private sealed class Leaf : Node
    {
        public readonly List<string> Values = new();
        public Leaf? Next; // the chain that makes range scans cheap
    }

    private sealed class Inner : Node
    {
        public readonly List<Node> Kids = new();
    }

    private Node _root = new Leaf();
    private int _count;

    public int Count => _count;

    public int LeafCount
    {
        get
        {
            var n = 0;
            for (var l = FirstLeaf(); l != null; l = l.Next) n++;
            return n;
        }
    }

    private Leaf FirstLeaf()
    {
        var n = _root;
        while (n is Inner i) n = i.Kids[0];
        return (Leaf)n;
    }

    private Leaf FindLeaf(int key)
    {
        var n = _root;
        while (n is Inner inner)
        {
            var i = inner.Keys.BinarySearch(key);
            n = inner.Kids[i >= 0 ? i + 1 : ~i]; // keys equal to a signpost live to its right
        }
        return (Leaf)n;
    }

    public string? Get(int key)
    {
        var leaf = FindLeaf(key);
        var i = leaf.Keys.BinarySearch(key);
        return i >= 0 ? leaf.Values[i] : null;
    }

    public void Put(int key, string value)
    {
        var split = Insert(_root, key, value);
        if (split is { } s)
        {
            var root = new Inner();
            root.Keys.Add(s.Sep);
            root.Kids.Add(_root);
            root.Kids.Add(s.Right);
            _root = root;
        }
    }

    /// <summary>Insert below n; if n had to split, return the signpost and the new right node.</summary>
    private (int Sep, Node Right)? Insert(Node n, int key, string value)
    {
        if (n is Leaf leaf)
        {
            var i = leaf.Keys.BinarySearch(key);
            if (i >= 0)
            {
                leaf.Values[i] = value;
                return null;
            }
            leaf.Keys.Insert(~i, key);
            leaf.Values.Insert(~i, value);
            _count++;
            if (leaf.Keys.Count <= maxKeys) return null;
            var half = leaf.Keys.Count / 2;
            var right = new Leaf { Next = leaf.Next };
            right.Keys.AddRange(leaf.Keys.GetRange(half, leaf.Keys.Count - half));
            right.Values.AddRange(leaf.Values.GetRange(half, leaf.Values.Count - half));
            leaf.Keys.RemoveRange(half, leaf.Keys.Count - half);
            leaf.Values.RemoveRange(half, leaf.Values.Count - half);
            leaf.Next = right;
            return (right.Keys[0], right); // a COPY of the first key goes up
        }
        var inner = (Inner)n;
        var j = inner.Keys.BinarySearch(key);
        var at = j >= 0 ? j + 1 : ~j;
        if (Insert(inner.Kids[at], key, value) is not { } s) return null;
        inner.Keys.Insert(at, s.Sep);
        inner.Kids.Insert(at + 1, s.Right);
        if (inner.Keys.Count <= maxKeys) return null;
        var mid = inner.Keys.Count / 2;
        var sep = inner.Keys[mid];
        var r = new Inner();
        r.Keys.AddRange(inner.Keys.GetRange(mid + 1, inner.Keys.Count - mid - 1));
        r.Kids.AddRange(inner.Kids.GetRange(mid + 1, inner.Kids.Count - mid - 1));
        inner.Keys.RemoveRange(mid, inner.Keys.Count - mid);   // the middle key MOVES up
        inner.Kids.RemoveRange(mid + 1, inner.Kids.Count - mid - 1);
        return (sep, r);
    }

    public List<(int Key, string Value)> Range(int lo, int hi)
    {
        var outp = new List<(int, string)>();
        for (var leaf = FindLeaf(lo); leaf != null; leaf = leaf.Next) // down once, then along the chain
        {
            for (var i = 0; i < leaf.Keys.Count; i++)
            {
                if (leaf.Keys[i] > hi) return outp;
                if (leaf.Keys[i] >= lo) outp.Add((leaf.Keys[i], leaf.Values[i]));
            }
        }
        return outp;
    }
}
