namespace Challenges.Lru;

public class LruCache<TKey, TValue>(int capacity) where TKey : notnull
{
    private readonly Dictionary<TKey, LinkedListNode<(TKey Key, TValue Value)>> _map = new();
    private readonly LinkedList<(TKey Key, TValue Value)> _order = new(); // front = most recent, back = least recent

    public int Count => _map.Count;

    public bool TryGet(TKey key, out TValue value)
    {
        if (!_map.TryGetValue(key, out var node))
        {
            value = default!;
            return false;
        }
        _order.Remove(node);   // O(1): we hold the node itself
        _order.AddFirst(node); // now the most recent
        value = node.Value.Value;
        return true;
    }

    public void Put(TKey key, TValue value)
    {
        if (_map.TryGetValue(key, out var old)) _order.Remove(old);
        var node = _order.AddFirst((key, value));
        _map[key] = node;
        if (_map.Count > capacity)
        {
            var lru = _order.Last!;
            _order.RemoveLast();
            _map.Remove(lru.Value.Key);
        }
    }

    public TValue GetOrAdd(TKey key, Func<TKey, TValue> load)
    {
        if (TryGet(key, out var v)) return v;
        v = load(key);
        Put(key, v);
        return v;
    }
}
