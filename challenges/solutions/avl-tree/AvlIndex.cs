namespace Challenges.Avl;

public class AvlIndex
{
    private class Node(int key)
    {
        public readonly int Key = key;
        public Node? L, R;
        public int H; // height of this subtree in edges
    }

    private Node? _root;
    private int _count;

    public int Count => _count;

    public int Height => H(_root);

    private static int H(Node? n) => n?.H ?? -1;

    private static void Fix(Node n) => n.H = 1 + Math.Max(H(n.L), H(n.R));

    private static Node RotRight(Node n)
    {
        var l = n.L!;
        n.L = l.R;
        l.R = n;
        Fix(n);
        Fix(l);
        return l;
    }

    private static Node RotLeft(Node n)
    {
        var r = n.R!;
        n.R = r.L;
        r.L = n;
        Fix(n);
        Fix(r);
        return r;
    }

    private static Node Balance(Node n)
    {
        Fix(n);
        var bf = H(n.L) - H(n.R);
        if (bf > 1)
        {
            if (H(n.L!.L) < H(n.L.R)) n.L = RotLeft(n.L); // zig-zag: straighten first
            return RotRight(n);
        }
        if (bf < -1)
        {
            if (H(n.R!.R) < H(n.R.L)) n.R = RotRight(n.R);
            return RotLeft(n);
        }
        return n;
    }

    public void Insert(int key) => _root = Ins(_root, key);

    private Node Ins(Node? n, int key)
    {
        if (n == null)
        {
            _count++;
            return new Node(key);
        }
        if (key < n.Key) n.L = Ins(n.L, key);
        else if (key > n.Key) n.R = Ins(n.R, key);
        else return n;
        return Balance(n); // on the way back up, fix any node that got 2 taller on one side
    }

    public bool Contains(int key)
    {
        for (var n = _root; n != null; n = key < n.Key ? n.L : n.R)
            if (n.Key == key) return true;
        return false;
    }

    public List<int> InOrder()
    {
        var outp = new List<int>(_count);
        void Walk(Node? n)
        {
            if (n == null) return;
            Walk(n.L);
            outp.Add(n.Key);
            Walk(n.R);
        }
        Walk(_root);
        return outp;
    }
}
