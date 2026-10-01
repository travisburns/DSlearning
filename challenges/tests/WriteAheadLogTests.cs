using System.Text;
using Challenges.Wal;
using Xunit;

namespace Challenges.Tests;

[Trait("Lesson", "write-ahead-log")]
public class WriteAheadLogTests
{
    private static Dictionary<string, string?> C(params (string K, string? V)[] kv) => kv.ToDictionary(x => x.K, x => x.V);

    [Fact]
    public void Restart_recovers_committed_state()
    {
        var log = new MemoryStream();
        var s = new WalStore(log);
        s.Commit(C(("theme", "dark"), ("lang", "en")));
        s.Commit(C(("theme", "light"), ("lang", null)));
        Assert.Equal("light", s.Get("theme"));
        var log2 = new MemoryStream();
        log2.Write(log.ToArray());
        var restarted = new WalStore(log2);
        Assert.Equal("light", restarted.Get("theme"));
        Assert.Null(restarted.Get("lang"));
        Assert.Equal(1, restarted.Count);
        restarted.Commit(C(("font", "serif"))); // appended after the old records
        var again = new WalStore(new MemoryStream(log2.ToArray()));
        Assert.Equal("light", again.Get("theme"));
        Assert.Equal("serif", again.Get("font"));
    }

    [Fact]
    public void A_crash_anywhere_loses_only_the_unfinished_batch()
    {
        var log = new MemoryStream();
        var s = new WalStore(log);
        s.Commit(C(("a", "1")));
        var afterFirst = log.Length;
        s.Commit(C(("a", "2"), ("b", "x")));
        var bytes = log.ToArray();
        for (var cut = 0; cut <= bytes.Length; cut++)
        {
            var r = new WalStore(new MemoryStream(bytes[..cut]));
            if (cut == bytes.Length)
            {
                Assert.Equal("2", r.Get("a"));
                Assert.Equal("x", r.Get("b"));
            }
            else if (cut >= afterFirst)
            {
                Assert.Equal("1", r.Get("a")); // second batch torn: ignored as a whole
                Assert.Null(r.Get("b"));
            }
            else Assert.Null(r.Get("a"));
        }
    }

    [Fact]
    public void Log_is_plain_text_lines()
    {
        var log = new MemoryStream();
        new WalStore(log).Commit(C(("k", "v")));
        Assert.Equal("SET k\tv\nCOMMIT\n", Encoding.UTF8.GetString(log.ToArray()));
    }
}
