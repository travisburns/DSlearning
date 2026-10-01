using Challenges.BitManipulation;
using Xunit;

namespace Challenges.Tests;

[Trait("Lesson", "bit-manipulation")]
public class BitManipulationTests
{
    [Fact]
    public void Packs_and_unpacks()
    {
        Assert.Equal(0xFF8000, BitTools.Pack(255, 128, 0));
        Assert.Equal((18, 52, 86), BitTools.Unpack(0x123456));
        var (r, g, b) = BitTools.Unpack(BitTools.Pack(1, 2, 3));
        Assert.Equal((1, 2, 3), (r, g, b));
    }

    [Fact]
    public void Darkens_each_channel()
    {
        Assert.Equal(BitTools.Pack(127, 64, 5), BitTools.Darken(BitTools.Pack(255, 128, 11)));
    }

    [Fact]
    public void Finds_the_unpaired_ticket()
    {
        Assert.Equal(42, BitTools.StillInside(new[] { 7, 42, 13, 7, 13 }));
        Assert.Equal(5, BitTools.StillInside(new[] { 5 }));
    }
}
