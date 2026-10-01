namespace Challenges.Lfu;

public class LfuCache(int capacity)
{
    private class Entry
    {
        public string Value = "";
        public int Count;
        public LinkedListNode<string> Node = null!;
    }

    private readonly Dictionary<string, Entry> _entries = new();
    private readonly Dictionary<int, LinkedList<string>> _buckets = new(); // use count → keys, oldest first
    private int _min;

    public int Count => _entries.Count;

    private void Touch(string key, Entry e)
    {
        var bucket = _buckets[e.Count];
        bucket.Remove(e.Node);
        if (bucket.Count == 0)
        {
            _buckets.Remove(e.Count);
            if (_min == e.Count) _min++;
        }
        e.Count++;
        if (!_buckets.TryGetValue(e.Count, out var next)) _buckets[e.Count] = next = new LinkedList<string>();
        e.Node = next.AddLast(key);
    }

    public string? Get(string key)
    {
        if (!_entries.TryGetValue(key, out var e)) return null;
        Touch(key, e);
        return e.Value;
    }

    public void Put(string key, string value)
    {
        if (capacity <= 0) return;
        if (_entries.TryGetValue(key, out var e))
        {
            e.Value = value;
            Touch(key, e);
            return;
        }
        if (_entries.Count >= capacity)
        {
            var bucket = _buckets[_min];
            var victim = bucket.First!.Value; // least used, and oldest among those
            bucket.RemoveFirst();
            if (bucket.Count == 0) _buckets.Remove(_min);
            _entries.Remove(victim);
        }
        if (!_buckets.TryGetValue(1, out var ones)) _buckets[1] = ones = new LinkedList<string>();
        _entries[key] = new Entry { Value = value, Count = 1, Node = ones.AddLast(key) };
        _min = 1;
    }
}
