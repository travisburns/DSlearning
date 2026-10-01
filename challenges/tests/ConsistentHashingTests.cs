using Challenges.ConsistentHashing;
using Xunit;

namespace Challenges.Tests;

[Trait("Lesson", "consistent-hashing")]
public class ConsistentHashingTests
{
    private static readonly string[] Keys = Enumerable.Range(0, 20_000).Select(i => "session:" + i).ToArray();

    private static HashRing Ring(params string[] servers)
    {
        var r = new HashRing();
        foreach (var s in servers) r.AddServer(s);
        return r;
    }

    [Fact]
    public void Same_key_same_server() => Assert.Equal(Ring("a", "b", "c").ServerFor("user:1"), Ring("a", "b", "c").ServerFor("user:1"));

    [Fact]
    public void Load_is_roughly_even()
    {
        var r = Ring("a", "b", "c", "d");
        var counts = Keys.GroupBy(r.ServerFor).ToDictionary(g => g.Key, g => g.Count());
        Assert.Equal(4, counts.Count);
        foreach (var c in counts.Values) Assert.InRange(c, 3_000, 7_000); // 5,000 if perfectly even
    }

    [Fact]
    public void Adding_a_server_moves_few_keys()
    {
        var before = Ring("a", "b", "c", "d");
        var after = Ring("a", "b", "c", "d", "e");
        var moved = Keys.Count(k => before.ServerFor(k) != after.ServerFor(k));
        Assert.InRange(moved, 1, Keys.Length * 35 / 100);
        Assert.All(Keys.Where(k => before.ServerFor(k) != after.ServerFor(k)), k => Assert.Equal("e", after.ServerFor(k)));
    }

    [Fact]
    public void Removing_a_server_only_moves_its_keys()
    {
        var r = Ring("a", "b", "c");
        var owner = Keys.ToDictionary(k => k, r.ServerFor);
        r.RemoveServer("b");
        foreach (var k in Keys) if (owner[k] != "b") Assert.Equal(owner[k], r.ServerFor(k));
    }
}
