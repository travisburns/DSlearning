namespace Challenges.Treaps;

public class RankedSet
{
    private class Node(int key, int pri)
    {
        public readonly int Key = key;
        public readonly int Pri = pri;
        public Node? L, R;
        public int Size = 1;
    }

    private static readonly Random Rnd = new(12345);
    private Node? _root;

    private static int Sz(Node? n) => n?.Size ?? 0;

    private static void Up(Node n) => n.Size = 1 + Sz(n.L) + Sz(n.R);

    /// <summary>Split into keys &lt; key and keys ≥ key.</summary>
    private static (Node?, Node?) Split(Node? n, int key)
    {
        if (n == null) return (null, null);
        if (n.Key < key)
        {
            var (a, b) = Split(n.R, key);
            n.R = a;
            Up(n);
            return (n, b);
        }
        else
        {
            var (a, b) = Split(n.L, key);
            n.L = b;
            Up(n);
            return (a, n);
        }
    }

    /// <summary>Join two treaps where every key in a is smaller than every key in b; the smaller priority goes on top.</summary>
    private static Node? Merge(Node? a, Node? b)
    {
        if (a == null) return b;
        if (b == null) return a;
        if (a.Pri < b.Pri)
        {
            a.R = Merge(a.R, b);
            Up(a);
            return a;
        }
        b.L = Merge(a, b.L);
        Up(b);
        return b;
    }

    public int Count => Sz(_root);

    public bool Contains(int score)
    {
        for (var n = _root; n != null; n = score < n.Key ? n.L : n.R)
            if (n.Key == score) return true;
        return false;
    }

    public bool Insert(int score)
    {
        if (Contains(score)) return false;
        var (a, b) = Split(_root, score);
        _root = Merge(Merge(a, new Node(score, Rnd.Next())), b);
        return true;
    }

    public bool Remove(int score)
    {
        if (!Contains(score)) return false;
        var (a, b) = Split(_root, score);      // a: < score, b: ≥ score
        var (_, c) = Split(b, score + 1);      // drop exactly score
        _root = Merge(a, c);
        return true;
    }

    public int Rank(int score)
    {
        var r = 0;
        for (var n = _root; n != null;)
        {
            if (score <= n.Key) n = n.L;
            else
            {
                r += Sz(n.L) + 1; // this node and its whole left subtree are smaller
                n = n.R;
            }
        }
        return r;
    }

    public int Kth(int k)
    {
        if (k < 0 || k >= Count) throw new ArgumentOutOfRangeException(nameof(k));
        var n = _root;
        while (true)
        {
            var left = Sz(n!.L);
            if (k < left) n = n.L;
            else if (k == left) return n.Key;
            else
            {
                k -= left + 1;
                n = n.R;
            }
        }
    }
}
