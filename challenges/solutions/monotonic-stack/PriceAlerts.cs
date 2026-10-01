namespace Challenges.MonotonicStack;

public static class PriceAlerts
{
    public static int[] DaysUntilHigher(int[] prices)
    {
        var answer = new int[prices.Length];
        var waiting = new Stack<int>(); // days without an answer yet; prices fall from bottom to top
        for (var day = 0; day < prices.Length; day++)
        {
            while (waiting.Count > 0 && prices[waiting.Peek()] < prices[day])
            {
                var d = waiting.Pop();
                answer[d] = day - d;
            }
            waiting.Push(day);
        }
        return answer; // anything still waiting keeps 0
    }
}
