namespace Challenges.SkipLists;

public class SkipList
{
    private const int MaxLevel = 32;

    private class Node(int value, int height)
    {
        public readonly int Value = value;
        public readonly Node?[] Next = new Node?[height];
    }

    private readonly Node _head = new(int.MinValue, MaxLevel);
    private readonly Random _rnd = new(131);
    private int _level = 1;
    private int _count;

    public int Count => _count;

    /// <summary>For each level, the last node whose value is &lt; x.</summary>
    private Node[] Predecessors(int x)
    {
        var update = new Node[MaxLevel];
        var cur = _head;
        for (var lv = _level - 1; lv >= 0; lv--)
        {
            while (cur.Next[lv] != null && cur.Next[lv]!.Value < x) cur = cur.Next[lv]!; // move right on this lane
            update[lv] = cur;                                                         // then drop down
        }
        return update;
    }

    public bool Contains(int x)
    {
        var p = Predecessors(x)[0];
        return p.Next[0]?.Value == x;
    }

    public bool Add(int x)
    {
        var update = Predecessors(x);
        if (update[0].Next[0]?.Value == x) return false;
        var h = 1;
        while (h < MaxLevel && _rnd.Next(2) == 0) h++; // coin flips: half the nodes reach level 2, a quarter level 3…
        for (; _level < h; _level++) update[_level] = _head;
        var n = new Node(x, h);
        for (var lv = 0; lv < h; lv++)
        {
            n.Next[lv] = update[lv].Next[lv];
            update[lv].Next[lv] = n;
        }
        _count++;
        return true;
    }

    public bool Remove(int x)
    {
        var update = Predecessors(x);
        var target = update[0].Next[0];
        if (target?.Value != x) return false;
        for (var lv = 0; lv < target.Next.Length; lv++) update[lv].Next[lv] = target.Next[lv];
        while (_level > 1 && _head.Next[_level - 1] == null) _level--;
        _count--;
        return true;
    }

    public List<int> Range(int lo, int hi)
    {
        var outp = new List<int>();
        for (var n = Predecessors(lo)[0].Next[0]; n != null && n.Value <= hi; n = n.Next[0]) outp.Add(n.Value);
        return outp;
    }
}
