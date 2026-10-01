using Challenges.Greedy;
using Xunit;

namespace Challenges.Tests;

[Trait("Lesson", "greedy")]
public class GreedyTests
{
    [Fact]
    public void Fits_the_most_meetings()
    {
        var req = new List<(int, int)> { (1, 4), (3, 5), (0, 6), (5, 7), (3, 9), (5, 9), (6, 10), (8, 11), (8, 12), (2, 14), (12, 16) };
        var got = Rooms.MaxMeetings(req);
        Assert.Equal(4, got.Count);
        for (var i = 1; i < got.Count; i++) Assert.True(got[i].Start >= got[i - 1].End);
    }

    [Fact]
    public void Back_to_back_is_allowed()
    {
        Assert.Equal(3, Rooms.MaxMeetings(new List<(int, int)> { (1, 2), (2, 3), (3, 4) }).Count);
        Assert.Equal(1, Rooms.RoomsNeeded(new List<(int, int)> { (1, 2), (2, 3), (3, 4) }));
    }

    [Fact]
    public void Rooms_needed()
    {
        Assert.Equal(2, Rooms.RoomsNeeded(new List<(int, int)> { (0, 30), (5, 10), (15, 20) }));
        Assert.Equal(4, Rooms.RoomsNeeded(new List<(int, int)> { (1, 10), (2, 7), (3, 19), (8, 12), (10, 20), (11, 30) })); // at time 11
        Assert.Equal(0, Rooms.RoomsNeeded(new List<(int, int)>()));
    }

    [Fact]
    public void Big_office()
    {
        var rnd = new Random(9);
        var ms = Enumerable.Range(0, 200_000).Select(_ =>
        {
            var s = rnd.Next(1_000_000);
            return (s, s + rnd.Next(1, 500));
        }).ToList();
        Perf.Under(1500, () =>
        {
            Rooms.MaxMeetings(ms);
            Rooms.RoomsNeeded(ms);
        }, "200,000 meetings");
    }
}
