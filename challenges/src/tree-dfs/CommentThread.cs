namespace Challenges.TreeDfs;

public record Comment(int Id, string Author, string Text, List<Comment> Replies);

public static class CommentThread
{
    public static List<string> Render(Comment root) => throw new NotImplementedException("Your code here");

    public static int TotalReplies(Comment c) => throw new NotImplementedException();

    public static int DeepestLevel(Comment root) => throw new NotImplementedException();

    public static Comment? Find(Comment root, int id) => throw new NotImplementedException();
}
