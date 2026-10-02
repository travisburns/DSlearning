namespace Challenges.RateLimiting;

public class TokenBucket
{
    public TokenBucket(int capacity, double refillPerSecond, Func<long> nowMs)
    {
    }

    public double Available => throw new NotImplementedException("Your code here");

    public bool TryTake(int tokens = 1) => throw new NotImplementedException();
}

public class SlidingWindowLimiter
{
    public SlidingWindowLimiter(int limit, int windowMs, Func<long> nowMs)
    {
    }

    public bool Allow(string client) => throw new NotImplementedException();
}
