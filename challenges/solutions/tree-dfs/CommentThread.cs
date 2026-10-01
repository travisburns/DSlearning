namespace Challenges.TreeDfs;

public record Comment(int Id, string Author, string Text, List<Comment> Replies);

public static class CommentThread
{
    public static List<string> Render(Comment root)
    {
        var lines = new List<string>();
        void Pre(Comment c, int depth)
        {
            lines.Add(new string(' ', depth * 2) + $"{c.Author}: {c.Text}"); // the node first…
            foreach (var r in c.Replies) Pre(r, depth + 1);                  // …then its subtrees
        }
        Pre(root, 0);
        return lines;
    }

    public static int TotalReplies(Comment c) => c.Replies.Sum(r => 1 + TotalReplies(r)); // children's answers first

    public static int DeepestLevel(Comment root) => root.Replies.Count == 0 ? 0 : 1 + root.Replies.Max(DeepestLevel);

    public static Comment? Find(Comment root, int id)
    {
        if (root.Id == id) return root;
        foreach (var r in root.Replies)
            if (Find(r, id) is { } hit) return hit;
        return null;
    }
}
