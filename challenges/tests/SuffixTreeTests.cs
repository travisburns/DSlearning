using Challenges.SuffixTrees;
using Xunit;

namespace Challenges.Tests;

[Trait("Lesson", "suffix-tree")]
public class SuffixTreeTests
{
    [Fact]
    public void Longest_repeat()
    {
        Assert.Equal("ana", Repeats.LongestRepeat("banana"));
        Assert.Equal("", Repeats.LongestRepeat("abcd"));
        Assert.Equal("aaa", Repeats.LongestRepeat("aaaa"));
        Assert.Equal("the cat ", Repeats.LongestRepeat("the cat sat on the cat mat"));
    }

    [Fact]
    public void Distinct_substrings()
    {
        Assert.Equal(15, Repeats.DistinctSubstrings("banana"));
        Assert.Equal(4, Repeats.DistinctSubstrings("aaaa"));
        Assert.Equal(0, Repeats.DistinctSubstrings(""));
    }

    [Fact]
    public void Matches_brute_force()
    {
        var rnd = new Random(109);
        for (var t = 0; t < 30; t++)
        {
            var s = new string(Enumerable.Range(0, rnd.Next(1, 40)).Select(_ => "ab"[rnd.Next(2)]).ToArray());
            var subs = new HashSet<string>();
            for (var i = 0; i < s.Length; i++) for (var j = i + 1; j <= s.Length; j++) subs.Add(s[i..j]);
            Assert.Equal(subs.Count, Repeats.DistinctSubstrings(s));
            var repeated = subs.Where(x => Enumerable.Range(0, s.Length - x.Length + 1).Count(i => string.CompareOrdinal(s, i, x, 0, x.Length) == 0) >= 2).ToList();
            var expected = repeated.Count == 0 ? "" : repeated.OrderByDescending(x => x.Length).ThenBy(x => x, StringComparer.Ordinal).First();
            Assert.Equal(expected, Repeats.LongestRepeat(s));
        }
    }

    [Fact]
    public void Long_document()
    {
        var rnd = new Random(113);
        var words = new[] { "the ", "cat ", "sat ", "on ", "a ", "mat ", "and ", "then " };
        var text = string.Concat(Enumerable.Range(0, 12_000).Select(_ => words[rnd.Next(words.Length)]));
        Perf.Under(2000, () => Assert.True(Repeats.LongestRepeat(text).Length > 10), "a 50,000-char document");
    }
}
