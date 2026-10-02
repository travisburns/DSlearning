using Challenges.Routing;
using Xunit;

namespace Challenges.Tests;

[Trait("Lesson", "packets-ip")]
public class PacketsIpTests
{
    [Theory]
    [InlineData("0.0.0.0", 0u)]
    [InlineData("10.0.0.1", 167772161u)]
    [InlineData("192.168.1.20", 3232235796u)]
    [InlineData("255.255.255.255", 4294967295u)]
    public void Parse_and_format_round_trip(string ip, uint n)
    {
        Assert.Equal(n, RoutingTable.Parse(ip));
        Assert.Equal(ip, RoutingTable.Format(n));
    }

    [Theory]
    [InlineData("256.1.1.1")]
    [InlineData("1.2.3")]
    [InlineData("1.2.3.4.5")]
    [InlineData("1.2..4")]
    [InlineData("a.b.c.d")]
    [InlineData("1.2.3.-4")]
    public void Parse_rejects_bad_addresses(string ip) => Assert.Throws<FormatException>(() => RoutingTable.Parse(ip));

    [Theory]
    [InlineData("192.168.1.0/24", "192.168.1.200", true)]
    [InlineData("192.168.1.0/24", "192.168.2.7", false)]
    [InlineData("10.0.0.0/8", "10.250.3.4", true)]
    [InlineData("10.0.0.0/8", "11.0.0.1", false)]
    [InlineData("172.16.0.0/12", "172.31.255.255", true)]
    [InlineData("172.16.0.0/12", "172.32.0.0", false)]
    [InlineData("0.0.0.0/0", "8.8.8.8", true)]
    [InlineData("8.8.8.8/32", "8.8.8.8", true)]
    [InlineData("8.8.8.8/32", "8.8.8.9", false)]
    public void Contains_checks_the_prefix_bits(string cidr, string ip, bool inside) => Assert.Equal(inside, RoutingTable.Contains(cidr, ip));

    [Fact]
    public void Longest_prefix_wins()
    {
        var t = new RoutingTable();
        t.Add("0.0.0.0/0", "internet");
        t.Add("10.0.0.0/8", "corp");
        t.Add("10.4.0.0/16", "vpn");
        t.Add("10.4.7.0/24", "lab");
        Assert.Equal("lab", t.Route("10.4.7.99"));
        Assert.Equal("vpn", t.Route("10.4.8.1"));
        Assert.Equal("corp", t.Route("10.5.0.1"));
        Assert.Equal("internet", t.Route("8.8.8.8"));
    }

    [Fact]
    public void No_default_route_means_null()
    {
        var t = new RoutingTable();
        t.Add("192.168.0.0/16", "lan");
        Assert.Equal("lan", t.Route("192.168.3.3"));
        Assert.Null(t.Route("192.169.0.1"));
    }

    [Fact]
    public void Host_bits_are_ignored_and_re_adding_replaces()
    {
        var t = new RoutingTable();
        t.Add("10.4.9.9/16", "old");
        t.Add("10.4.0.0/16", "new");
        Assert.Equal("new", t.Route("10.4.200.1"));
        t.Add("1.2.3.4/32", "host");
        Assert.Equal("host", t.Route("1.2.3.4"));
        Assert.Null(t.Route("1.2.3.5"));
    }

    [Fact]
    public void Add_rejects_bad_routes()
    {
        var t = new RoutingTable();
        Assert.Throws<FormatException>(() => t.Add("10.0.0.0/33", "x"));
        Assert.Throws<FormatException>(() => t.Add("10.0.0.0/-1", "x"));
        Assert.Throws<FormatException>(() => t.Add("10.0.0.0", "x"));
        Assert.Throws<FormatException>(() => t.Add("10.0.0/8", "x"));
    }

    [Fact]
    public void Matches_a_brute_force_scan()
    {
        var rng = new Random(7);
        var t = new RoutingTable();
        var routes = new List<(uint Net, int Len, string Hop)>();
        for (var i = 0; i < 300; i++)
        {
            var len = rng.Next(4, 29);
            var mask = uint.MaxValue << (32 - len);
            var net = (uint)rng.Next(0, 64) << 24 | (uint)rng.Next() & 0x00FFFFFF;
            net &= mask;
            var hop = $"h{i}";
            routes.RemoveAll(r => r.Net == net && r.Len == len);
            routes.Add((net, len, hop));
            t.Add($"{RoutingTable.Format(net)}/{len}", hop);
        }
        for (var i = 0; i < 2000; i++)
        {
            var ip = (uint)rng.Next(0, 64) << 24 | (uint)rng.Next() & 0x00FFFFFF;
            var best = routes.Where(r => (ip & (uint.MaxValue << (32 - r.Len))) == r.Net).OrderByDescending(r => r.Len).FirstOrDefault();
            Assert.Equal(best.Hop, t.Route(RoutingTable.Format(ip)));
        }
    }

    [Fact]
    public void Large_table_is_fast()
    {
        var rng = new Random(1);
        var t = new RoutingTable();
        t.Add("0.0.0.0/0", "default");
        for (var i = 0; i < 50_000; i++)
        {
            var len = rng.Next(8, 33);
            t.Add($"{RoutingTable.Format((uint)rng.Next() << 1)}/{len}", $"h{i}");
        }
        var ips = Enumerable.Range(0, 200_000).Select(_ => RoutingTable.Format((uint)rng.Next() << 1)).ToArray();
        Perf.Under(1500, () =>
        {
            foreach (var ip in ips) Assert.NotNull(t.Route(ip));
        }, "200,000 lookups in a 50,000-route table");
    }
}
