namespace Challenges.Splay;

public class SplayTree
{
    private class Node(int key)
    {
        public readonly int Key = key;
        public Node? L, R;
    }

    private Node? _root;
    private int _count;

    public int? Root => _root?.Key;

    public int Count => _count;

    /// <summary>Top-down splay (Sleator): brings key, or the last node on its search path, to the root.</summary>
    private static Node Splay(Node t, int key)
    {
        var header = new Node(0);
        Node left = header, right = header;
        while (true)
        {
            if (key < t.Key)
            {
                if (t.L == null) break;
                if (key < t.L.Key) // zig-zig: rotate right first
                {
                    var y = t.L;
                    t.L = y.R;
                    y.R = t;
                    t = y;
                    if (t.L == null) break;
                }
                right.L = t; // link t into the right tree
                right = t;
                t = t.L!;
            }
            else if (key > t.Key)
            {
                if (t.R == null) break;
                if (key > t.R.Key)
                {
                    var y = t.R;
                    t.R = y.L;
                    y.L = t;
                    t = y;
                    if (t.R == null) break;
                }
                left.R = t;
                left = t;
                t = t.R!;
            }
            else break;
        }
        left.R = t.L;
        right.L = t.R;
        t.L = header.R;
        t.R = header.L;
        return t;
    }

    public bool Contains(int key)
    {
        if (_root == null) return false;
        _root = Splay(_root, key);
        return _root.Key == key;
    }

    public void Insert(int key)
    {
        if (_root == null)
        {
            _root = new Node(key);
            _count++;
            return;
        }
        _root = Splay(_root, key);
        if (_root.Key == key) return;
        var n = new Node(key);
        if (key < _root.Key)
        {
            n.L = _root.L;
            n.R = _root;
            _root.L = null;
        }
        else
        {
            n.R = _root.R;
            n.L = _root;
            _root.R = null;
        }
        _root = n;
        _count++;
    }
}
