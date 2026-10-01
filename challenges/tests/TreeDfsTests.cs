using Challenges.TreeDfs;
using Xunit;

namespace Challenges.Tests;

[Trait("Lesson", "tree-dfs")]
public class TreeDfsTests
{
    private static Comment C(int id, string a, string t, params Comment[] r) => new(id, a, t, r.ToList());

    private static readonly Comment Root = C(1, "Ann", "New release!",
        C(2, "Bob", "Nice", C(4, "Cat", "Agreed", C(6, "Ann", "Thanks"))),
        C(3, "Dan", "Bug?", C(5, "Ann", "Fixed")));

    [Fact]
    public void Renders_in_reading_order_with_indentation() =>
        Assert.Equal(new[] { "Ann: New release!", "  Bob: Nice", "    Cat: Agreed", "      Ann: Thanks", "  Dan: Bug?", "    Ann: Fixed" }, CommentThread.Render(Root));

    [Fact]
    public void Counts_and_depth()
    {
        Assert.Equal(5, CommentThread.TotalReplies(Root));
        Assert.Equal(2, CommentThread.TotalReplies(CommentThread.Find(Root, 2)!));
        Assert.Equal(3, CommentThread.DeepestLevel(Root));
        Assert.Null(CommentThread.Find(Root, 99));
        Assert.Equal("Fixed", CommentThread.Find(Root, 5)!.Text);
    }
}
