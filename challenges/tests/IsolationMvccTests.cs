using Challenges.Mvcc;
using Xunit;

namespace Challenges.Tests;

[Trait("Lesson", "isolation-mvcc")]
public class IsolationMvccTests
{
    [Fact]
    public void Readers_keep_their_snapshot()
    {
        var db = new MvccStore();
        var setup = db.Begin();
        setup.Write("price", "10");
        Assert.True(setup.Commit());

        var report = db.Begin();
        Assert.Equal("10", report.Read("price"));
        var writer = db.Begin();
        writer.Write("price", "12");
        Assert.Equal("12", writer.Read("price")); // own write
        Assert.Equal("10", report.Read("price")); // not committed yet
        Assert.True(writer.Commit());
        Assert.Equal("10", report.Read("price")); // committed after the report's snapshot
        Assert.Equal("12", db.Begin().Read("price"));
        Assert.Equal(2, db.VersionCount("price"));
    }

    [Fact]
    public void First_committer_wins()
    {
        var db = new MvccStore();
        var a = db.Begin();
        var b = db.Begin();
        a.Write("stock", "4");
        b.Write("stock", "3");
        Assert.True(a.Commit());
        Assert.False(b.Commit()); // would overwrite a's change unseen
        Assert.Equal("4", db.Begin().Read("stock"));
        var c = db.Begin();
        var d = db.Begin();
        c.Write("x", "1");
        d.Write("y", "2"); // different keys: no conflict
        Assert.True(c.Commit());
        Assert.True(d.Commit());
    }

    [Fact]
    public void Deletes_are_versions_too()
    {
        var db = new MvccStore();
        var t = db.Begin();
        t.Write("k", "v");
        t.Commit();
        var old = db.Begin();
        var del = db.Begin();
        del.Write("k", null);
        Assert.True(del.Commit());
        Assert.Null(db.Begin().Read("k"));
        Assert.Equal("v", old.Read("k"));
        Assert.Null(db.Begin().Read("missing"));
    }
}
