namespace Challenges.Matrix;

public static class ImageTools
{
    public static int[,] RotateClockwise(int[,] img)
    {
        int rows = img.GetLength(0), cols = img.GetLength(1);
        var outp = new int[cols, rows];
        for (var r = 0; r < rows; r++)
            for (var c = 0; c < cols; c++)
                outp[c, rows - 1 - r] = img[r, c]; // row r becomes column (rows - 1 - r)
        return outp;
    }

    public static int[,] Blur(int[,] img)
    {
        int rows = img.GetLength(0), cols = img.GetLength(1);
        var outp = new int[rows, cols];
        for (var r = 0; r < rows; r++)
            for (var c = 0; c < cols; c++)
            {
                int sum = 0, n = 0;
                for (var dr = -1; dr <= 1; dr++)
                    for (var dc = -1; dc <= 1; dc++)
                    {
                        int rr = r + dr, cc = c + dc;
                        if (rr < 0 || cc < 0 || rr >= rows || cc >= cols) continue;
                        sum += img[rr, cc];
                        n++;
                    }
                outp[r, c] = sum / n;
            }
        return outp;
    }

    public static int FlatIndex(int row, int col, int columns) => row * columns + col; // skip full rows, then step in
}
