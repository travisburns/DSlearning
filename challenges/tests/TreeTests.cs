using Challenges.Trees;
using Xunit;

namespace Challenges.Tests;

[Trait("Lesson", "tree")]
public class TreeTests
{
    private static FileTree Sample()
    {
        var t = new FileTree();
        foreach (var p in new[] { "docs/2024/report.pdf", "docs/2024/notes.txt", "docs/cv.pdf", "pics/cat.png", "readme.md" }) t.AddFile(p);
        return t;
    }

    [Fact]
    public void Counts_files_under_folders()
    {
        var t = Sample();
        Assert.Equal(5, t.CountFiles(""));
        Assert.Equal(3, t.CountFiles("docs"));
        Assert.Equal(2, t.CountFiles("docs/2024"));
        Assert.Equal(0, t.CountFiles("nope"));
    }

    [Fact]
    public void Children_and_height()
    {
        var t = Sample();
        Assert.Equal(new[] { "docs", "pics", "readme.md" }, t.Children(""));
        Assert.Equal(new[] { "2024", "cv.pdf" }, t.Children("docs"));
        Assert.Equal(3, t.Height);
    }
}
