using Challenges.CuckooHashing;
using Xunit;

namespace Challenges.Tests;

[Trait("Lesson", "cuckoo-hashing")]
public class CuckooHashingTests
{
    [Fact]
    public void Basic_set_operations()
    {
        var s = new CuckooSet();
        Assert.True(s.Add(10));
        Assert.False(s.Add(10));
        Assert.True(s.Contains(10));
        Assert.False(s.Contains(11));
        Assert.True(s.Remove(10));
        Assert.False(s.Contains(10));
        Assert.Equal(0, s.Count);
    }

    [Fact]
    public void Survives_kicks_and_growth()
    {
        var s = new CuckooSet();
        var rnd = new Random(11);
        var vals = Enumerable.Range(0, 20_000).Select(_ => rnd.Next()).Distinct().ToArray();
        foreach (var v in vals) Assert.True(s.Add(v));
        Assert.Equal(vals.Length, s.Count);
        foreach (var v in vals) Assert.True(s.Contains(v));
        Assert.False(s.Contains(-1));
    }

    [Fact]
    public void Lookups_are_fast()
    {
        var s = new CuckooSet();
        for (var i = 0; i < 100_000; i++) s.Add(i * 31);
        Perf.Under(1500, () =>
        {
            var hits = 0;
            for (var i = 0; i < 3_000_000; i++) if (s.Contains(i)) hits++;
            Assert.Equal(96_775, hits);
        }, "3,000,000 lookups");
    }
}
