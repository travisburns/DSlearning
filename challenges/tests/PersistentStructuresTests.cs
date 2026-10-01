using Challenges.Persistent;
using Xunit;

namespace Challenges.Tests;

[Trait("Lesson", "persistent-structures")]
public class PersistentStructuresTests
{
    [Fact]
    public void Old_versions_never_change()
    {
        var m = new VersionedMap();
        var v1 = m.Set("theme", "light");
        var v2 = m.Set("font", "serif");
        var v3 = m.Set("theme", "dark");
        var v4 = m.Remove("font");
        Assert.Equal(4, m.Latest);
        Assert.Equal("light", m.Get(v1, "theme"));
        Assert.Null(m.Get(v1, "font"));
        Assert.Equal("serif", m.Get(v2, "font"));
        Assert.Equal("dark", m.Get(v3, "theme"));
        Assert.Null(m.Get(v4, "font"));
        Assert.Equal(0, m.Count(0));
        Assert.Equal(2, m.Count(v3));
        Assert.Equal(1, m.Count(v4));
        var v5 = m.Restore(v2);
        Assert.Equal("light", m.Get(v5, "theme"));
        Assert.Equal("serif", m.Get(v5, "font"));
        Assert.Equal("dark", m.Get(v3, "theme"));
    }

    [Fact]
    public void Matches_full_copies()
    {
        var rnd = new Random(173);
        var m = new VersionedMap();
        var snapshots = new List<Dictionary<string, string>> { new() };
        for (var i = 0; i < 400; i++)
        {
            var copy = new Dictionary<string, string>(snapshots[^1]);
            var k = "k" + rnd.Next(60);
            if (rnd.Next(4) == 0)
            {
                copy.Remove(k);
                m.Remove(k);
            }
            else
            {
                copy[k] = "v" + i;
                m.Set(k, "v" + i);
            }
            snapshots.Add(copy);
        }
        for (var v = 0; v < snapshots.Count; v += 7)
        {
            Assert.Equal(snapshots[v].Count, m.Count(v));
            for (var k = 0; k < 60; k++) Assert.Equal(snapshots[v].GetValueOrDefault("k" + k), m.Get(v, "k" + k));
        }
    }

    [Fact]
    public void Thousands_of_versions() =>
        Perf.Under(1500, () =>
        {
            var m = new VersionedMap();
            var rnd = new Random(179);
            for (var i = 0; i < 20_000; i++) m.Set("key" + rnd.Next(20_000), "v" + i);
            for (var i = 0; i < 20_000; i++) m.Set("key" + rnd.Next(20_000), "w" + i);
            for (var q = 0; q < 200_000; q++) m.Get(rnd.Next(m.Latest + 1), "key" + rnd.Next(20_000));
            Assert.Equal(40_000, m.Latest);
        }, "40,000 versions and 200,000 historical lookups");
}
