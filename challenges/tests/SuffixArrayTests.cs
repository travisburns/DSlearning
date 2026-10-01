using Challenges.SuffixArrays;
using Xunit;

namespace Challenges.Tests;

[Trait("Lesson", "suffix-array")]
public class SuffixArrayTests
{
    [Fact]
    public void Banana()
    {
        var idx = new SuffixIndex("banana");
        Assert.Equal(new[] { 5, 3, 1, 0, 4, 2 }, idx.Array);
        Assert.Equal(2, idx.Count("ana"));
        Assert.Equal(new[] { 1, 3 }, idx.Positions("ana"));
        Assert.Equal(3, idx.Count("a"));
        Assert.Equal(0, idx.Count("nab"));
        Assert.Equal(new[] { 0 }, idx.Positions("banana"));
    }

    [Fact]
    public void Matches_brute_force()
    {
        var rnd = new Random(107);
        var text = new string(Enumerable.Range(0, 500).Select(_ => "abc"[rnd.Next(3)]).ToArray());
        var idx = new SuffixIndex(text);
        var expectedSa = Enumerable.Range(0, text.Length).OrderBy(i => text[i..], StringComparer.Ordinal).ToArray();
        Assert.Equal(expectedSa, idx.Array);
        foreach (var p in new[] { "ab", "cab", "aaa", "bcb", "c" })
        {
            var expected = Enumerable.Range(0, text.Length - p.Length + 1).Where(i => string.CompareOrdinal(text, i, p, 0, p.Length) == 0).ToList();
            Assert.Equal(expected, idx.Positions(p));
        }
    }

    [Fact]
    public void Repetitive_text_builds_fast()
    {
        var text = new string('a', 60_000) + "b" + new string('a', 20_000);
        Perf.Under(2000, () =>
        {
            var idx = new SuffixIndex(text);
            Assert.Equal(1, idx.Count("ab"));
        }, "indexing an 80,000-char repetitive document");
    }
}
