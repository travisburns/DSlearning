namespace Challenges.Queues;

public class RateLimiter(int maxRequests, long windowMs)
{
    private readonly Queue<long> _accepted = new(); // oldest at the front

    public int InWindow => _accepted.Count;

    public bool Allow(long timestampMs)
    {
        while (_accepted.Count > 0 && _accepted.Peek() <= timestampMs - windowMs) _accepted.Dequeue(); // expired
        if (_accepted.Count >= maxRequests) return false;
        _accepted.Enqueue(timestampMs);
        return true;
    }
}
