using Challenges.Dns;
using Xunit;

namespace Challenges.Tests;

[Trait("Lesson", "dns")]
public class DnsTests
{
    private long _now = 1000;
    private readonly Dictionary<string, DnsRecord> _zone = new();
    private readonly List<string> _asked = new();

    private DnsResolver Make() => new(name =>
    {
        _asked.Add(name);
        return _zone.GetValueOrDefault(name);
    }, () => _now);

    private void A(string name, string ip, int ttl) => _zone[name] = new DnsRecord(name, "A", ip, ttl);

    private void Cname(string name, string target, int ttl) => _zone[name] = new DnsRecord(name, "CNAME", target, ttl);

    [Fact]
    public void Answers_from_cache_until_the_ttl_expires()
    {
        A("api.example.com", "10.0.0.1", 60);
        var r = Make();
        Assert.Equal("10.0.0.1", r.Resolve("api.example.com"));
        _now += 59;
        Assert.Equal("10.0.0.1", r.Resolve("api.example.com"));
        Assert.Single(_asked);
        A("api.example.com", "10.0.0.2", 60);
        Assert.Equal("10.0.0.1", r.Resolve("api.example.com"));
        _now += 1;
        Assert.Equal("10.0.0.2", r.Resolve("api.example.com"));
        Assert.Equal(2, _asked.Count);
    }

    [Fact]
    public void Names_are_case_insensitive_and_ignore_a_trailing_dot()
    {
        A("shop.example.com", "1.2.3.4", 300);
        var r = Make();
        Assert.Equal("1.2.3.4", r.Resolve("Shop.Example.COM."));
        Assert.Equal("1.2.3.4", r.Resolve("shop.example.com"));
        Assert.Single(_asked);
        Assert.Equal("shop.example.com", _asked[0]);
    }

    [Fact]
    public void Missing_names_are_null_and_not_cached()
    {
        var r = Make();
        Assert.Null(r.Resolve("nope.example.com"));
        A("nope.example.com", "5.5.5.5", 60);
        Assert.Equal("5.5.5.5", r.Resolve("nope.example.com"));
    }

    [Fact]
    public void Follows_cname_chains_and_caches_each_link_separately()
    {
        Cname("www.shop.com", "shop.cdn.net", 3600);
        Cname("shop.cdn.net", "edge7.cdn.net", 300);
        A("edge7.cdn.net", "9.9.9.9", 20);
        var r = Make();
        Assert.Equal("9.9.9.9", r.Resolve("www.shop.com"));
        Assert.Equal(3, _asked.Count);
        Assert.Equal(3, r.CacheSize);
        _now += 20;
        Assert.Equal(2, r.CacheSize);
        A("edge7.cdn.net", "8.8.8.8", 20);
        Assert.Equal("8.8.8.8", r.Resolve("www.shop.com"));
        Assert.Equal(4, _asked.Count);
        Assert.Equal("edge7.cdn.net", _asked[3]);
    }

    [Fact]
    public void A_broken_chain_resolves_to_null()
    {
        Cname("old.example.com", "gone.example.com", 60);
        Assert.Null(Make().Resolve("old.example.com"));
    }

    [Fact]
    public void Loops_and_very_long_chains_throw()
    {
        Cname("a.com", "b.com", 60);
        Cname("b.com", "a.com", 60);
        Assert.Throws<InvalidOperationException>(() => Make().Resolve("a.com"));

        for (var i = 0; i < 9; i++) Cname($"n{i}.com", $"n{i + 1}.com", 60);
        A("n9.com", "7.7.7.7", 60);
        Assert.Throws<InvalidOperationException>(() => Make().Resolve("n0.com"));
        Assert.Equal("7.7.7.7", Make().Resolve("n1.com"));
    }

    [Fact]
    public void Heavy_traffic_rarely_reaches_the_authority()
    {
        for (var i = 0; i < 5; i++) A($"svc{i}.internal", $"10.1.0.{i}", 30);
        var r = Make();
        for (var t = 0; t < 600; t++)
        {
            for (var k = 0; k < 50; k++) Assert.Equal($"10.1.0.{k % 5}", r.Resolve($"svc{k % 5}.internal"));
            _now++;
        }
        // 600 seconds with a 30 s TTL: 20 lookups per name.
        Assert.Equal(100, _asked.Count);
    }
}
