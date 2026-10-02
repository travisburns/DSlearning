using Challenges.Emulator;
using Xunit;

namespace Challenges.Tests;

[Trait("Lesson", "cpu-cycle")]
public class CpuCycleTests
{
    [Fact]
    public void Straight_line_program()
    {
        var r = Cpu.Run(new[] { "SET r0, 7", "SET r1, -3", "ADD r0, r1", "MOV r2, r0", "INC r2", "OUT r2", "HALT" });
        Assert.Equal(new[] { 4, -3, 5, 0 }, r.Registers);
        Assert.Equal(new[] { 5 }, r.Output);
        Assert.Equal(7, r.Steps);
    }

    [Fact]
    public void A_loop_sums_one_to_ten()
    {
        var program = new[]
        {
            "SET r1, 10",   // 0: counter
            "ADD r0, r1",   // 1: total += counter
            "DEC r1",       // 2
            "JNZ r1, 1",    // 3: loop while counter != 0
            "OUT r0",       // 4
            "HALT",         // 5
        };
        var r = Cpu.Run(program);
        Assert.Equal(new[] { 55 }, r.Output);
        Assert.Equal(1 + 10 * 3 + 2, r.Steps);
    }

    [Fact]
    public void Fibonacci()
    {
        var program = new[]
        {
            "SET r0, 0",    // 0: a
            "SET r1, 1",    // 1: b
            "SET r3, 10",   // 2: how many
            "OUT r0",       // 3
            "MOV r2, r0",   // 4: t = a
            "ADD r2, r1",   // 5: t = a + b
            "MOV r0, r1",   // 6: a = b
            "MOV r1, r2",   // 7: b = t
            "DEC r3",       // 8
            "JNZ r3, 3",    // 9
        };
        var r = Cpu.Run(program);
        Assert.Equal(new[] { 0, 1, 1, 2, 3, 5, 8, 13, 21, 34 }, r.Output);
    }

    [Fact]
    public void Jz_and_jmp_and_running_off_the_end()
    {
        var program = new[]
        {
            "JZ r0, 3",     // 0: r0 is 0, so jump
            "SET r1, 99",   // 1: skipped
            "HALT",         // 2: skipped
            "set R1 , 5",   // 3: case and spacing don't matter
            "JMP 6",        // 4: jump to the end = stop
            "SET r1, 1",    // 5: skipped
        };
        var r = Cpu.Run(program);
        Assert.Equal(5, r.Registers[1]);
        Assert.Equal(3, r.Steps); // JZ, SET, JMP
    }

    [Fact]
    public void Infinite_loops_time_out()
    {
        Assert.Throws<TimeoutException>(() => Cpu.Run(new[] { "INC r0", "JMP 0" }, 1000));
        // Exactly maxSteps instructions is fine if the program stops there.
        Assert.Equal(3, Cpu.Run(new[] { "INC r0", "INC r0", "HALT" }, 3).Steps);
    }

    [Theory]
    [InlineData("FLY r0")]
    [InlineData("ADD r0")]
    [InlineData("ADD r0, r4")]
    [InlineData("SET r0, ten")]
    [InlineData("SET x0, 1")]
    [InlineData("JMP 99")]
    [InlineData("JNZ r0, -1")]
    [InlineData("HALT r0")]
    public void Bad_programs_are_rejected_before_running(string bad)
    {
        // The bad line is never reached (HALT comes first), yet it must still be rejected.
        Assert.Throws<FormatException>(() => Cpu.Run(new[] { "HALT", bad }));
    }

    [Fact]
    public void Many_steps_run_fast()
    {
        var program = new[] { "SET r1, 1", "SET r2, 0", "SET r3, 2000000", "ADD r2, r1", "DEC r3", "JNZ r3, 3", "OUT r2", "HALT" };
        Perf.Under(1500, () =>
        {
            var r = Cpu.Run(program, 10_000_000);
            Assert.Equal(2_000_000, r.Output[0]);
        }, "6 million emulated instructions");
    }
}
