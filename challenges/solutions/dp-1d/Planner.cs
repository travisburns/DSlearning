namespace Challenges.Dp1d;

public static class Planner
{
    public static long MaxAdRevenue(int[] slots)
    {
        long skip2 = 0, skip1 = 0; // best totals up to two slots back and one slot back
        foreach (var v in slots)
        {
            var best = Math.Max(skip1, skip2 + v); // leave this slot, or use it on top of best-two-back
            skip2 = skip1;
            skip1 = best;
        }
        return skip1;
    }

    public static int MinCoins(int amount, int[] coins)
    {
        var best = new int[amount + 1];
        Array.Fill(best, int.MaxValue);
        best[0] = 0;
        for (var a = 1; a <= amount; a++)
            foreach (var c in coins)
                if (c <= a && best[a - c] != int.MaxValue) best[a] = Math.Min(best[a], best[a - c] + 1);
        return best[amount] == int.MaxValue ? -1 : best[amount];
    }
}
