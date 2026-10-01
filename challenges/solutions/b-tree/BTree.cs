namespace Challenges.BTrees;

public class BTree(int t)
{
    private class Node
    {
        public readonly List<int> Keys = new();
        public readonly List<Node> Kids = new();
        public bool Leaf => Kids.Count == 0;
    }

    private Node _root = new();
    private int _count;

    public int Count => _count;

    public int Height
    {
        get
        {
            var h = 0;
            for (var n = _root; !n.Leaf; n = n.Kids[0]) h++;
            return h;
        }
    }

    public bool Contains(int key)
    {
        var n = _root;
        while (true)
        {
            var i = n.Keys.BinarySearch(key);
            if (i >= 0) return true;
            if (n.Leaf) return false;
            n = n.Kids[~i]; // the child between the two keys around `key`
        }
    }

    public void Insert(int key)
    {
        if (Contains(key)) return;
        if (_root.Keys.Count == 2 * t - 1)
        {
            var newRoot = new Node();
            newRoot.Kids.Add(_root);
            SplitChild(newRoot, 0); // the tree grows taller only here, at the top
            _root = newRoot;
        }
        var n = _root;
        while (!n.Leaf)
        {
            var i = ~n.Keys.BinarySearch(key);
            if (n.Kids[i].Keys.Count == 2 * t - 1)
            {
                SplitChild(n, i); // split full nodes on the way down, so there's always room
                if (key > n.Keys[i]) i++;
            }
            n = n.Kids[i];
        }
        n.Keys.Insert(~n.Keys.BinarySearch(key), key);
        _count++;
    }

    private void SplitChild(Node parent, int i)
    {
        var full = parent.Kids[i];
        var right = new Node();
        var mid = full.Keys[t - 1];
        right.Keys.AddRange(full.Keys.GetRange(t, t - 1));
        full.Keys.RemoveRange(t - 1, t);
        if (!full.Leaf)
        {
            right.Kids.AddRange(full.Kids.GetRange(t, t));
            full.Kids.RemoveRange(t, t);
        }
        parent.Keys.Insert(i, mid); // middle key moves up
        parent.Kids.Insert(i + 1, right);
    }

    public List<int> InOrder()
    {
        var outp = new List<int>(_count);
        void Walk(Node n)
        {
            for (var i = 0; i < n.Keys.Count; i++)
            {
                if (!n.Leaf) Walk(n.Kids[i]);
                outp.Add(n.Keys[i]);
            }
            if (!n.Leaf) Walk(n.Kids[^1]);
        }
        Walk(_root);
        return outp;
    }
}
