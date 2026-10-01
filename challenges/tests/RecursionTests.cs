using Challenges.Recursion;
using Xunit;

namespace Challenges.Tests;

[Trait("Lesson", "recursion")]
public class RecursionTests
{
    private static readonly Folder Root = new("root", new long[] { 10 }, new[]
    {
        new Folder("docs", new long[] { 5, 5 }, new[] { new Folder("old", new long[] { 100 }, Array.Empty<Folder>()) }),
        new Folder("pics", Array.Empty<long>(), Array.Empty<Folder>()),
    });

    [Fact]
    public void Total_size_includes_everything_inside() => Assert.Equal(120, DiskUsage.TotalSize(Root));

    [Fact]
    public void Depth() => Assert.Equal(3, DiskUsage.Depth(Root));

    [Fact]
    public void Paths_parent_before_children() =>
        Assert.Equal(new[] { "root", "root/docs", "root/docs/old", "root/pics" }, DiskUsage.AllPaths(Root));

    [Fact]
    public void Empty_folder() => Assert.Equal(0, DiskUsage.TotalSize(new Folder("x", Array.Empty<long>(), Array.Empty<Folder>())));
}
