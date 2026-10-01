namespace Challenges.Recursion;

public record Folder(string Name, long[] FileSizes, Folder[] Subfolders);

public static class DiskUsage
{
    public static long TotalSize(Folder f) => f.FileSizes.Sum() + f.Subfolders.Sum(TotalSize);

    // Base case: no subfolders → 1. Otherwise one more than the deepest child.
    public static int Depth(Folder f) => 1 + (f.Subfolders.Length == 0 ? 0 : f.Subfolders.Max(Depth));

    public static List<string> AllPaths(Folder f)
    {
        var outp = new List<string>();
        Walk(f, f.Name, outp);
        return outp;
    }

    private static void Walk(Folder f, string path, List<string> outp)
    {
        outp.Add(path);
        foreach (var sub in f.Subfolders) Walk(sub, path + "/" + sub.Name, outp);
    }
}
