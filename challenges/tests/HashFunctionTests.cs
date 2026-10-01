using Challenges.HashFunction;
using Xunit;

namespace Challenges.Tests;

[Trait("Lesson", "hash-function")]
public class HashFunctionTests
{
    [Theory]
    [InlineData("", 2166136261u)]
    [InlineData("a", 0xE40C292Cu)]
    [InlineData("foobar", 0xBF9CF968u)]
    public void Known_values(string s, uint expected) => Assert.Equal(expected, Sharding.Fnv1a(s));

    [Fact]
    public void Same_input_same_shard() => Assert.Equal(Sharding.ShardFor("user-42", 8), Sharding.ShardFor("user-42", 8));

    [Fact]
    public void Users_spread_evenly()
    {
        var counts = new int[8];
        for (var i = 0; i < 100_000; i++) counts[Sharding.ShardFor("user-" + i, 8)]++;
        foreach (var c in counts) Assert.InRange(c, 11_000, 14_000); // 12,500 each if perfectly even
    }
}
