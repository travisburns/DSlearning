using System.Text;

namespace Challenges.ConsistentHashing;

public class HashRing(int virtualNodes = 100)
{
    public static uint Hash(string s)
    {
        var h = 2166136261u;
        foreach (var b in Encoding.UTF8.GetBytes(s)) h = unchecked((h ^ b) * 16777619u);
        return h;
    }

    private readonly SortedList<uint, string> _ring = new(); // ring position → server
    private uint[] _keys = [];

    public void AddServer(string name)
    {
        for (var i = 0; i < virtualNodes; i++) _ring[Hash(name + "#" + i)] = name;
        _keys = _ring.Keys.ToArray();
    }

    public void RemoveServer(string name)
    {
        for (var i = 0; i < virtualNodes; i++) _ring.Remove(Hash(name + "#" + i));
        _keys = _ring.Keys.ToArray();
    }

    public string ServerFor(string key)
    {
        var h = Hash(key);
        var i = Array.BinarySearch(_keys, h);
        if (i < 0) i = ~i;               // index of the first position after h
        if (i == _keys.Length) i = 0;   // past the end: wrap round the ring
        return _ring[_keys[i]];
    }
}
