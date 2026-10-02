namespace Challenges.Gates;

public static class Alu
{
    public static (bool Sum, bool Carry) FullAdder(bool a, bool b, bool carryIn) =>
        (a ^ b ^ carryIn, (a & b) | (carryIn & (a ^ b)));

    public static byte Add(byte a, byte b, out bool carryOut)
    {
        var carry = false;
        var result = 0;
        for (var i = 0; i < 8; i++)
        {
            var (sum, c) = FullAdder(((a >> i) & 1) == 1, ((b >> i) & 1) == 1, carry);
            if (sum) result |= 1 << i;
            carry = c;
        }
        carryOut = carry;
        return (byte)result;
    }

    public static byte Negate(byte x) => Add((byte)~x, 1, out _);

    public static byte Subtract(byte a, byte b) => Add(a, Negate(b), out _);

    public static sbyte AsSigned(byte x) => unchecked((sbyte)x);

    public static bool SignedOverflow(byte a, byte b)
    {
        var r = Add(a, b, out _);
        var sa = (a & 0x80) != 0;
        var sb = (b & 0x80) != 0;
        var sr = (r & 0x80) != 0;
        return sa == sb && sr != sa;
    }
}
