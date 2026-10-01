namespace Challenges.PrefixSums;

public class SalesReport
{
    private readonly long[] _prefix; // _prefix[i] = sum of the first i days

    public SalesReport(long[] daily)
    {
        _prefix = new long[daily.Length + 1];
        for (var i = 0; i < daily.Length; i++) _prefix[i + 1] = _prefix[i] + daily[i];
    }

    public long Between(int from, int to) => _prefix[to + 1] - _prefix[from]; // everything up to `to`, minus everything before `from`

    public double AverageBetween(int from, int to) => (double)Between(from, to) / (to - from + 1);

    public int FirstDayReaching(long target)
    {
        int lo = 1, hi = _prefix.Length - 1;
        if (hi < 1 || _prefix[hi] < target) return -1;
        while (lo < hi)
        {
            var mid = (lo + hi) / 2;
            if (_prefix[mid] >= target) hi = mid;
            else lo = mid + 1;
        }
        return lo - 1; // _prefix[lo] includes day lo - 1
    }
}
