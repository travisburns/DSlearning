# An 8-bit ALU from gates

**The ticket.** For a hardware-teaching kit we're writing an emulator of an 8-bit computer. Its arithmetic unit must work the way the chip does: from logic gates, one bit at a time, with real carries and real overflow. No `+` or `-` on the numbers themselves: use only the bitwise operators (`&`, `|`, `^`, `~`, shifts) and your own adder.

**Build** the static class `Alu` in `Alu.cs`:

- `(bool Sum, bool Carry) FullAdder(bool a, bool b, bool carryIn)`: sum and carry-out of three bits.
- `byte Add(byte a, byte b, out bool carryOut)`: chain 8 full adders from bit 0 up. `carryOut` is the carry out of bit 7.
- `byte Negate(byte x)`: two's complement (flip every bit, then add 1 with your adder).
- `byte Subtract(byte a, byte b)`: `a + (−b)`, using your adder.
- `sbyte AsSigned(byte x)`: the same 8 bits read as two's complement (−128 to 127).
- `bool SignedOverflow(byte a, byte b)`: true if adding `a` and `b` as signed numbers gives a result that doesn't fit in −128..127. (Rule: it overflows exactly when both inputs have the same sign bit and the result's sign bit differs.)

**Hint.** Sum = a XOR b XOR c. Carry = (a AND b) OR (c AND (a XOR b)). Bit `i` of `x` is `((x >> i) & 1) == 1`.

**Run:** `dotnet test --filter Lesson=logic-gates`
