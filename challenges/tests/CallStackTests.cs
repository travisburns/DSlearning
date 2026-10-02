using Challenges.Frames;
using Xunit;

namespace Challenges.Tests;

[Trait("Lesson", "call-stack")]
public class CallStackTests
{
    [Fact]
    public void Call_args_and_return()
    {
        var s = new CallStack(64);
        s.Call(100, 2, 3);
        Assert.Equal(1, s.Depth);
        Assert.Equal(5, s.WordsUsed);
        Assert.Equal(2, s.Arg(0));
        Assert.Equal(3, s.Arg(1));
        Assert.Equal(100, s.Return());
        Assert.Equal(0, s.Depth);
        Assert.Equal(0, s.WordsUsed);
        Assert.Throws<InvalidOperationException>(() => s.Return());
    }

    [Fact]
    public void Frames_are_private_and_restored_after_returns()
    {
        var s = new CallStack(64);
        s.Call(10, 1);
        var x = s.AllocLocal(42);
        Assert.Equal(0, x);
        s.Call(20, 7, 8, 9);
        Assert.Equal(7, s.Arg(0));
        Assert.Equal(9, s.Arg(2));
        Assert.Equal(0, s.AllocLocal(5));
        Assert.Equal(1, s.AllocLocal(6));
        s.SetLocal(0, 50);
        Assert.Equal(50, s.GetLocal(0));
        Assert.Equal(6, s.GetLocal(1));
        Assert.Equal(new[] { 20, 10 }, s.Trace());
        Assert.Equal(20, s.Return());
        Assert.Equal(1, s.Arg(0));
        Assert.Equal(42, s.GetLocal(0));
        Assert.Equal(4 + 1, s.WordsUsed);
        Assert.Equal(new[] { 10 }, s.Trace());
    }

    [Fact]
    public void Bad_indexes_throw()
    {
        var s = new CallStack(64);
        Assert.Throws<InvalidOperationException>(() => s.Arg(0));
        s.Call(1, 5);
        Assert.Throws<ArgumentOutOfRangeException>(() => s.Arg(1));
        Assert.Throws<ArgumentOutOfRangeException>(() => s.Arg(-1));
        Assert.Throws<ArgumentOutOfRangeException>(() => s.GetLocal(0));
        s.AllocLocal(0);
        Assert.Throws<ArgumentOutOfRangeException>(() => s.SetLocal(1, 0));
    }

    [Fact]
    public void Overflows_at_exactly_the_right_depth_and_changes_nothing()
    {
        var s = new CallStack(100);
        // Each call: 1 arg + 3 = 4 words, plus 1 local = 5 words. 100 / 5 = 20 frames.
        for (var i = 0; i < 20; i++)
        {
            s.Call(i, i);
            s.AllocLocal(i * 10);
        }
        Assert.Equal(100, s.WordsUsed);
        Assert.Throws<StackOverflowError>(() => s.Call(99, 1));
        Assert.Throws<StackOverflowError>(() => s.AllocLocal(1));
        Assert.Equal(20, s.Depth);
        Assert.Equal(19, s.Arg(0));
        Assert.Equal(190, s.GetLocal(0));
        Assert.Equal(19, s.Return());
        s.Call(7); // 3 words fit now
        Assert.Equal(98, s.WordsUsed);
    }

    [Fact]
    public void Runs_recursive_factorial_without_using_the_real_stack()
    {
        // Simulate: int Fact(int n) => n <= 1 ? 1 : n * Fact(n - 1);
        // Return address 1 = "inside Fact, after the recursive call"; 0 = "back in Main".
        var s = new CallStack(10_000);
        long Fact(int n)
        {
            s.Call(0, n);
            long result = 1;
            while (true)
            {
                var arg = s.Arg(0);
                if (arg > 1)
                {
                    s.Call(1, arg - 1);
                    continue;
                }
                // Base case reached: unwind, multiplying on the way out.
                while (true)
                {
                    var ret = s.Return();
                    if (ret == 0) return result;
                    result *= s.Arg(0);
                }
            }
        }
        Assert.Equal(1, Fact(1));
        Assert.Equal(120, Fact(5));
        Assert.Equal(2432902008176640000, Fact(20));
        Assert.Equal(0, s.Depth);
        Assert.Equal(0, s.WordsUsed);
    }

    [Fact]
    public void Deep_call_chains_are_fast()
    {
        Perf.Under(800, () =>
        {
            var s = new CallStack(5_000_000);
            for (var i = 0; i < 1_000_000; i++)
            {
                s.Call(i, i);
                s.AllocLocal(i);
            }
            for (var i = 999_999; i >= 0; i--) Assert.Equal(i, s.Return());
        }, "1,000,000 nested calls and returns");
    }
}
