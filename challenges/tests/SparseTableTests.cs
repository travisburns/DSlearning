using Challenges.SparseTable;
using Xunit;

namespace Challenges.Tests;

[Trait("Lesson", "sparse-table")]
public class SparseTableTests
{
    [Fact]
    public void Matches_a_brute_force_check()
    {
        var rnd = new Random(53);
        var temps = Enumerable.Range(0, 300).Select(_ => rnd.Next(-30, 40)).ToArray();
        var c = new ColdestDay(temps);
        for (var from = 0; from < temps.Length; from += 7)
            for (var to = from; to < temps.Length; to += 5)
                Assert.Equal(temps[from..(to + 1)].Min(), c.MinBetween(from, to));
        Assert.Equal(temps[42], c.MinBetween(42, 42));
    }

    [Fact]
    public void Millions_of_queries()
    {
        var rnd = new Random(59);
        var temps = Enumerable.Range(0, 1_000_000).Select(_ => rnd.Next(-30, 40)).ToArray();
        var c = new ColdestDay(temps);
        Perf.Under(1500, () =>
        {
            long s = 0;
            for (var q = 0; q < 3_000_000; q++)
            {
                var a = q % 900_000;
                s += c.MinBetween(a, a + 50_000);
            }
            Assert.True(s < 0);
        }, "3,000,000 range-minimum queries");
    }
}
