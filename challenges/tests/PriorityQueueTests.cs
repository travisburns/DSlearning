using Challenges.PriorityQueues;
using Xunit;

namespace Challenges.Tests;

[Trait("Lesson", "priority-queue")]
public class PriorityQueueTests
{
    [Fact]
    public void Most_urgent_first_then_longest_waiting()
    {
        var t = new Triage();
        t.Add("typo", 5);
        t.Add("login-slow", 3);
        t.Add("site-down", 1);
        t.Add("checkout-slow", 3);
        Assert.Equal(4, t.Count);
        Assert.Equal("site-down", t.Next());
        Assert.Equal("login-slow", t.Next());
        Assert.Equal("checkout-slow", t.Next());
        Assert.Equal("typo", t.Next());
        Assert.Null(t.Next());
    }

    [Fact]
    public void Busy_day_is_fast() =>
        Perf.Under(1500, () =>
        {
            var t = new Triage();
            var rnd = new Random(5);
            for (var i = 0; i < 300_000; i++)
            {
                t.Add("t" + i, rnd.Next(1, 6));
                if (i % 3 == 0) t.Next();
            }
            while (t.Next() != null) { }
        }, "300,000 tickets");
}
