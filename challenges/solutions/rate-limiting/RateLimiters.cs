namespace Challenges.RateLimiting;

public class TokenBucket
{
    private readonly int _capacity;
    private readonly double _rate;
    private readonly Func<long> _now;
    private double _tokens;
    private long _last;

    public TokenBucket(int capacity, double refillPerSecond, Func<long> nowMs)
    {
        _capacity = capacity;
        _rate = refillPerSecond;
        _now = nowMs;
        _tokens = capacity;
        _last = nowMs();
    }

    private void Refill()
    {
        var now = _now();
        _tokens = Math.Min(_capacity, _tokens + (now - _last) * _rate / 1000.0);
        _last = now;
    }

    public double Available
    {
        get
        {
            Refill();
            return _tokens;
        }
    }

    public bool TryTake(int tokens = 1)
    {
        Refill();
        if (_tokens < tokens) return false;
        _tokens -= tokens;
        return true;
    }
}

public class SlidingWindowLimiter
{
    private readonly int _limit;
    private readonly int _window;
    private readonly Func<long> _now;
    private readonly Dictionary<string, Queue<long>> _log = new();

    public SlidingWindowLimiter(int limit, int windowMs, Func<long> nowMs)
    {
        _limit = limit;
        _window = windowMs;
        _now = nowMs;
    }

    public bool Allow(string client)
    {
        var now = _now();
        if (!_log.TryGetValue(client, out var q)) _log[client] = q = new Queue<long>();
        while (q.Count > 0 && now - q.Peek() >= _window) q.Dequeue();
        if (q.Count >= _limit) return false;
        q.Enqueue(now);
        return true;
    }
}
