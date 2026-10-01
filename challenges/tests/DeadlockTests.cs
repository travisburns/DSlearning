using Challenges.Deadlocks;
using Xunit;

namespace Challenges.Tests;

[Trait("Lesson", "deadlock")]
public class DeadlockTests
{
    [Fact]
    public void Transfers_move_money()
    {
        var b = new Bank(3, 100);
        Assert.True(b.Transfer(0, 2, 30));
        Assert.False(b.Transfer(1, 0, 500));
        Assert.False(b.Transfer(1, 1, 5));
        Assert.Equal(70, b.Balance(0));
        Assert.Equal(130, b.Balance(2));
        Assert.Equal(300, b.Total());
    }

    [Fact]
    public void Opposite_transfers_at_once_never_freeze()
    {
        var b = new Bank(2, 1_000_000);
        Hang.Within(10_000, () =>
        {
            var t1 = new Thread(() => { for (var i = 0; i < 200_000; i++) b.Transfer(0, 1, 1); });
            var t2 = new Thread(() => { for (var i = 0; i < 200_000; i++) b.Transfer(1, 0, 1); });
            t1.Start();
            t2.Start();
            t1.Join();
            t2.Join();
        }, "200,000 transfers each way between the same two accounts");
        Assert.Equal(2_000_000, b.Total());
    }

    [Fact]
    public void Busy_bank_keeps_every_penny()
    {
        var b = new Bank(20, 1000);
        Hang.Within(15_000, () =>
        {
            var ts = Enumerable.Range(0, 8).Select(seed => new Thread(() =>
            {
                var rnd = new Random(seed);
                for (var i = 0; i < 50_000; i++) b.Transfer(rnd.Next(20), rnd.Next(20), rnd.Next(1, 50));
            })).ToList();
            ts.ForEach(t => t.Start());
            ts.ForEach(t => t.Join());
        }, "400,000 random transfers on 8 threads");
        Assert.Equal(20_000, b.Total());
        for (var i = 0; i < 20; i++) Assert.True(b.Balance(i) >= 0);
    }

    [Fact]
    public void Finds_the_waiting_cycle()
    {
        var w = new Dictionary<string, string> { ["T1"] = "T2", ["T2"] = "T3", ["T3"] = "T1", ["T4"] = "T1" };
        var cycle = Bank.FindDeadlock(w)!;
        Assert.Equal(3, cycle.Count);
        Assert.Equal(new[] { "T1", "T2", "T3" }, cycle.OrderBy(x => x));
        for (var i = 0; i < cycle.Count; i++) Assert.Equal(cycle[(i + 1) % cycle.Count], w[cycle[i]]);
        Assert.Null(Bank.FindDeadlock(new Dictionary<string, string> { ["A"] = "B", ["B"] = "C" }));
    }
}
