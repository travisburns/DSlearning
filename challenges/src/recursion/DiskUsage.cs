namespace Challenges.Recursion;

public record Folder(string Name, long[] FileSizes, Folder[] Subfolders);

public static class DiskUsage
{
    public static long TotalSize(Folder f) => throw new NotImplementedException("Your code here");

    public static int Depth(Folder f) => throw new NotImplementedException();

    public static List<string> AllPaths(Folder f) => throw new NotImplementedException();
}
