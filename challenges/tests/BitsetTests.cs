using Challenges.Bitset;
using Xunit;

namespace Challenges.Tests;

[Trait("Lesson", "bitset")]
public class BitsetTests
{
    [Fact]
    public void Book_free_and_check_across_word_boundaries()
    {
        var c = new YearCalendar();
        foreach (var d in new[] { 0, 63, 64, 200, 364 }) c.Book(d);
        Assert.True(c.IsBooked(63));
        Assert.True(c.IsBooked(64));
        Assert.False(c.IsBooked(65));
        Assert.Equal(5, c.BookedCount);
        c.Free(64);
        Assert.False(c.IsBooked(64));
        Assert.True(c.IsBooked(63));
        Assert.Equal(4, c.BookedCount);
    }

    [Fact]
    public void Combining_two_rooms()
    {
        var a = new YearCalendar();
        var b = new YearCalendar();
        for (var d = 0; d < 365; d++) if (d % 2 == 0) a.Book(d);
        for (var d = 0; d < 365; d++) if (d % 3 == 0) b.Book(d);
        var either = a.BookedByEither(b);
        Assert.True(either.IsBooked(4));
        Assert.True(either.IsBooked(9));
        Assert.False(either.IsBooked(5));
        var free = a.FreeInBoth(b);
        Assert.Equal(new[] { 1, 5, 7, 11, 13 }, free.Take(5));
        Assert.Equal(365 - either.BookedCount, free.Count);
        Assert.False(a.IsBooked(3)); // the originals are unchanged
    }
}
