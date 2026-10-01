using Challenges.Transactions;
using Xunit;

namespace Challenges.Tests;

[Trait("Lesson", "transactions")]
public class TransactionsTests
{
    [Fact]
    public void Rollback_undoes_everything_since_begin()
    {
        var s = new TxStore();
        s.Set("theme", "light");
        s.Begin();
        s.Set("theme", "dark");
        s.Set("font", "serif");
        s.Delete("theme");
        Assert.Null(s.Get("theme"));
        Assert.True(s.Rollback());
        Assert.Equal("light", s.Get("theme"));
        Assert.Null(s.Get("font"));
        Assert.False(s.Rollback());
        Assert.False(s.Commit());
    }

    [Fact]
    public void Nested_transactions()
    {
        var s = new TxStore();
        s.Begin();
        s.Set("a", "1");
        s.Begin();
        s.Set("a", "2");
        s.Set("b", "x");
        Assert.Equal(2, s.Depth);
        Assert.True(s.Rollback()); // inner undone, outer still open
        Assert.Equal("1", s.Get("a"));
        Assert.Null(s.Get("b"));
        s.Begin();
        s.Set("c", "y");
        Assert.True(s.Commit()); // inner folded into outer, not yet permanent
        Assert.True(s.Rollback()); // outer undone: takes the inner's changes with it
        Assert.Null(s.Get("a"));
        Assert.Null(s.Get("c"));
        s.Begin();
        s.Set("a", "kept");
        s.Begin();
        s.Delete("a");
        s.Commit();
        s.Commit();
        Assert.Null(s.Get("a"));
        Assert.Equal(0, s.Depth);
    }
}
