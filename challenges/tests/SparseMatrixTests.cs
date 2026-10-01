using Challenges.Sparse;
using Xunit;

namespace Challenges.Tests;

[Trait("Lesson", "sparse-matrix")]
public class SparseMatrixTests
{
    [Fact]
    public void Set_get_and_remove()
    {
        var m = new SparseMatrix(3, 4);
        m.Set(0, 1, 2);
        m.Set(2, 3, 5);
        m.Set(2, 0, 1);
        Assert.Equal(3, m.NonZeros);
        Assert.Equal(5, m.Get(2, 3));
        Assert.Equal(0, m.Get(1, 1));
        m.Set(2, 3, 0);
        Assert.Equal(2, m.NonZeros);
        Assert.Equal(new[] { (0, 1.0) }, m.Row(2));
        Assert.Empty(m.Row(1));
    }

    [Fact]
    public void Multiply_and_transpose()
    {
        var m = new SparseMatrix(2, 3);
        m.Set(0, 0, 1);
        m.Set(0, 2, 2);
        m.Set(1, 1, 3);
        Assert.Equal(new[] { 7.0, 6.0 }, m.Multiply(new[] { 1.0, 2.0, 3.0 }));
        var t = m.Transpose();
        Assert.Equal(3, t.Rows);
        Assert.Equal(2, t.Get(2, 0));
        Assert.Equal(new[] { 1.0, 6.0, 2.0 }, t.Multiply(new[] { 1.0, 2.0 }));
    }

    [Fact]
    public void Huge_but_mostly_empty() =>
        Perf.Under(1500, () =>
        {
            var m = new SparseMatrix(1_000_000, 100_000);
            var rnd = new Random(163);
            for (var i = 0; i < 300_000; i++) m.Set(rnd.Next(1_000_000), rnd.Next(100_000), 1);
            var x = new double[100_000];
            Array.Fill(x, 1.0);
            var y = m.Multiply(x);
            Assert.Equal(m.NonZeros, y.Sum());
        }, "a 1,000,000 × 100,000 matrix with 300,000 non-zeros");
}
