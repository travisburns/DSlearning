using Challenges.LinkedListChallenge;
using Xunit;

namespace Challenges.Tests;

[Trait("Lesson", "linked-list")]
public class LinkedListTests
{
    private static Playlist Make(params string[] t)
    {
        var p = new Playlist();
        foreach (var s in t) p.AddLast(s);
        return p;
    }

    [Fact]
    public void Insert_after_and_remove()
    {
        var p = Make("A", "B", "C");
        Assert.True(p.InsertAfter("A", "X"));
        Assert.True(p.InsertAfter("C", "Y"));
        Assert.False(p.InsertAfter("nope", "Z"));
        Assert.Equal(new[] { "A", "X", "B", "C", "Y" }, p.Titles());
        Assert.True(p.Remove("A"));
        Assert.True(p.Remove("Y"));
        Assert.False(p.Remove("nope"));
        Assert.Equal(new[] { "X", "B", "C" }, p.Titles());
        p.AddLast("D"); // tail must still be right after removing the old tail
        Assert.Equal(new[] { "X", "B", "C", "D" }, p.Titles());
    }

    [Fact]
    public void Reverse_in_place()
    {
        var p = Make("1", "2", "3", "4");
        p.Reverse();
        Assert.Equal(new[] { "4", "3", "2", "1" }, p.Titles());
        p.AddLast("0");
        Assert.Equal(new[] { "4", "3", "2", "1", "0" }, p.Titles());
        Assert.Empty(new Playlist().Titles());
    }

    [Fact]
    public void Adding_to_the_end_is_constant_time() =>
        Perf.Under(1600, () =>
        {
            var p = new Playlist();
            for (var i = 0; i < 300_000; i++) p.AddLast("s");
            p.Reverse();
        }, "300,000 AddLast calls");
}
