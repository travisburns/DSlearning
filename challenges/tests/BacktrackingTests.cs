using Challenges.Backtracking;
using Xunit;

namespace Challenges.Tests;

[Trait("Lesson", "backtracking")]
public class BacktrackingTests
{
    private static int[,] Parse(string s)
    {
        var g = new int[9, 9];
        var digits = s.Where(ch => ch == '.' || char.IsDigit(ch)).ToArray();
        for (var i = 0; i < 81; i++) g[i / 9, i % 9] = digits[i] == '.' ? 0 : digits[i] - '0';
        return g;
    }

    private const string Puzzle = "53..7.... 6..195... .98....6. 8...6...3 4..8.3..1 7...2...6 .6....28. ...419..5 ....8..79";
    private const string Answer = "534678912 672195348 198342567 859761423 426853791 713924856 961537284 287419635 345286179";

    [Fact]
    public void Solves_a_puzzle()
    {
        var g = Parse(Puzzle);
        Assert.True(Sudoku.Solve(g));
        Assert.Equal(Parse(Answer), g);
    }

    [Fact]
    public void Validity()
    {
        Assert.True(Sudoku.IsValid(Parse(Puzzle)));
        Assert.True(Sudoku.IsValid(Parse(Answer)));
        var bad = Parse(Puzzle);
        bad[0, 2] = 5; // 5 already in row 0
        Assert.False(Sudoku.IsValid(bad));
    }

    [Fact]
    public void Reports_unsolvable()
    {
        var g = new int[9, 9];
        for (var i = 0; i < 8; i++) g[0, i] = i + 1; // row 0 needs a 9 in its last cell…
        g[1, 8] = 9;                                 // …but that column already has one
        Assert.True(Sudoku.IsValid(g));
        Assert.False(Sudoku.Solve(g));
    }

    [Fact]
    public void Harder_puzzle_is_quick() =>
        Perf.Under(1500, () =>
        {
            var g = Parse("..9748... 7........ .2.1.9... ..7...24. .64.1.59. .98...3.. ...8.3.2. ........6 ...2759..");
            Assert.True(Sudoku.Solve(g));
            Assert.True(Sudoku.IsValid(g));
        }, "solving a harder puzzle");
}
