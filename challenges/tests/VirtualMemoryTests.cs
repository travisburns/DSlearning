using Challenges.VirtualMemory;
using Xunit;

namespace Challenges.Tests;

[Trait("Lesson", "virtual-memory")]
public class VirtualMemoryTests
{
    [Fact]
    public void Translates_addresses()
    {
        var m = new Mmu(1024, 2, "LRU");
        Assert.Equal(0 * 1024 + 5, m.Translate(3 * 1024 + 5)); // page 3 → frame 0
        Assert.Equal(1 * 1024 + 7, m.Translate(7 * 1024 + 7)); // page 7 → frame 1
        Assert.Equal(0 * 1024 + 100, m.Translate(3 * 1024 + 100)); // hit
        Assert.Equal(2, m.Faults);
        m.Translate(9 * 1024); // evicts page 7 (used longest ago), reusing frame 1
        Assert.Null(m.FrameOf(7));
        Assert.Equal(1, m.FrameOf(9));
        Assert.Equal(0, m.FrameOf(3));
    }

    [Fact]
    public void Fifo_versus_lru()
    {
        var refs = new[] { 7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2, 1, 2, 0, 1, 7, 0, 1 };
        Assert.Equal(15, Mmu.CountFaults(refs, 3, "FIFO"));
        Assert.Equal(12, Mmu.CountFaults(refs, 3, "LRU"));
    }

    [Fact]
    public void Beladys_anomaly_more_frames_can_mean_more_faults_with_fifo()
    {
        var refs = new[] { 1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5 };
        Assert.Equal(9, Mmu.CountFaults(refs, 3, "FIFO"));
        Assert.Equal(10, Mmu.CountFaults(refs, 4, "FIFO"));
        Assert.True(Mmu.CountFaults(refs, 4, "LRU") <= Mmu.CountFaults(refs, 3, "LRU"));
    }

    [Fact]
    public void Millions_of_accesses() =>
        Perf.Under(1500, () =>
        {
            var m = new Mmu(4096, 256, "LRU");
            var rnd = new Random(181);
            for (var i = 0; i < 2_000_000; i++) m.Translate(rnd.Next(512) * 4096 + rnd.Next(4096));
            Assert.True(m.Faults > 0);
        }, "2,000,000 address translations");
}
