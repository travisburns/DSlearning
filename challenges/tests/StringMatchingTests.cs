using Challenges.StringMatching;
using Xunit;

namespace Challenges.Tests;

[Trait("Lesson", "string-matching")]
public class StringMatchingTests
{
    [Fact]
    public void Finds_every_match()
    {
        Assert.Equal(new[] { 0, 8 }, Finder.FindAll("the cat the", "the"));
        Assert.Equal(new[] { 0, 1, 2 }, Finder.FindAll("aaaa", "aa"));
        Assert.Empty(Finder.FindAll("abc", "abcd"));
        Assert.Empty(Finder.FindAll("abc", "x"));
        Assert.Equal(new[] { 4 }, Finder.FindAll("abcdefg", "efg"));
    }

    [Fact]
    public void Repetitive_documents_are_fast()
    {
        var text = new string('a', 1_000_000) + "b";
        var pattern = new string('a', 5_000) + "b";
        Perf.Under(1500, () => Assert.Equal(new[] { 995_000 }, Finder.FindAll(text, pattern)), "searching a 1,000,000-char repetitive document");
    }
}
