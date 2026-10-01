namespace Challenges.Trees;

public class FileTree
{
    private class Node
    {
        public readonly Dictionary<string, Node> Kids = new();
        public bool IsFile;
    }

    private readonly Node _root = new();

    public int Height => H(_root);

    private static int H(Node n) => n.Kids.Count == 0 ? 0 : 1 + n.Kids.Values.Max(H);

    public void AddFile(string path)
    {
        var cur = _root;
        foreach (var part in path.Split('/'))
        {
            if (!cur.Kids.TryGetValue(part, out var next)) cur.Kids[part] = next = new Node();
            cur = next;
        }
        cur.IsFile = true;
    }

    private Node? Find(string folderPath)
    {
        var cur = _root;
        if (folderPath == "") return cur;
        foreach (var part in folderPath.Split('/'))
            if (!cur.Kids.TryGetValue(part, out cur!)) return null;
        return cur;
    }

    public int CountFiles(string folderPath) => Find(folderPath) is { } n ? Count(n) : 0;

    private static int Count(Node n) => (n.IsFile ? 1 : 0) + n.Kids.Values.Sum(Count);

    public List<string> Children(string folderPath) =>
        Find(folderPath)?.Kids.Keys.OrderBy(k => k, StringComparer.Ordinal).ToList() ?? new List<string>();
}
