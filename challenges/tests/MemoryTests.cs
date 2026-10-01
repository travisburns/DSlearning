using Challenges.Memory;
using Xunit;

namespace Challenges.Tests;

[Trait("Lesson", "memory")]
public class MemoryTests
{
    [Fact]
    public void Pieces_sit_side_by_side()
    {
        var a = new MemoryArena(100);
        Assert.Equal(0, a.Allocate(10));
        Assert.Equal(10, a.Allocate(4));
        Assert.Equal(14, a.Allocate(1));
        Assert.Equal(15, a.Used);
    }

    [Fact]
    public void Read_returns_what_was_written_at_that_address()
    {
        var a = new MemoryArena(16);
        var p = a.Allocate(3);
        a.Write(p, 7);
        a.Write(p + 2, 9);
        Assert.Equal(7, a.Read(p));
        Assert.Equal(9, a.Read(p + 2));
    }

    [Fact]
    public void Running_out_throws()
    {
        var a = new MemoryArena(8);
        a.Allocate(6);
        Assert.Throws<OutOfMemoryException>(() => a.Allocate(3));
    }

    [Fact]
    public void Reset_frees_everything()
    {
        var a = new MemoryArena(8);
        a.Allocate(8);
        a.Reset();
        Assert.Equal(0, a.Used);
        Assert.Equal(0, a.Allocate(8));
    }

    [Fact]
    public void Million_allocations_per_frame_are_fast() =>
        Perf.Under(500, () =>
        {
            var a = new MemoryArena(4_000_000);
            for (var frame = 0; frame < 5; frame++)
            {
                for (var i = 0; i < 1_000_000; i++) a.Write(a.Allocate(4), 1);
                a.Reset();
            }
        }, "5 frames of 1,000,000 allocations");
}
