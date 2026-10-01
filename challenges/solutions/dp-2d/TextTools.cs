namespace Challenges.Dp2d;

public static class TextTools
{
    public static int CommonLines(string[] a, string[] b)
    {
        var dp = new int[a.Length + 1, b.Length + 1];
        for (var i = 1; i <= a.Length; i++)
            for (var j = 1; j <= b.Length; j++)
                dp[i, j] = a[i - 1] == b[j - 1] ? dp[i - 1, j - 1] + 1 : Math.Max(dp[i - 1, j], dp[i, j - 1]);
        return dp[a.Length, b.Length];
    }

    public static int EditDistance(string a, string b)
    {
        var dp = new int[a.Length + 1, b.Length + 1];
        for (var i = 0; i <= a.Length; i++) dp[i, 0] = i; // delete everything
        for (var j = 0; j <= b.Length; j++) dp[0, j] = j; // insert everything
        for (var i = 1; i <= a.Length; i++)
            for (var j = 1; j <= b.Length; j++)
                dp[i, j] = a[i - 1] == b[j - 1]
                    ? dp[i - 1, j - 1]
                    : 1 + Math.Min(dp[i - 1, j - 1], Math.Min(dp[i - 1, j], dp[i, j - 1])); // replace, delete, insert
        return dp[a.Length, b.Length];
    }

    public static string Suggest(string typed, string[] dictionary)
    {
        var best = dictionary[0];
        var bestD = int.MaxValue;
        foreach (var w in dictionary)
        {
            var d = EditDistance(typed, w);
            if (d < bestD) (best, bestD) = (w, d);
        }
        return best;
    }
}
