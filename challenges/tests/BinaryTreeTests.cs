using Challenges.BinaryTrees;
using Xunit;
using static Challenges.BinaryTrees.Node;

namespace Challenges.Tests;

[Trait("Lesson", "binary-tree")]
public class BinaryTreeTests
{
    // ((3 + 4) * 2) - (10 / 4)
    private static readonly Node Tree = Make('-', Make('*', Make('+', Num(3), Num(4)), Num(2)), Make('/', Num(10), Num(4)));

    [Fact]
    public void Evaluates() => Assert.Equal(11.5, Expr.Evaluate(Tree));

    [Fact]
    public void Height_and_leaves()
    {
        Assert.Equal(3, Expr.Height(Tree));
        Assert.Equal(5, Expr.CountLeaves(Tree));
        Assert.Equal(0, Expr.Height(Num(1)));
    }

    [Fact]
    public void Prints_with_brackets() => Assert.Equal("(((3 + 4) * 2) - (10 / 4))", Expr.ToInfix(Tree));
}
