using Challenges.Tries;
using Xunit;

namespace Challenges.Tests;

[Trait("Lesson", "trie")]
public class TrieTests
{
    [Fact]
    public void Suggests_alphabetically_with_a_limit()
    {
        var a = new Autocomplete();
        foreach (var w in new[] { "card", "car", "cart", "cat", "dog", "care", "car" }) a.Add(w);
        Assert.Equal(6, a.Count);
        Assert.Equal(new[] { "car", "card", "care", "cart", "cat" }, a.Suggest("ca", 10));
        Assert.Equal(new[] { "car", "card" }, a.Suggest("car", 2));
        Assert.Empty(a.Suggest("x", 5));
        Assert.True(a.Contains("cart"));
        Assert.False(a.Contains("ca"));
    }

    [Fact]
    public void Keystrokes_on_a_big_catalogue_are_fast()
    {
        var a = new Autocomplete();
        var rnd = new Random(19);
        for (var i = 0; i < 200_000; i++)
            a.Add(new string(Enumerable.Range(0, rnd.Next(4, 10)).Select(_ => (char)('a' + rnd.Next(26))).ToArray()));
        Perf.Under(1500, () =>
        {
            for (var q = 0; q < 50_000; q++) a.Suggest(((char)('a' + q % 26)).ToString() + (char)('a' + q / 26 % 26), 10);
        }, "50,000 autocomplete lookups");
    }
}
