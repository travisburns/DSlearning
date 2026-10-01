using Challenges.Fenwick;
using Xunit;

namespace Challenges.Tests;

[Trait("Lesson", "fenwick-tree")]
public class FenwickTreeTests
{
    [Fact]
    public void Counts_votes()
    {
        var v = new VoteCounter(8);
        v.Add(3, 10);
        v.Add(5, 4);
        v.Add(8, 7);
        v.Add(3, 1);
        Assert.Equal(11, v.Votes(3));
        Assert.Equal(11, v.UpTo(4));
        Assert.Equal(22, v.UpTo(8));
        Assert.Equal(15, v.Between(3, 5));
        Assert.Equal(0, v.Between(1, 2));
    }

    [Fact]
    public void Matches_brute_force()
    {
        var rnd = new Random(71);
        var v = new VoteCounter(200);
        var copy = new long[201];
        for (var i = 0; i < 3000; i++)
        {
            var c = rnd.Next(1, 201);
            var n = rnd.Next(1, 50);
            v.Add(c, n);
            copy[c] += n;
            var k = rnd.Next(1, 201);
            Assert.Equal(copy[1..(k + 1)].Sum(), v.UpTo(k));
        }
    }

    [Fact]
    public void Live_vote() =>
        Perf.Under(1500, () =>
        {
            var v = new VoteCounter(1_000_000);
            for (var i = 0; i < 2_000_000; i++)
            {
                v.Add(i % 1_000_000 + 1, 1);
                if (i % 2 == 0) v.Between(i % 1000 + 1, 900_000);
            }
            Assert.Equal(2_000_000, v.UpTo(1_000_000));
        }, "2,000,000 votes and 1,000,000 range totals");
}
