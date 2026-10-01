using Challenges.StaticArray;
using Xunit;

namespace Challenges.Tests;

[Trait("Lesson", "static-array")]
public class StaticArrayTests
{
    [Fact]
    public void Booking_and_checking()
    {
        var r = new SeatRow(30);
        Assert.True(r.IsFree(5));
        Assert.True(r.Book(5));
        Assert.False(r.IsFree(5));
        Assert.False(r.Book(5));
        Assert.False(r.Book(30));
        Assert.False(r.Book(-1));
        Assert.Equal(29, r.FreeCount);
    }

    [Fact]
    public void Finds_the_first_block_of_adjacent_free_seats()
    {
        var r = new SeatRow(10);
        foreach (var s in new[] { 1, 4, 5 }) r.Book(s);
        // free: 0, 2, 3, 6, 7, 8, 9
        Assert.Equal(2, r.FindBlock(2));
        Assert.Equal(6, r.FindBlock(3));
        Assert.Equal(6, r.FindBlock(4));
        Assert.Equal(-1, r.FindBlock(5));
    }

    [Fact]
    public void Checking_seats_is_constant_time() =>
        Perf.Under(300, () =>
        {
            var r = new SeatRow(1_000_000);
            for (var i = 0; i < 1_000_000; i += 2) r.Book(i);
            var free = 0;
            for (var k = 0; k < 3; k++)
                for (var i = 0; i < 1_000_000; i++) if (r.IsFree(i)) free++;
            Assert.Equal(1_500_000, free);
        }, "3,000,000 seat checks");
}
