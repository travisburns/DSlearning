namespace Challenges.HashChaining;

public class ChainedMap
{
    private class Entry(string key, int value, Entry? next)
    {
        public readonly string Key = key;
        public int Value = value;
        public Entry? Next = next;
    }

    private Entry?[] _buckets = new Entry?[8];
    private int _count;

    public int Count => _count;

    public int BucketCount => _buckets.Length;

    private int Index(string key, int n) => (key.GetHashCode() & 0x7FFFFFFF) % n;

    public void Put(string key, int value)
    {
        var i = Index(key, _buckets.Length);
        for (var e = _buckets[i]; e != null; e = e.Next)
            if (e.Key == key)
            {
                e.Value = value;
                return;
            }
        _buckets[i] = new Entry(key, value, _buckets[i]); // add at the front of this bucket's chain
        _count++;
        if (_count > _buckets.Length * 3 / 4) Grow();
    }

    public bool TryGet(string key, out int value)
    {
        for (var e = _buckets[Index(key, _buckets.Length)]; e != null; e = e.Next)
            if (e.Key == key)
            {
                value = e.Value;
                return true;
            }
        value = 0;
        return false;
    }

    public bool Remove(string key)
    {
        var i = Index(key, _buckets.Length);
        Entry? prev = null;
        for (var e = _buckets[i]; e != null; prev = e, e = e.Next)
        {
            if (e.Key != key) continue;
            if (prev == null) _buckets[i] = e.Next;
            else prev.Next = e.Next;
            _count--;
            return true;
        }
        return false;
    }

    private void Grow()
    {
        var old = _buckets;
        _buckets = new Entry?[old.Length * 2];
        foreach (var head in old)
            for (var e = head; e != null;)
            {
                var next = e.Next;
                var i = Index(e.Key, _buckets.Length); // more buckets → new positions
                e.Next = _buckets[i];
                _buckets[i] = e;
                e = next;
            }
    }
}
