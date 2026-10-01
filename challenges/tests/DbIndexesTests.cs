using Challenges.Indexes;
using Xunit;

namespace Challenges.Tests;

[Trait("Lesson", "db-indexes")]
public class DbIndexesTests
{
    [Fact]
    public void Lookups_follow_every_change()
    {
        var t = new UserTable();
        t.Insert(new User(1, "ann@x", 30));
        t.Insert(new User(2, "bob@x", 25));
        t.Insert(new User(3, "cy@x", 30));
        Assert.Throws<InvalidOperationException>(() => t.Insert(new User(4, "ann@x", 50)));
        Assert.Throws<InvalidOperationException>(() => t.Insert(new User(1, "new@x", 50)));
        Assert.Null(t.FindByEmail("new@x"));
        Assert.Equal(new[] { 2, 1, 3 }, t.FindByAge(20, 40).Select(u => u.Id));
        t.Update(new User(1, "ann@new", 41));
        Assert.Null(t.FindByEmail("ann@x"));
        Assert.Equal(41, t.FindByEmail("ann@new")!.Age);
        Assert.Equal(new[] { 2, 3 }, t.FindByAge(20, 40).Select(u => u.Id));
        Assert.Throws<InvalidOperationException>(() => t.Update(new User(2, "cy@x", 25)));
        Assert.True(t.Delete(3));
        Assert.Null(t.FindByEmail("cy@x"));
        Assert.Equal(new[] { 2 }, t.FindByAge(0, 40).Select(u => u.Id));
    }

    [Fact]
    public void Big_table()
    {
        var t = new UserTable();
        var rnd = new Random(191);
        for (var i = 0; i < 300_000; i++) t.Insert(new User(i, $"user{i}@mail", rnd.Next(18, 90)));
        Perf.Under(1500, () =>
        {
            for (var q = 0; q < 300_000; q++) Assert.Equal(q, t.FindByEmail($"user{q}@mail")!.Id);
            var found = 0;
            for (var q = 0; q < 2_000; q++) found += t.FindByAge(30, 30).Count > 0 ? 1 : 0;
            Assert.Equal(2_000, found);
        }, "300,000 email lookups and 2,000 age queries");
    }
}
