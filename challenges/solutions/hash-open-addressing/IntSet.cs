namespace Challenges.HashOpenAddressing;

public class IntSet
{
    private const byte Empty = 0, Used = 1, Deleted = 2;
    private int[] _keys = new int[16];
    private byte[] _state = new byte[16];
    private int _count, _tombstones;

    public int Count => _count;

    private int Home(int x, int cap) => (x.GetHashCode() & 0x7FFFFFFF) % cap;

    /// <summary>Slot holding x, or -1. Probing stops only at a truly empty slot.</summary>
    private int Find(int x)
    {
        var cap = _keys.Length;
        for (int i = Home(x, cap), n = 0; n < cap; i = (i + 1) % cap, n++)
        {
            if (_state[i] == Empty) return -1;
            if (_state[i] == Used && _keys[i] == x) return i;
        }
        return -1;
    }

    public bool Contains(int x) => Find(x) >= 0;

    public bool Add(int x)
    {
        if (Contains(x)) return false;
        if ((_count + _tombstones + 1) * 2 > _keys.Length) Rebuild(_keys.Length * 2);
        var cap = _keys.Length;
        var i = Home(x, cap);
        while (_state[i] == Used) i = (i + 1) % cap; // first empty or tombstone slot
        if (_state[i] == Deleted) _tombstones--;
        _keys[i] = x;
        _state[i] = Used;
        _count++;
        return true;
    }

    public bool Remove(int x)
    {
        var i = Find(x);
        if (i < 0) return false;
        _state[i] = Deleted; // a tombstone: "keep probing past me"
        _count--;
        _tombstones++;
        return true;
    }

    private void Rebuild(int cap)
    {
        var (keys, state) = (_keys, _state);
        _keys = new int[cap];
        _state = new byte[cap];
        _count = _tombstones = 0;
        for (var i = 0; i < keys.Length; i++)
            if (state[i] == Used)
            {
                var j = Home(keys[i], cap);
                while (_state[j] == Used) j = (j + 1) % cap;
                _keys[j] = keys[i];
                _state[j] = Used;
                _count++;
            }
    }
}
