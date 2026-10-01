using Challenges.HashMaps;
using Xunit;

namespace Challenges.Tests;

[Trait("Lesson", "hash-map")]
public class HashMapTests
{
    [Fact]
    public void Shorten_and_resolve()
    {
        var s = new Shortener();
        var a = s.Shorten("https://example.com/a");
        var b = s.Shorten("https://example.com/b");
        Assert.Equal("1", a);
        Assert.Equal("2", b);
        Assert.Equal(a, s.Shorten("https://example.com/a"));
        Assert.Equal("https://example.com/b", s.Resolve(b));
        Assert.Null(s.Resolve("zzz"));
        Assert.Equal(2, s.Count);
    }

    [Fact]
    public void Base62_codes()
    {
        var s = new Shortener();
        string last = "";
        for (var i = 1; i <= 62; i++) last = s.Shorten("u" + i);
        Assert.Equal("10", last);
        Assert.Equal("u61", s.Resolve("Z"));
    }

    [Fact]
    public void Many_links()
    {
        var urls = Enumerable.Range(0, 300_000).Select(i => "https://site.com/page/" + i).ToArray();
        Perf.Under(1500, () =>
        {
            var s = new Shortener();
            var codes = urls.Select(s.Shorten).ToArray();
            for (var i = 0; i < urls.Length; i++) Assert.Equal(urls[i], s.Resolve(codes[i]));
        }, "300,000 links");
    }
}
