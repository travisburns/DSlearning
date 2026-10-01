namespace Challenges.Persistent;

/// <summary>Each version is the root of an immutable BST; changes copy only the root-to-key path.</summary>
public class VersionedMap
{
    private sealed record Node(string Key, string Value, Node? L, Node? R, int Size);

    private readonly List<Node?> _versions = new() { null };

    public int Latest => _versions.Count - 1;

    private static int Sz(Node? n) => n?.Size ?? 0;

    private static Node Mk(string k, string v, Node? l, Node? r) => new(k, v, l, r, 1 + Sz(l) + Sz(r));

    private static Node Put(Node? n, string key, string value)
    {
        if (n == null) return Mk(key, value, null, null);
        var c = string.CompareOrdinal(key, n.Key);
        if (c < 0) return Mk(n.Key, n.Value, Put(n.L, key, value), n.R);   // new copy of this node, right side shared
        if (c > 0) return Mk(n.Key, n.Value, n.L, Put(n.R, key, value));   // left side shared
        return Mk(key, value, n.L, n.R);
    }

    private static Node? Del(Node? n, string key)
    {
        if (n == null) return null;
        var c = string.CompareOrdinal(key, n.Key);
        if (c < 0) return Mk(n.Key, n.Value, Del(n.L, key), n.R);
        if (c > 0) return Mk(n.Key, n.Value, n.L, Del(n.R, key));
        if (n.L == null) return n.R;
        if (n.R == null) return n.L;
        var m = n.R;
        while (m.L != null) m = m.L; // successor
        return Mk(m.Key, m.Value, n.L, Del(n.R, m.Key));
    }

    public int Set(string key, string value)
    {
        _versions.Add(Put(_versions[^1], key, value));
        return Latest;
    }

    public int Remove(string key)
    {
        _versions.Add(Del(_versions[^1], key));
        return Latest;
    }

    public string? Get(int version, string key)
    {
        for (var n = _versions[version]; n != null;)
        {
            var c = string.CompareOrdinal(key, n.Key);
            if (c == 0) return n.Value;
            n = c < 0 ? n.L : n.R;
        }
        return null;
    }

    public int Count(int version) => Sz(_versions[version]);

    public int Restore(int version)
    {
        _versions.Add(_versions[version]); // old roots never change, so just reuse it
        return Latest;
    }
}
