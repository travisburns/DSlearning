# "People you may know"

**The ticket.** A social app needs friends lists, mutual friends, and friend suggestions. Friendships go both ways.

**Build** `SocialGraph` in `SocialGraph.cs` (store it as `Dictionary<string, HashSet<string>>`: each person → their friends):

- `void AddFriendship(string a, string b)` (ignore a person befriending themselves).
- `List<string> Friends(string p)`: sorted A→Z (empty if unknown).
- `List<string> Mutual(string a, string b)`: sorted.
- `List<string> Suggest(string p, int max)`: friends of friends who aren't `p` or already `p`'s friends, ranked by how many mutual friends they share with `p` (most first), ties A→Z.

**Run:** `dotnet test --filter Lesson=graph`
