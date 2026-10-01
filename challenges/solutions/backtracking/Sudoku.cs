namespace Challenges.Backtracking;

public static class Sudoku
{
    public static bool Solve(int[,] grid)
    {
        for (var r = 0; r < 9; r++)
            for (var c = 0; c < 9; c++)
            {
                if (grid[r, c] != 0) continue;
                for (var d = 1; d <= 9; d++)
                {
                    if (!Fits(grid, r, c, d)) continue;
                    grid[r, c] = d;          // choose
                    if (Solve(grid)) return true;
                    grid[r, c] = 0;          // un-choose, try the next digit
                }
                return false; // nothing fits here: an earlier choice was wrong
            }
        return true; // no empty cells left
    }

    public static bool IsValid(int[,] grid)
    {
        for (var r = 0; r < 9; r++)
            for (var c = 0; c < 9; c++)
            {
                var d = grid[r, c];
                if (d == 0) continue;
                grid[r, c] = 0;
                var ok = Fits(grid, r, c, d);
                grid[r, c] = d;
                if (!ok) return false;
            }
        return true;
    }

    private static bool Fits(int[,] g, int r, int c, int d)
    {
        for (var i = 0; i < 9; i++)
            if (g[r, i] == d || g[i, c] == d || g[r / 3 * 3 + i / 3, c / 3 * 3 + i % 3] == d) return false;
        return true;
    }
}
