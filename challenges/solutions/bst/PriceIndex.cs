namespace Challenges.Bst;

public class PriceIndex
{
    private class Node(int key)
    {
        public readonly int Key = key;
        public Node? Left, Right;
    }

    private Node? _root;
    private int _count;

    public int Count => _count;

    public void Add(int price)
    {
        ref var slot = ref _root;
        while (slot != null)
        {
            if (price == slot.Key) return;
            slot = ref price < slot.Key ? ref slot.Left : ref slot.Right; // smaller left, bigger right
        }
        slot = new Node(price);
        _count++;
    }

    public bool Contains(int price)
    {
        for (var n = _root; n != null; n = price < n.Key ? n.Left : n.Right)
            if (n.Key == price) return true;
        return false;
    }

    public List<int> Range(int lo, int hi)
    {
        var outp = new List<int>();
        Walk(_root, lo, hi, outp);
        return outp;
    }

    private static void Walk(Node? n, int lo, int hi, List<int> outp)
    {
        if (n == null) return;
        if (lo < n.Key) Walk(n.Left, lo, hi, outp);   // only go left if smaller values could be in range
        if (lo <= n.Key && n.Key <= hi) outp.Add(n.Key);
        if (n.Key < hi) Walk(n.Right, lo, hi, outp);  // only go right if bigger values could be in range
    }

    public int? Min()
    {
        var n = _root;
        while (n?.Left != null) n = n.Left;
        return n?.Key;
    }

    public int? Max()
    {
        var n = _root;
        while (n?.Right != null) n = n.Right;
        return n?.Key;
    }

    public int? Floor(int x)
    {
        int? best = null;
        for (var n = _root; n != null;)
        {
            if (n.Key == x) return x;
            if (n.Key < x)
            {
                best = n.Key; // a candidate; maybe something bigger (still ≤ x) is to the right
                n = n.Right;
            }
            else n = n.Left;
        }
        return best;
    }
}
