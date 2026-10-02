namespace Challenges.Caches;

public class CacheSim
{
    private readonly int _lineBytes;
    private readonly int _ways;
    private readonly List<long>[] _sets; // per set: line tags, least recently used first

    public CacheSim(int lineBytes, int sets, int ways)
    {
        _lineBytes = lineBytes;
        _ways = ways;
        _sets = Enumerable.Range(0, sets).Select(_ => new List<long>(ways + 1)).ToArray();
    }

    public int Hits { get; private set; }

    public int Misses { get; private set; }

    public bool Access(long address)
    {
        var line = address / _lineBytes;
        var set = _sets[(int)(line % _sets.Length)];
        var at = set.IndexOf(line);
        if (at >= 0)
        {
            set.RemoveAt(at);
            set.Add(line);
            Hits++;
            return true;
        }
        Misses++;
        if (set.Count == _ways) set.RemoveAt(0);
        set.Add(line);
        return false;
    }

    public void Reset()
    {
        foreach (var s in _sets) s.Clear();
        Hits = 0;
        Misses = 0;
    }
}
