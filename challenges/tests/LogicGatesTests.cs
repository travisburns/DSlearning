using Challenges.Gates;
using Xunit;

namespace Challenges.Tests;

[Trait("Lesson", "logic-gates")]
public class LogicGatesTests
{
    [Fact]
    public void Full_adder_truth_table()
    {
        for (var i = 0; i < 8; i++)
        {
            bool a = (i & 4) != 0, b = (i & 2) != 0, c = (i & 1) != 0;
            var ones = (a ? 1 : 0) + (b ? 1 : 0) + (c ? 1 : 0);
            Assert.Equal((ones % 2 == 1, ones >= 2), Alu.FullAdder(a, b, c));
        }
    }

    [Fact]
    public void Add_matches_real_addition_for_every_pair()
    {
        for (var a = 0; a < 256; a++)
            for (var b = 0; b < 256; b++)
            {
                var r = Alu.Add((byte)a, (byte)b, out var carry);
                Assert.Equal((byte)(a + b), r);
                Assert.Equal(a + b > 255, carry);
            }
    }

    [Fact]
    public void Negate_is_twos_complement()
    {
        Assert.Equal(0, Alu.Negate(0));
        Assert.Equal(255, Alu.Negate(1));
        Assert.Equal(128, Alu.Negate(128)); // -(-128) doesn't fit: it stays -128
        for (var x = 0; x < 256; x++) Assert.Equal((byte)(256 - x), Alu.Negate((byte)x));
    }

    [Fact]
    public void Subtract_for_every_pair()
    {
        for (var a = 0; a < 256; a++)
            for (var b = 0; b < 256; b++)
                Assert.Equal((byte)(a - b), Alu.Subtract((byte)a, (byte)b));
    }

    [Theory]
    [InlineData(0, 0)]
    [InlineData(127, 127)]
    [InlineData(128, -128)]
    [InlineData(255, -1)]
    [InlineData(200, -56)]
    public void As_signed(int x, int expected) => Assert.Equal((sbyte)expected, Alu.AsSigned((byte)x));

    [Fact]
    public void Signed_overflow_for_every_pair()
    {
        for (var a = 0; a < 256; a++)
            for (var b = 0; b < 256; b++)
            {
                var real = (sbyte)a + (sbyte)b;
                Assert.Equal(real is < -128 or > 127, Alu.SignedOverflow((byte)a, (byte)b));
            }
        Assert.True(Alu.SignedOverflow(127, 1));
        Assert.False(Alu.SignedOverflow(255, 1)); // -1 + 1 = 0: a carry, but no signed overflow
    }
}
