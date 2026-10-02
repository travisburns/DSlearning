namespace Challenges.Caching;

public class ReadThroughCache<TKey, TValue> where TKey : notnull
{
    private readonly Func<TKey, TValue> _load;
    private readonly int _capacity;
    private readonly int _ttl;
    private readonly Func<long> _now;
    private readonly object _gate = new();
    private readonly Dictionary<TKey, LinkedListNode<(TKey Key, TValue Value, long At)>> _map = new();
    private readonly LinkedList<(TKey Key, TValue Value, long At)> _order = new(); // front = most recent
    private readonly Dictionary<TKey, Lazy<TValue>> _loading = new();
    private int _hits;
    private int _loads;

    public ReadThroughCache(Func<TKey, TValue> load, int capacity, int ttlMs, Func<long> nowMs)
    {
        _load = load;
        _capacity = capacity;
        _ttl = ttlMs;
        _now = nowMs;
    }

    public int Hits => Volatile.Read(ref _hits);

    public int Loads => Volatile.Read(ref _loads);

    public int Count
    {
        get
        {
            lock (_gate) return _map.Count;
        }
    }

    public TValue Get(TKey key)
    {
        Lazy<TValue>? pending;
        var owner = false;
        lock (_gate)
        {
            if (_map.TryGetValue(key, out var node))
            {
                if (_now() - node.Value.At < _ttl)
                {
                    _order.Remove(node);
                    _order.AddFirst(node);
                    _hits++;
                    return node.Value.Value;
                }
                _order.Remove(node);
                _map.Remove(key);
            }
            if (!_loading.TryGetValue(key, out pending))
            {
                pending = new Lazy<TValue>(() =>
                {
                    Interlocked.Increment(ref _loads);
                    return _load(key);
                }, LazyThreadSafetyMode.ExecutionAndPublication);
                _loading[key] = pending;
                owner = true;
            }
        }

        TValue value;
        try
        {
            value = pending.Value; // the load runs here, outside the lock
        }
        catch
        {
            if (owner) lock (_gate) _loading.Remove(key);
            throw;
        }

        if (owner)
        {
            lock (_gate)
            {
                _loading.Remove(key);
                if (_map.TryGetValue(key, out var old))
                {
                    _order.Remove(old);
                    _map.Remove(key);
                }
                _map[key] = _order.AddFirst((key, value, _now()));
                if (_map.Count > _capacity)
                {
                    var last = _order.Last!;
                    _order.RemoveLast();
                    _map.Remove(last.Value.Key);
                }
            }
        }
        return value;
    }

    public void Invalidate(TKey key)
    {
        lock (_gate)
        {
            if (_map.Remove(key, out var node)) _order.Remove(node);
        }
    }
}
