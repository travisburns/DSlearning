# Disk usage report

**The ticket.** The storage page shows how big every folder is, including everything inside it, and lists every folder path. Folders contain files and other folders, nested to any depth.

**Build** in `DiskUsage.cs` (a `Folder` record is given):

- `long TotalSize(Folder f)`: its own files plus the total of every subfolder.
- `int Depth(Folder f)`: 1 for a folder with no subfolders, otherwise 1 + the deepest subfolder.
- `List<string> AllPaths(Folder f)`: `"root"`, `"root/docs"`, `"root/docs/old"`, …: a folder before its subfolders, subfolders in the order given.

**Hint.** Each function handles one folder and calls itself for each subfolder. What's the base case?

**Run:** `dotnet test --filter Lesson=recursion`
