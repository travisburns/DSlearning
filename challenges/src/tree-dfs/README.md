# Render a comment thread

**The ticket.** Comments can have replies, which can have replies, to any depth. The page shows them indented under their parent, and each comment shows how many replies it has in total (all levels).

**Build** in `CommentThread.cs` (a `Comment` record is given):

- `List<string> Render(Comment root)`: one line per comment, in reading order (a comment, then its whole reply thread, then the next sibling), each indented by two spaces per level: `"  Bob: me too"`.
- `int TotalReplies(Comment c)`: every reply below it, at any depth.
- `int DeepestLevel(Comment root)`: 0 if no replies.
- `Comment? Find(Comment root, int id)`.

**Hint.** Render is a preorder traversal (node before children); TotalReplies needs the children's answers first (postorder).

**Run:** `dotnet test --filter Lesson=tree-dfs`
