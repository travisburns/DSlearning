using Challenges.CircularBuffer;
using Xunit;

namespace Challenges.Tests;

[Trait("Lesson", "circular-buffer")]
public class CircularBufferTests
{
    [Fact]
    public void Keeps_the_last_n_in_order()
    {
        var r = new RingLog(3);
        r.Add("a");
        r.Add("b");
        Assert.Equal(new[] { "a", "b" }, r.Lines());
        r.Add("c");
        r.Add("d");
        r.Add("e");
        Assert.Equal(new[] { "c", "d", "e" }, r.Lines());
        Assert.Equal(3, r.Count);
    }

    [Fact]
    public void Millions_of_lines_in_fixed_memory() =>
        Perf.Under(1500, () =>
        {
            var r = new RingLog(1000);
            for (var i = 0; i < 5_000_000; i++) r.Add("line");
            Assert.Equal(1000, r.Count);
        }, "5,000,000 log lines");
}
