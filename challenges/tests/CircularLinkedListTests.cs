using Challenges.CircularLinkedList;
using Xunit;

namespace Challenges.Tests;

[Trait("Lesson", "circular-linked-list")]
public class CircularLinkedListTests
{
    [Fact]
    public void Turns_wrap_around()
    {
        var r = new RoundRobin();
        r.Add("A");
        r.Add("B");
        r.Add("C");
        Assert.Equal(new[] { "A", "B", "C", "A", "B" }, Enumerable.Range(0, 5).Select(_ => r.Next()));
    }

    [Fact]
    public void New_tasks_go_last_in_the_cycle()
    {
        var r = new RoundRobin();
        r.Add("A");
        r.Add("B");
        Assert.Equal("A", r.Next());
        r.Add("C"); // B is up next; A already ran, so it waits behind B; C joins at the very back
        Assert.Equal(new[] { "B", "A", "C" }, Enumerable.Range(0, 3).Select(_ => r.Next()));
    }

    [Fact]
    public void Finishing_tasks()
    {
        var r = new RoundRobin();
        foreach (var t in new[] { "A", "B", "C", "D" }) r.Add(t);
        Assert.Equal("A", r.Next());
        Assert.True(r.Finish("B")); // B was next
        Assert.True(r.Finish("D"));
        Assert.False(r.Finish("Z"));
        Assert.Equal(2, r.Count);
        Assert.Equal(new[] { "C", "A", "C" }, Enumerable.Range(0, 3).Select(_ => r.Next()));
        r.Finish("A");
        r.Finish("C");
        Assert.Equal(0, r.Count);
        Assert.Throws<InvalidOperationException>(() => r.Next());
    }
}
