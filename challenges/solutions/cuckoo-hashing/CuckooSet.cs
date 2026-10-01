namespace Challenges.CuckooHashing;

public class CuckooSet
{
    private int?[] _t1 = new int?[16], _t2 = new int?[16];
    private int _count;
    private uint _seed = 0x9E3779B1;

    public int Count => _count;

    /// <summary>Scramble the bits so nearby numbers land far apart (a standard 32-bit mixer).</summary>
    private static uint Mix(uint h)
    {
        h ^= h >> 16;
        h = unchecked(h * 0x85EBCA6Bu);
        h ^= h >> 13;
        h = unchecked(h * 0xC2B2AE35u);
        return h ^ (h >> 16);
    }

    private int H1(int x) => (int)(Mix((uint)x ^ _seed) % (uint)_t1.Length);

    private int H2(int x) => (int)(Mix((uint)x * 31u + ~_seed) % (uint)_t2.Length);

    public bool Contains(int x) => _t1[H1(x)] == x || _t2[H2(x)] == x; // two probes, always

    public bool Remove(int x)
    {
        if (_t1[H1(x)] == x) _t1[H1(x)] = null;
        else if (_t2[H2(x)] == x) _t2[H2(x)] = null;
        else return false;
        _count--;
        return true;
    }

    public bool Add(int x)
    {
        if (Contains(x)) return false;
        Place(x);
        _count++;
        return true;
    }

    private void Place(int x)
    {
        int? cur = x;
        for (var kicks = 0; kicks < 32; kicks++)
        {
            var i = H1(cur.Value);
            (_t1[i], cur) = (cur, _t1[i]); // take t1's slot, holding whoever was there
            if (cur == null) return;
            var j = H2(cur.Value);
            (_t2[j], cur) = (cur, _t2[j]); // the evicted value goes to its other home
            if (cur == null) return;
        }
        Grow();
        Place(cur!.Value);
    }

    private void Grow()
    {
        var old = _t1.Concat(_t2).Where(v => v != null).Select(v => v!.Value).ToList();
        _t1 = new int?[_t1.Length * 2];
        _t2 = new int?[_t2.Length * 2];
        _seed = _seed * 2654435761u + 1; // new hash functions too
        foreach (var v in old) Place(v);
    }
}
