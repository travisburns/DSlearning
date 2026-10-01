namespace Challenges.Deques;

public static class Ticker
{
    public static int[] WindowMax(int[] prices, int k)
    {
        var outp = new int[prices.Length - k + 1];
        var dq = new LinkedList<int>(); // indexes; their prices decrease from front to back
        for (var i = 0; i < prices.Length; i++)
        {
            while (dq.Count > 0 && prices[dq.Last!.Value] <= prices[i]) dq.RemoveLast(); // can never be the max again
            dq.AddLast(i);
            if (dq.First!.Value <= i - k) dq.RemoveFirst(); // left the window
            if (i >= k - 1) outp[i - k + 1] = prices[dq.First.Value];
        }
        return outp;
    }
}
