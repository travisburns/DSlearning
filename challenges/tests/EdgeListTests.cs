using Challenges.EdgeList;
using Xunit;

namespace Challenges.Tests;

[Trait("Lesson", "edge-list")]
public class EdgeListTests
{
    private const string Csv = "from,to,km\nLeeds, York ,40\n\nYork,Hull,60\nLeeds,Hull,95\nHull,Grimsby,60\n";

    [Fact]
    public void Parses_and_reports()
    {
        var roads = Roads.Parse(Csv);
        Assert.Equal(4, roads.Count);
        Assert.Equal(new Road("Leeds", "York", 40), roads[0]);
        Assert.Equal(255, Roads.TotalKm(roads));
        Assert.Equal(new[] { 95, 60, 60 }, Roads.Longest(roads, 3).Select(r => r.Km));
        Assert.Equal("York", Roads.Longest(roads, 3)[1].A); // ties keep original order
    }

    [Fact]
    public void Adjacency_goes_both_ways()
    {
        var adj = Roads.ToAdjacency(Roads.Parse(Csv));
        Assert.Equal(new[] { ("York", 40), ("Hull", 95) }, adj["Leeds"]);
        Assert.Equal(3, adj["Hull"].Count);
        Assert.Contains(("Leeds", 40), adj["York"]);
    }
}
