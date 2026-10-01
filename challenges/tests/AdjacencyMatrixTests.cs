using Challenges.AdjacencyMatrix;
using Xunit;

namespace Challenges.Tests;

[Trait("Lesson", "adjacency-matrix")]
public class AdjacencyMatrixTests
{
    private static RouteTable Sample()
    {
        var r = new RouteTable(new[] { "LHR", "CDG", "AMS", "BER", "MAD" });
        r.AddFlight("LHR", "CDG", 90);
        r.AddFlight("LHR", "AMS", 70);
        r.AddFlight("AMS", "BER", 60);
        r.AddFlight("CDG", "BER", 50);
        r.AddFlight("BER", "MAD", 120);
        return r;
    }

    [Fact]
    public void Direct_flights_are_one_way()
    {
        var r = Sample();
        Assert.True(r.HasDirect("LHR", "CDG"));
        Assert.False(r.HasDirect("CDG", "LHR"));
        Assert.Equal(70, r.Price("LHR", "AMS"));
        Assert.Equal(0, r.Price("MAD", "LHR"));
        Assert.Equal(new[] { "CDG", "AMS" }, r.Destinations("LHR"));
    }

    [Fact]
    public void One_stop()
    {
        var r = Sample();
        Assert.Equal(130, r.CheapestWithOneStop("LHR", "BER")); // via AMS (70 + 60) beats CDG (90 + 50)
        Assert.Equal(-1, r.CheapestWithOneStop("LHR", "MAD"));
    }
}
