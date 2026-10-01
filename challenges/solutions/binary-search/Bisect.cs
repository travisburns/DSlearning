namespace Challenges.BinarySearch;

public static class Bisect
{
    public static int FirstBad(int releases, Func<int, bool> isBad)
    {
        int lo = 1, hi = releases; // the answer is always in [lo, hi]
        while (lo < hi)
        {
            var mid = lo + (hi - lo) / 2; // avoids overflow of lo + hi
            if (isBad(mid)) hi = mid;      // mid might be the first bad one
            else lo = mid + 1;             // first bad is after mid
        }
        return lo;
    }

    public static int BracketIndex(int[] lowerLimits, long income)
    {
        int lo = 0, hi = lowerLimits.Length - 1;
        while (lo < hi)
        {
            var mid = lo + (hi - lo + 1) / 2; // round up so lo always moves
            if (lowerLimits[mid] <= income) lo = mid;
            else hi = mid - 1;
        }
        return lo;
    }
}
