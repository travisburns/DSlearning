using Challenges.Matrix;
using Xunit;

namespace Challenges.Tests;

[Trait("Lesson", "matrix")]
public class MatrixTests
{
    [Fact]
    public void Rotates_a_rectangle_clockwise()
    {
        var img = new[,] { { 1, 2, 3 }, { 4, 5, 6 } };
        var r = ImageTools.RotateClockwise(img);
        Assert.Equal(new[,] { { 4, 1 }, { 5, 2 }, { 6, 3 } }, r);
    }

    [Fact]
    public void Four_rotations_give_the_original()
    {
        var img = new[,] { { 1, 2 }, { 3, 4 }, { 5, 6 } };
        var r = img;
        for (var i = 0; i < 4; i++) r = ImageTools.RotateClockwise(r);
        Assert.Equal(img, r);
    }

    [Fact]
    public void Blur_averages_the_neighbourhood()
    {
        var img = new[,] { { 0, 0, 0 }, { 0, 90, 0 }, { 0, 0, 0 } };
        var b = ImageTools.Blur(img);
        Assert.Equal(10, b[1, 1]);  // 90 / 9
        Assert.Equal(22, b[0, 0]);  // 90 / 4 (corner sees 4 pixels)
        Assert.Equal(15, b[0, 1]);  // 90 / 6 (edge sees 6 pixels)
    }

    [Fact]
    public void Row_major_index()
    {
        Assert.Equal(0, ImageTools.FlatIndex(0, 0, 5));
        Assert.Equal(7, ImageTools.FlatIndex(1, 2, 5));
        Assert.Equal(19, ImageTools.FlatIndex(3, 4, 5));
    }
}
