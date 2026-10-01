using Challenges.Dp2d;
using Xunit;

namespace Challenges.Tests;

[Trait("Lesson", "dp-2d")]
public class Dp2dTests
{
    [Fact]
    public void Common_lines()
    {
        var v1 = new[] { "using X;", "class A {", "int a;", "int b;", "}" };
        var v2 = new[] { "using X;", "using Y;", "class A {", "int b;", "int c;", "}" };
        Assert.Equal(4, TextTools.CommonLines(v1, v2));
        Assert.Equal(0, TextTools.CommonLines(v1, Array.Empty<string>()));
    }

    [Fact]
    public void Edit_distance()
    {
        Assert.Equal(3, TextTools.EditDistance("kitten", "sitting"));
        Assert.Equal(0, TextTools.EditDistance("same", "same"));
        Assert.Equal(4, TextTools.EditDistance("", "abcd"));
        Assert.Equal(2, TextTools.EditDistance("recieve", "receive")); // a swap is two replacements
    }

    [Fact]
    public void Suggestion()
    {
        var dict = new[] { "account", "accommodate", "accumulate" };
        Assert.Equal("accommodate", TextTools.Suggest("accomodate", dict));
    }

    [Fact]
    public void Big_files()
    {
        var a = Enumerable.Range(0, 2000).Select(i => "line " + i % 50).ToArray();
        var b = Enumerable.Range(0, 2000).Select(i => "line " + i % 47).ToArray();
        Perf.Under(1500, () => Assert.True(TextTools.CommonLines(a, b) > 0), "diffing two 2,000-line files");
    }
}
