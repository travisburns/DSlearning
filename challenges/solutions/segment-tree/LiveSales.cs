namespace Challenges.SegmentTree;

public class LiveSales
{
    private readonly int _size;           // leaves start at index _size
    private readonly long[] _sum, _max;

    public LiveSales(int days)
    {
        _size = 1;
        while (_size < days) _size *= 2;
        _sum = new long[2 * _size];
        _max = new long[2 * _size];
    }

    public void Set(int day, long value)
    {
        var i = day + _size;
        _sum[i] = _max[i] = value;
        for (i /= 2; i >= 1; i /= 2) // fix every ancestor on the way up: O(log n)
        {
            _sum[i] = _sum[2 * i] + _sum[2 * i + 1];
            _max[i] = Math.Max(_max[2 * i], _max[2 * i + 1]);
        }
    }

    public long Total(int from, int to)
    {
        long s = 0;
        for (int l = from + _size, r = to + _size + 1; l < r; l /= 2, r /= 2) // bottom-up: take whole nodes at the edges
        {
            if ((l & 1) == 1) s += _sum[l++];
            if ((r & 1) == 1) s += _sum[--r];
        }
        return s;
    }

    public long Best(int from, int to)
    {
        var m = long.MinValue;
        for (int l = from + _size, r = to + _size + 1; l < r; l /= 2, r /= 2)
        {
            if ((l & 1) == 1) m = Math.Max(m, _max[l++]);
            if ((r & 1) == 1) m = Math.Max(m, _max[--r]);
        }
        return m;
    }
}
