namespace Challenges.HashingPatterns;

public static class Checkout
{
    public static (int, int)? TwoItemsFor(int[] prices, int card)
    {
        var seen = new Dictionary<int, int>(); // price → index where we saw it
        for (var j = 0; j < prices.Length; j++)
        {
            if (seen.TryGetValue(card - prices[j], out var i)) return (i, j); // partner already seen
            seen.TryAdd(prices[j], j);
        }
        return null;
    }

    public static int? FirstRepeat(int[] orderIds)
    {
        var seen = new HashSet<int>();
        foreach (var id in orderIds)
            if (!seen.Add(id)) return id; // Add returns false if it was already there
        return null;
    }

    public static List<string> TopSellers(string[] orders, int k)
    {
        var counts = new Dictionary<string, int>();
        foreach (var o in orders) counts[o] = counts.GetValueOrDefault(o) + 1;
        return counts.OrderByDescending(kv => kv.Value).ThenBy(kv => kv.Key, StringComparer.Ordinal).Take(k).Select(kv => kv.Key).ToList();
    }
}
