# File explorer folder tree

**The ticket.** The file explorer receives a flat list of file paths (`docs/2024/report.pdf`) and must show them as a folder tree with counts.

**Build** `FileTree` in `FileTree.cs`, a tree of nodes where each node has a name and a `Dictionary<string, Node>` of children:

- `void AddFile(string path)`: create any missing folders along the way; the last part is a file (a leaf).
- `int CountFiles(string folderPath)`: files anywhere under that folder (`""` means the root). 0 if the folder doesn't exist.
- `List<string> Children(string folderPath)`: names directly inside it, sorted A→Z.
- `int Height`: the most levels below the root (a file at `a/b/c.txt` makes it 3).

**Run:** `dotnet test --filter Lesson=tree`
