namespace Challenges.SlidingWindow;

public static class Traffic
{
    public static long PeakLoad(int[] perSecond, int k)
    {
        long sum = 0;
        for (var i = 0; i < k; i++) sum += perSecond[i];
        var best = sum;
        for (var i = k; i < perSecond.Length; i++)
        {
            sum += perSecond[i] - perSecond[i - k]; // one in, one out
            best = Math.Max(best, sum);
        }
        return best;
    }

    public static int LongestUniqueStreak(string[] pages)
    {
        var lastSeen = new Dictionary<string, int>();
        int best = 0, left = 0;
        for (var right = 0; right < pages.Length; right++)
        {
            if (lastSeen.TryGetValue(pages[right], out var at) && at >= left) left = at + 1; // jump past the repeat
            lastSeen[pages[right]] = right;
            best = Math.Max(best, right - left + 1);
        }
        return best;
    }
}
