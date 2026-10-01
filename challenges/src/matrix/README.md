# Image editor: rotate and blur

**The ticket.** Our photo app stores greyscale images as a 2D array `int[,] pixels` (rows × columns, values 0–255). Add “rotate 90° clockwise” and a simple blur.

**Build** in `ImageTools.cs`:

- `int[,] RotateClockwise(int[,] img)`: an R × C image becomes C × R. The top row becomes the right-hand column.
- `int[,] Blur(int[,] img)`: each pixel becomes the average (integer division) of itself and its neighbours in the 3 × 3 square around it (fewer at edges and corners).
- `int FlatIndex(int row, int col, int columns)`: where pixel (row, col) lives if the image is stored row by row in one long array.

**Rules.** Use `img.GetLength(0)` (rows) and `img.GetLength(1)` (columns).

**Run:** `dotnet test --filter Lesson=matrix`
