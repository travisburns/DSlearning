using Challenges.Caches;
using Xunit;

namespace Challenges.Tests;

[Trait("Lesson", "cpu-caches")]
public class CpuCachesTests
{
    [Fact]
    public void Sequential_reads_miss_once_per_line()
    {
        var c = new CacheSim(64, 64, 1);
        for (var i = 0; i < 4096; i++) c.Access(i * 4L);
        Assert.Equal(256, c.Misses);
        Assert.Equal(3840, c.Hits);
    }

    [Fact]
    public void Lru_within_a_set()
    {
        var c = new CacheSim(64, 1, 2);
        var got = new[] { 0L, 64, 0, 128, 64, 0 }.Select(c.Access).ToArray();
        Assert.Equal(new[] { false, false, true, false, false, false }, got);
    }

    [Fact]
    public void Direct_mapped_conflicts()
    {
        var c = new CacheSim(16, 4, 1);
        var got = new[] { 0L, 4, 16, 64, 0, 68, 4 }.Select(c.Access).ToArray();
        // 0 and 64 are different lines that map to the same set, so they keep evicting each other.
        Assert.Equal(new[] { false, true, false, false, false, false, false }, got);
        Assert.Equal(1, c.Hits);
        Assert.Equal(6, c.Misses);
        c.Reset();
        Assert.Equal(0, c.Hits + c.Misses);
        Assert.False(c.Access(4));
    }

    [Fact]
    public void Row_order_beats_column_order()
    {
        var c = new CacheSim(64, 64, 1); // 4 KB direct-mapped
        Assert.Equal((3840, 256), Traversal.SumMatrix(c, 64, rowByRow: true));
        Assert.Equal((0, 4096), Traversal.SumMatrix(c, 64, rowByRow: false));
    }

    [Fact]
    public void Associativity_rescues_column_order()
    {
        // Same 4 KB, but 16 sets of 16 ways: the conflicting lines can now live side by side.
        var c = new CacheSim(64, 16, 16);
        Assert.Equal((3840, 256), Traversal.SumMatrix(c, 64, rowByRow: false));
    }

    [Fact]
    public void Matches_a_brute_force_model()
    {
        var rng = new Random(3);
        foreach (var (lb, sets, ways) in new[] { (16, 8, 2), (32, 1, 8), (64, 4, 4), (8, 32, 1) })
        {
            var c = new CacheSim(lb, sets, ways);
            var model = Enumerable.Range(0, sets).Select(_ => new List<long>()).ToArray();
            for (var i = 0; i < 20_000; i++)
            {
                var a = rng.Next(0, 4096);
                var line = a / lb;
                var s = model[line % sets];
                var hit = s.Remove(line);
                s.Add(line);
                if (s.Count > ways) s.RemoveAt(0);
                Assert.Equal(hit, c.Access(a));
            }
        }
    }

    [Fact]
    public void Simulating_millions_of_accesses_is_fast()
    {
        var c = new CacheSim(64, 512, 8);
        Perf.Under(2000, () => Traversal.SumMatrix(c, 1500, rowByRow: false), "2.25 million simulated accesses");
    }
}
