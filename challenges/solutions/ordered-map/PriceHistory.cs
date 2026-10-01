namespace Challenges.OrderedMaps;

public class PriceHistory
{
    private readonly SortedList<long, decimal> _h = new(); // keys kept sorted

    public (long Time, decimal Price)? Latest => _h.Count == 0 ? null : (_h.Keys[^1], _h.Values[^1]);

    public void Record(long time, decimal price) => _h[time] = price;

    /// <summary>Index of the last key ≤ time, or -1.</summary>
    private int Floor(long time)
    {
        int lo = 0, hi = _h.Count - 1, ans = -1;
        var keys = _h.Keys;
        while (lo <= hi)
        {
            var mid = (lo + hi) / 2;
            if (keys[mid] <= time)
            {
                ans = mid;
                lo = mid + 1;
            }
            else hi = mid - 1;
        }
        return ans;
    }

    public decimal? PriceAt(long time)
    {
        var i = Floor(time);
        return i < 0 ? null : _h.Values[i];
    }

    public List<(long Time, decimal Price)> Between(long from, long to)
    {
        var outp = new List<(long, decimal)>();
        for (var i = Floor(from - 1) + 1; i < _h.Count && _h.Keys[i] <= to; i++) outp.Add((_h.Keys[i], _h.Values[i]));
        return outp;
    }
}
