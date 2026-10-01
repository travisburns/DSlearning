using Challenges.Stacks;
using Xunit;

namespace Challenges.Tests;

[Trait("Lesson", "stack")]
public class StackTests
{
    [Fact]
    public void Undo_and_redo_in_order()
    {
        var n = new Notes();
        n.Type("Hello");
        n.Type(" world");
        n.DeleteLast(5);
        Assert.Equal("Hello ", n.Text);
        Assert.True(n.Undo());
        Assert.Equal("Hello world", n.Text);
        Assert.True(n.Undo());
        Assert.Equal("Hello", n.Text);
        Assert.True(n.Redo());
        Assert.Equal("Hello world", n.Text);
        Assert.True(n.Undo());
        Assert.True(n.Undo());
        Assert.False(n.Undo());
        Assert.Equal("", n.Text);
    }

    [Fact]
    public void New_action_clears_redo()
    {
        var n = new Notes();
        n.Type("abc");
        n.Undo();
        n.Type("x");
        Assert.False(n.Redo());
        Assert.Equal("x", n.Text);
    }

    [Fact]
    public void Deleting_more_than_exists()
    {
        var n = new Notes();
        n.Type("hi");
        n.DeleteLast(10);
        Assert.Equal("", n.Text);
        n.Undo();
        Assert.Equal("hi", n.Text);
    }

    [Fact]
    public void Long_editing_sessions_stay_fast() =>
        Perf.Under(1500, () =>
        {
            var n = new Notes();
            for (var i = 0; i < 100_000; i++) n.Type("word ");
            for (var i = 0; i < 50_000; i++) n.Undo();
            for (var i = 0; i < 50_000; i++) n.Redo();
            Assert.Equal(500_000, n.Text.Length);
        }, "100,000 edits, 50,000 undos and redos");
}
