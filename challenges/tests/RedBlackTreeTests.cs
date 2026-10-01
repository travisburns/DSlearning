using Challenges.RedBlack;
using Xunit;

namespace Challenges.Tests;

[Trait("Lesson", "red-black-tree")]
public class RedBlackTreeTests
{
    [Fact]
    public void Rejects_overlaps_allows_back_to_back()
    {
        var c = new RoomCalendar();
        Assert.True(c.Book(10, 12));
        Assert.True(c.Book(12, 13));
        Assert.True(c.Book(8, 10));
        Assert.False(c.Book(11, 12));
        Assert.False(c.Book(9, 11));
        Assert.False(c.Book(7, 20));
        Assert.True(c.Book(13, 14));
        Assert.Equal(4, c.Count);
        Assert.Equal(new[] { (10, 12), (12, 13) }, c.Between(10, 13));
    }

    [Fact]
    public void Busy_room() =>
        Perf.Under(1500, () =>
        {
            var c = new RoomCalendar();
            var rnd = new Random(29);
            var ok = 0;
            for (var i = 0; i < 100_000; i++)
            {
                var s = rnd.Next(10_000_000);
                if (c.Book(s, s + rnd.Next(1, 60))) ok++;
            }
            Assert.Equal(ok, c.Count);
        }, "100,000 booking requests");
}
