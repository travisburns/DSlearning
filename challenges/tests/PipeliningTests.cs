using Challenges.Branches;
using Xunit;

namespace Challenges.Tests;

[Trait("Lesson", "pipelining")]
public class PipeliningTests
{
    [Fact]
    public void Counters_saturate()
    {
        var p = new TwoBitPredictor(4);
        Assert.False(p.Predict(5));
        p.Update(5, true);
        Assert.True(p.Predict(5));
        p.Update(5, true);
        p.Update(5, true);
        p.Update(5, true); // stays at 3
        p.Update(5, false);
        Assert.True(p.Predict(5)); // 2: still taken after one surprise
        p.Update(5, false);
        Assert.False(p.Predict(5));
        p.Update(5, false);
        p.Update(5, false);
        p.Update(5, true); // from 0 to 1
        Assert.False(p.Predict(5));
    }

    [Fact]
    public void Branches_share_entries_by_low_bits()
    {
        var p = new TwoBitPredictor(2); // 4 entries
        p.Update(1, true);
        Assert.True(p.Predict(1));
        Assert.True(p.Predict(5)); // 5 & 3 == 1: same entry
        Assert.False(p.Predict(2));
    }

    private static IEnumerable<(long, bool)> Loop(int outer, int inner)
    {
        for (var o = 0; o < outer; o++)
            for (var i = 0; i < inner; i++) yield return (0x40, i < inner - 1);
    }

    [Fact]
    public void Loop_branches_are_predicted_well()
    {
        var acc = new TwoBitPredictor(8).Run(Loop(1000, 10));
        Assert.InRange(acc, 0.89, 0.91); // only the exit of each loop is missed
    }

    [Fact]
    public void Alternating_branches_defeat_a_two_bit_counter()
    {
        var trace = Enumerable.Range(0, 1000).Select(i => (0x10L, i % 2 == 0));
        Assert.Equal(0.0, new TwoBitPredictor(8).Run(trace));
    }

    [Fact]
    public void Sorted_data_is_predictable_random_data_is_not()
    {
        var rng = new Random(9);
        var data = Enumerable.Range(0, 100_000).Select(_ => rng.Next(256)).ToArray();
        IEnumerable<(long, bool)> Trace(int[] d) => d.Select(x => (0x80L, x >= 128));
        var random = new TwoBitPredictor(8).Run(Trace(data));
        Array.Sort(data);
        var sorted = new TwoBitPredictor(8).Run(Trace(data));
        Assert.InRange(random, 0.4, 0.6);
        Assert.True(sorted > 0.999, $"sorted accuracy {sorted}");

        var cyclesRandom = Pipeline.Cycles(14, 100_000 * 4, (long)Math.Round((1 - random) * 100_000), 17);
        var cyclesSorted = Pipeline.Cycles(14, 100_000 * 4, (long)Math.Round((1 - sorted) * 100_000), 17);
        Assert.True(cyclesRandom > 2 * cyclesSorted);
    }

    [Fact]
    public void Run_on_an_empty_trace()
    {
        Assert.Equal(1.0, new TwoBitPredictor(4).Run(Array.Empty<(long, bool)>()));
    }

    [Theory]
    [InlineData(5, 0, 0, 20, 0)]
    [InlineData(5, 1, 0, 20, 5)]
    [InlineData(5, 100, 0, 20, 104)]
    [InlineData(4, 20, 3, 15, 68)]
    [InlineData(1, 10, 0, 10, 10)]
    public void Pipeline_cycles(int stages, long n, long miss, int penalty, long expected) =>
        Assert.Equal(expected, Pipeline.Cycles(stages, n, miss, penalty));
}
