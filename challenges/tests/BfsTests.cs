using Challenges.Bfs;
using Xunit;

namespace Challenges.Tests;

[Trait("Lesson", "bfs")]
public class BfsTests
{
    [Fact]
    public void Robot_moves()
    {
        var g = new[]
        {
            "S.#.....",
            ".##.###.",
            "....#...",
            "##.##.#E",
        };
        Assert.Equal(14, Pathing.MinMoves(g));
        Assert.Equal(-1, Pathing.MinMoves(new[] { "S#E" }));
        Assert.Equal(1, Pathing.MinMoves(new[] { "SE" }));
    }

    [Fact]
    public void Degrees_of_separation()
    {
        var f = new Dictionary<string, List<string>>
        {
            ["ann"] = new() { "bob", "cat" },
            ["bob"] = new() { "ann", "dan" },
            ["cat"] = new() { "ann", "dan", "eve" },
            ["dan"] = new() { "bob", "cat", "fay" },
            ["eve"] = new() { "cat", "fay" },
            ["fay"] = new() { "dan", "eve" },
        };
        Assert.Equal(new[] { "ann", "bob", "dan", "fay" }, Pathing.Chain(f, "ann", "fay"));
        Assert.Equal(new[] { "ann" }, Pathing.Chain(f, "ann", "ann"));
        Assert.Null(Pathing.Chain(f, "ann", "zed"));
    }

    [Fact]
    public void Big_warehouse()
    {
        var rows = Enumerable.Range(0, 1000).Select(r =>
        {
            var row = new char[1000];
            for (var c = 0; c < 1000; c++) row[c] = r % 2 == 1 && c != (r % 4 == 1 ? 999 : 0) ? '#' : '.';
            return new string(row);
        }).ToArray();
        rows[0] = "S" + rows[0][1..];
        rows[999] = rows[999][..999] + "E";
        Perf.Under(1500, () => Assert.Equal(499_500, Pathing.MinMoves(rows)), "a 1000 × 1000 zig-zag warehouse");
    }
}
